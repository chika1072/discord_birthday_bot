import { SlashCommandBuilder } from 'discord.js';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initializeApp, applicationDefault } from 'firebase-admin/app';

// Firestore 初期化（必要なら一度だけ）
initializeApp({
  credential: applicationDefault()
});

const db = getFirestore();

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

    // 誕生日形式のバリデーション
    const isValidBirthday = /^\d{2}\/\d{2}$/.test(birthday);
    if (!isValidBirthday) {
      return await interaction.reply({
        content: '❌ \nMM/DD の形式で入力してください（例: 01/01）',
        ephemeral: true
      });
    }

    try {
      // Firestore に保存
      const docRef = db.collection('birthdays').doc(username);
      await docRef.set({
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
      await interaction.reply({
        content: '誕生日の保存中にエラーが発生しました',
        ephemeral: true
      });
    }
  }
};