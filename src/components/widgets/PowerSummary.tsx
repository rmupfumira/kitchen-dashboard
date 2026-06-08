import { Icon } from "@/components/ui/Icon";
import { Ring } from "@/components/ui/Ring";
import type { InverterShape } from "@/data/mock";
import { CardHead } from "./CardHead";

const f1 = (v: number) => (Math.round(Math.abs(v) * 10) / 10).toFixed(1);

/** Battery detail card — % ring + flow info + capacity bar. */
export function BatteryCard({ inv }: { inv: InverterShape }) {
  const charging = inv.batteryFlow > 0.05;
  const usable = (inv.batteryCap * (inv.battery / 100)).toFixed(1);

  return (
    <div className="card rise" style={{ gridColumn: "span 4" }}>
      <CardHead icon="battery-full" title="Battery" sub={`${inv.batteryCap} kWh system`} />

      <div className="gauge" style={{ marginBottom: 18 }}>
        <Ring
          value={inv.battery}
          size={116}
          thickness={13}
          grad={["oklch(0.74 0.13 150)", "oklch(0.6 0.13 158)"]}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.03em" }}>
              {inv.battery}%
            </div>
            <div
              style={{
                fontSize: 10.5,
                color: "var(--ink-mute)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: ".04em",
              }}
            >
              {charging ? "Charging" : "Discharging"}
            </div>
          </div>
        </Ring>

        <div className="gauge-meta" style={{ gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--ink-mute)", fontWeight: 600 }}>
              {charging ? "Power in" : "Power out"}
            </div>
            <div style={{ fontSize: 19, fontWeight: 800 }}>
              {f1(inv.batteryFlow)}
              <span style={{ fontSize: 12, color: "var(--ink-mute)", marginLeft: 3 }}>kW</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--ink-mute)", fontWeight: 600 }}>
              {charging ? "Until full" : "Backup left"}
            </div>
            <div style={{ fontSize: 19, fontWeight: 800 }}>{inv.batteryTime}</div>
          </div>
        </div>
      </div>

      <div className="batt-track">
        <div className="batt-fill" style={{ width: `${inv.battery}%` }} />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 9,
          fontSize: 12,
          color: "var(--ink-mute)",
          fontWeight: 600,
        }}
      >
        <span>{usable} kWh available</span>
        <span>{inv.batteryCap} kWh</span>
      </div>
    </div>
  );
}

/** Today's solar generation as a 2-hour-bucketed bar chart. */
export function SolarCurve({ inv }: { inv: InverterShape }) {
  const max = Math.max(...inv.curve);
  return (
    <div className="card rise" style={{ gridColumn: "span 8" }}>
      <CardHead
        icon="sun-medium"
        title="Solar Production · Today"
        sub={`Peak ${inv.solarPeak} kW`}
        right={
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.02em" }}>
              {inv.solarToday}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-mute)", fontWeight: 600 }}>
              kWh generated
            </div>
          </div>
        }
      />
      <div className="chart" style={{ height: 150 }}>
        {inv.curve.map((v, i) => (
          <div className="bar-col" key={inv.curveLabels[i]}>
            <div
              className={`bar${v === max ? " lit" : ""}`}
              style={{
                height: `${(v / max) * 100}%`,
                background:
                  v === max
                    ? undefined
                    : "color-mix(in oklch, var(--c-solar) 26%, transparent)",
                maxWidth: 30,
              }}
            />
            <span className="m">{inv.curveLabels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Self-sufficiency + today's balance breakdown. */
export function TodayCard({ inv }: { inv: InverterShape }) {
  const rows = [
    { ic: "sun", c: "var(--c-solar)", l: "Produced", v: `${inv.solarToday} kWh` },
    { ic: "house", c: "var(--c-load)", l: "Consumed", v: `${inv.loadToday} kWh` },
    { ic: "arrow-down-to-line", c: "var(--c-grid)", l: "Imported", v: `${inv.gridToday.import} kWh` },
    { ic: "arrow-up-from-line", c: "var(--c-batt)", l: "Exported", v: `${inv.gridToday.export} kWh` },
  ];
  return (
    <div className="card rise" style={{ gridColumn: "span 4" }}>
      <CardHead icon="leaf" title="Today" sub="Energy balance" />
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
        <Ring
          value={inv.selfSufficiency}
          size={84}
          thickness={11}
          grad={["oklch(0.74 0.13 150)", "var(--c-solar)"]}
        >
          <span style={{ fontSize: 18, fontWeight: 800 }}>{inv.selfSufficiency}%</span>
        </Ring>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Self-sufficient</div>
          <div style={{ fontSize: 12, color: "var(--ink-mute)", fontWeight: 500, maxWidth: 150 }}>
            Share of your home powered by sun &amp; battery today
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {rows.map((r) => (
          <div className="trow" key={r.l}>
            <span className="tdot" style={{ background: r.c }} />
            <Icon name={r.ic} size={15} color="var(--ink-mute)" />
            <span className="tl">{r.l}</span>
            <span className="tv">{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
