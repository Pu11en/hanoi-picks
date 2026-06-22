import 'dotenv/config';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, GatewayIntentBits } from 'discord.js';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const messageOperatorDir = resolve(__dirname, '..');
const envPath = resolve(messageOperatorDir, '.env');

loadLocalEnv();

const token = process.env.DISCORD_BOT_TOKEN;
const supportChannelId = process.env.SUPPORT_CHANNEL_ID || process.env.CONTACT_US_CHANNEL_ID;

if (!token || !supportChannelId) {
  console.error('Missing Discord token or support channel setting.');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', async () => {
  try {
    const channel = await client.channels.fetch(supportChannelId);
    if (!channel?.isTextBased()) throw new Error('Support channel is not text-based.');

    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('support_open')
        .setLabel('Open Ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎫'),
    );

    await channel.send({
      content: `🎫 **SUPPORT**\n\nNeed help with access, payment, free Premium proof, or a missing role?\n\nClick **Open Ticket** and an admin will help you in a private thread.`,
      components: [button],
      allowedMentions: { parse: [] },
    });

    console.log('posted support ticket panel');
  } finally {
    client.destroy();
  }
});

client.login(token);

function loadLocalEnv() {
  if (!existsSync(envPath)) return;
  const env = readFileSync(envPath, 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    if (!process.env[key]) process.env[key] = valueParts.join('=').trim();
  }
}
