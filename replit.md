# Discord Welcome Bot

## Overview
A 24/7 Discord bot that automatically sends welcome messages when new members join the server and supports custom commands with GIF embeds.

## Current State
- Bot monitors for new member joins
- Sends custom welcome images (black background, MEE6 style) to channel ID: 1426618374359613634
- Includes user avatar, username, and member count in welcome images
- Custom command system with GIF support (max 5 GIFs per command)
- Express server keeps bot running 24/7

## Features
### Welcome Messages
- Custom-generated images with Canvas
- Black background with circular user avatar
- Username and member count display

### Custom Commands
- `/command add <name> <gif_url> <message>` - Create a new command (setup channel only)
- `/command edit <name> <gif_url>` - Add additional GIFs (max 5, setup channel only)
- `/command delete <name>` - Remove a command (setup channel only)
- Trigger: Message containing command word + @mention (e.g., "im going to boop you @user")
- Placeholders: `{@user}` = mentioned user's display name, `{@me}` = command user's display name
- Bot randomly selects from available GIFs when command is triggered

## Architecture
- **Discord.js**: Main bot framework
- **Canvas**: Custom welcome image generation
- **Express.js**: Web server to keep bot alive 24/7
- **Node.js**: Runtime environment
- **File Storage**: JSON-based command storage (commands.json)

## Recent Changes
- 2025-10-14: Initial bot setup with welcome message functionality
- 2025-10-14: Added Express server for 24/7 operation
- 2025-10-14: Configured custom welcome image with Canvas
- 2025-10-14: Added custom command system with add/edit/delete functionality
- 2025-10-14: Implemented random GIF selection for commands (max 5 GIFs)

## Configuration
- Welcome Channel ID: 1426618374359613634
- Setup Channel ID: 1427688994967388341 (for command management)
- Required Discord Intents: Guilds, GuildMembers, GuildMessages, MessageContent
- Port: 5000 (Express server)
- Commands File: commands.json

## Environment Variables
- DISCORD_TOKEN: Discord bot authentication token
