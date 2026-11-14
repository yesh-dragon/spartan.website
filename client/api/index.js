import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

let cachedHandler = null;

export default function handler(req, res) {
  try {
    if (!cachedHandler) {
      const { createServerlessHandler } = require("./_handler.cjs");
      cachedHandler = createServerlessHandler();
    }
    return cachedHandler(req, res);
  } catch (err) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        error: {
          code: "SERVER_UNAVAILABLE",
          message:
            err instanceof Error
              ? err.message
              : "Serverless API bundle failed to load. Enable 'Include source files outside of the Root Directory' or deploy from the repository root.",
        },
      }),
    );
  }
}
