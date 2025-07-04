import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  console.log("CONSOLE_VITE_MODE:", mode);
  console.log("CONSOLE_VITE_BASE_URL",env.VITE_BASE_URL);
  
  return {
    base: env.VITE_BASE_URL || "/",
    plugins: [
      react(),
      federation({
        name: "mfe_console",
        filename: "remoteEntry.js",
        exposes: {
          "./ConsoleApp": "./src/App.tsx",
        },
        shared: ["react", "react-dom"],
      }),
    ],
    server: {
      port: 8081, // dev mode
    },
    preview: {
      port: 8081, // prod/st mod
    },
    build: {
      target: "esnext",
      minify: false,
      cssCodeSplit: false,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});
