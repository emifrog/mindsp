import { cn } from "@/lib/utils";

interface IconProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

const sizeMap = {
  xs: "text-sm",
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
  "2xl": "text-4xl",
};

export function Icon({ name, size = "md", className }: IconProps) {
  return (
    <span
      role="img"
      className={cn("inline-block flex-shrink-0 leading-none", sizeMap[size], className)}
    >
      {name}
    </span>
  );
}
