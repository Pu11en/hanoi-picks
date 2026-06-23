import { z } from "zod";

const envSchema = z.object({
  DISCORD_BOT_TOKEN: z.string().min(1, "DISCORD_BOT_TOKEN is required"),
  DISCORD_GUILD_ID: z.string().min(1, "DISCORD_GUILD_ID is required"),
  ALLOWED_USER_IDS: z
    .string()
    .min(1, "ALLOWED_USER_IDS is required")
    .transform((v) => v.split(",").map((id) => id.trim())),
  BASE_PROJECT_DIR: z.string().min(1, "BASE_PROJECT_DIR is required"),
  // Absolute path to the cloned discord-mcp directory. When set, the Discord
  // management MCP server is auto-attached to every Claude Code session.
  DISCORD_MCP_DIR: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  // The channel the agent listens in. On startup it auto-binds this channel
  // to AGENT_WORKSPACE_DIR so the owner can just talk — no /register needed.
  AGENT_CONTROL_CHANNEL: z.string().default("agent-control"),
  // Channel ID for picks intake — any message here is queued to the Make Video app, no Claude session.
  PICKS_INTAKE_CHANNEL_ID: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  // URL of the local Make Video app queue endpoint
  MAKE_VIDEO_QUEUE_URL: z.string().default("http://127.0.0.1:4000/api/queue"),
  AGENT_WORKSPACE_DIR: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(10),
  SHOW_COST: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  CLAUDE_MODEL: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export type Config = z.infer<typeof envSchema>;

let _config: Config | null = null;

export function loadConfig(): Config {
  if (_config) return _config;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    console.error(`Configuration error:\n${errors}`);
    process.exit(1);
  }

  _config = result.data;
  return _config;
}

export function getConfig(): Config {
  if (!_config) return loadConfig();
  return _config;
}
