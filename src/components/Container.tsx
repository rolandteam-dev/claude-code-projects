import type { ReactNode } from "react";

export function Container({
  children,
  size = "default",
  className = "",
}: {
  children: ReactNode;
  size?: "narrow" | "default" | "wide";
  className?: string;
}) {
  const max =
    size === "narrow" ? "max-w-[820px]" : size === "wide" ? "max-w-[1200px]" : "max-w-[1040px]";
  return <div className={`${max} mx-auto px-6 ${className}`}>{children}</div>;
}
