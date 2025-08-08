import fs from 'fs';
import path from 'path';
import { saveBirthdayToFirestore } from './firestoreUtils.js';

const DATA_PATH = path.join(process.cwd(), 'birthdays.json');

async function migrateBirthdays() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error('❌ birthdays.json が見つかりません');
    return;
  }

  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  if (raw.trim() === '') {
    console.warn('⚠️ birthdays.json が空です');
    return;
  }

  let birthdayData;
  try {
    birthdayData = JSON.parse(raw);
  } catch (error) {
    console.error('❌ JSON パースエラー:', error);
    return;
  }

  for (const user of birthdayData) {
    const { username, birthday } = user;
    if (!username || !birthday) {
      console.warn(`⚠️ 無効なデータ: ${JSON.stringify(user)}`);
      continue;
    }

    await saveBirthdayToFirestore(username, birthday);
  }

  console.log('✅ Firestore への移行が完了しました');
}

migrateBirthdays();