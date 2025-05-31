import { defineConfig } from "@vscode/test-cli";

// biome-ignore lint/style/noDefaultExport: <explanation>
export default defineConfig({
  files: "out/test/**/*.test.js"
});
