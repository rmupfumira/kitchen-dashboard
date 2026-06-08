import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

interface SectionLabelProps {
  icon: string;
  children: ReactNode;
  right?: ReactNode;
}

/**
 * Section divider inside the dashboard grid — spans all 12 columns.
 * Used to break the long dashboard into "Security & Access", "Scenes", "Devices".
 */
export function SectionLabel({ icon, children, right }: SectionLabelProps) {
  return (
    <div className="section-label" style={{ gridColumn: "1 / -1" }}>
      <Icon name={icon} size={16} />
      <span>{children}</span>
      <div style={{ flex: 1 }} />
      {right}
    </div>
  );
}
