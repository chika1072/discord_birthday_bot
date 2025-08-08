import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    const commands = await rest.get(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID));
    for (const command of commands) {
      if (command.name === 'list_birthdays') {
        await rest.delete(Routes.applicationGuildCommand(CLIENT_ID, GUILD_ID, command.id));
        console.log(`🗑️ Deleted command: ${command.name}`);
      }
    }
  } catch (error) {
    console.error('❌ エラー:', error);
  }
})();