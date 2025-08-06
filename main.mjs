// main.mjs - Discord Birthday Bot メインプログラム

// 必要なライブラリを読み込み
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import dotenv from 'dotenv';
import express from 'express';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

// ESモジュールのための__dirname, __filenameの定義
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .envファイルから環境変数を読み込み
dotenv.config();

// Discord Botクライアントを作成
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// コマンドのコレクションを用意
client.commands = new Collection();

// commands フォルダのコマンドを読み込む
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(pathToFileURL(filePath).href);
  client.commands.set(command.default.data.name, command.default);
}

// Botが起動完了したときの処理
client.once('ready', () => {
  console.log(`🎉 ${client.user.tag} が正常に起動しました！`);
  console.log(`📊 ${client.guilds.cache.size} つのサーバーに参加中`);
});

// コマンド受信時の処理
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error('❌ コマンド実行中にエラー:', error);
    await interaction.reply({ content: 'エラーが発生しました 💥', ephemeral: true });
  }
});

// エラーハンドリング
client.on('error', (error) => {
  console.error(`❌ Discord クライアントエラー：`, error);
});

// プロセス終了時の処理
process.on('SIGINT', () => {
  console.log(`🔴 Botを終了しています...`);
  client.destroy();
  process.exit(0);
});

// Discordにログイン
if (!process.env.DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN が .env ファイルに設定されていません！');
  process.exit(1);
}

console.log(`🔄️ Discord に接続中...`);
await client.login(process.env.DISCORD_TOKEN)
  .catch(error => {
    console.error('❌ ログインに失敗しました：', error);
    process.exit(1);
  });

// Render用

const app = express();
const port = process.env.PORT || 3000;

// ヘルスチェック用エンドポイント
app.get('/', (req, res) => {
  res.json({
    status: 'Bot is running! 🤖',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// サーバー起動
app.listen(port, () => {
  console.log(`🌐 Web サーバーがポート ${port} で起動しました`);
});

// 誕生日データ処理

const DATA_PATH = path.join(__dirname, 'birthdays.json');

/**
 * 今月の誕生日のリストを取得する
 * @returns {Array<Object>} 今月が誕生日のユーザーのリスト
 */
function getMonthlyBirthdayList() {
  if (!fs.existsSync(DATA_PATH)) {
    console.log('birthdays.jsonファイルが見つかりません。');
    return [];
  }

  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  const data = raw.trim() === '' ? [] : JSON.parse(raw);

  const currentMonth = new Date().getMonth() + 1;
  return data.filter(user => {
    const userMonth = parseInt(user.birthday.split('/')[0], 10);
    return userMonth === currentMonth;
  });
}

/**
 * 誕生日の保存
 * @param {string} username ユーザー名
 * @param {string} birthday 誕生日 (MM/DD形式)
 * @returns {Promise<void>}
 */
function saveBirthday(username, birthday) {
  return new Promise((resolve, reject) => {
    fs.readFile(DATA_PATH, (err, data) => {
      if (err && err.code !== 'ENOENT') return reject(err);

      const birthdayData = data && data.length > 0 ? JSON.parse(data) : [];
      birthdayData.push({ username, birthday });

      fs.writeFile(DATA_PATH, JSON.stringify(birthdayData, null, 2), (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
}

// スケジュールタスク (Cron)

// 毎分実行（テスト用）
cron.schedule('* * * * *', async () => {
  console.log('🔄 テスト実行：誕生日カレンダー送信');

  const birthdayList = getMonthlyBirthdayList();
  if (birthdayList.length === 0) {
    console.log('👻 今月は誕生日が登録されていません');
    return;
  }

  // 誕生日の日付順に並び替え
  birthdayList.sort((a, b) => {
    const dateA = parseInt(a.birthday.split('/')[1], 10);
    const dateB = parseInt(b.birthday.split('/')[1], 10);
    return dateA - dateB;
  });

  const month = new Date().getMonth() + 1;

  const embed = {
    title: `🎂 ${month}月の誕生日カレンダー`,
    color: 0xc993ff,
    fields: birthdayList.map(user => ({
      name: `▷ ${user.username}`,
      value: ` ${user.birthday}`,
    }))
  };

  try {
    const channel = await client.channels.fetch(process.env.BIRTHDAY_CHANNEL_ID);
    if (channel) {
      await channel.send({ embeds: [embed] });
      console.log('✅ 誕生日カレンダーを送信しました');
    } else {
      console.error('❌ 指定されたチャンネルが見つかりませんでした');
    }
  } catch (error) {
    console.error('❌ チャンネル取得時にエラー:', error);
  }
});