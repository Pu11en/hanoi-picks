import 'dotenv/config';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  Partials,
} from 'discord.js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const messageOperatorDir = resolve(__dirname, '..');
const envPath = resolve(messageOperatorDir, '.env');
const channelMapPath = resolve(messageOperatorDir, 'config', 'channel-map.json');
const logsDir = resolve(messageOperatorDir, 'logs');
const draftsPath = resolve(logsDir, 'drafts.jsonl');
const postsPath = resolve(logsDir, 'posts.jsonl');

loadLocalEnv();
mkdirSync(logsDir, { recursive: true });

const config = {
  discordToken: process.env.DISCORD_BOT_TOKEN,
  guildId: process.env.DISCORD_GUILD_ID,
  minimaxApiKey: process.env.MINIMAX_API_KEY,
  minimaxBaseUrl: process.env.MINIMAX_BASE_URL ?? 'https://api.minimax.io/v1',
  minimaxModel: process.env.MINIMAX_MODEL ?? 'MiniMax-M3',
  controlChannelName: process.env.CONTROL_CHANNEL_NAME ?? 'agent-control',
  requireApproval: process.env.REQUIRE_APPROVAL !== 'false',
  dryRun: process.env.DRY_RUN !== 'false',
};

if (!config.discordToken) fail('Missing DISCORD_BOT_TOKEN in private settings.');
if (!config.minimaxApiKey) fail('Missing MINIMAX_API_KEY in private settings.');

const channelMap = JSON.parse(readFileSync(channelMapPath, 'utf8'));
const pendingDrafts = new Map();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, async () => {
  const guilds = await client.guilds.fetch();
  const guildId = config.guildId || (guilds.size === 1 ? guilds.first().id : null);
  if (!guildId) fail('Set DISCORD_GUILD_ID in private settings. Bot is in more than one server or none.');

  const guild = await client.guilds.fetch(guildId);
  const channels = await guild.channels.fetch();
  const controlChannel = findChannel(channels, config.controlChannelName);
  if (!controlChannel) fail(`Could not find control channel: ${config.controlChannelName}`);

  console.log(`Message Operator online in ${guild.name}. Listening in #${controlChannel.name}.`);
  console.log(config.dryRun ? 'DRY_RUN is on: approvals will not post live.' : 'DRY_RUN is off: approvals can post live.');
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;
  if (message.channel.name !== config.controlChannelName) return;

  const text = message.content.trim();
  if (!text) return;

  if (text === '!templates') {
    await message.reply(templateList());
    return;
  }

  if (text === '!help') {
    await message.reply(helpText());
    return;
  }

  const draftMatch = text.match(/^!draft\s+(\S+)\s+([\s\S]+)/i);
  if (!draftMatch) {
    await message.reply('Use `!draft <type> <what you want>` or `!templates`.');
    return;
  }

  const [, type, goal] = draftMatch;
  const target = channelMap.targets[type];
  if (!target) {
    await message.reply(`I do not have a template for \`${type}\`. Use \`!templates\` to see options.`);
    return;
  }

  await message.channel.send(`Drafting **${type}** for #${target.name}...`);

  try {
    const template = readTemplate(target.template);
    const draft = await createDraft({ type, goal, template, targetChannel: target.name });
    const draftId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    pendingDrafts.set(draftId, { type, goal, target, draft, requestedBy: message.author.id });
    logJson(draftsPath, { draftId, type, goal, target: target.name, draft, requestedBy: message.author.id, at: new Date().toISOString() });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`mo_approve:${draftId}`).setLabel(config.dryRun ? 'Approve Dry Run' : 'Approve & Post').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`mo_cancel:${draftId}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary),
    );

    await message.channel.send({
      content: `**Target:** #${target.name}\n**Type:** ${type}\n\n${draft}`,
      components: [buttons],
      allowedMentions: { parse: [] },
    });
  } catch (error) {
    console.error(error);
    await message.reply('Draft failed. Check the private MiniMax settings and try again.');
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
  if (!interaction.customId.startsWith('mo_')) return;

  const [action, draftId] = interaction.customId.replace('mo_', '').split(':');
  const draft = pendingDrafts.get(draftId);
  if (!draft) {
    await interaction.reply({ content: 'That draft is expired or missing.', ephemeral: true });
    return;
  }

  if (action === 'cancel') {
    pendingDrafts.delete(draftId);
    await interaction.update({ content: `Canceled draft for #${draft.target.name}.`, components: [] });
    return;
  }

  if (action === 'approve') {
    if (config.dryRun) {
      pendingDrafts.delete(draftId);
      logJson(postsPath, { draftId, dryRun: true, target: draft.target.name, draft: draft.draft, approvedBy: interaction.user.id, at: new Date().toISOString() });
      await interaction.update({ content: `Dry-run approved. Nothing was posted live.\n\n**Would post to:** #${draft.target.name}\n\n${draft.draft}`, components: [] });
      return;
    }

    const targetChannel = await resolveTargetChannel(interaction.guild, draft.target.name);
    if (!targetChannel) {
      await interaction.reply({ content: `Could not find target channel #${draft.target.name}.`, ephemeral: true });
      return;
    }

    await targetChannel.send({ content: draft.draft, allowedMentions: { parse: [] } });
    pendingDrafts.delete(draftId);
    logJson(postsPath, { draftId, dryRun: false, target: draft.target.name, draft: draft.draft, approvedBy: interaction.user.id, at: new Date().toISOString() });
    await interaction.update({ content: `Posted to #${draft.target.name}.`, components: [] });
  }
});

client.login(config.discordToken);

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

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readTemplate(filename) {
  return readFileSync(resolve(messageOperatorDir, 'templates', filename), 'utf8');
}

function findChannel(channels, name) {
  return [...channels.values()].find((channel) => channel?.name === name && isTextLike(channel));
}

async function resolveTargetChannel(guild, name) {
  const channels = await guild.channels.fetch();
  return findChannel(channels, name);
}

function isTextLike(channel) {
  return channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement;
}

async function createDraft({ type, goal, template, targetChannel }) {
  const response = await fetch(`${config.minimaxBaseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.minimaxApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.minimaxModel,
      messages: [
        {
          role: 'system',
          content: [
            'You are the Hanoi Picks Message Operator.',
            'You write official Discord server posts only.',
            'Use the provided template exactly as instruction, not as text to copy blindly.',
            'Do not invent wins, records, prices, screenshots, or claims.',
            'Do not mention that you are an AI.',
            'Return only the final Discord-ready message.',
          ].join('\n'),
        },
        {
          role: 'user',
          content: [
            `Message type: ${type}`,
            `Target channel: ${targetChannel}`,
            `Owner request: ${goal}`,
            '',
            'Template/instructions:',
            template,
          ].join('\n'),
        },
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`MiniMax request failed: ${response.status} ${body}`);
  }

  const data = await response.json();
  const draft = data?.choices?.[0]?.message?.content?.trim();
  if (!draft) throw new Error('MiniMax returned an empty draft.');
  return draft;
}

function templateList() {
  return `Available templates:\n${Object.keys(channelMap.targets).map((key) => `• ${key} → #${channelMap.targets[key].name}`).join('\n')}\n\nUse: \`!draft <type> <what you want>\``;
}

function helpText() {
  return [
    '**Hanoi Picks Message Operator**',
    'Use this in agent-control only.',
    '',
    '`!templates` — show post types',
    '`!draft join-premium make the main offer shorter` — draft a post',
    '',
    config.dryRun ? 'Safe mode is on: approvals do not post live.' : 'Live mode is on: approvals post to target channels.',
  ].join('\n');
}

function logJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value)}\n`, { flag: 'a' });
}
