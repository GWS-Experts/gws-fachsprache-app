import Image from "next/image";
import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3">
      <Image src="/gws-logo.png" alt="GWS – The Experts" width={48} height={48} priority className="h-12 w-12" />
      <span className="leading-tight">
        <span className="block text-base font-bold text-primary">GWS Fachsprache</span>
        <span className="block text-xs font-semibold text-accent">Pflege · B2</span>
      </span>
    </Link>
  );
}
