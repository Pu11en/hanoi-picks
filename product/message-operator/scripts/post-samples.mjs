import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const messageOperatorDir = resolve(__dirname, '..');
const envPath = resolve(messageOperatorDir, '.env');

loadLocalEnv();

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error('Missing DISCORD_BOT_TOKEN in private settings.');
  process.exit(1);
}

const samplePosts = {
  ANNOUNCEMENTS_CHANNEL_ID: `📢 HANOI PICKS UPDATE\n\nPremium is the full board.\n\nEvery day, members get 8+ plays with full data writeups across major sports, EV+ spots, and value reads from the Hanoi team.\n\nIf you’re still in free chat, check join-premium or use code **HANOI** on a partner book to unlock free Premium.`,
  MEMBER_ANNOUNCEMENTS_CHANNEL_ID: `🚨 PREMIUM BOARD IS LIVE\n\nTonight’s slips are posted.\n\nCheck the writeups before entering, watch unit size, and don’t chase late movement unless an update is posted.\n\nLet the board come to you.`,
  JOIN_PREMIUM_CHANNEL_ID: `🌟 START WINNING WITH HANOI PICKS\n\nStop wasting hours researching every slate. Premium gets the full board: 8+ daily slips, full data writeups, EV+ picks, and every major sport.\n\n🏈 Football\n🏀 Basketball\n⚾ Baseball\n⚽ Soccer\n🏒 Hockey\n🎮 Esports\n🎾 Tennis\n🥊 MMA & Boxing\n📈 EV+ Picks\n\n💳 Membership:\n• $12 weekly\n• $30 monthly\n• $300 lifetime\n\nWant free Premium? Use code **HANOI** on a partner platform.\n\n1 signup = 4 weeks free.\n2+ signups = 12+ weeks free.\n\nOnce you sign up, DM proof and say if you’re in Free Chat or Premium.`,
  FREE_PREMIUM_CHANNEL_ID: `🎁 GET UP TO 3 MONTHS FREE PREMIUM\n\nUse code **HANOI** on any partner platform:\n\n📋 Chalkboard — 1 month free Premium + $100 deposit match\n💤 Sleeper — 1 month free Premium + $100 deposit match\n🐶 Underdog — deposit $5, get $75 free\n🃏 Parlay Play — 1 month free Premium + $100 deposit match\n\n1 signup = 4 weeks free.\n2+ signups = 12+ weeks free.\n\nAfter signing up, DM proof and say if you’re in Free Chat or Premium.`,
  PREMIUM_WINS_CHANNEL_ID: `✅ PREMIUM RESULTS\n\nAnother strong night from the board.\n\nThe value was there, the writeups were posted, and Premium members had the full card before the slate moved.\n\nFull verified history stays inside Premium.\n\nIf you’re watching from free chat, the full board is in join-premium.`,
  GIVEAWAYS_CHANNEL_ID: `🎁 GIVEAWAY IS LIVE\n\nPrize: free Premium access.\n\nTo enter:\n1. Follow Hanoi Picks on social.\n2. Drop proof in the thread.\n3. Stay active in free chat.\n\nOne entry per person.\nWinner will be picked after the deadline.`,
  SOCIAL_MEDIA_CHANNEL_ID: `📲 FOLLOW HANOI PICKS\n\nFree plays, clips, results, and Premium updates drop on social too.\n\nInstagram: https://www.instagram.com/hanoipicks?igsh=NTc4MTIwNjQ2YQ%3D%3D&utm_source=qr\nTikTok: www.tiktok.com/@hanoipicks\nYouTube: https://www.youtube.com/@hanoipicks\n\nFollow there so you don’t miss the next drop.`,
  CONTACT_US_CHANNEL_ID: `Need help getting access?\n\nDrop your issue here and include what you’re trying to access.\n\nIf it’s free Premium proof, include:\n• platform you signed up for\n• screenshot/proof\n• whether you’re in Free Chat or Premium\n\nThe team will check it and get you set up.`,
};

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', async () => {
  try {
    let posted = 0;
    for (const [envKey, body] of Object.entries(samplePosts)) {
      const channelId = process.env[envKey];
      if (!channelId) continue;
      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (!channel?.isTextBased()) continue;
      await channel.send({ content: `**MESSAGE OPERATOR SAMPLE — REVIEW DRAFT**\n\n${body}`, allowedMentions: { parse: [] } });
      posted += 1;
      console.log(`posted sample to ${envKey}`);
    }
    console.log(`posted ${posted} sample messages`);
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
