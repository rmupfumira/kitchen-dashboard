/**
 * HaProvider — single React context holding:
 *   - status     "idle" | "connecting" | "connected" | "error"
 *   - entities   { entity_id: { state, attributes, last_changed, ... } }
 *   - conn       the live Connection object (or null) — used for service calls
 *   - error      a readable string when status === "error"
 *
 * Everything subscribes through useHA() / useEntity(). Children should never
 * touch the connection directly.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { HA_CONFIGURED, describeError, openConnection, subscribeEntities } from "./client";

const HaContext = createContext(null);

export function HaProvider({ children }) {
  const [status, setStatus] = useState(HA_CONFIGURED ? "connecting" : "error");
  const [entities, setEntities] = useState({});
  const [error, setError] = useState(HA_CONFIGURED ? null : "Missing VITE_HA_URL / VITE_HA_TOKEN");
  const connRef = useRef(null);
  const unsubRef = useRef(null);
  const retryRef = useRef(null);

  // Connection lifecycle: open + subscribe + handle reconnects.
  // The library auto-retries inside createConnection, but we also catch the
  // first-shot failure and retry after a backoff so the UI can recover even
  // if HA was down at boot.
  const connect = useCallback(async () => {
    if (!HA_CONFIGURED) return;
    setStatus("connecting");
    setError(null);
    try {
      const conn = await openConnection();
      connRef.current = conn;
      // ready/disconnected/reconnect-error events — keep status fresh
      conn.addEventListener("ready", () => {
        setStatus("connected");
        setError(null);
      });
      conn.addEventListener("disconnected", () => {
        setStatus("connecting");
      });
      conn.addEventListener("reconnect-error", (_c, err) => {
        setStatus("error");
        setError(describeError(err));
      });
      // initial state stream
      unsubRef.current = subscribeEntities(conn, (next) => {
        setEntities(next);
      });
      setStatus("connected");
    } catch (err) {
      const msg = describeError(err);
      setError(msg);
      setStatus("error");
      // simple backoff retry — fires once every 8s until the user reconnects
      clearTimeout(retryRef.current);
      retryRef.current = setTimeout(connect, 8000);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(retryRef.current);
      try { unsubRef.current && unsubRef.current(); } catch {}
      try { connRef.current && connRef.current.close(); } catch {}
    };
  }, [connect]);

  const retry = useCallback(() => {
    clearTimeout(retryRef.current);
    connect();
  }, [connect]);

  const value = {
    status,
    entities,
    error,
    conn: connRef.current,
    retry,
  };

  return <HaContext.Provider value={value}>{children}</HaContext.Provider>;
}

export function useHA() {
  const ctx = useContext(HaContext);
  if (!ctx) throw new Error("useHA must be used inside <HaProvider>");
  return ctx;
}

/** Subscribe to a single entity by id. Returns its state object, or undefined. */
export function useEntity(entityId) {
  const { entities } = useHA();
  return entityId ? entities[entityId] : undefined;
}

/** Subscribe to many entities. Returns a same-order array of state objects. */
export function useEntities(...ids) {
  const { entities } = useHA();
  return ids.map((id) => entities[id]);
}
