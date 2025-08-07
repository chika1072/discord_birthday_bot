import { SlashCommandBuilder } from '@discordjs/builders';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'birthdays.json');

function getNextBirthday(birthdays) {
  const today = new Date();
  const todayNum = (today.getMonth() + 1) * 100 + today.getDate();

  const sorted = birthdays
    .map(b => ({
      username: b.username,
      dateNum: parseInt(b.birthday.replace('/', '')),
      raw: b.birthday
    }))
    .sort((a, b) => a.dateNum - b.dateNum);

  for (const b of sorted) {
    if (b.dateNum >= todayNum) return b;
  }

  return sorted[0]; // 来年最初の誕生日
}

export default {
  data: new SlashCommandBuilder()
    .setName('next_birthday')
    .setDescription('次の誕生日のユーザーを表示します'),

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
          title: `🔮 次の誕生日`,
          description: '👻 誕生日がまだ登録されていません',
          color: 0x9494ff
        };
      } else {
        const next = getNextBirthday(birthdayData);
        embed = {
          title: `🔮 次の誕生日`,
          color: 0x9494ff,
          fields: [
            {
              name: `▷ ${next.username}`,
              value: `${next.raw}`
            }
          ]
        };
      }

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('❌ 次の誕生日取得エラー:', error);
      await interaction.reply({ content: '誕生日取得中にエラーが発生しました 💥', ephemeral: true });
    }
  }
};