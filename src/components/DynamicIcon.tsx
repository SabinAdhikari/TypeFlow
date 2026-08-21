import * as Icons from "lucide-react";

interface DynamicIconProps {
  name: string;
  className?: string;
}

export function DynamicIcon({ name, className = "w-6 h-6" }: DynamicIconProps) {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] || Icons.Award;
  return <Icon className={className} />;
}
