import "dotenv/config";
import { Client, GatewayIntentBits, ChannelType } from "discord.js";
const SEP="┃";
function deBold(s){let o="";for(const ch of s){const c=ch.codePointAt(0);if(c>=0x1d5d4&&c<=0x1d5ed)o+=String.fromCharCode(65+c-0x1d5d4);else if(c>=0x1d5ee&&c<=0x1d607)o+=String.fromCharCode(97+c-0x1d5ee);else o+=ch;}return o;}
const chBase=n=>deBold(n.includes(SEP)?n.split(SEP).pop():n).replace(/^[-\s]+|[-\s]+$/g,"").toLowerCase();
const c=new Client({intents:[GatewayIntentBits.Guilds]});
c.once("clientReady",async()=>{
  const g=await c.guilds.fetch(process.env.DISCORD_GUILD_ID);
  await g.channels.fetch();
  const ch=[...g.channels.cache.values()].find(x=>x.type===ChannelType.GuildText&&chBase(x.name)==="start-here");
  if(!ch){console.log("start-here not found");c.destroy();process.exit(1);}
  const msgs=await ch.messages.fetch({limit:20});
  for(const m of msgs.values()) if(m.author.id===c.user.id) await m.delete().catch(()=>{});
  const DIV="━━━━━━━━━━━━━━━━━━━━━━━━━";
  await ch.send({embeds:[{
    color:0xF1C40F,
    title:"👋  Welcome to Hanoi Picks",
    description:"By joining **Hanoi Picks**, you agree to the rules & Terms below and confirm you have read and understood the disclaimer. A violation will result in a **warning or ban**.\n\n🔞  *This is an 18+ community.*\n"+DIV,
    fields:[
      {name:"⚖️  Disclaimer",value:"This Discord is for **educational & entertainment purposes only.** We are **not** responsible for any money lost trading securities or gambling. Nothing posted here is financial advice or a guarantee of any result or outcome."},
      {name:"📋  Rules",value:"🔹 Do your own research — posts are **not** a recommendation to bet or trade.\n🔹 You are responsible for your own decisions. We are **not** financial advisors.\n🔹 No links to other Discords or competitors.\n🔹 Be respectful — no discouragement, no spam.\n🔹 **18+ only** — underage members banned on sight."},
      {name:"✅  Getting In",value:"Complete the quick verification to unlock the full server and start seeing picks."},
    ],
    footer:{text:"Hanoi Picks  •  Bet responsibly 🍀"},
  }]});
  console.log("posted professional welcome to start-here");
  c.destroy();process.exit(0);
});
c.login(process.env.DISCORD_BOT_TOKEN);
