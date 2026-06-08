import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Vite config — local-LAN-friendly dev server, alias `@` → `src`.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    host: true, // expose on LAN so you can preview on the wall panel during dev
    port: 5173,
    strictPort: true,
  },
  build: {
    target: "es2022",
    sourcemap: false,
    cssCodeSplit: true,
    // lucide-react contains ~1.4k icon components → expected to be the biggest chunk.
    // Default 500 kB warning is noisy; 800 kB matches reality and still flags real bloat.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // small named chunks so the wall-panel browser cache survives small edits
        manualChunks: {
          react: ["react", "react-dom"],
          ha: ["home-assistant-js-websocket"],
          icons: ["lucide-react"],
          motion: ["framer-motion"],
        },
      },
    },
  },
});
