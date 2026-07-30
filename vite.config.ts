import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer as createQPayServer } from "./server/index";

function qpayApiPlugin() {
  return {
    name: "qpay-api",
    configureServer(viteServer: any) {
      let api: any;
      let startupError: unknown;

      createQPayServer()
        .then((app) => {
          api = app;
        })
        .catch((error) => {
          startupError = error;
          console.error("Failed to start QPay API middleware:", error);
        });

      viteServer.middlewares.use((req: any, res: any, next: any) => {
        const url = req.url || "";
        const isApiRequest =
          url.startsWith("/api/") ||
          url === "/health" ||
          url === "/ready";

        if (!isApiRequest) {
          next();
          return;
        }

        if (startupError) {
          res.statusCode = 503;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ success: false, message: "API unavailable" }));
          return;
        }

        if (!api) {
          res.statusCode = 503;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ success: false, message: "API is starting" }));
          return;
        }

        api(req, res, next);
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [...(mode === "test" ? [] : [qpayApiPlugin()]), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}))
