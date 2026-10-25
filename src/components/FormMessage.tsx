export function FormMessage({ error, success }: { error?: string | null; success?: string | null }) {
  if (error) return <p role="alert" className="rounded-md bg-danger-light px-3 py-2 text-sm text-danger">{error}</p>;
  if (success) return <p role="status" className="rounded-md bg-success-light px-3 py-2 text-sm text-success">{success}</p>;
  return null;
}
