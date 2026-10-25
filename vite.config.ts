import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { parse } from "yaml";

// Degree requirement files (src/programs/*.yaml) are parsed here, so the app ships plain data.
const yaml = (): Plugin => ({
  name: "yaml",
  transform(src, id) {
    if (id.endsWith(".yaml")) return { code: `export default ${JSON.stringify(parse(src))};`, map: null };
  },
});

export default defineConfig({
  plugins: [react(), yaml()],
  base: "./",
});
