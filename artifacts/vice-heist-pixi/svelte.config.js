import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // Stake Engine's RGS-driven games are static single-page bundles.
    adapter: adapter({
      pages: "build",
      assets: "build",
      fallback: "index.html",
    }),
  },
};

export default config;
