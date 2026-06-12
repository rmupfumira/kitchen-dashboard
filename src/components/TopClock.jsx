import { useEffect, useState } from "react";

/** Top-left clock — the largest element on screen per spec. 12h + AM/PM. */
export default function TopClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = now.getHours();
  const h12 = ((hh + 11) % 12) + 1;
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ampm = hh < 12 ? "AM" : "PM";
  const dateStr = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="card rise tclock">
      <div className="tclock-time">
        <span className="tclock-hm">
          {h12}:{mm}
        </span>
        <span className="tclock-ampm">{ampm}</span>
      </div>
      <div className="tclock-date">{dateStr}</div>
    </div>
  );
}
