import "dotenv/config";
import { Client, GatewayIntentBits, ChannelType } from "discord.js";
const c = new Client({ intents: [GatewayIntentBits.Guilds] });
c.once("clientReady", async () => {
  const g = await c.guilds.fetch(process.env.DISCORD_GUILD_ID);
  await g.channels.fetch();
  const cats = [...g.channels.cache.values()].filter(x=>x.type===ChannelType.GuildCategory).sort((a,b)=>a.rawPosition-b.rawPosition);
  for (const cat of cats){
    console.log(`\n[${cat.rawPosition}] ${cat.name}`);
    const kids=[...g.channels.cache.values()].filter(x=>x.parentId===cat.id).sort((a,b)=>a.rawPosition-b.rawPosition);
    for(const k of kids) console.log(`   ${k.name}`);
  }
  const loose=[...g.channels.cache.values()].filter(x=>!x.parentId && x.type===ChannelType.GuildText);
  if(loose.length){console.log("\n[no category]");loose.forEach(k=>console.log("   "+k.name));}
  c.destroy(); process.exit(0);
});
c.login(process.env.DISCORD_BOT_TOKEN);
