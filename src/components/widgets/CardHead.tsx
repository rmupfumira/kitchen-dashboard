import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

interface CardHeadProps {
  icon?: string;
  title: string;
  sub?: string;
  right?: ReactNode;
}

/**
 * Card header — icon chip + title + subtitle, with an optional right-aligned slot
 * (typically a Switch or summary number). Used inside every card with a heading.
 */
export function CardHead({ icon, title, sub, right }: CardHeadProps) {
  return (
    <div className="card-head">
      {icon && (
        <div className="card-ic">
          <Icon name={icon} size={18} />
        </div>
      )}
      <div>
        <div className="card-title">{title}</div>
        {sub && <div className="card-sub">{sub}</div>}
      </div>
      <div className="spacer" />
      {right}
    </div>
  );
}
