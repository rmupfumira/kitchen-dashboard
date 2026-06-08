/**
 * Toast — bottom-centered animated notification.
 * Listens to the dashboard store's `toast` value; renders nothing when null.
 */
import { AnimatePresence, motion } from "framer-motion";
import { useDashboardStore } from "@/state/useDashboardStore";
import { Icon } from "./Icon";

export function Toast() {
  const toast = useDashboardStore((s) => s.toast);
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          className="toast-wrap"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.25, ease: [0.3, 1, 0.4, 1] }}
        >
          <div className="toast">
            <Icon name={toast.icon} size={17} className="ic" />
            {toast.msg}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
