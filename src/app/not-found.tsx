import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="display text-4xl">Page not found</h1>
      <p className="mt-3 text-muted-foreground">That offer, business, or city is not available.</p>
      <Link href="/" className="mt-6 inline-block font-semibold text-primary">Back to home</Link>
    </div>
  );
}
