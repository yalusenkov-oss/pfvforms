// Admin Google Sheets helper — fetch rows from the Apps Script web app
async function getGoogleScriptUrl(): Promise<string> {
  // @ts-ignore
  if ((window as any)?.VITE_GOOGLE_SCRIPT_URL) return (window as any).VITE_GOOGLE_SCRIPT_URL;
  try {
    const res = await fetch('/config.json', { cache: 'no-store' });
    if (res.ok) {
      const obj = await res.json();
      if (obj?.VITE_GOOGLE_SCRIPT_URL) return obj.VITE_GOOGLE_SCRIPT_URL;
    }
  } catch (e) {
    // ignore
  }
  return '';
}

interface SheetRow {
  [key: string]: string | number | null;
}

export async function fetchSheetRows(sheetName: string, options: { limit?: number } = {}): Promise<SheetRow[] | null> {
  const url = await getGoogleScriptUrl();
  if (!url) return null;

  const params = new URLSearchParams();
  params.set('action', 'list');
  params.set('sheet', sheetName);
  if (options.limit) params.set('limit', String(options.limit));

  const final = `${url}?${params.toString()}`;

  try {
    const res = await fetch(final, { method: 'GET', redirect: 'follow' });
    const text = await res.text();
    try {
      const json = text ? JSON.parse(text) : null;
      if (Array.isArray(json)) return json;
      if (json && Array.isArray(json.rows)) return json.rows;
      return null;
    } catch (e) {
      // not JSON
      return null;
    }
  } catch (err) {
    return null;
  }
}

export default { fetchSheetRows };
