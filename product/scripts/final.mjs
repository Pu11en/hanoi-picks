// Authoritative layout. Converges the server to the confirmed blueprint:
//   START HERE (public)
//   JOIN PREMIUM (PUBLIC sales pitch): announcements, free-premium, premium-wins, premium-testimonials, giveaways
//   PICKS (locked): 1,2,3,4
//   MEMBERS (locked): member-announcements, premium-chat, member-picks
//   FREE (public): free-locks, free-chat, social-media
//   SPORTSBOOKS (public) / HELP (public) / AI AGENT (admin)
// Clean channel titles: "emoji┃𝗯𝗼𝗹𝗱" (no spaces — Discord turns spaces into dashes).
// Category banners: "─────── emoji NAME ───────". Idempotent.
import "dotenv/config";
import { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, OverwriteType } from "discord.js";

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const ALLOWED = (process.env.ALLOWED_USER_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
const SEP = "┃";
const DASH = "─".repeat(7);

function toBold(s) {
  let o = "";
  for (const ch of s) {
    const c = ch.codePointAt(0);
    if (c >= 65 && c <= 90) o += String.fromCodePoint(0x1d5d4 + c - 65);
    else if (c >= 97 && c <= 122) o += String.fromCodePoint(0x1d5ee + c - 97);
    else if (c >= 48 && c <= 57) o += String.fromCodePoint(0x1d7ec + c - 48);
    else o += ch;
  }
  return o;
}
function deBold(s) {
  let o = "";
  for (const ch of s) {
    const c = ch.codePointAt(0);
    if (c >= 0x1d5d4 && c <= 0x1d5ed) o += String.fromCharCode(65 + c - 0x1d5d4);
    else if (c >= 0x1d5ee && c <= 0x1d607) o += String.fromCharCode(97 + c - 0x1d5ee);
    else if (c >= 0x1d7ec && c <= 0x1d7f5) o += String.fromCharCode(48 + c - 0x1d7ec);
    else o += ch;
  }
  return o;
}
// logical base of a channel name, e.g. "📢-┃-𝗮𝗻𝗻𝗼𝘂𝗻𝗰𝗲𝗺𝗲𝗻𝘁𝘀" -> "announcements"
function chBase(name) {
  const right = name.includes(SEP) ? name.split(SEP).pop() : name;
  return deBold(right).replace(/^[-\s]+|[-\s]+$/g, "").toLowerCase();
}
function catBase(name) {
  return deBold(name.replace(/─/g, "")).replace(/^\P{L}*/u, "").trim().toUpperCase();
}

const SPEC = [
  { match: "START HERE", emoji: "📌", name: "START HERE", lock: "public", channels: [["start-here", "👋"]] },
  { match: "PREMIUM", emoji: "💎", name: "JOIN PREMIUM", lock: "public",
    channels: [["announcements", "📢"], ["free-premium", "🔓"], ["premium-wins", "🔥"], ["premium-testimonials", "⭐"], ["giveaways", "🎁"]] },
  { match: "PICKS", emoji: "🎯", name: "PICKS", lock: "premium",
    channels: [["1", "🥇"], ["2", "🥈"], ["3", "🥉"], ["4", "🏅"]] },
  { match: "MEMBERS", emoji: "👥", name: "MEMBERS", lock: "premium",
    channels: [["member-announcements", "📢"], ["premium-chat", "💬"], ["member-picks", "📊"]] },
  { match: "FREE", emoji: "🆓", name: "FREE", lock: "public",
    channels: [["free-locks", "🎯"], ["free-chat", "💬"], ["social-media", "📱"]] },
  { match: "SPORTSBOOKS", emoji: "📕", name: "SPORTSBOOKS", lock: "public",
    channels: [["underdog", "🐶"], ["sleeper", "💤"], ["chalkboard", "✏️"], ["parlay-play", "🎟️"], ["kalshi", "📈"]] },
  { match: "HELP", emoji: "🆘", name: "HELP", lock: "public",
    channels: [["premium-results", "✅"], ["contact-us", "📨"]] },
  { match: "AI AGENT", emoji: "🤖", name: "AI AGENT", lock: "admin", channels: [["agent-control", "🛠️"]] },
];

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("clientReady", async () => {
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    await guild.roles.fetch();
    await guild.channels.fetch();

    const premiumRole = guild.roles.cache.find((r) => r.name.toLowerCase() === "premium");
    const adminRole = guild.roles.cache.find((r) => r.name.toLowerCase() === "admin");

    const everyone = guild.roles.everyone.id;
    const lockSets = {
      public: [],
      premium: [
        { id: everyone, type: OverwriteType.Role, deny: [PermissionFlagsBits.ViewChannel] },
        ...(premiumRole ? [{ id: premiumRole.id, type: OverwriteType.Role, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }] : []),
        ...(adminRole ? [{ id: adminRole.id, type: OverwriteType.Role, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }] : []),
      ],
      admin: [
        { id: everyone, type: OverwriteType.Role, deny: [PermissionFlagsBits.ViewChannel] },
        ...(adminRole ? [{ id: adminRole.id, type: OverwriteType.Role, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }] : []),
        ...ALLOWED.map((uid) => ({ id: uid, type: OverwriteType.Member, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] })),
      ],
    };

    const allCats = () => [...guild.channels.cache.values()].filter((c) => c.type === ChannelType.GuildCategory);
    const allText = () => [...guild.channels.cache.values()].filter((c) => c.type === ChannelType.GuildText);

    let catPos = 0;
    for (const spec of SPEC) {
      let category = allCats().find((c) => catBase(c.name) === spec.match);
      const banner = `${DASH} ${spec.emoji} ${spec.name} ${DASH}`;
      if (!category) {
        category = await guild.channels.create({ name: banner, type: ChannelType.GuildCategory, permissionOverwrites: lockSets[spec.lock] });
        console.log(`+ category ${spec.name}`);
      } else {
        if (category.name !== banner) await category.setName(banner);
        await category.permissionOverwrites.set(lockSets[spec.lock]);
      }
      await category.setPosition(catPos++);

      let chPos = 0;
      for (const [base, emoji] of spec.channels) {
        let ch = allText().find((c) => chBase(c.name) === base || chBase(c.name) === `capper-${base}`);
        const title = `${emoji}${SEP}${toBold(base)}`;
        if (!ch) {
          ch = await guild.channels.create({ name: title, type: ChannelType.GuildText, parent: category.id });
          console.log(`+ #${base}`);
        } else {
          if (ch.parentId !== category.id) await ch.setParent(category.id, { lockPermissions: false });
          if (ch.name !== title) await ch.setName(title);
        }
        await ch.lockPermissions(); // sync to category (public/premium/admin)
        await ch.setPosition(chPos++);
      }
    }

    // social links (no twitter), only if not already posted
    const social = allText().find((c) => chBase(c.name) === "social-media");
    if (social) {
      const msgs = await social.messages.fetch({ limit: 20 });
      const already = [...msgs.values()].some((m) => m.author.id === client.user.id && m.content.includes("hanoipicks"));
      if (!already) {
        await social.send([
          "**📲 Follow Hanoi Picks**", "",
          "🎥 **YouTube** — https://www.youtube.com/@hanoipicks",
          "📸 **Instagram** — https://www.instagram.com/hanoipicks?utm_source=qr",
          "🎵 **TikTok** — https://www.tiktok.com/@hanoipicks?_r=1&_t=ZT-97BmUKVvKAf",
        ].join("\n"));
        console.log("posted social links");
      }
    }

    console.log("\nDONE.");
  } catch (e) {
    console.error("FINAL ERROR:", e);
  } finally {
    client.destroy();
    process.exit(0);
  }
});

client.login(TOKEN);
