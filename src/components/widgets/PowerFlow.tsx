import type { CSSProperties, ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import type { InverterShape } from "@/data/mock";
import { CardHead } from "./CardHead";

const f1 = (v: number) => (Math.round(Math.abs(v) * 10) / 10).toFixed(1);

/** Single edge in the power-flow diagram. Renders both the base track and the
 *  animated dash overlay when there's active flow in that direction. */
function Flow({
  x1,
  y1,
  x2,
  y2,
  active,
  color,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  active: boolean;
  color?: string;
}) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} className="flow-base" vectorEffect="non-scaling-stroke" />
      {active && (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          className="flow-dash"
          vectorEffect="non-scaling-stroke"
          style={{ stroke: color }}
        />
      )}
    </g>
  );
}

interface PNodeProps {
  pos: [number, number];
  icon: string;
  value?: string;
  unit?: string;
  big?: string;
  label: string;
  sub?: ReactNode;
  tone: string;
}

/** A power node chip — Solar / Grid / Battery / Home Load. Positioned via % coords. */
function PNode({ pos, icon, value, unit, big, label, sub, tone }: PNodeProps) {
  const style = { left: `${pos[0]}%`, top: `${pos[1]}%`, ["--tone" as string]: tone } as CSSProperties;
  return (
    <div className="pnode" style={style}>
      <div className="pnode-ic">
        <Icon name={icon} size={19} />
      </div>
      <div className="pnode-v">
        {big ?? value}
        {unit && <span className="u">{unit}</span>}
      </div>
      <div className="pnode-l">{label}</div>
      {sub && <div className="pnode-s">{sub}</div>}
    </div>
  );
}

/**
 * PowerFlow — animated SVG diagram showing solar → inverter → battery / grid / home.
 * Direction-aware: arrows reverse for battery discharge and grid export.
 */
export function PowerFlow({ inv }: { inv: InverterShape }) {
  const solarOn = inv.solar > 0.1;
  const loadOn = inv.load > 0.1;
  const charging = inv.batteryFlow > 0.05;
  const discharging = inv.batteryFlow < -0.05;
  const importing = inv.grid > 0.05;
  const exporting = inv.grid < -0.05;

  return (
    <div className="card rise" style={{ gridColumn: "span 8" }}>
      <CardHead
        icon="zap"
        title="Power Flow"
        sub="Live from inverter"
        right={
          <div className="live-chip">
            <span className="blink" />
            LIVE
          </div>
        }
      />

      <div className="flow-stage">
        <svg className="flow-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Flow x1={50} y1={16} x2={50} y2={50} active={solarOn} color="var(--c-solar)" />
          <Flow x1={50} y1={50} x2={50} y2={84} active={loadOn} color="var(--c-load)" />
          {charging && <Flow x1={50} y1={50} x2={85} y2={50} active color="var(--c-batt)" />}
          {discharging && <Flow x1={85} y1={50} x2={50} y2={50} active color="var(--c-batt)" />}
          {!charging && !discharging && <Flow x1={50} y1={50} x2={85} y2={50} active={false} />}
          {importing && <Flow x1={15} y1={50} x2={50} y2={50} active color="var(--c-grid)" />}
          {exporting && <Flow x1={50} y1={50} x2={15} y2={50} active color="var(--c-grid)" />}
          {!importing && !exporting && <Flow x1={15} y1={50} x2={50} y2={50} active={false} />}
        </svg>

        <PNode
          pos={[50, 16]}
          icon="sun"
          value={f1(inv.solar)}
          unit="kW"
          label="Solar"
          sub={solarOn ? "Producing" : "Idle"}
          tone="var(--c-solar)"
        />
        <PNode
          pos={[15, 50]}
          icon="utility-pole"
          value={f1(inv.grid)}
          unit="kW"
          label="Grid"
          sub={importing ? "Importing" : exporting ? "Exporting" : "Standby"}
          tone="var(--c-grid)"
        />
        <PNode
          pos={[85, 50]}
          icon="battery-charging"
          big={`${inv.battery}%`}
          label="Battery"
          sub={
            charging
              ? `Charging ${f1(inv.batteryFlow)}kW`
              : discharging
                ? `Discharging ${f1(inv.batteryFlow)}kW`
                : "Holding"
          }
          tone="var(--c-batt)"
        />
        <PNode
          pos={[50, 84]}
          icon="house"
          value={f1(inv.load)}
          unit="kW"
          label="Home Load"
          sub="Drawing now"
          tone="var(--c-load)"
        />

        <div className="pcenter">
          <Icon name="cpu" size={26} />
          <span>Inverter</span>
        </div>
      </div>
    </div>
  );
}
