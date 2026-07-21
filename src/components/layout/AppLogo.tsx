import Image from "next/image";

export const EPOINT_LOGO_PATH = "/epoint-logo.png";

const SIZE_MAP = {
  xs: { box: "h-8 w-8", dimension: 32, radius: "rounded-md" },
  sm: { box: "h-9 w-9", dimension: 36, radius: "rounded-md" },
  md: { box: "h-12 w-12", dimension: 48, radius: "rounded-lg" },
  lg: { box: "h-16 w-16", dimension: 64, radius: "rounded-xl" },
  xl: { box: "h-20 w-20", dimension: 80, radius: "rounded-2xl" },
  "2xl": { box: "h-28 w-28", dimension: 112, radius: "rounded-2xl" },
} as const;

export type AppLogoSize = keyof typeof SIZE_MAP;

interface AppLogoProps {
  size?: AppLogoSize;
  className?: string;
  priority?: boolean;
}

export function AppLogo({ size = "sm", className = "", priority }: AppLogoProps) {
  const { box, dimension, radius } = SIZE_MAP[size];

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-cream-400 shadow-sm ring-1 ring-cream-600/60 ${radius} ${box} ${className}`.trim()}
    >
      <Image
        src={EPOINT_LOGO_PATH}
        alt="Epoint Corp"
        width={dimension}
        height={dimension}
        className="h-full w-full object-cover object-center"
        priority={priority}
      />
    </div>
  );
}
