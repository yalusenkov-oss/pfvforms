#!/usr/bin/env node

/**
 * Скрипт для тестирования интеграции с Google Sheets
 * Использование: node test-sheets.js [distribution|promo-detailed|promo-weekly]
 */

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzogGGEaJXU7QA9QAB5Oz9HwGmWm8DsDezr1M-wwAmc8L9XkP0lQBHxfyCqOKIgNhJypg/exec';

// Тестовые данные для дистрибуции
const testDistributionData = {
  formType: 'distribution',
  timestamp: new Date().toISOString(),
  tariff: 'basic',
  releaseType: 'single',
  trackCount: 1,
  releaseName: 'Тестовый релиз (Node.js)',
  mainArtist: 'Тестовый артист',
  releaseVersion: '',
  releaseLink: 'https://example.com/release',
  genre: 'Pop',
  language: 'Русский',
  releaseDate: '2024-12-31',
  coverLink: 'https://example.com/cover.jpg',
  tiktokExcerpt: 'https://example.com/tiktok',
  tiktokFull: '',
  yandexPreSave: '',
  addKaraoke: 'no',
  tracks: JSON.stringify([
    {
      number: 1,
      name: 'Тестовый трек',
      version: '',
      artists: 'Тестовый артист',
      lyricists: 'Автор текста',
      composers: 'Композитор',
      explicitContent: 'Нет',
      substanceMention: 'Нет',
      lyrics: 'Тестовый текст песни',
    },
  ], null, 2),
  fullName: 'Иван Иванов',
  passportNumber: '1234 567890',
  issuedBy: 'МВД России',
  issueDate: '2020-01-01',
  bankDetails: '12345678901234567890',
  email: 'test@example.com',
  contactInfo: '@testuser',
  artistProfileLinks: '',
  basePrice: 500,
  karaokePrice: 0,
  totalPrice: 500,
};

// Тестовые данные для детального промо
const testPromoDetailedData = {
  formType: 'promo',
  timestamp: new Date().toISOString(),
  promoType: 'detailed',
  releaseLink: 'https://example.com/release.wav',
  upcOrName: 'UPC123456789',
  releaseDate: '2024-12-31',
  genre: 'Pop',
  focusTrack: 'Фокус трек',
  additionalInfo: 'Дополнительная информация для редакции',
  artistAndTitle: 'Тестовый артист - Тестовый релиз',
  releaseDescription: 'Описание тестового релиза',
  artistInfo: 'Информация о тестовом артисте',
  artistPhotos: 'https://example.com/photos.zip',
  socialLinks: 'https://vk.com/testartist',
  contactInfo: '@testcontact',
};

// Тестовые данные для еженедельного промо
const testPromoWeeklyData = {
  formType: 'promo',
  timestamp: new Date().toISOString(),
  promoType: 'weekly',
  releaseLink: 'https://example.com/release.wav',
  upcOrName: 'UPC987654321',
  releaseDate: '2024-12-27',
  genre: 'Rock',
  focusTrack: 'Еженедельный трек',
  additionalInfo: 'Информация для еженедельного промо',
  artistAndTitle: '',
  releaseDescription: '',
  artistInfo: '',
  artistPhotos: '',
  socialLinks: '',
  contactInfo: '@weeklycontact',
};

async function testGoogleSheets(testType = 'distribution') {
  let testData;
  
  switch (testType) {
    case 'distribution':
      testData = testDistributionData;
      console.log('📦 Тестирование дистрибуции...\n');
      break;
    case 'promo-detailed':
      testData = testPromoDetailedData;
      console.log('📢 Тестирование детального промо...\n');
      break;
    case 'promo-weekly':
      testData = testPromoWeeklyData;
      console.log('📢 Тестирование еженедельного промо...\n');
      break;
    default:
      console.error('❌ Неизвестный тип теста. Используйте: distribution, promo-detailed, promo-weekly');
      process.exit(1);
  }

  console.log('📤 Отправка данных...');
  console.log('URL:', SCRIPT_URL);
  console.log('Данные:', JSON.stringify(testData, null, 2).substring(0, 200) + '...\n');

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(testData),
      redirect: 'follow',
    });

    const text = await response.text();
    let json = null;
    
    try {
      json = text ? JSON.parse(text) : null;
    } catch (e) {
      // Не JSON ответ
    }

    console.log('📥 Ответ сервера:');
    console.log('Статус:', response.status, response.statusText);
    console.log('Ответ:', json || text);

    if (response.ok) {
      console.log('\n✅ Успех! Данные отправлены в Google Таблицу');
      if (json && json.success) {
        console.log('Сообщение:', json.message);
        if (json.row) {
          console.log('Номер строки:', json.row);
        }
      }
      console.log('\n💡 Проверьте вашу Google Таблицу для подтверждения');
    } else {
      console.log('\n❌ Ошибка при отправке данных');
      if (json && json.error) {
        console.log('Ошибка:', json.error);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Ошибка:', error.message);
    console.error('Детали:', error);
    process.exit(1);
  }
}

// Проверка доступности URL
async function checkUrl() {
  console.log('🔍 Проверка доступности URL...\n');
  console.log('URL:', SCRIPT_URL);

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'GET',
      redirect: 'follow',
    });

    const text = await response.text();
    let json = null;
    
    try {
      json = JSON.parse(text);
    } catch (e) {
      // Не JSON ответ
    }

    console.log('\n📥 Ответ:');
    console.log('Статус:', response.status, response.statusText);
    console.log('Ответ:', json || text.substring(0, 200));

    if (response.ok) {
      console.log('\n✅ URL доступен и отвечает');
    } else {
      console.log('\n⚠️ URL отвечает, но с ошибкой');
    }
  } catch (error) {
    console.error('\n❌ Ошибка при проверке URL:', error.message);
    process.exit(1);
  }
}

// Главная функция
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    console.log(`
🧪 Тестирование интеграции с Google Sheets

Использование:
  node test-sheets.js [команда]

Команды:
  distribution      - Тест отправки данных дистрибуции
  promo-detailed    - Тест отправки детального промо
  promo-weekly      - Тест отправки еженедельного промо
  check             - Проверка доступности URL скрипта
  help              - Показать эту справку

Примеры:
  node test-sheets.js distribution
  node test-sheets.js promo-detailed
  node test-sheets.js check
    `);
    return;
  }

  if (command === 'check') {
    await checkUrl();
  } else {
    await testGoogleSheets(command);
  }
}

// Запуск
main().catch(error => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});
