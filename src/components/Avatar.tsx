interface AvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-20 h-20 text-2xl",
};

export function Avatar({ username, avatarUrl, size = "md" }: AvatarProps) {
  const initials = username.slice(0, 2).toUpperCase();
  const colors = [
    "from-brand-400 to-brand-600",
    "from-emerald-400 to-emerald-600",
    "from-amber-400 to-amber-600",
    "from-rose-400 to-rose-600",
    "from-cyan-400 to-cyan-600",
    "from-teal-400 to-teal-600",
  ];
  const colorIdx = username.charCodeAt(0) % colors.length;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center font-semibold text-white ring-2 ring-slate-200 dark:ring-slate-700`}
    >
      {initials}
    </div>
  );
}
