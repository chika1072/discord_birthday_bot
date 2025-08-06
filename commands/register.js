// commands/register.js
import { SlashCommandBuilder } from '@discordjs/builders';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'birthdays.json');

export default {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('あなたの誕生日を登録します')
    .addStringOption(option =>
      option.setName('birthday')
        .setDescription('MM/DD の形式で誕生日を入力してください')
        .setRequired(true)),

  async execute(interaction) {
    const username = interaction.user.username;
    const birthday = interaction.options.getString('birthday');

    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    data.push({ username, birthday });
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

    await interaction.reply(`🎉 ${username}さんの誕生日 (${birthday}) を登録しました！`);
  }
};