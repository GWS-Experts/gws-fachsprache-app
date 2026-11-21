"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireCustomer, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasAdminKey } from "@/lib/supabase/admin";
import { deleteCustomerData } from "@/lib/delete-customer";
import { sendMail } from "@/lib/mail";
import { siteUrl } from "@/lib/env";

export type DeleteState = { error?: "noKey" | "confirm" | "notCustomer" | "generic" } | undefined;

const deleteSchema = z.object({ id: z.string().uuid(), confirm: z.string().trim().toLowerCase() });

// GWS löscht alle Trainingsdaten eines Kunden. Zur Sicherheit muss die
// E-Mail-Adresse des Kunden eingetippt werden.
export async function deleteCustomer(_prev: DeleteState, formData: FormData): Promise<DeleteState> {
  await requireStaff();
  if (!hasAdminKey()) return { error: "noKey" };
  const parsed = deleteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "generic" };

  const supabase = await createClient();
  const { data: customer } = await supabase.from("profiles").select("id, email, first_name, locale, role").eq("id", parsed.data.id).maybeSingle();
  if (!customer) return { error: "generic" };
  if (customer.role !== "customer") return { error: "notCustomer" };
  if (parsed.data.confirm !== customer.email.toLowerCase()) return { error: "confirm" };

  const result = await deleteCustomerData(customer.id);
  if (!result.ok) return { error: result.reason === "notCustomer" ? "notCustomer" : "generic" };

  // Bestätigung an die Person (Art. 19 DSGVO: Mitteilung über die Löschung).
  const t = await getTranslations({ locale: customer.locale, namespace: "mail" });
  await sendMail({ to: customer.email, subject: t("deletedSubject"), text: t("deletedBody", { name: customer.first_name || customer.email }) });

  revalidatePath("/admin");
  revalidatePath("/admin/messages");
  revalidatePath("/admin/submissions");
  redirect("/admin?deleted=1");
}

export type RequestState = { error?: "generic"; success?: "sent" } | undefined;

// Kunde beantragt die Löschung seiner Daten. Der Antrag landet als Nachricht
// im Verlauf (sichtbar im GWS-Posteingang) und als E-Mail bei GWS.
export async function requestDeletion(): Promise<RequestState> {
  const profile = await requireCustomer();
  const t = await getTranslations({ locale: "de", namespace: "privacy" });
  const supabase = await createClient();
  const body = t("requestMessage");
  const { error } = await supabase.from("messages").insert({ customer_id: profile.id, body, lesson_id: null });
  if (error) return { error: "generic" };

  const to = process.env.STAFF_NOTIFY_EMAIL;
  if (to) {
    const mt = await getTranslations({ locale: "de", namespace: "mail" });
    const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email;
    await sendMail({
      to,
      subject: mt("deletionRequestSubject", { name }),
      text: mt("deletionRequestBody", { name, email: profile.email, link: `${siteUrl()}/admin/customers/${profile.id}#delete` }),
    });
  }
  revalidatePath("/app/messages");
  return { success: "sent" };
}
