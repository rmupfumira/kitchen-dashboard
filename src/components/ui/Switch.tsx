/**
 * Switch — pill-shaped on/off toggle. Visual style lives in .switch (shell.css)
 * which Phase 2 will move into widgets.css. Stops propagation so it can be
 * embedded inside clickable cards.
 */
import { type MouseEvent } from "react";
import clsx from "clsx";

interface SwitchProps {
  on: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}

export function Switch({ on, onClick, ariaLabel = "toggle" }: SwitchProps) {
  return (
    <button
      type="button"
      className={clsx("switch", on && "on")}
      onClick={(e: MouseEvent) => {
        e.stopPropagation();
        onClick?.();
      }}
      aria-pressed={on}
      aria-label={ariaLabel}
    />
  );
}
