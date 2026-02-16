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
  const url = await getGoogleScriptUrl();
  if (!url) return false;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow',
      body: JSON.stringify({
        action: 'update',
        sheet,
        rowIndex,
        data: updates,
      }),
    });

    const text = await res.text();
    const json = JSON.parse(text);
    return json?.success || !!json?.status;
  } catch (err) {
    console.error('updateSheetRow error:', err);
    return false;
  }
}

export async function createSignLink(
  contractNumber: string,
  rowIndex?: number
): Promise<{ signUrl?: string; token?: string; success?: boolean } | null> {
  // This creates a sign link for e-signature service.
  // For now, return a mock/placeholder response.
  // In production, this would integrate with an e-signature service (e.g., docusign, pandadoc, etc.)
  const token = btoa(JSON.stringify({ contractNumber, rowIndex, timestamp: Date.now() }));
  const signUrl = `${window.location.origin}/sign?token=${encodeURIComponent(token)}`;

  return {
    signUrl,
    token,
    success: true,
  };
}

export default { fetchSheetRows, updateSheetRow, createSignLink };
