import tailwindcss from "@tailwindcss/vite";
import { getRequestListener } from "@hono/node-server";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import path from "path";
import { defineConfig } from "vite";
import { createApp } from "./src/server/app";

export default defineConfig(() => {
  const apiListener = getRequestListener(createApp().fetch);

  return {
    plugins: [
      {
        name: "aa-translator-api",
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (!req.url?.startsWith("/api")) {
              next();
              return;
            }

            apiListener(req, res);
          });
        },
      },
      react(),
      babel({
        presets: [reactCompilerPreset()],
      }),
      tailwindcss(),
    ],
    build: {
      outDir: "dist/client",
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true",
    },
  };
});
