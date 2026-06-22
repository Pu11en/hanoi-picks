import 'dotenv/config';
import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const messageOperatorDir = resolve(__dirname, '..');
const envPath = resolve(messageOperatorDir, '.env');

if (existsSync(envPath)) {
  const env = readFileSync(envPath, 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    if (!process.env[key]) process.env[key] = valueParts.join('=').trim();
  }
}

const token = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !guildId) {
  console.error('Missing private Discord settings. Fill product/message-operator/.env first.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const typeLabel = new Map([
  [ChannelType.GuildText, 'text'],
  [ChannelType.GuildAnnouncement, 'announcement'],
  [ChannelType.GuildForum, 'forum'],
  [ChannelType.GuildCategory, 'category'],
  [ChannelType.GuildVoice, 'voice'],
  [ChannelType.GuildStageVoice, 'stage'],
]);

client.once('ready', async () => {
  try {
    const guild = await client.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();

    const rows = [...channels.values()]
      .filter(Boolean)
      .sort((a, b) => (a.rawPosition ?? 0) - (b.rawPosition ?? 0))
      .map((channel) => ({
        id: channel.id,
        name: channel.name,
        type: typeLabel.get(channel.type) ?? String(channel.type),
        parent: channel.parent?.name ?? null,
      }));

    const outputPath = resolve(messageOperatorDir, 'config', 'live-channels.json');
    writeFileSync(outputPath, JSON.stringify({ guild: { id: guild.id, name: guild.name }, channels: rows }, null, 2));

    console.log(`Connected to ${guild.name}. Found ${rows.length} channels.`);
    for (const row of rows) {
      const parent = row.parent ? `${row.parent} / ` : '';
      console.log(`${row.type.padEnd(12)} ${parent}${row.name}  (${row.id})`);
    }
    console.log('\nSaved live channel list to product/message-operator/config/live-channels.json');
  } finally {
    client.destroy();
  }
});

client.login(token);
