/**
 * Icon — lucide-react wrapper that takes a string name like "lightbulb"
 * (matching the design's icon names) and renders the corresponding component.
 *
 * Using lucide-react instead of the UMD bundle: better TypeScript, tree-shaken
 * at build time, smaller production bundle.
 */
import { type LucideIcon, icons } from "lucide-react";
import { type CSSProperties, useMemo } from "react";

function toPascalCase(name: string): string {
  return name
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

interface IconProps {
  name: string;
  size?: number;
  stroke?: number;
  className?: string;
  style?: CSSProperties;
  color?: string;
  "aria-hidden"?: boolean;
}

export function Icon({
  name,
  size = 22,
  stroke = 2,
  className,
  style,
  color,
  ...rest
}: IconProps) {
  const Component = useMemo<LucideIcon>(() => {
    const pascal = toPascalCase(name) as keyof typeof icons;
    return icons[pascal] ?? icons.Square;
  }, [name]);

  return (
    <Component
      size={size}
      strokeWidth={stroke}
      color={color ?? "currentColor"}
      className={className}
      style={style}
      aria-hidden={rest["aria-hidden"] ?? true}
    />
  );
}
