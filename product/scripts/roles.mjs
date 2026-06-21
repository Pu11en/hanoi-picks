import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
const c=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers]});
c.once("clientReady",async()=>{
  const g=await c.guilds.fetch(process.env.DISCORD_GUILD_ID);
  await g.roles.fetch();
  const me=await g.members.fetchMe();
  const botTop=me.roles.highest;
  console.log(`Bot highest role: "${botTop.name}" position=${botTop.position}`);
  console.log("--- roles (high→low) ---");
  [...g.roles.cache.values()].sort((a,b)=>b.position-a.position).forEach(r=>{
    const can = r.position < botTop.position ? "✓bot can assign" : (r.id===botTop.id?"(bot's own)":"✗ABOVE bot");
    console.log(`  ${r.position}  ${r.name}  ${r.name!=="@everyone"?can:""}`);
  });
  c.destroy();process.exit(0);
});
c.login(process.env.DISCORD_BOT_TOKEN);
