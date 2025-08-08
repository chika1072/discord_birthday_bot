import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * Firestore に誕生日を保存する
 * @param {string} username ユーザー名
 * @param {string} birthday 誕生日 (MM/DD形式)
 */
export async function saveBirthday(username, birthday) {
  try {
    await setDoc(doc(db, 'birthdays', username), {
      birthday: birthday,
      registeredAt: new Date().toISOString()
    });
    console.log(`✅ Firestore に保存: ${username} - ${birthday}`);
  } catch (error) {
    console.error('❌ Firestore 保存エラー:', error);
  }
}

/**
 * 今月の誕生日リストを取得する
 * @returns {Promise<Array<{username: string, birthday: string}>>}
 */
export async function getAllBirthdays() {
  try {
    const snapshot = await getDocs(collection(db, 'birthdays'));
    const birthdays = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      birthdays.push({
        username: doc.id,
        birthday: data.birthday
      });
    });

    return birthdays;
  } catch (error) {
    console.error('❌ Firestore 誕生日一覧取得エラー:', error);
    return [];
  }
}