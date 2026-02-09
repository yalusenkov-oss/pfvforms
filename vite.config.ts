import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Загружаем переменные из .env и .env.local
  const env = loadEnv(mode, process.cwd(), '');
  
  // Take only VITE_ prefixed values to avoid leaking secrets
  const clientEnv = Object.keys(env)
    .filter((k) => k.startsWith('VITE_'))
    .reduce((acc, k) => {
      acc[k] = env[k];
      return acc;
    }, {} as Record<string, string>);

  return {
    plugins: [react(), tailwindcss(), viteSingleFile()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    // Передаём переменные в приложение через import.meta.env (весь объект)
    define: {
      'import.meta.env': JSON.stringify(clientEnv),
    },
  };
});
