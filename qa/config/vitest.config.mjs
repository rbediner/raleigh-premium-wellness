import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["qa/unit/**/*.test.js", "qa/tests/**/*.test.js"],
  },
});
