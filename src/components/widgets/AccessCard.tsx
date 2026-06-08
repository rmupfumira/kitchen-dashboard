import clsx from "clsx";
import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";
import { Switch } from "@/components/ui/Switch";

interface AccessCardProps {
  icon: string;
  name: string;
  on: boolean;
  onLabel: string;
  offLabel: string;
  /** CSS color string — drives border + status dot + icon glow when on. */
  tone: string;
  onToggle: () => void;
  span?: number;
}

/**
 * AccessCard — single security/access tile (e.g. Garage, Gate, Outdoor Alarm).
 * The whole card is clickable; the Switch shows current state.
 */
export function AccessCard({
  icon,
  name,
  on,
  onLabel,
  offLabel,
  tone,
  onToggle,
  span = 3,
}: AccessCardProps) {
  const style = {
    gridColumn: `span ${span}`,
    ["--tone" as string]: tone,
  } as CSSProperties;

  return (
    <div
      className={clsx("card access", on && "on")}
      style={style}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onToggle();
      }}
    >
      <div className="access-top">
        <div className="access-ic">
          <Icon name={icon} size={23} />
        </div>
        <Switch on={on} onClick={onToggle} />
      </div>
      <div className="access-name">{name}</div>
      <div className="access-status">
        <span className="adot" />
        {on ? onLabel : offLabel}
      </div>
    </div>
  );
}
