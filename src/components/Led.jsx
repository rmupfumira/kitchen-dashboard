/**
 * 8px status LED. Tones: default · gold · success · warning · critical.
 * Set `pulse` for the heartbeat animation.
 */
export default function Led({ tone = "default", pulse = false }) {
  const cls = ["led"];
  if (tone !== "default") cls.push(tone);
  if (pulse) cls.push("pulse");
  return <span className={cls.join(" ")} aria-hidden="true" />;
}
