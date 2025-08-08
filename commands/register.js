import { SlashCommandBuilder } from '@discordjs/builders';
import fs from 'fs';
import path from 'path';
import { saveBirthday } from '../firestoreUtils.js'; // Firestore保存関数をインポート

const DATA_PATH = path.join(process.cwd(), 'birthdays.json');

export default {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('誕生日を登録します')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('カレンダーに表示するユーザー名を入力してください')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('birthday')
        .setDescription('MM/DD の形式で誕生日を入力してください (例. 01/01)')
        .setRequired(true)),

  async execute(interaction) {
    const username = interaction.options.getString('username');
    const birthday = interaction.options.getString('birthday');

    try {
      // JSONファイルへの保存処理
      let data = [];
      if (fs.existsSync(DATA_PATH)) {
        const raw = fs.readFileSync(DATA_PATH, 'utf8');
        data = raw.trim() === '' ? [] : JSON.parse(raw);
      }

      data.push({ username, birthday });
      fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

      // Firestoreへの保存処理
      await getAllBirthdays(username, birthday);

      await interaction.reply({
        content: `${username}さんの誕生日 (${birthday}) を登録しました！`,
        ephemeral: true
      });
    } catch (error) {
      console.error('❌ 誕生日保存エラー:', error);
      await interaction.reply({
        content: '誕生日の保存中にエラーが発生しました',
        ephemeral: true
      });
    }
  }
};