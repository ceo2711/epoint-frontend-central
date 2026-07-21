"use client";

export function LoadingSpinner({
  label,
  size = "md",
}: {
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-14 w-14" : "h-11 w-11";
  const border = size === "sm" ? "border-2" : "border-[2.5px]";

  return (
    <div className="flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <div className={`relative ${dim}`}>
        <div
          className={`absolute inset-0 rounded-full ${border} border-cream-600`}
          aria-hidden
        />
        <div
          className={`absolute inset-0 animate-spin rounded-full ${border} border-transparent border-t-brand border-r-accent`}
          aria-hidden
        />
        <div
          className="absolute inset-[28%] rounded-full bg-gradient-to-br from-brand/25 to-accent/30"
          aria-hidden
        />
      </div>
      {label ? (
        <p className="text-sm font-medium tracking-wide text-brown-700">{label}</p>
      ) : (
        <span className="sr-only">Cargando…</span>
      )}
    </div>
  );
}

/**
 * Spinner centrado en el área de contenido (debajo del header sticky).
 * Usa la altura del viewport visible para no “saltar” al cargar.
 */
export function PageLoader({ label }: { label?: string }) {
  return (
    <div
      className="flex w-full flex-1 items-center justify-center px-4"
      style={{ minHeight: "calc(100dvh - 5.75rem)" }}
    >
      <LoadingSpinner label={label} size="lg" />
    </div>
  );
}
