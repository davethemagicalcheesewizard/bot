const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

const WELCOME_CHANNEL_ID = '1426618374359613634';
const SETUP_CHANNEL_ID = '1427688994967388341';
const COMMANDS_FILE = './commands.json';

function loadCommands() {
  try {
    if (fs.existsSync(COMMANDS_FILE)) {
      const data = fs.readFileSync(COMMANDS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading commands:', error);
  }
  return {};
}

function saveCommands(commands) {
  try {
    fs.writeFileSync(COMMANDS_FILE, JSON.stringify(commands, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving commands:', error);
    return false;
  }
}

let customCommands = loadCommands();

client.once('ready', () => {
  console.log(`✅ Bot is online! Logged in as ${client.user.tag}`);
  console.log(`🤖 Monitoring for new members...`);
  console.log(`📝 Loaded ${Object.keys(customCommands).length} custom commands`);
});

async function createWelcomeImage(member) {
  const canvas = createCanvas(400, 200);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  try {
    const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 128 });
    const avatar = await loadImage(avatarURL);

    ctx.save();
    ctx.beginPath();
    ctx.arc(200, 70, 50, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 150, 20, 100, 100);
    ctx.restore();
  } catch (error) {
    console.error('Error loading avatar:', error);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${member.user.tag} just joined the server`, 200, 145);

  ctx.font = '14px Arial';
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText(`Member #${member.guild.memberCount}`, 200, 170);

  return canvas.toBuffer();
}

client.on('guildMemberAdd', async (member) => {
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  
  if (!channel) {
    console.error(`❌ Could not find channel with ID: ${WELCOME_CHANNEL_ID}`);
    return;
  }

  try {
    const imageBuffer = await createWelcomeImage(member);
    const attachment = new AttachmentBuilder(imageBuffer, { name: 'welcome.png' });

    await channel.send({ files: [attachment] });
    console.log(`✅ Sent welcome message for ${member.user.tag}`);
  } catch (error) {
    console.error('❌ Error sending welcome message:', error);
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith('/command ')) {
    if (message.channelId !== SETUP_CHANNEL_ID) {
      return message.reply('❌ Command setup can only be used in the designated setup channel.');
    }

    const args = message.content.slice(9).trim().split(/ +/);
    const action = args[0]?.toLowerCase();

    if (action === 'add') {
      const commandName = args[1]?.toLowerCase();
      const gifUrl = args[2];
      const commandMessage = args.slice(3).join(' ');

      if (!commandName || !gifUrl || !commandMessage) {
        return message.reply('❌ Usage: `/command add <name> <gif_url> <message>`\nUse `{@user}` for mentioned user and `{@me}` for command user');
      }

      customCommands[commandName] = {
        message: commandMessage,
        gifs: [gifUrl]
      };

      if (saveCommands(customCommands)) {
        message.reply(`✅ Command \`${commandName}\` has been created!`);
      } else {
        message.reply('❌ Failed to save command.');
      }
    }
    else if (action === 'edit') {
      const commandName = args[1]?.toLowerCase();
      const gifUrl = args[2];

      if (!commandName || !gifUrl) {
        return message.reply('❌ Usage: `/command edit <name> <gif_url>`');
      }

      if (!customCommands[commandName]) {
        return message.reply(`❌ Command \`${commandName}\` does not exist.`);
      }

      if (customCommands[commandName].gifs.length >= 5) {
        return message.reply('❌ Maximum 5 GIFs per command.');
      }

      customCommands[commandName].gifs.push(gifUrl);

      if (saveCommands(customCommands)) {
        message.reply(`✅ Added GIF to \`${commandName}\` (${customCommands[commandName].gifs.length}/5 GIFs)`);
      } else {
        message.reply('❌ Failed to save command.');
      }
    }
    else if (action === 'delete') {
      const commandName = args[1]?.toLowerCase();

      if (!commandName) {
        return message.reply('❌ Usage: `/command delete <name>`');
      }

      if (!customCommands[commandName]) {
        return message.reply(`❌ Command \`${commandName}\` does not exist.`);
      }

      delete customCommands[commandName];

      if (saveCommands(customCommands)) {
        message.reply(`✅ Command \`${commandName}\` has been deleted.`);
      } else {
        message.reply('❌ Failed to delete command.');
      }
    }
    else {
      message.reply('❌ Usage: `/command add/edit/delete`');
    }
    return;
  }

  if (message.mentions.users.size > 0) {
    const messageContent = message.content.toLowerCase();
    
    for (const [commandName, command] of Object.entries(customCommands)) {
      if (messageContent.includes(commandName.toLowerCase())) {
        const mentionedUser = message.mentions.users.first();
        const mentionedMember = message.guild.members.cache.get(mentionedUser.id);
        const authorMember = message.guild.members.cache.get(message.author.id);
        
        const randomGif = command.gifs[Math.floor(Math.random() * command.gifs.length)];
        
        let responseMessage = command.message
          .replace(/{@user}/g, mentionedMember?.displayName || mentionedUser.username)
          .replace(/{@me}/g, authorMember?.displayName || message.author.username);

        const embed = new EmbedBuilder()
          .setImage(randomGif);

        message.channel.send({ 
          content: responseMessage,
          embeds: [embed] 
        });
        break;
      }
    }
  }
});

client.on('error', (error) => {
  console.error('❌ Discord client error:', error);
});

client.on('warn', (warning) => {
  console.warn('⚠️ Discord client warning:', warning);
});

const app = express();
const PORT = 5000;

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Discord Welcome Bot</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            backdrop-filter: blur(10px);
          }
          .status {
            display: inline-block;
            width: 12px;
            height: 12px;
            background: #00ff00;
            border-radius: 50%;
            margin-right: 8px;
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🤖 Discord Welcome Bot</h1>
          <p><span class="status"></span>Bot is running 24/7</p>
          <p>Monitoring for new members...</p>
        </div>
      </body>
    </html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Web server is running on port ${PORT}`);
  console.log(`📡 Keeping bot alive 24/7...`);
});

client.login(process.env.DISCORD_TOKEN).catch((error) => {
  console.error('❌ Failed to login to Discord:', error);
  process.exit(1);
});
