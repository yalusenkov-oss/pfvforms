// ═══════════════════════════════════════════════════════════════════════════
// PFVMUSIC Google Sheets Integration - Apps Script Code
// Скопируйте весь этот код в Google Apps Script редактор
// ═══════════════════════════════════════════════════════════════════════════

// Настройки
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const DISTRIBUTION_SHEET_NAME = 'Дистрибуция';
const PROMO_SHEET_NAME = 'Промо';
const PROMO_CODES_SHEET_NAME = 'Промокоды';

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
    promoSheet.getRange(1, 1, 1, 15).setValues([[
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
      'Контакты',             // N
      'status'                // O
    ]]);
    // Форматируем заголовки
    promoSheet.getRange(1, 1, 1, 15).setFontWeight('bold').setBackground('#f0f0f0');
    Logger.log('Created sheet: ' + PROMO_SHEET_NAME);
  }

  // Создаем лист "Промокоды" если не существует
  let promoCodesSheet = spreadsheet.getSheetByName(PROMO_CODES_SHEET_NAME);
  if (!promoCodesSheet) {
    promoCodesSheet = spreadsheet.insertSheet(PROMO_CODES_SHEET_NAME);
    promoCodesSheet.getRange(1, 1, 1, 13).setValues([[
      'id',                     // A
      'code',                   // B
      'discount_type',          // C
      'discount_value',         // D
      'applicable_tariffs',     // E
      'applicable_release_types', // F
      'max_uses',               // G
      'current_uses',           // H
      'is_active',              // I
      'valid_from',             // J
      'valid_until',            // K
      'created_at',             // L
      'description'             // M
    ]]);
    promoCodesSheet.getRange(1, 1, 1, 13).setFontWeight('bold').setBackground('#f0f0f0');
    Logger.log('Created sheet: ' + PROMO_CODES_SHEET_NAME);
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
    
    if (data.action === 'update') {
      updateRowData(data);
    } else if (data.action === 'promo_code_delete') {
      deletePromoCode(data);
    } else if (data.formType === 'promo_code') {
      savePromoCode(data);
    } else if (data.formType === 'distribution') {
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

  // Админ-панель: получение строк из таблицы
  if (e.parameter.action === 'list') {
    try {
      const sheetParam = e.parameter.sheet || '';
      const limit = e.parameter.limit ? parseInt(String(e.parameter.limit), 10) : null;
      const rows = listSheetRows(sheetParam, limit);
      return ContentService
        .createTextOutput(JSON.stringify({ rows: rows }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      Logger.log('doGet list error: ' + error.toString());
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
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
// Чтение строк для админ-панели
// ═══════════════════════════════════════════════════════════════════════════
function listSheetRows(sheetParam, limit) {
  initializeSheets();

  const normalized = String(sheetParam || '').toLowerCase().trim();
  let sheetName = sheetParam;
  let sheetType = 'unknown';
  if (normalized === 'distributions' || normalized === 'distribution' || normalized === 'дистрибуция') {
    sheetName = DISTRIBUTION_SHEET_NAME;
    sheetType = 'distribution';
  } else if (normalized === 'promos' || normalized === 'promo' || normalized === 'промо') {
    sheetName = PROMO_SHEET_NAME;
    sheetType = 'promo';
  } else if (normalized === 'promocodes' || normalized === 'promo_codes' || normalized === 'промокоды') {
    sheetName = PROMO_CODES_SHEET_NAME;
    sheetType = 'promocodes';
  }

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet "' + sheetName + '" not found');
  }

  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return [];

  let rows = data.slice(1);
  if (limit && limit > 0) {
    rows = rows.slice(-limit);
  }

  if (sheetType === 'distribution') {
    return rows.map(function(row, idx) {
      const obj = mapDistributionRow(row);
      obj._row = idx + 2;
      return obj;
    });
  }
  if (sheetType === 'promo') {
    return rows.map(function(row, idx) {
      const obj = mapPromoRow(row);
      obj._row = idx + 2;
      return obj;
    });
  }
  if (sheetType === 'promocodes') {
    return rows.map(function(row, idx) {
      const obj = mapPromoCodeRow(row);
      obj._row = idx + 2;
      return obj;
    });
  }

  // Fallback: return objects with numeric keys
  return rows.map(function(row, idx) {
    return { index: idx + 1, values: row };
  });
}

function mapDistributionRow(row) {
  const keys = [
    'timestamp',
    'tariff',
    'releaseType',
    'trackCount',
    'releaseName',
    'mainArtist',
    'releaseVersion',
    'releaseLink',
    'genre',
    'language',
    'releaseDate',
    'coverLink',
    'tiktokExcerpt',
    'tiktokFull',
    'yandexPreSave',
    'addKaraoke',
    'tracks',
    'fullName',
    'passportNumber',
    'issuedBy',
    'issueDate',
    'bankDetails',
    'email',
    'contactInfo',
    'artistProfileLinks',
    'basePrice',
    'karaokePrice',
    'totalPrice',
    'contract_number',
    'percentage',
    'contract_status',
    'music_author',
    'lyrics_author',
    'document_status'
  ];

  const obj = {};
  for (let i = 0; i < keys.length; i++) {
    obj[keys[i]] = row[i];
  }

  // Normalize values to match admin expectations
  obj.timestamp = normalizeDate(obj.timestamp);
  obj.tariff = normalizeTariff(obj.tariff);
  obj.releaseType = normalizeReleaseType(obj.releaseType);
  obj.tiktokFull = normalizeBool(obj.tiktokFull);
  obj.yandexPreSave = normalizeBool(obj.yandexPreSave);
  obj.addKaraoke = normalizeBool(obj.addKaraoke);
  obj.basePrice = normalizeNumber(obj.basePrice);
  obj.karaokePrice = normalizeNumber(obj.karaokePrice);
  obj.totalPrice = normalizeNumber(obj.totalPrice);

  return obj;
}

function mapPromoRow(row) {
  const keys = [
    'timestamp',
    'promoType',
    'releaseLink',
    'upcOrName',
    'releaseDate',
    'genre',
    'focusTrack',
    'additionalInfo',
    'artistAndTitle',
    'releaseDescription',
    'artistInfo',
    'artistPhotos',
    'socialLinks',
    'contactInfo',
    'status'
  ];

  const obj = {};
  for (let i = 0; i < keys.length; i++) {
    obj[keys[i]] = row[i];
  }

  obj.timestamp = normalizeDate(obj.timestamp);
  obj.promoType = normalizePromoType(obj.promoType);
  return obj;
}

function mapPromoCodeRow(row) {
  const keys = [
    'id',
    'code',
    'discountType',
    'discountValue',
    'applicableTariffs',
    'applicableReleaseTypes',
    'maxUses',
    'currentUses',
    'isActive',
    'validFrom',
    'validUntil',
    'createdAt',
    'description'
  ];
  const obj = {};
  for (let i = 0; i < keys.length; i++) {
    obj[keys[i]] = row[i];
  }
  return obj;
}

function updateRowData(data) {
  const sheetParam = data.sheet || '';
  const row = parseInt(String(data.row || ''), 10);
  const updates = data.updates || {};
  if (!sheetParam || !row || !updates) throw new Error('Missing update parameters');

  const normalized = String(sheetParam || '').toLowerCase().trim();
  let sheetName = sheetParam;
  if (normalized === 'distributions' || normalized === 'distribution' || normalized === 'дистрибуция') {
    sheetName = DISTRIBUTION_SHEET_NAME;
  } else if (normalized === 'promos' || normalized === 'promo' || normalized === 'промо') {
    sheetName = PROMO_SHEET_NAME;
  } else if (normalized === 'promocodes' || normalized === 'promo_codes' || normalized === 'промокоды') {
    sheetName = PROMO_CODES_SHEET_NAME;
  }

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet "' + sheetName + '" not found');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  Object.keys(updates).forEach(function(key) {
    let idx = headers.indexOf(key);
    if (idx < 0) {
      // Add missing column to the end
      headers.push(key);
      sheet.getRange(1, headers.length).setValue(key);
      idx = headers.length - 1;
    }
    sheet.getRange(row, idx + 1).setValue(updates[key]);
  });
}

function savePromoCode(data) {
  initializeSheets();
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(PROMO_CODES_SHEET_NAME);
  if (!sheet) throw new Error('Sheet "' + PROMO_CODES_SHEET_NAME + '" not found');

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const id = data.id || ('PC-' + Math.random().toString(36).substring(2, 8).toUpperCase());
  const existingRow = findRowById(sheet, headers, id);

  const row = [
    id,
    data.code || '',
    data.discountType || 'percent',
    data.discountValue || 0,
    (data.applicableTariffs || []).join(', '),
    (data.applicableReleaseTypes || []).join(', '),
    data.maxUses || 0,
    data.currentUses || 0,
    data.isActive === false ? false : true,
    data.validFrom || '',
    data.validUntil || '',
    data.createdAt || new Date().toISOString(),
    data.description || ''
  ];

  if (existingRow > 1) {
    sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

function deletePromoCode(data) {
  initializeSheets();
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(PROMO_CODES_SHEET_NAME);
  if (!sheet) throw new Error('Sheet "' + PROMO_CODES_SHEET_NAME + '" not found');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const id = data.id || '';
  const row = findRowById(sheet, headers, id);
  if (row > 1) {
    sheet.deleteRow(row);
  }
}

function findRowById(sheet, headers, id) {
  if (!id) return -1;
  const idIdx = headers.indexOf('id');
  if (idIdx < 0) return -1;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const values = sheet.getRange(2, idIdx + 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

function normalizeDate(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
}

function normalizeBool(value) {
  if (value === true || value === false) return value;
  if (value === 'Да' || value === 'yes' || value === 'true' || value === '1') return true;
  if (value === 'Нет' || value === 'no' || value === 'false' || value === '0') return false;
  return !!value;
}

function normalizeNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function normalizeTariff(value) {
  const map = {
    'Базовый': 'basic',
    'Продвинутый': 'advanced',
    'Премиум': 'premium',
    'Платинум': 'platinum'
  };
  return map[value] || value;
}

function normalizeReleaseType(value) {
  const map = {
    'Сингл': 'single',
    'EP': 'ep',
    'Альбом': 'album'
  };
  return map[value] || value;
}

function normalizePromoType(value) {
  const map = {
    'Детальное промо': 'detailed',
    'Еженедельное промо': 'weekly'
  };
  return map[value] || value;
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
      data.status || ''                                // O: Статус
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
