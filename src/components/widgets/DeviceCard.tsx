import clsx from "clsx";
import { Icon } from "@/components/ui/Icon";
import { Switch } from "@/components/ui/Switch";
import type { Device } from "@/data/mock";
import { Placeholder } from "./Placeholder";

interface DeviceCardProps {
  dev: Device;
  icon: string;
  onToggle: () => void;
}

/**
 * DeviceCard — small device tile (4-column-wide). Click anywhere to toggle.
 * TVs and lights show an image-slot placeholder; other types show a big icon.
 */
export function DeviceCard({ dev, icon, onToggle }: DeviceCardProps) {
  return (
    <div
      className={clsx("card dev rise", !dev.on && "off")}
      style={{ gridColumn: "span 3", padding: 14 }}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onToggle();
      }}
    >
      <div className="dev-thumb">
        {dev.type === "tv" || dev.type === "light" ? (
          <Placeholder label={dev.name} variant="rect" />
        ) : (
          <div className="dev-icwrap">
            <Icon name={icon} size={30} stroke={1.7} />
          </div>
        )}
      </div>
      <div className="dev-bottom">
        <div className="meta">
          <b>{dev.name}</b>
          <span>{dev.model}</span>
        </div>
        <Switch on={dev.on} onClick={onToggle} />
      </div>
    </div>
  );
}
