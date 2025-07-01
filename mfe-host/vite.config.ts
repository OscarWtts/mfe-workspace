import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  console.log("HOST_VITE_MODE:", mode);
  console.log("HOST_VITE_PORT:", env.VITE_PORT);
  
  return {
    plugins: [
      react(),
      federation({
        remotes: {
          mfe_console: `${env.VITE_CONSOLE_REMOTE_URL}`,
        },
        shared: ["react", "react-dom"],
      }),
    ],
    server: {
      port: Number(env.VITE_PORT) || 4173,
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
