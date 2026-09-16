import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // Relative URLs are required: Stake Engine serves the game from
    // https://{team}.live.stake-engine.com/{game}/v{version}/
    // Absolute `/_app/...` or `/assets/...` 404 on that host.
    paths: { relative: true },
    adapter: adapter({
      pages: "build",
      assets: "build",
      fallback: "index.html",
    }),
  },
};

export default config;
