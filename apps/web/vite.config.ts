import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(dirname, "../..");

export default defineConfig({
  envDir: workspaceRoot,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "src"),
      "next/link": path.resolve(dirname, "src/shims/next-link.tsx"),
      "next/navigation": path.resolve(dirname, "src/shims/next-navigation.ts"),
      "next/image": path.resolve(dirname, "src/shims/next-image.tsx"),
      "next/dynamic": path.resolve(dirname, "src/shims/next-dynamic.tsx")
    }
  }
});
