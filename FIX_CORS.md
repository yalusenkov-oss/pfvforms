# Исправление проблемы CORS с Google Apps Script

## Проблема

При отправке POST запросов возникает ошибка "Load failed" из-за CORS политики браузера.

## Решение

Google Apps Script веб-приложения требуют специальной настройки для обработки POST запросов. Обновите код в Google Apps Script:

### Обновленный код doPost функции

```javascript
// Обработка POST запросов
function doPost(e) {
  try {
    let data;
    
    // Обработка разных форматов данных
    if (e.postData && e.postData.contents) {
      // JSON данные
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter && e.parameter.data) {
      // Данные из FormData
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
```

## Шаги для исправления

1. **Откройте Google Apps Script редактор**
   - В вашей Google Таблице: **Расширения** → **Apps Script**

2. **Замените функцию `doPost`** на код выше

3. **Сохраните изменения** (Ctrl+S или Cmd+S)

4. **Создайте новое развертывание**
   - **Развернуть** → **Управление развёртываниями**
   - Нажмите на карандаш ✏️ рядом с текущим развертыванием
   - Или создайте новое: **Развернуть** → **Новое развёртывание**
   - Выберите **Веб-приложение**
   - Настройки:
     - **Выполнять как**: Я (ваш email)
     - **Доступ**: Все
   - Нажмите **Развернуть**

5. **Скопируйте новый URL** (если создали новое развертывание)

6. **Обновите URL в проекте** (если изменился)
   - В файле `.env`: `VITE_GOOGLE_SCRIPT_URL="новый_URL"`
   - В файле `public/config.json`: `"VITE_GOOGLE_SCRIPT_URL": "новый_URL"`

7. **Проверьте работу**
   - Откройте `test-google-sheets.html`
   - Попробуйте отправить тестовые данные

## Альтернативное решение (если проблема сохраняется)

Если проблема все еще возникает, попробуйте использовать альтернативный метод отправки через URL параметры (менее надежно для больших данных):

```javascript
// В тестовом файле используйте GET с данными в URL
const url = new URL(GOOGLE_SCRIPT_URL);
url.searchParams.set('data', JSON.stringify(preparedData));
const res = await fetch(url.toString(), {
  method: 'GET',
  redirect: 'follow',
});
```

И обновите `doGet` в Apps Script:

```javascript
function doGet(e) {
  try {
    const data = JSON.parse(e.parameter.data);
    
    if (data.formType === 'distribution') {
      saveDistribution(data);
    } else if (data.formType === 'promo') {
      savePromo(data);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Проверка логов

Если проблема сохраняется, проверьте логи в Google Apps Script:
1. **Выполнение** → **Журнал выполнений**
2. Посмотрите, какие ошибки возникают при POST запросах

## Дополнительная информация

Google Apps Script веб-приложения имеют ограничения CORS. Убедитесь, что:
- ✅ Развертывание настроено как "Веб-приложение"
- ✅ Доступ установлен на "Все"
- ✅ Используется правильный URL развертывания (не URL редактора)
