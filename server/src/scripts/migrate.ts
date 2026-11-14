import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { config as loadDotenv } from "dotenv";
import { Client as PgClient } from "pg";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SEED_EMAILS, bootstrapUserWorkspace } from "../services/seed.js";

const REQUIRED_TABLES = [
  "profiles",
  "guard_settings",
  "seed_email_templates",
  "emails",
  "scans",
  "alerts",
  "pending_actions",
  "audit_log",
] as const;

export interface MigrationOptions {
  supabaseUrl: string;
  serviceRoleKey: string;
  databaseUrl?: string;
  accessToken?: string;
  migrationsDir?: string;
  seedOnly?: boolean;
  verifyOnly?: boolean;
  demoUserEmail?: string;
  demoUserPassword?: string;
}

export interface MigrationResult {
  ddlMethod: "pg_direct" | "management_api" | "service_role_pg_meta" | "service_role_rpc" | "already_present" | "skipped";
  appliedFiles: string[];
  verifiedTables: string[];
  templatesSynced: number;
  usersSeeded: number;
}

export function resolveRepoRoot(): string {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // Supports running from both server/src/scripts and server/dist/scripts
  return path.resolve(__dirname, "../../..");
}

export function resolveSupabaseProjectRef(supabaseUrl: string): string | null {
  try {
    const parsed = new URL(supabaseUrl);
    const match = /^([a-z0-9-]+)\.supabase\.(co|in|red)$/i.exec(parsed.hostname);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export function loadMigrationFiles(migrationsDir: string): Array<{ name: string; sql: string }> {
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();
  if (files.length === 0) {
    throw new Error(`No .sql migration files found in: ${migrationsDir}`);
  }
  return files.map((file) => ({
    name: file,
    sql: fs.readFileSync(path.join(migrationsDir, file), "utf8"),
  }));
}

async function tryServiceRoleSqlEndpoint(
  supabaseUrl: string,
  serviceRoleKey: string,
  sql: string,
): Promise<"service_role_pg_meta" | "service_role_rpc" | null> {
  const base = supabaseUrl.replace(/\/+$/, "");
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };

  // 1. Check Supabase PgMeta SQL endpoint (available on Studio / exposed pg-meta instances)
  try {
    const metaRes = await fetch(`${base}/pg/query`, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: sql }),
    });
    if (metaRes.ok) {
      return "service_role_pg_meta";
    }
  } catch {
    // Fall through to RPC check
  }

  // 2. Check PostgREST exec_sql RPC if pre-installed on target Supabase DB
  for (const body of [{ sql }, { query: sql }]) {
    try {
      const rpcRes = await fetch(`${base}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      if (rpcRes.ok) {
        return "service_role_rpc";
      }
    } catch {
      // Try next payload shape
    }
  }

  return null;
}

async function applySqlViaPg(databaseUrl: string, migrations: Array<{ name: string; sql: string }>): Promise<void> {
  const client = new PgClient({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")
      ? false
      : { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    for (const migration of migrations) {
      await client.query(migration.sql);
    }
  } finally {
    await client.end();
  }
}

async function applySqlViaManagementApi(
  projectRef: string,
  accessToken: string,
  migrations: Array<{ name: string; sql: string }>,
): Promise<void> {
  for (const migration of migrations) {
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: migration.sql }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Supabase Management API failed on ${migration.name} (HTTP ${res.status}): ${text}`,
      );
    }
  }
}

async function checkTablesExist(adminClient: SupabaseClient): Promise<string[]> {
  const present: string[] = [];
  for (const table of REQUIRED_TABLES) {
    const { error } = await adminClient
      .from(table)
      .select("*", { count: "exact", head: true });
    if (!error) {
      present.push(table);
    }
  }
  return present;
}

export async function verifyAndSeedWithServiceRole(
  adminClient: SupabaseClient,
  options: Pick<MigrationOptions, "verifyOnly" | "demoUserEmail" | "demoUserPassword"> = {},
): Promise<{ verifiedTables: string[]; templatesSynced: number; usersSeeded: number }> {
  const presentTables = await checkTablesExist(adminClient);
  const missing = REQUIRED_TABLES.filter((t) => !presentTables.includes(t));
  if (missing.length > 0) {
    throw new Error(
      `Schema verification failed. Missing or inaccessible tables: ${missing.join(", ")}`,
    );
  }

  let templatesSynced = 0;
  let usersSeeded = 0;

  if (!options.verifyOnly) {
    const templateRows = SEED_EMAILS.map((item) => ({
      slug: item.slug,
      from_address: item.from_address,
      subject: item.subject,
      body_html: item.body_html,
      minutes_ago: item.minutesAgo,
      sort_order: item.sortOrder,
    }));

    const { error: upsertErr } = await adminClient
      .from("seed_email_templates")
      .upsert(templateRows, { onConflict: "slug" });
    if (upsertErr) {
      throw new Error(`Failed syncing seed_email_templates via service role: ${upsertErr.message}`);
    }
    templatesSynced = templateRows.length;

    if (options.demoUserEmail && options.demoUserPassword) {
      const { data: listed } = await adminClient.auth.admin.listUsers({ perPage: 100 });
      const existing = listed?.users.find(
        (u) => u.email?.toLowerCase() === options.demoUserEmail!.toLowerCase(),
      );
      if (!existing) {
        const { error: createUserErr } = await adminClient.auth.admin.createUser({
          email: options.demoUserEmail,
          password: options.demoUserPassword,
          email_confirm: true,
        });
        if (createUserErr) {
          throw new Error(`Failed creating demo user: ${createUserErr.message}`);
        }
      }
    }

    const { data: usersData, error: listUsersErr } = await adminClient.auth.admin.listUsers({
      perPage: 100,
    });
    if (listUsersErr) {
      throw new Error(`Failed listing Supabase Auth users: ${listUsersErr.message}`);
    }

    for (const user of usersData.users) {
      await bootstrapUserWorkspace(adminClient, user.id, user.email ?? undefined);
      usersSeeded += 1;
    }
  }

  return {
    verifiedTables: presentTables,
    templatesSynced,
    usersSeeded,
  };
}

export async function runMigration(options: MigrationOptions): Promise<MigrationResult> {
  const repoRoot = resolveRepoRoot();
  const migrationsDir = options.migrationsDir ?? path.join(repoRoot, "supabase", "migrations");
  const migrations = loadMigrationFiles(migrationsDir);

  const adminClient = createClient(options.supabaseUrl, options.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let ddlMethod: MigrationResult["ddlMethod"] = "skipped";
  let appliedFiles: string[] = [];

  if (!options.seedOnly && !options.verifyOnly) {
    if (options.databaseUrl) {
      await applySqlViaPg(options.databaseUrl, migrations);
      ddlMethod = "pg_direct";
      appliedFiles = migrations.map((m) => m.name);
    } else if (options.accessToken) {
      const ref = resolveSupabaseProjectRef(options.supabaseUrl);
      if (!ref) {
        throw new Error(
          `Could not extract Supabase project ref from SUPABASE_URL (${options.supabaseUrl}) for Management API migration.`,
        );
      }
      await applySqlViaManagementApi(ref, options.accessToken, migrations);
      ddlMethod = "management_api";
      appliedFiles = migrations.map((m) => m.name);
    } else {
      // Try Supabase Service Role SQL endpoints first
      let endpointMethod: "service_role_pg_meta" | "service_role_rpc" | null = null;
      for (const migration of migrations) {
        endpointMethod = await tryServiceRoleSqlEndpoint(
          options.supabaseUrl,
          options.serviceRoleKey,
          migration.sql,
        );
        if (!endpointMethod) break;
      }

      if (endpointMethod) {
        ddlMethod = endpointMethod;
        appliedFiles = migrations.map((m) => m.name);
      } else {
        // Check if tables are already applied in Postgres (verify + seed via service role)
        const present = await checkTablesExist(adminClient);
        if (present.length === REQUIRED_TABLES.length) {
          ddlMethod = "already_present";
        } else {
          throw new Error(
            [
              "Supabase Cloud PostgREST does not expose raw DDL execution with SUPABASE_SERVICE_ROLE_KEY alone.",
              `Detected ${present.length}/${REQUIRED_TABLES.length} schema tables in PostgreSQL.`,
              "To apply /supabase/migrations/001_initial_schema.sql directly from Node, set ONE of:",
              "  1. SUPABASE_DB_URL=postgresql://postgres:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres",
              "  2. SUPABASE_ACCESS_TOKEN=<Supabase Personal Access Token>",
              "Or paste supabase/migrations/001_initial_schema.sql into Supabase SQL Editor once, then re-run `npm run db:migrate` to verify & seed via SUPABASE_SERVICE_ROLE_KEY.",
            ].join("\n"),
          );
        }
      }
    }
  }

  const verification = await verifyAndSeedWithServiceRole(adminClient, {
    verifyOnly: options.verifyOnly,
    demoUserEmail: options.demoUserEmail,
    demoUserPassword: options.demoUserPassword,
  });

  return {
    ddlMethod,
    appliedFiles,
    ...verification,
  };
}

async function main(): Promise<void> {
  const repoRoot = resolveRepoRoot();
  // Load server/.env first, then root .env without overriding explicitly set env vars
  loadDotenv({ path: path.join(repoRoot, "server", ".env") });
  loadDotenv({ path: path.join(repoRoot, ".env") });

  const args = new Set(process.argv.slice(2));
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "[Agent Guard Migrate] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment / server/.env.",
    );
    process.exit(1);
  }

  const result = await runMigration({
    supabaseUrl,
    serviceRoleKey,
    databaseUrl: process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL,
    accessToken: process.env.SUPABASE_ACCESS_TOKEN,
    seedOnly: args.has("--seed-only"),
    verifyOnly: args.has("--verify-only"),
    demoUserEmail: process.env.SEED_DEMO_USER_EMAIL,
    demoUserPassword: process.env.SEED_DEMO_USER_PASSWORD,
  });

  console.log("[Agent Guard Migrate] Completed cleanly:", JSON.stringify(result, null, 2));
}

const isEntrypoint =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isEntrypoint) {
  main().catch((err) => {
    console.error("[Agent Guard Migrate] Error:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
}

