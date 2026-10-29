export function RouteLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-transparent px-4 py-16" role="status" aria-live="polite" aria-busy="true">
      <picture>
        <source srcSet="/logo_loader.webp" type="image/webp" />
        <img
          src="/logo_loader.gif"
          alt="Loading SpotZi"
          width={400}
          height={225}
          className="h-64 w-auto max-w-[min(94vw,40rem)] bg-transparent object-contain sm:h-72 md:h-80"
        />
      </picture>
      <span className="sr-only">Loading</span>
    </div>
  );
}
