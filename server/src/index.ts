import { getEnv } from "./config/env.js";
import { getSupabaseAdmin } from "./lib/supabase.js";
import { getLogger } from "./lib/logger.js";
import { createApp } from "./app.js";
import { startPendingExpiryJob } from "./jobs/expirePending.js";

function main(): void {
  const env = getEnv();
  const logger = getLogger();
  const supabase = getSupabaseAdmin();

  const app = createApp({ env, supabase });
  const stopExpiryJob = startPendingExpiryJob(supabase);

  const server = app.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        demoMode: env.DEMO_MODE,
        model: env.GEMINI_MODEL,
        origin: env.CLIENT_ORIGIN,
      },
      "Agent Guard API server listening",
    );
  });

  const shutdown = () => {
    stopExpiryJob();
    server.close(() => process.exit(0));
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main();

