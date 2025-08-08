import { SlashCommandBuilder } from '@discordjs/builders';
import { getAllBirthdays } from '../firestoreUtils.js';

export default {
  data: new SlashCommandBuilder()
    .setName('birthday_list')
    .setDescription('登録されている全ての誕生日を表示します'),

  async execute(interaction) {
    try {
      const birthdayData = await getAllBirthdays();

      let embed;

      if (birthdayData.length === 0) {
        embed = {
          title: `🪐 登録された誕生日一覧`,
          description: '👻 誕生日がまだ登録されていません',
          color: 0x94c9ff
        };
      } else {
        birthdayData.sort((a, b) => {
          const [aMonth, aDay] = a.birthday.split('/').map(n => parseInt(n, 10));
          const [bMonth, bDay] = b.birthday.split('/').map(n => parseInt(n, 10));
          return aMonth !== bMonth ? aMonth - bMonth : aDay - bDay;
        });

        embed = {
          title: `🪐 登録された誕生日一覧`,
          color: 0x94c9ff,
          fields: birthdayData.map(user => ({
            name: `▷ ${user.username}`,
            value: `${user.birthday}`
          }))
        };
      }

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('❌ 誕生日一覧取得エラー:', error);
      await interaction.reply({ content: '一覧取得中にエラーが発生しました 💥', ephemeral: true });
    }
  }
};