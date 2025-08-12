import { SlashCommandBuilder } from 'discord.js';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase.js'; // Web SDKで初期化された Firestore インスタンス

export default {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('誕生日を登録します')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('カレンダーに表示するユーザー名を入力してください')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('birthday')
        .setDescription('MM/DD の形式で誕生日を入力してください (例: 01/01)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString('username');
    const birthday = interaction.options.getString('birthday');

    const isValidBirthday = /^\d{2}\/\d{2}$/.test(birthday);
    if (!isValidBirthday) {
      return await interaction.reply({
        content: '❌ MM/DD の形式で入力してください（例: 01/01）',
        ephemeral: true
      });
    }

    try {
      const ref = doc(collection(db, 'birthdays'), username);
      await setDoc(ref, {
        username,
        birthday,
        registeredAt: Timestamp.now()
      });

      await interaction.reply({
        content: `${username}さんの誕生日 (${birthday}) を登録しました！`,
        ephemeral: true
      });
    } catch (error) {
      console.error('❌ Firestore保存エラー:', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: '誕生日の保存中にエラーが発生しました',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: '誕生日の保存中にエラーが発生しました',
          ephemeral: true
        });
      }
    }
  }
};