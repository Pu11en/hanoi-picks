import 'dotenv/config';
import { ChannelType, Client, GatewayIntentBits, PermissionsBitField } from 'discord.js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const messageOperatorDir = resolve(__dirname, '..');
const envPath = resolve(messageOperatorDir, '.env');
const outPath = resolve(messageOperatorDir, 'logs', 'permission-audit.json');
loadLocalEnv();

const token = process.env.DISCORD_BOT_TOKEN;
let guildId = process.env.DISCORD_GUILD_ID;
if (!token) {
  console.error('Missing DISCORD_BOT_TOKEN.');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const keyChannels = {
  control: process.env.CONTROL_CHANNEL_ID,
  announcements: process.env.ANNOUNCEMENTS_CHANNEL_ID,
  memberAnnouncements: process.env.MEMBER_ANNOUNCEMENTS_CHANNEL_ID,
  joinPremium: process.env.JOIN_PREMIUM_CHANNEL_ID,
  freePremium: process.env.FREE_PREMIUM_CHANNEL_ID,
  premiumWins: process.env.PREMIUM_WINS_CHANNEL_ID,
  giveaways: process.env.GIVEAWAYS_CHANNEL_ID,
  socialMedia: process.env.SOCIAL_MEDIA_CHANNEL_ID,
  support: process.env.SUPPORT_CHANNEL_ID || process.env.CONTACT_US_CHANNEL_ID,
};

client.once('clientReady', async () => {
  try {
    const guilds = await client.guilds.fetch();
    if (!guildId) guildId = guilds.size === 1 ? guilds.first().id : null;
    if (!guildId) throw new Error('Set DISCORD_GUILD_ID.');
    const guild = await client.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();
    const roles = await guild.roles.fetch();
    const me = await guild.members.fetchMe();

    const everyone = guild.roles.everyone;
    const premium = roles.find((role) => role.name.toLowerCase() === 'premium');
    const free = roles.find((role) => role.name.toLowerCase().includes('free'));
    const adminLike = roles.filter((role) => /admin|owner|mod|hanoi|agent|drew/i.test(role.name));

    const textChannels = [...channels.values()]
      .filter((channel) => channel && [ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum].includes(channel.type))
      .sort((a, b) => (a.rawPosition ?? 0) - (b.rawPosition ?? 0));

    const roleRows = {
      everyone: everyone ? roleSummary(everyone) : null,
      free: free ? roleSummary(free) : null,
      premium: premium ? roleSummary(premium) : null,
      adminLike: adminLike.map(roleSummary),
      bot: roleSummary(me.roles.highest),
    };

    const channelRows = textChannels.map((channel) => {
      const everyonePerms = channel.permissionsFor(everyone);
      const freePerms = free ? channel.permissionsFor(free) : null;
      const premiumPerms = premium ? channel.permissionsFor(premium) : null;
      const botPerms = channel.permissionsFor(me);
      return {
        id: channel.id,
        name: channel.name,
        parent: channel.parent?.name ?? null,
        type: channel.type,
        everyone: permissionSummary(everyonePerms),
        free: permissionSummary(freePerms),
        premium: permissionSummary(premiumPerms),
        bot: permissionSummary(botPerms),
        key: Object.entries(keyChannels).find(([, id]) => id === channel.id)?.[0] ?? null,
      };
    });

    const findings = buildFindings({ channelRows, premium, free });
    const result = { guild: { id: guild.id, name: guild.name }, roles: roleRows, channels: channelRows, findings };
    writeFileSync(outPath, JSON.stringify(result, null, 2));

    console.log(`Permission audit: ${guild.name}`);
    console.log(`Roles: Premium=${premium?.name ?? 'missing'}, Free=${free?.name ?? 'missing'}, Bot=${me.roles.highest.name}`);
    console.log('\nFindings:');
    for (const finding of findings) console.log(`- [${finding.level}] ${finding.message}`);
    console.log('\nKey channels:');
    for (const row of channelRows.filter((row) => row.key)) {
      console.log(`${row.key.padEnd(20)} #${row.name} | everyone:${flags(row.everyone)} free:${flags(row.free)} premium:${flags(row.premium)} bot:${flags(row.bot)}`);
    }
    console.log(`\nSaved audit to ${outPath}`);
  } finally {
    client.destroy();
  }
});

client.login(token);

function roleSummary(role) {
  return { id: role.id, name: role.name, permissions: role.permissions.toArray() };
}

function permissionSummary(perms) {
  if (!perms) return null;
  return {
    view: perms.has(PermissionsBitField.Flags.ViewChannel),
    send: perms.has(PermissionsBitField.Flags.SendMessages),
    readHistory: perms.has(PermissionsBitField.Flags.ReadMessageHistory),
    createPublicThreads: perms.has(PermissionsBitField.Flags.CreatePublicThreads),
    createPrivateThreads: perms.has(PermissionsBitField.Flags.CreatePrivateThreads),
    manageMessages: perms.has(PermissionsBitField.Flags.ManageMessages),
    manageThreads: perms.has(PermissionsBitField.Flags.ManageThreads),
    mentionEveryone: perms.has(PermissionsBitField.Flags.MentionEveryone),
  };
}

function flags(summary) {
  if (!summary) return 'n/a';
  return `${summary.view ? 'view' : '-'}${summary.send ? '+send' : ''}${summary.manageMessages ? '+manageMsg' : ''}${summary.manageThreads ? '+manageThreads' : ''}${summary.mentionEveryone ? '+mentionAll' : ''}`;
}

function buildFindings({ channelRows, premium, free }) {
  const findings = [];
  if (!premium) findings.push({ level: 'HIGH', message: 'Premium role was not found by exact name.' });
  if (!free) findings.push({ level: 'MED', message: 'Free role was not found by name containing “free”.' });

  for (const row of channelRows) {
    const name = row.name.toLowerCase();
    const parent = (row.parent ?? '').toLowerCase();
    const isPrivatePremiumArea = parent.includes('pro picks') || parent.includes('members') || ['memberAnnouncements', 'giveaways'].includes(row.key);
    const isAdminArea = parent.includes('ai agent') || row.key === 'control';
    const isPublicSales = ['joinPremium', 'freePremium', 'announcements', 'premiumWins'].includes(row.key) || name.includes('testimonial') || name.includes('results');
    const isSupport = row.key === 'support';

    if ((isPrivatePremiumArea || isAdminArea) && row.everyone?.view) {
      findings.push({ level: 'HIGH', message: `@everyone can view restricted channel #${row.name}.` });
    }
    if ((isPrivatePremiumArea || isAdminArea) && row.free?.view) {
      findings.push({ level: 'HIGH', message: `Free role can view restricted channel #${row.name}.` });
    }
    if (isPrivatePremiumArea && premium && !row.premium?.view) {
      findings.push({ level: 'HIGH', message: `Premium role cannot view premium channel #${row.name}.` });
    }
    if (isPublicSales && !row.everyone?.view) {
      findings.push({ level: 'MED', message: `Public sales channel #${row.name} is not visible to @everyone.` });
    }
    if (isSupport && !row.everyone?.view) {
      findings.push({ level: 'MED', message: `Support channel #${row.name} is not visible to @everyone.` });
    }
    if (row.bot?.mentionEveryone) {
      findings.push({ level: 'MED', message: `Bot can mention everyone in #${row.name}; avoid unless intentional.` });
    }
  }

  if (findings.length === 0) findings.push({ level: 'OK', message: 'No obvious permission problems found.' });
  return findings;
}

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
