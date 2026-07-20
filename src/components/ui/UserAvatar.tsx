"use client";

type UserAvatarSize = "sm" | "md" | "lg";

const sizeClass: Record<UserAvatarSize, string> = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-20 w-20 text-xl",
};

interface UserAvatarProps {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  size?: UserAvatarSize;
  className?: string;
}

export function UserAvatar({
  firstName,
  lastName,
  avatarUrl,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const dim = sizeClass[size];

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className={`${dim} shrink-0 rounded-full object-cover ring-2 ring-slate-200 ${className}`.trim()}
      />
    );
  }

  return (
    <div
      className={`flex ${dim} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark font-bold text-white ring-2 ring-slate-200 ${className}`.trim()}
      aria-hidden
    >
      {firstName?.[0] ?? ""}
      {lastName?.[0] ?? ""}
    </div>
  );
}
