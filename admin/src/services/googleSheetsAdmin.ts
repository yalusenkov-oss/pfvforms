// Admin Google Sheets helper — browser calls only local /api/* routes.
function getSignBaseUrl(): string {
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

function parseJsonSafe(text: string): any {
  if (!text || !text.trim()) return {};
  return JSON.parse(text);
}

export async function fetchSheetRows(sheetName: string, options: { limit?: number } = {}): Promise<SheetRow[] | null> {
  const params = new URLSearchParams();
  params.set('sheet', sheetName);
  if (options.limit) params.set('limit', String(options.limit));

  try {
    const res = await fetch(`/api/list?${params.toString()}`, { method: 'GET', redirect: 'follow' });
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
    const res = await fetchViaProxyPost('/api/submit', {
      action: 'update',
      sheet,
      row: rowIndex,
      updates,
    });

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
    const res = await fetchViaProxyPost('/api/submit', {
      action: 'delete',
      sheet,
      row: rowIndex,
    });

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
  payload?: { contractHtml?: string; signSource?: string; forceRegenerate?: boolean }
): Promise<{ signUrl?: string; token?: string; success?: boolean; emailSent?: boolean; emailError?: string; message?: string } | null> {
  const mainSiteBase = getSignBaseUrl();

  // Normalize any sign URL to point to the main site with /#sign?token= format
  const normalizeSignUrl = (url: string): string => {
    if (!url) return url;
    // Extract token from any format: /sign.html?token=X, /sign?token=X, /#sign?token=X
    const tokenMatch = url.match(/token=([^&]*)/);
    if (tokenMatch) {
      return `${mainSiteBase}/#sign?token=${tokenMatch[1]}`;
    }
    return url;
  };

  // Create sign link only on server so token/email/html stay in sync.
  try {
    const res = await fetchViaProxyPost('/api/sign', {
      action: 'create',
      contractNumber,
      row: rowIndex,
      contractHtml: payload?.contractHtml || '',
      signSource: payload?.signSource || 'internal',
      forceRegenerate: payload?.forceRegenerate || false
    });
    const text = await res.text();
    const json = parseJsonSafe(text);
    if (res.ok && json?.success) {
      // Fix the URL from server to point to main site
      if (json.signUrl) {
        json.signUrl = normalizeSignUrl(json.signUrl);
      }
      return json;
    }
    throw new Error(json?.error || `Не удалось создать ссылку (HTTP ${res.status})`);
  } catch (e: any) {
    throw new Error(e?.message || 'Не удалось создать ссылку на сервере');
  }
}

export async function fetchPromoCodes(): Promise<any[] | null> {
  try {
    const res = await fetch('/api/gas-proxy?action=list&sheet=promocodes', { method: 'GET', redirect: 'follow' });
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
    const res = await fetchViaProxyPost('/api/submit', {
      formType: 'promo_code',
      ...promoData,
    });

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
    const res = await fetchViaProxyPost('/api/submit', {
      action: 'promo_code_delete',
      id,
    });

    const text = await res.text();
    const json = parseJsonSafe(text);
    return json?.success || !!json?.status;
  } catch (err) {
    console.error('deletePromoCodeRemote error:', err);
    return false;
  }
}

export default { fetchSheetRows, updateSheetRow, deleteSheetRow, createSignLink, fetchPromoCodes, upsertPromoCode, deletePromoCodeRemote };
