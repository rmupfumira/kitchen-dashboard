/**
 * Thin wrapper for `conn.sendMessagePromise({type: 'call_service', ...})`.
 *
 * Usage:
 *   const { conn } = useHA();
 *   await callService(conn, "light", "turn_on", { brightness: 200 },
 *                     { entity_id: "light.kitchen" });
 */
export async function callService(conn, domain, service, serviceData = {}, target = undefined) {
  if (!conn) {
    console.warn("[Dashboard] callService called without a connection", { domain, service });
    return;
  }
  const payload = {
    type: "call_service",
    domain,
    service,
    service_data: serviceData,
  };
  if (target) payload.target = target;
  try {
    return await conn.sendMessagePromise(payload);
  } catch (err) {
    console.warn("[Dashboard] service call failed", domain, service, err);
    throw err;
  }
}
