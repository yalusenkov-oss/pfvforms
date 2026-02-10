// Admin Google Sheets helper — fetch rows from the Apps Script web app
// Attempts (in order): import.meta.env -> window global -> config.json (base-relative, then root)
let _cachedGoogleScriptUrl: string | null = null;
async function getGoogleScriptUrl(): Promise<string> {
  if (_cachedGoogleScriptUrl) return _cachedGoogleScriptUrl;

  // 1) Vite-provided env at build time
  try {
    const envUrl = ((import.meta as any)?.env?.VITE_GOOGLE_SCRIPT_URL as string) || '';
    if (envUrl) {
      _cachedGoogleScriptUrl = envUrl;
      return envUrl;
    }
  } catch {
    // ignore
  }

  // 2) global window variable (injected via public/config.js or similar)
  try {
    // @ts-ignore
    const w = (window as any);
    if (w && w.VITE_GOOGLE_SCRIPT_URL) {
      _cachedGoogleScriptUrl = String(w.VITE_GOOGLE_SCRIPT_URL);
      return _cachedGoogleScriptUrl;
    }
  } catch {
    // ignore
  }

  // 3) try to fetch config.json from base path and root
  const base = ((import.meta as any)?.env?.BASE_URL as string) || '/';
  const baseWithSlash = base.replace(/\/?$/, '/');
  const candidates = [baseWithSlash + 'config.json', '/config.json', 'config.json'];
  for (const path of candidates) {
    try {
      const res = await fetch(path, { cache: 'no-store' });
      if (res.ok) {
        const obj = await res.json();
        if (obj?.VITE_GOOGLE_SCRIPT_URL) {
          _cachedGoogleScriptUrl = String(obj.VITE_GOOGLE_SCRIPT_URL);
          return _cachedGoogleScriptUrl;
        }
      }
    } catch {
      // ignore
    }
  }

  return '';
}

interface SheetRow {
  [key: string]: string | number | null;
}

async function postToScript(payload: Record<string, any>): Promise<any> {
  const url = await getGoogleScriptUrl();
  if (!url) throw new Error('Google Script URL is not configured');
  const getUrl = `${url}${url.includes('?') ? '&' : '?'}data=${encodeURIComponent(JSON.stringify(payload))}`;
  const res = await fetch(getUrl, { method: 'GET', redirect: 'follow' });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} when posting to script: ${text.slice(0, 300)}`);
  }
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Response was not valid JSON: ${text.slice(0, 300)}`);
  }
}

export async function fetchSheetRows(sheetName: string, options: { limit?: number } = {}): Promise<SheetRow[] | null> {
  const url = await getGoogleScriptUrl();
  if (!url) return null;

  let final = url;
  try {
    const u = new URL(url);
    u.searchParams.set('action', 'list');
    u.searchParams.set('sheet', sheetName);
    if (options.limit) u.searchParams.set('limit', String(options.limit));
    final = u.toString();
  } catch {
    const params = new URLSearchParams();
    params.set('action', 'list');
    params.set('sheet', sheetName);
    if (options.limit) params.set('limit', String(options.limit));
    final = `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;
  }

  try {
    const res = await fetch(final, { method: 'GET', redirect: 'follow' });
    const text = await res.text();

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} when fetching sheets: ${text.slice(0, 300)}`);
    }

    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (e) {
      throw new Error(`Response was not valid JSON: ${text.slice(0, 300)}`);
    }

    // Accept either raw array or { rows: [...] } shape
    if (Array.isArray(json)) return json as SheetRow[];
    if (json && Array.isArray(json.rows)) return json.rows as SheetRow[];

    // Unexpected shape — surface it to the caller
    throw new Error(`Unexpected JSON shape from script: ${JSON.stringify(json).slice(0, 500)}`);
  } catch (err: any) {
    // Bubble up the error message so caller can display diagnostics
    throw new Error(err?.message || String(err));
  }
}

export async function updateSheetRow(sheetName: string, rowIndex: number, updates: Record<string, any>) {
  return postToScript({ action: 'update', sheet: sheetName, row: rowIndex, updates });
}

export async function fetchPromoCodes(): Promise<SheetRow[] | null> {
  return fetchSheetRows('promocodes');
}

export async function upsertPromoCode(payload: Record<string, any>) {
  return postToScript({ formType: 'promo_code', ...payload });
}

export async function deletePromoCodeRemote(id: string) {
  return postToScript({ action: 'promo_code_delete', id });
}

export default { fetchSheetRows };
