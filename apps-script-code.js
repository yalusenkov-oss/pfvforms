// ═══════════════════════════════════════════════════════════════════════════
// PFVMUSIC Google Sheets Integration - Apps Script Code
// Скопируйте весь этот код в Google Apps Script редактор
// ═══════════════════════════════════════════════════════════════════════════

// Настройки
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const DISTRIBUTION_SHEET_NAME = 'Дистрибуция';
const PROMO_SHEET_NAME = 'Промо';

// ═══════════════════════════════════════════════════════════════════════════
// Инициализация листов (создание если не существуют)
// ═══════════════════════════════════════════════════════════════════════════
function initializeSheets() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Создаем лист "Дистрибуция" если не существует
  let distributionSheet = spreadsheet.getSheetByName(DISTRIBUTION_SHEET_NAME);
  if (!distributionSheet) {
    distributionSheet = spreadsheet.insertSheet(DISTRIBUTION_SHEET_NAME);
    // Устанавливаем заголовки
    distributionSheet.getRange(1, 1, 1, 28).setValues([[
      'Дата/Время',           // A
      'Тариф',                // B
      'Тип релиза',           // C
      'Кол-во треков',        // D
      'Название релиза',       // E
      'Основной артист',       // F
      'Версия релиза',        // G
      'Ссылка на релиз',       // H
      'Жанр',                 // I
      'Язык',                 // J
      'Дата релиза',          // K
      'Ссылка на обложку',    // L
      'Отрывок TikTok',       // M
      'Полная версия TikTok', // N
      'Pre-Save Яндекс',      // O
      'Караоке',              // P
      'Треки (JSON)',         // Q
      'ФИО',                  // R
      'Паспорт',              // S
      'Кем выдан',            // T
      'Дата выдачи',          // U
      'Банковские реквизиты', // V
      'Email',                // W
      'Контакты',             // X
      'Ссылки на профили',    // Y
      'Базовая цена',         // Z
      'Цена караоке',         // AA
      'Итого'                 // AB
    ]]);
    // Форматируем заголовки
    distributionSheet.getRange(1, 1, 1, 28).setFontWeight('bold').setBackground('#f0f0f0');
    Logger.log('Created sheet: ' + DISTRIBUTION_SHEET_NAME);
  }
  
  // Создаем лист "Промо" если не существует
  let promoSheet = spreadsheet.getSheetByName(PROMO_SHEET_NAME);
  if (!promoSheet) {
    promoSheet = spreadsheet.insertSheet(PROMO_SHEET_NAME);
    // Устанавливаем заголовки
    promoSheet.getRange(1, 1, 1, 14).setValues([[
      'Дата/Время',           // A
      'Тип промо',            // B
      'Ссылка на релиз',      // C
      'UPC / Название',       // D
      'Дата релиза',          // E
      'Жанр',                 // F
      'Фокус-трек',           // G
      'Доп. информация',      // H
      'Артист и название',    // I
      'Описание релиза',      // J
      'Информация об артисте', // K
      'Фото артиста',         // L
      'Соцсети',              // M
      'Контакты'              // N
    ]]);
    // Форматируем заголовки
    promoSheet.getRange(1, 1, 1, 14).setFontWeight('bold').setBackground('#f0f0f0');
    Logger.log('Created sheet: ' + PROMO_SHEET_NAME);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Обработка POST запросов
// ═══════════════════════════════════════════════════════════════════════════
function doPost(e) {
  try {
    // Проверяем, что e существует
    if (!e) {
      throw new Error('No request data received');
    }
    
    let data;
    
    // Обработка разных форматов данных
    if (e.postData && e.postData.contents) {
      // JSON данные из POST запроса
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter && e.parameter.data) {
      // Данные из FormData или URL параметров
      data = JSON.parse(e.parameter.data);
    } else {
      throw new Error('No data received. postData: ' + !!e.postData + ', parameter: ' + !!(e.parameter && e.parameter.data));
    }
    
    if (data.formType === 'distribution') {
      saveDistribution(data);
    } else if (data.formType === 'promo') {
      savePromo(data);
    } else {
      throw new Error('Unknown formType: ' + (data.formType || 'undefined'));
    }
    
    // Возвращаем ответ с правильным форматом
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: 'Данные успешно сохранены',
        formType: data.formType
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('doPost error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString(),
        stack: error.stack
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Обработка GET запросов (для тестирования и альтернативного метода отправки)
// ═══════════════════════════════════════════════════════════════════════════
function doGet(e) {
  // Проверяем, что e существует и имеет параметры
  if (!e) {
    e = { parameter: {} };
  }
  
  if (!e.parameter) {
    e.parameter = {};
  }
  
  // Если есть параметр data - это запрос на сохранение данных (обходит CORS)
  if (e.parameter.data) {
    try {
      // Декодируем данные из URL
      const dataString = decodeURIComponent(e.parameter.data);
      Logger.log('Received data string length: ' + dataString.length);
      Logger.log('First 200 chars: ' + dataString.substring(0, 200));
      
      const data = JSON.parse(dataString);
      Logger.log('Parsed data formType: ' + (data.formType || 'undefined'));
      
      if (data.formType === 'distribution') {
        saveDistribution(data);
      } else if (data.formType === 'promo') {
        savePromo(data);
      } else {
        throw new Error('Unknown formType: ' + (data.formType || 'undefined'));
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: true, 
          message: 'Данные успешно сохранены',
          formType: data.formType
        }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      Logger.log('doGet error: ' + error.toString());
      Logger.log('Error stack: ' + (error.stack || 'no stack'));
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          error: error.toString(),
          receivedParams: Object.keys(e.parameter || {}).join(', ') || 'no parameters'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  // Обычный GET запрос для проверки работоспособности
  return ContentService
    .createTextOutput(JSON.stringify({ 
      status: 'ok', 
      message: 'GET works!',
      info: 'Send data by adding ?data=JSON_STRING to URL',
      hasParameters: !!(e && e.parameter && Object.keys(e.parameter).length > 0)
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ═══════════════════════════════════════════════════════════════════════════
// Сохранение заявки на дистрибуцию
// ═══════════════════════════════════════════════════════════════════════════
function saveDistribution(data) {
  try {
    // Инициализируем листы если нужно
    initializeSheets();
    
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DISTRIBUTION_SHEET_NAME);
    
    if (!sheet) {
      throw new Error('Sheet "' + DISTRIBUTION_SHEET_NAME + '" not found after initialization');
    }
    
    const row = [
      new Date(data.timestamp || new Date()),           // A: Дата/Время
      getTariffName(data.tariff),                      // B: Тариф
      getReleaseTypeName(data.releaseType),            // C: Тип релиза
      data.trackCount || 0,                            // D: Кол-во треков
      data.releaseName || '',                          // E: Название релиза
      data.mainArtist || '',                           // F: Основной артист
      data.releaseVersion || '',                       // G: Версия релиза
      data.releaseLink || '',                          // H: Ссылка на релиз
      data.genre || '',                                // I: Жанр
      data.language || '',                             // J: Язык
      data.releaseDate || '',                          // K: Дата релиза
      data.coverLink || '',                            // L: Ссылка на обложку
      data.tiktokExcerpt || '',                        // M: Отрывок TikTok
      data.tiktokFull || '',                           // N: Полная версия TikTok
      data.yandexPreSave || '',                        // O: Pre-Save Яндекс
      data.addKaraoke === 'yes' ? 'Да' : 'Нет',       // P: Караоке
      data.tracks || '',                               // Q: Треки (JSON)
      data.fullName || '',                             // R: ФИО
      data.passportNumber || '',                       // S: Паспорт
      data.issuedBy || '',                             // T: Кем выдан
      data.issueDate || '',                            // U: Дата выдачи
      data.bankDetails || '',                          // V: Банковские реквизиты
      data.email || '',                                // W: Email
      data.contactInfo || '',                          // X: Контакты
      data.artistProfileLinks || '',                   // Y: Ссылки на профили
      (data.basePrice || 0) + ' ₽',                    // Z: Базовая цена
      (data.karaokePrice || 0) + ' ₽',                 // AA: Цена караоке
      (data.totalPrice || 0) + ' ₽',                   // AB: Итого
    ];
    
    sheet.appendRow(row);
    Logger.log('Distribution data saved successfully');
  } catch (error) {
    Logger.log('saveDistribution error: ' + error.toString());
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Сохранение заявки на промо
// ═══════════════════════════════════════════════════════════════════════════
function savePromo(data) {
  try {
    // Инициализируем листы если нужно
    initializeSheets();
    
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(PROMO_SHEET_NAME);
    
    if (!sheet) {
      throw new Error('Sheet "' + PROMO_SHEET_NAME + '" not found after initialization');
    }
    
    const row = [
      new Date(data.timestamp || new Date()),          // A: Дата/Время
      getPromoTypeName(data.promoType),                // B: Тип промо
      data.releaseLink || '',                          // C: Ссылка на релиз
      data.upcOrName || '',                            // D: UPC / Название
      data.releaseDate || '',                          // E: Дата релиза
      data.genre || '',                                // F: Жанр
      data.focusTrack || '',                           // G: Фокус-трек
      data.additionalInfo || '',                       // H: Доп. информация
      data.artistAndTitle || '',                       // I: Артист и название
      data.releaseDescription || '',                   // J: Описание релиза
      data.artistInfo || '',                           // K: Информация об артисте
      data.artistPhotos || '',                         // L: Фото артиста
      data.socialLinks || '',                          // M: Соцсети
      data.contactInfo || '',                         // N: Контакты
    ];
    
    sheet.appendRow(row);
    Logger.log('Promo data saved successfully');
  } catch (error) {
    Logger.log('savePromo error: ' + error.toString());
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Вспомогательные функции для читаемых названий
// ═══════════════════════════════════════════════════════════════════════════

function getTariffName(tariff) {
  const names = {
    'basic': 'Базовый',
    'advanced': 'Продвинутый',
    'premium': 'Премиум',
    'platinum': 'Платинум'
  };
  return names[tariff] || tariff || 'Не указан';
}

function getReleaseTypeName(type) {
  const names = {
    'single': 'Сингл',
    'ep': 'EP',
    'album': 'Альбом'
  };
  return names[type] || type || 'Не указан';
}

function getPromoTypeName(type) {
  const names = {
    'detailed': 'Детальное промо',
    'weekly': 'Еженедельное промо'
  };
  return names[type] || type || 'Не указан';
}
