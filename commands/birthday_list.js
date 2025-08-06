import { SlashCommandBuilder } from '@discordjs/builders';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'birthdays.json');

export default {
  data: new SlashCommandBuilder()
    .setName('list_birthdays')
    .setDescription('登録されている全ての誕生日を表示します'),

  async execute(interaction) {
    try {
      let birthdayData = [];
      if (fs.existsSync(DATA_PATH)) {
        const raw = fs.readFileSync(DATA_PATH, 'utf8');
        birthdayData = raw.trim() === '' ? [] : JSON.parse(raw);
      }

      let embed;

      if (birthdayData.length === 0) {
        embed = {
          title: `📅 登録された誕生日一覧`,
          description: '👻 誕生日がまだ登録されていません',
          color: 0xc993ff
        };
      } else {
        // 日付順に並べる
        birthdayData.sort((a, b) => {
          const [aMonth, aDay] = a.birthday.split('/').map(n => parseInt(n, 10));
          const [bMonth, bDay] = b.birthday.split('/').map(n => parseInt(n, 10));
          return aMonth !== bMonth ? aMonth - bMonth : aDay - bDay;
        });

        embed = {
          title: `📅 登録された誕生日一覧`,
          color: 0xc993ff,
          fields: birthdayData.map(user => ({
            name: `▷ ${user.username}`,
            value: `🎂 ${user.birthday}`
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