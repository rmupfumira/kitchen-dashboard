/**
 * useService — handy wrapper that pulls the live connection from HaContext
 * and exposes a stable `call(domain, service, data, target)` function.
 *
 * Components do:
 *   const call = useService();
 *   call("light", "toggle", {}, { entity_id: "light.x" });
 *
 * If the connection is down, the call resolves with `undefined` and logs a
 * warning — never throws — so UI handlers don't need try/catch.
 */
import { useCallback } from "react";
import { useHA } from "./HaContext";
import { callService } from "./callService";

export function useService() {
  const { conn, status } = useHA();
  return useCallback(
    async (domain, service, data, target, returnResponse = false) => {
      if (status !== "connected" || !conn) {
        console.warn("[Dashboard] dropped service call — not connected", { domain, service });
        return undefined;
      }
      return callService(conn, domain, service, data, target, returnResponse);
    },
    [conn, status]
  );
}

/** Build an absolute URL for an HA media path (entity_picture, camera proxy, etc). */
export function haUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const base = (import.meta.env.VITE_HA_URL || "").replace(/\/$/, "");
  return base + (path.startsWith("/") ? path : "/" + path);
}

/** Append the access token to an HA URL — only do this for img/video src on the LAN. */
export function haAuthUrl(path) {
  const url = haUrl(path);
  if (!url) return "";
  const tok = (import.meta.env.VITE_HA_TOKEN || "").trim();
  if (!tok) return url;
  return url + (url.includes("?") ? "&" : "?") + "access_token=" + encodeURIComponent(tok);
}
