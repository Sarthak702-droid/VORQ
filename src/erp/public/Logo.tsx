type MarkProps = {
  size?: number;
  className?: string;
  title?: string;
};

/**
 * VORQ mark: a keystone — the last stone set in an arch, the one that locks the
 * rest in place — with a V cut into it. One colour; it inherits `currentColor`.
 */
export function LogoMark({ size = 32, className, title }: MarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d="M9 8h8.9L32 50.3 46.1 8H55L43 56H21z" />
      <path d="M22.1 8h19.8L32 37.7z" />
    </svg>
  );
}

export function Logo({
  size = 30,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span
        className="font-display leading-none"
        style={{ fontSize: size * 0.78, letterSpacing: "0.16em" }}
      >
        VORQ
      </span>
    </span>
  );
}
