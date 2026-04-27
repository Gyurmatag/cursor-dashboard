import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig({
	// Uncomment to enable R2 cache,
	// It should be imported as:
	// `import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";`
	// See https://opennext.js.org/cloudflare/caching for more details
	// incrementalCache: r2IncrementalCache,
});

// Use a dedicated Next.js build script so that `npm run build` (used by
// Cloudflare Workers Builds CI) can wrap the full OpenNext bundle step
// without recursing back into itself.
// `defineCloudflareConfig` strips unknown options, so we attach this directly
// to the returned config object.
export default {
	...config,
	buildCommand: "npm run build:next",
};
