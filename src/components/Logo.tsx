import Image from "next/image";
import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3">
      <Image src="/gws-logo.svg" alt="GWS – The Experts" width={132} height={38} priority />
      <span className="hidden border-l border-line pl-3 text-sm font-semibold text-primary sm:inline">Fachsprache Pflege</span>
    </Link>
  );
}
