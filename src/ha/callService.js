/**
 * Thin wrapper for `conn.sendMessagePromise({type: 'call_service', ...})`.
 *
 * Usage:
 *   const { conn } = useHA();
 *   await callService(conn, "light", "turn_on", { brightness: 200 },
 *                     { entity_id: "light.kitchen" });
 */
export async function callService(conn, domain, service, serviceData = {}, target = undefined, returnResponse = false) {
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
  if (returnResponse) payload.return_response = true;
  try {
    const res = await conn.sendMessagePromise(payload);
    // For response-returning services (e.g. music_assistant.search) HA wraps the
    // data as { context, response }; hand back just the response.
    return returnResponse ? res?.response : res;
  } catch (err) {
    console.warn("[Dashboard] service call failed", domain, service, err);
    throw err;
  }
}
