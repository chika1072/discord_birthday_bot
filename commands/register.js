import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} from 'discord.js';

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initializeApp, applicationDefault } from 'firebase-admin/app';

// Firestore 初期化
initializeApp({
  credential: applicationDefault()
});

const db = getFirestore();

export default {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('誕生日を登録します'),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('registerBirthday')
      .setTitle('🎂 誕生日登録')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('username')
            .setLabel('表示するユーザー名')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('例: せん')
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('birthday')
            .setLabel('誕生日 (MM/DD形式)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('例: 01/01')
            .setRequired(true)
        )
      );

    await interaction.showModal(modal);
  },

  async modalSubmit(interaction) {
    if (interaction.customId !== 'registerBirthday') return;

    const username = interaction.fields.getTextInputValue('username');
    const birthday = interaction.fields.getTextInputValue('birthday');

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