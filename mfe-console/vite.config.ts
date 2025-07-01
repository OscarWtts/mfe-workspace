import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  console.log("CONSOLE_VITE_MODE:", mode);
  console.log("CONSOLE_VITE_PORT:", env.VITE_PORT);

  return {
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
      port: Number(env.VITE_PORT) || 4174,
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
