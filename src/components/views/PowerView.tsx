import { useEffect, useState } from "react";
import { inverter as initialInverter, type InverterShape } from "@/data/mock";
import { PowerFlow } from "@/components/widgets/PowerFlow";
import { BatteryCard, SolarCurve, TodayCard } from "@/components/widgets/PowerSummary";

/**
 * Step the simulated inverter one tick — keeps the energy balance honest:
 *   solar = load + battery_charge + grid_export, etc.
 * In Phase 4 this whole simulation is replaced by live entity values.
 */
function stepInverter(s: InverterShape): InverterShape {
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  const r1 = (v: number) => Math.round(v * 10) / 10;

  const solar = clamp(s.solar + (Math.random() - 0.5) * 0.7, 0, 6.2);
  const load = clamp(s.load + (Math.random() - 0.5) * 0.5, 0.7, 3.8);

  let battery = s.battery;
  let batteryFlow = 0;
  let grid = 0;
  const surplus = solar - load;

  if (surplus >= 0) {
    const charge = battery < 100 ? Math.min(surplus, 2.5) : 0;
    batteryFlow = charge;
    grid = -(surplus - charge); // export the rest
  } else {
    const deficit = -surplus;
    const dis = battery > 8 ? Math.min(deficit, 2.5) : 0;
    batteryFlow = -dis;
    grid = deficit - dis; // import what we couldn't cover
  }
  battery = clamp(battery + batteryFlow * 0.05, 5, 100);

  return {
    ...s,
    solar: r1(solar),
    load: r1(load),
    batteryFlow: r1(batteryFlow),
    grid: r1(grid),
    battery: Math.round(battery),
  };
}

export function PowerView() {
  const [inv, setInv] = useState<InverterShape>(initialInverter);
  useEffect(() => {
    const id = setInterval(() => setInv((cur) => stepInverter(cur)), 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rise">
      <div className="view-head">
        <h2>Power</h2>
        <p>
          Hybrid inverter ·{" "}
          {inv.solar > inv.load ? "running on solar" : "drawing from battery"}
        </p>
      </div>
      <div className="grid">
        <PowerFlow inv={inv} />
        <BatteryCard inv={inv} />
        <SolarCurve inv={inv} />
        <TodayCard inv={inv} />
      </div>
    </div>
  );
}
