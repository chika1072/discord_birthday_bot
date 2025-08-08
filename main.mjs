// main.mjs - Discord Birthday Bot メインプログラム

import { Client, GatewayIntentBits, Collection } from 'discord.js';
import dotenv from 'dotenv';
import express from 'express';
import cron from 'node-cron';
import path from 'path';
import fs from 'fs';
import { pathToFileURL, fileURLToPath } from 'url';
import { MessageFlags } from 'discord-api-types/v10';
import { getAllBirthdays } from './firestoreUtils.js'; // Firestore対応

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
    await interaction.reply({
      content: 'エラーが発生しました 💥',
      flags: MessageFlags.Ephemeral
    });
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

// Render用 Webサーバー
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    status: 'Bot is running! 🤖',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`🌐 Web サーバーがポート ${port} で起動しました`);
});

// スケジュールタスク (Cron) - 毎月1日の0:00に誕生日カレンダー送信
cron.schedule('0 0 1 * *', async () => {
  console.log('🔄 誕生日カレンダー送信処理を実行中...');

  const birthdayList = await getAllBirthdays();

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
    fields:
      birthdayList.length === 0
        ? [{ name: '👻 今月の誕生日', value: '登録されていません' }]
        : birthdayList.map(user => ({
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