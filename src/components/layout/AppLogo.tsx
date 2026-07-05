import Image from "next/image";

export const EPOINT_LOGO_PATH = "/epoint-logo.png";

const SIZE_MAP = {
  xs: { box: "h-8 w-8", dimension: 32 },
  sm: { box: "h-9 w-9", dimension: 36 },
  md: { box: "h-12 w-12", dimension: 48 },
  lg: { box: "h-16 w-16", dimension: 64 },
  xl: { box: "h-20 w-20", dimension: 80 },
  "2xl": { box: "h-28 w-28", dimension: 112 },
} as const;

export type AppLogoSize = keyof typeof SIZE_MAP;

interface AppLogoProps {
  size?: AppLogoSize;
  className?: string;
  priority?: boolean;
}

export function AppLogo({ size = "sm", className = "", priority }: AppLogoProps) {
  const { box, dimension } = SIZE_MAP[size];

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-xl bg-cream-400 shadow-sm ring-1 ring-cream-600/60 ${box} ${className}`.trim()}
    >
      <Image
        src={EPOINT_LOGO_PATH}
        alt="ePoint Corp"
        width={dimension}
        height={dimension}
        className="h-full w-full object-contain p-0.5"
        priority={priority}
      />
    </div>
  );
}
