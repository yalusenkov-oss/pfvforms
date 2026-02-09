# Обновленный код Google Apps Script

## Важно! Обновите код в Google Apps Script

Скопируйте и замените весь код в вашем Google Apps Script на версию ниже. Это исправит проблему с CORS и позволит использовать как POST, так и GET запросы.

## Полный код для Google Apps Script

```javascript
// Настройки
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const DISTRIBUTION_SHEET_NAME = 'Дистрибуция';
const PROMO_SHEET_NAME = 'Промо';

// Обработка POST запросов
function doPost(e) {
  try {
    let data;
    
    // Обработка разных форматов данных
    if (e.postData && e.postData.contents) {
      // JSON данные из POST запроса
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter && e.parameter.data) {
      // Данные из FormData или URL параметров
      data = JSON.parse(e.parameter.data);
    } else {
      throw new Error('No data received');
    }
    
    if (data.formType === 'distribution') {
      saveDistribution(data);
    } else if (data.formType === 'promo') {
      savePromo(data);
    }
    
    // Возвращаем ответ с правильным форматом
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Данные успешно сохранены' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Обработка GET запросов (для тестирования и альтернативного метода отправки)
function doGet(e) {
  // Если есть параметр data - это запрос на сохранение данных
  if (e.parameter && e.parameter.data) {
    try {
      const data = JSON.parse(decodeURIComponent(e.parameter.data));
      
      if (data.formType === 'distribution') {
        saveDistribution(data);
      } else if (data.formType === 'promo') {
        savePromo(data);
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, message: 'Данные успешно сохранены' }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  // Обычный GET запрос для проверки работоспособности
  return ContentService
    .createTextOutput(JSON.stringify({ 
      status: 'ok', 
      message: 'GET works!' 
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Сохранение заявки на дистрибуцию
function saveDistribution(data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DISTRIBUTION_SHEET_NAME);
  
  const row = [
    new Date(data.timestamp),           // A: Дата/Время
    getTariffName(data.tariff),          // B: Тариф
    getReleaseTypeName(data.releaseType),// C: Тип релиза
    data.trackCount,                     // D: Кол-во треков
    data.releaseName,                    // E: Название релиза
    data.mainArtist,                     // F: Основной артист
    data.releaseVersion || '',           // G: Версия релиза
    data.releaseLink,                    // H: Ссылка на релиз
    data.genre,                          // I: Жанр
    data.language,                       // J: Язык
    data.releaseDate,                    // K: Дата релиза
    data.coverLink,                      // L: Ссылка на обложку
    data.tiktokExcerpt,                  // M: Отрывок TikTok
    data.tiktokFull || '',               // N: Полная версия TikTok
    data.yandexPreSave || '',            // O: Pre-Save Яндекс
    data.addKaraoke === 'yes' ? 'Да' : 'Нет', // P: Караоке
    data.tracks,                         // Q: Треки (JSON)
    data.fullName,                       // R: ФИО
    data.passportNumber,                 // S: Паспорт
    data.issuedBy,                       // T: Кем выдан
    data.issueDate,                      // U: Дата выдачи
    data.bankDetails,                    // V: Банковские реквизиты
    data.email,                          // W: Email
    data.contactInfo,                    // X: Контакты
    data.artistProfileLinks || '',       // Y: Ссылки на профили
    data.basePrice + ' ₽',               // Z: Базовая цена
    data.karaokePrice + ' ₽',            // AA: Цена караоке
    data.totalPrice + ' ₽',              // AB: Итого
  ];
  
  sheet.appendRow(row);
}

// Сохранение заявки на промо
function savePromo(data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(PROMO_SHEET_NAME);
  
  const row = [
    new Date(data.timestamp),            // A: Дата/Время
    getPromoTypeName(data.promoType),    // B: Тип промо
    data.releaseLink,                    // C: Ссылка на релиз
    data.upcOrName,                      // D: UPC / Название
    data.releaseDate,                    // E: Дата релиза
    data.genre,                          // F: Жанр
    data.focusTrack || '',               // G: Фокус-трек
    data.additionalInfo || '',           // H: Доп. информация
    data.artistAndTitle || '',           // I: Артист и название
    data.releaseDescription || '',       // J: Описание релиза
    data.artistInfo || '',               // K: Информация об артисте
    data.artistPhotos || '',             // L: Фото артиста
    data.socialLinks || '',              // M: Соцсети
    data.contactInfo,                    // N: Контакты
  ];
  
  sheet.appendRow(row);
}

// Вспомогательные функции для читаемых названий
function getTariffName(tariff) {
  const names = {
    'basic': 'Базовый',
    'advanced': 'Продвинутый',
    'premium': 'Премиум',
    'platinum': 'Платинум'
  };
  return names[tariff] || tariff;
}

function getReleaseTypeName(type) {
  const names = {
    'single': 'Сингл',
    'ep': 'EP',
    'album': 'Альбом'
  };
  return names[type] || type;
}

function getPromoTypeName(type) {
  const names = {
    'detailed': 'Детальное промо',
    'weekly': 'Еженедельное промо'
  };
  return names[type] || type;
}
```

## Шаги для обновления

1. **Откройте Google Apps Script**
   - В вашей Google Таблице: **Расширения** → **Apps Script**

2. **Удалите весь старый код**

3. **Вставьте новый код** (выше)

4. **Сохраните** (Ctrl+S или Cmd+S)

5. **Создайте новое развертывание**
   - **Развернуть** → **Новое развёртывание**
   - Выберите **Веб-приложение**
   - Настройки:
     - **Описание**: PFVMUSIC Forms API v2
     - **Выполнять как**: Я (ваш email)
     - **Доступ**: Все
   - Нажмите **Развернуть**

6. **Скопируйте новый URL** (если изменился)

7. **Обновите URL в проекте** (если изменился)
   - В файле `.env`
   - В файле `public/config.json`

8. **Проверьте работу**
   - Откройте `test-google-sheets.html`
   - Попробуйте отправить тестовые данные

## Что изменилось

✅ Добавлена поддержка GET запросов с данными в URL (обходит CORS)  
✅ Улучшена обработка ошибок  
✅ Поддержка разных форматов входящих данных  
✅ Более информативные ответы сервера  

Теперь код автоматически попробует POST запрос, и если он не работает из-за CORS, переключится на GET запрос с данными в URL параметрах.
