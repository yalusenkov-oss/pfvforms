// Admin Google Sheets helper — use local API proxy to avoid browser CORS/preflight issues.
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

async function getSignBaseUrl(): Promise<string> {
  // @ts-ignore
  if ((window as any)?.VITE_SIGN_BASE_URL) return String((window as any).VITE_SIGN_BASE_URL).replace(/\/$/, '');
  try {
    const res = await fetch('/config.json', { cache: 'no-store' });
    if (res.ok) {
      const obj = await res.json();
      if (obj?.VITE_SIGN_BASE_URL) return String(obj.VITE_SIGN_BASE_URL).replace(/\/$/, '');
    }
  } catch {
    // ignore
  }
  return String(window.location.origin).replace(/\/$/, '');
}

interface SheetRow {
  [key: string]: string | number | null;
}


async function fetchViaProxyPost(path: string, payload: Record<string, any>): Promise<Response> {
  return fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    redirect: 'follow',
    body: JSON.stringify(payload),
  });
}

async function postDirectToScript(payload: Record<string, any>): Promise<Response> {
  const url = await getGoogleScriptUrl();
  if (!url) throw new Error('Google Script URL not configured');
  // Do NOT set Content-Type: application/json — it triggers CORS preflight (OPTIONS)
  // which Google Apps Script does not support (405). Omitting the header makes it
  // a "simple request" that avoids preflight. Apps Script reads JSON from e.postData.contents.
  return fetch(url, {
    method: 'POST',
    redirect: 'follow',
    body: JSON.stringify(payload),
  });
}

function parseJsonSafe(text: string): any {
  if (!text || !text.trim()) return {};
  return JSON.parse(text);
}

export async function fetchSheetRows(sheetName: string, options: { limit?: number } = {}): Promise<SheetRow[] | null> {
  const params = new URLSearchParams();
  params.set('sheet', sheetName);
  if (options.limit) params.set('limit', String(options.limit));

  try {
    // Read operations are safe to call directly and avoid local /api dev routing issues.
    const url = await getGoogleScriptUrl();
    if (!url) return null;
    const final = `${url}?action=list&${params.toString()}`;
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

export async function updateSheetRow(sheet: string, rowIndex: number, updates: Record<string, any>): Promise<boolean> {
  try {
    let res = await fetchViaProxyPost('/api/submit', {
      action: 'update',
      sheet,
      row: rowIndex,
      updates,
    });
    if (!res.ok && (res.status === 404 || res.status === 405)) {
      try {
        res = await postDirectToScript({
          action: 'update',
          sheet,
          row: rowIndex,
          updates,
        });
      } catch {
        return false;
      }
    }

    const text = await res.text();
    const json = parseJsonSafe(text);
    return json?.success || !!json?.status;
  } catch (err) {
    console.error('updateSheetRow error:', err);
    return false;
  }
}

export async function deleteSheetRow(sheet: string, rowIndex: number): Promise<boolean> {
  try {
    let res = await fetchViaProxyPost('/api/submit', {
      action: 'delete',
      sheet,
      row: rowIndex,
    });
    if (!res.ok && (res.status === 404 || res.status === 405)) {
      res = await postDirectToScript({
        action: 'delete',
        sheet,
        row: rowIndex,
      });
    }

    const text = await res.text();
    const json = parseJsonSafe(text);
    return json?.success || !!json?.status;
  } catch (err) {
    console.error('deleteSheetRow error:', err);
    return false;
  }
}

export async function createSignLink(
  contractNumber: string,
  rowIndex?: number,
  payload?: { contractHtml?: string; signSource?: string }
): Promise<{ signUrl?: string; token?: string; success?: boolean } | null> {
  // Try remote APIs first, then fall back to local token generation
  try {
    let res = await fetchViaProxyPost('/api/sign', {
      action: 'create',
      contractNumber,
      row: rowIndex,
      contractHtml: payload?.contractHtml || '',
      signSource: payload?.signSource || 'internal',
    });
    if (!res.ok && (res.status === 404 || res.status === 405)) {
      const signBaseUrl = await getSignBaseUrl();
      res = await postDirectToScript({
        action: 'sign_create',
        contractNumber,
        row: rowIndex,
        signBaseUrl,
        signExpiresDays: 7,
        contractHtml: payload?.contractHtml || '',
        signSource: payload?.signSource || 'internal',
      });
    }
    const text = await res.text();
    const json = parseJsonSafe(text);
    if (res.ok && json?.success) {
      return json;
    }
  } catch {
    // Remote calls failed — fall back to client-side generation below
  }

  // Fallback: generate sign link locally using the main site URL (not admin)
  const signBase = await getSignBaseUrl();
  const token = btoa(JSON.stringify({ contractNumber, rowIndex, timestamp: Date.now() }));
  const signUrl = `${signBase}/#sign?token=${encodeURIComponent(token)}`;

  return {
    signUrl,
    token,
    success: true,
  };
}

export async function fetchPromoCodes(): Promise<any[] | null> {
  const params = new URLSearchParams();
  params.set('sheet', 'promocodes');

  try {
    const url = await getGoogleScriptUrl();
    if (!url) return null;
    const final = `${url}?action=list&${params.toString()}`;
    const res = await fetch(final, { method: 'GET', redirect: 'follow' });
    const text = await res.text();

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    }

    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      throw new Error(`Response was not valid JSON: ${text.slice(0, 300)}`);
    }

    if (Array.isArray(json)) return json;
    if (json && Array.isArray(json.rows)) return json.rows;
    return null;
  } catch (err: any) {
    throw new Error(err?.message || String(err));
  }
}

export async function upsertPromoCode(promoData: Record<string, any>): Promise<boolean> {
  try {
    let res = await fetchViaProxyPost('/api/submit', {
      formType: 'promo_code',
      ...promoData,
    });
    if (!res.ok && (res.status === 404 || res.status === 405)) {
      res = await postDirectToScript({
        formType: 'promo_code',
        ...promoData,
      });
    }

    const text = await res.text();
    const json = parseJsonSafe(text);
    return json?.success || !!json?.status;
  } catch (err) {
    console.error('upsertPromoCode error:', err);
    return false;
  }
}

export async function deletePromoCodeRemote(id: string): Promise<boolean> {
  try {
    let res = await fetchViaProxyPost('/api/submit', {
      action: 'promo_code_delete',
      id,
    });
    if (!res.ok && (res.status === 404 || res.status === 405)) {
      res = await postDirectToScript({
        action: 'promo_code_delete',
        id,
      });
    }

    const text = await res.text();
    const json = parseJsonSafe(text);
    return json?.success || !!json?.status;
  } catch (err) {
    console.error('deletePromoCodeRemote error:', err);
    return false;
  }
}

export default { fetchSheetRows, updateSheetRow, deleteSheetRow, createSignLink, fetchPromoCodes, upsertPromoCode, deletePromoCodeRemote };
