import { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DistributionList } from './components/DistributionList';
import { DistributionDetail } from './components/DistributionDetail';
import { PromoList } from './components/PromoList';
import { PromoDetail } from './components/PromoDetail';
import { SettingsPage } from './components/SettingsPage';
import { ContractGenerator } from './components/ContractGenerator';
import { LoginPage } from './components/LoginPage';
import { PromoCodesPage } from './components/PromoCodesPage';
import { AdminTab, DistributionData, PromoData } from './types';
import {
  getDistributions,
  getPromos,
  updateDistributionStatus,
  updateDistributionContractNumber,
  updatePromoStatus,
  deleteDistribution,
  deletePromo,
  resetData,
  isAuthenticated,
  logout,
} from './store';
import { fetchSheetRows, updateSheetRow } from './services/googleSheetsAdmin';

type View =
  | { type: 'dashboard' }
  | { type: 'distributions' }
  | { type: 'distribution-detail'; id: string }
  | { type: 'distribution-contract'; id: string }
  | { type: 'promos' }
  | { type: 'promo-detail'; id: string }
  | { type: 'promocodes' }
  | { type: 'settings' };

export function App() {
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState<View>({ type: 'dashboard' });
  const [distributions, setDistributions] = useState<DistributionData[]>([]);
  const [promos, setPromos] = useState<PromoData[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [remoteInfo, setRemoteInfo] = useState<{ loaded: boolean; source: 'remote' | 'local' | 'none'; distCount?: number; promoCount?: number; error?: string }>({ loaded: false, source: 'none' });

  const normalizeBool = (v: any): boolean => {
    if (v === true || v === false) return v;
    if (v === 'Да' || v === 'yes' || v === 'true' || v === '1') return true;
    if (v === 'Нет' || v === 'no' || v === 'false' || v === '0') return false;
    return !!v;
  };

  const normalizeNumber = (v: any): number => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const cleaned = v.replace(/[^\d.-]/g, '');
      const n = parseFloat(cleaned);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };

  const normalizeTrackArtists = (raw: any): { name: string; separator: ',' | 'feat.' }[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw.map((a: any) => ({
        name: String(a?.name ?? a ?? '').trim(),
        separator: a?.separator === 'feat.' || a?.type === 'feat' ? 'feat.' : ',',
      })).filter((a: any) => a.name);
    }
    const text = String(raw).trim();
    if (!text) return [];
    // Keep as a single artist if parsing fails
    const parts = text.split(/( feat\. |, )/);
    if (parts.length <= 1) return [{ name: text, separator: ',' }];
    const result: { name: string; separator: ',' | 'feat.' }[] = [];
    let pendingSep: ',' | 'feat.' = ',';
    for (const part of parts) {
      if (part === ' feat. ') {
        pendingSep = 'feat.';
        continue;
      }
      if (part === ', ') {
        pendingSep = ',';
        continue;
      }
      const name = String(part).trim();
      if (!name) continue;
      result.push({ name, separator: pendingSep });
      pendingSep = ',';
    }
    return result.length ? result : [{ name: text, separator: ',' }];
  };

  const toStringArray = (raw: any): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(v => String(v).trim()).filter(Boolean);
    return String(raw)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  };

  const normalizeTracks = (v: any): any[] => {
    if (!v) return [];
    let parsed: any[] = [];
    if (Array.isArray(v)) parsed = v;
    else {
      try {
        const maybe = JSON.parse(String(v));
        if (Array.isArray(maybe)) {
          parsed = maybe;
        } else if (maybe && Array.isArray(maybe.tracks)) {
          parsed = maybe.tracks;
        } else {
          parsed = [];
          if (maybe) {
            console.warn('[admin] tracks_json is not an array:', maybe);
          }
        }
      } catch {
        parsed = [];
      }
    }
    if (!Array.isArray(parsed)) return [];
    return parsed.map((t: any, idx: number) => ({
      id: String(t?.id ?? t?.number ?? idx + 1),
      name: String(t?.name ?? ''),
      version: String(t?.version ?? ''),
      artists: normalizeTrackArtists(t?.artists),
      lyricists: toStringArray(t?.lyricists),
      composers: toStringArray(t?.composers),
      explicit: normalizeBool(t?.explicit ?? t?.explicitContent),
      substances: normalizeBool(t?.substances ?? t?.substanceMention),
      lyrics: String(t?.lyrics ?? ''),
    }));
  };

  const refresh = useCallback(() => {
    setDistributions(getDistributions());
    setPromos(getPromos());
  }, []);

  useEffect(() => {
    if (authed) refresh();
  }, [authed, refresh, refreshKey]);

  // Try to load data from Google Sheets (Apps Script) and replace local store if available
  // Extracted loader so we can call it manually and show status in UI
  const loadRemote = useCallback(async () => {
    if (!authed) return;
    try {
      const rows = await fetchSheetRows('distributions');
      const distCount = Array.isArray(rows) ? rows.length : 0;
      const mapped = (Array.isArray(rows) ? rows : []).map((r: any, idx: number) => ({
        id: r.id || r.ID || `remote-${idx}`,
        rowIndex: r._row || r.rowIndex || r.row || undefined,
        tariff: (r.tariff as any) || (r.Tariff as any) || r.tariff_name || 'basic',
        releaseType: (r.releaseType as any) || (r.ReleaseType as any) || r.release_type || 'single',
        releaseName: r.releaseName || r.ReleaseName || r.title || r.work_title || '',
        mainArtist: r.mainArtist || r.MainArtist || r.artist || r.pseudonym || '',
        releaseVersion: r.releaseVersion || r.release_version || '',
        releaseLink: r.releaseLink || r.release_link || '',
        genre: r.genre || '',
        language: r.language || '',
        releaseDate: r.releaseDate || r.release_date || '',
        coverLink: r.coverLink || r.cover_link || '',
        tracks: normalizeTracks(r.tracks || r.tracks_json),
        tiktokStart: String(r.tiktokExcerpt ?? r.tiktok_excerpt ?? r.tiktokStart ?? ''),
        tiktokFull: normalizeBool(r.tiktokFull ?? r.tiktok_full),
        preSaveYandex: normalizeBool(r.yandexPreSave ?? r.yandex_presave),
        karaoke: normalizeBool(r.addKaraoke ?? r.karaoke),
        fullName: r.fullName || r.FullName || r.licensor_name || '',
        passportSeries: r.passportNumber || r.passportSeries || r.passport_series_number || '',
        passportIssuedBy: r.issuedBy || r.passportIssuedBy || r.passport_issued_by || '',
        passportIssuedDate: r.issueDate || r.passportIssueDate || r.passport_issue_date || '',
        bankDetails: r.bankDetails || r.bank_details || '',
        email: r.email || '',
        consentAccepted: true,
        contacts: r.contactInfo || r.contacts || r.contact || '',
        artistProfileLinks: r.artistProfileLinks || r.artist_profile_links || '',
        submittedAt: r.timestamp || r.submittedAt || new Date().toISOString(),
        status: (r.status as any) || r.contractStatus || r.contract_status || 'new',
        totalPrice: normalizeNumber(r.totalPrice ?? r.total ?? r.total_price),
        contractNumber: r.contractNumber || r.contract_number || '',
      }));
      setDistributions(mapped as DistributionData[]);

      const promoRows = await fetchSheetRows('promos');
      const promoCount = Array.isArray(promoRows) ? promoRows.length : 0;
      const mappedPromos = (Array.isArray(promoRows) ? promoRows : []).map((p: any, idx: number) => ({
        id: p.id || p.ID || `remote-promo-${idx}`,
        rowIndex: p._row || p.rowIndex || p.row || undefined,
        type: p.promoType || p.type || p.Type || 'detailed',
        trackLink: p.releaseLink || p.release_link || p.trackLink || '',
        upc: p.upcOrName || p.upc_or_name || p.upc || '',
        releaseDate: p.releaseDate || p.release_date || '',
        genre: p.genre || '',
        artistAndTitle: p.artistAndTitle || p.artist_and_title || '',
        releaseDescription: p.releaseDescription || p.release_description || '',
        artistInfo: p.artistInfo || p.artist_info || '',
        artistPhotos: p.artistPhotos || p.artist_photos || '',
        socialLinks: p.socialLinks || p.social_links || '',
        focusTrack: p.focusTrack || p.focus_track || '',
        additionalInfo: p.additionalInfo || p.additional_info || '',
        contacts: p.contactInfo || p.contacts || p.contact_info || '',
        submittedAt: p.timestamp || p.submittedAt || new Date().toISOString(),
        status: p.status || 'new',
      }));
      setPromos(mappedPromos as PromoData[]);

      setRemoteInfo({ loaded: true, source: 'remote', distCount, promoCount });
    } catch (e: any) {
      // Show diagnostics to the admin so it's clear why loading failed
      setRemoteInfo({ loaded: false, source: 'none', error: e?.message ? String(e.message) : String(e) });
    }
  }, [authed]);

  useEffect(() => {
    if (authed) {
      // initial attempt
      loadRemote();
    }
  }, [authed, loadRemote, refreshKey]);

  const handleLogout = () => {
    logout();
    setAuthed(false);
    setView({ type: 'dashboard' });
  };

  // If not authenticated, show login page
  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />;
  }

  const activeTab: AdminTab =
    view.type === 'dashboard' ? 'dashboard' :
    view.type === 'distributions' || view.type === 'distribution-detail' || view.type === 'distribution-contract' ? 'distributions' :
    view.type === 'promos' || view.type === 'promo-detail' ? 'promos' :
    view.type === 'promocodes' ? 'promocodes' :
    'settings';

  const handleTabChange = (tab: AdminTab) => {
    switch (tab) {
      case 'dashboard': setView({ type: 'dashboard' }); break;
      case 'distributions': setView({ type: 'distributions' }); break;
      case 'promos': setView({ type: 'promos' }); break;
      case 'promocodes': setView({ type: 'promocodes' }); break;
      case 'settings': setView({ type: 'settings' }); break;
    }
  };

  const handleDistStatusChange = async (id: string, status: DistributionData['status']) => {
    const row = distributions.find(d => d.id === id)?.rowIndex;
    if (row) {
      try {
        await updateSheetRow('distributions', row, { contract_status: status });
        loadRemote();
        return;
      } catch {
        // fall back to local
      }
    }
    updateDistributionStatus(id, status);
    setRefreshKey(k => k + 1);
  };

  const handlePromoStatusChange = async (id: string, status: PromoData['status']) => {
    const row = promos.find(p => p.id === id)?.rowIndex;
    if (row) {
      try {
        await updateSheetRow('promos', row, { status });
        loadRemote();
        return;
      } catch {
        // fall back to local
      }
    }
    updatePromoStatus(id, status);
    setRefreshKey(k => k + 1);
  };

  const handleDistDelete = (id: string) => {
    deleteDistribution(id);
    if ((view.type === 'distribution-detail' || view.type === 'distribution-contract') && view.id === id) {
      setView({ type: 'distributions' });
    }
    setRefreshKey(k => k + 1);
  };

  const handleContractNumberUpdate = async (id: string, contractNumber: string) => {
    const row = distributions.find(d => d.id === id)?.rowIndex;
    if (row) {
      try {
        await updateSheetRow('distributions', row, { contract_number: contractNumber });
        loadRemote();
        return;
      } catch {
        // fall back to local
      }
    }
    updateDistributionContractNumber(id, contractNumber);
    setRefreshKey(k => k + 1);
  };

  const handlePromoDelete = (id: string) => {
    deletePromo(id);
    if (view.type === 'promo-detail' && view.id === id) {
      setView({ type: 'promos' });
    }
    setRefreshKey(k => k + 1);
  };

  const handleResetData = () => {
    resetData();
    setView({ type: 'dashboard' });
    setRefreshKey(k => k + 1);
  };

  const renderContent = () => {
    switch (view.type) {
      case 'dashboard':
        return (
          <Dashboard
            distributions={distributions}
            promos={promos}
            onViewDistribution={(id) => setView({ type: 'distribution-detail', id })}
            onViewPromo={(id) => setView({ type: 'promo-detail', id })}
            onGoToDistributions={() => setView({ type: 'distributions' })}
            onGoToPromos={() => setView({ type: 'promos' })}
          />
        );

      case 'distributions':
        return (
          <DistributionList
            distributions={distributions}
            onView={(id) => setView({ type: 'distribution-detail', id })}
            onDelete={handleDistDelete}
            onStatusChange={handleDistStatusChange}
            onGenerateContract={(id) => setView({ type: 'distribution-contract', id })}
          />
        );

      case 'distribution-detail': {
        const data = distributions.find(d => d.id === view.id);
        if (!data) {
          setView({ type: 'distributions' });
          return null;
        }
        return (
          <DistributionDetail
            data={data}
            onBack={() => setView({ type: 'distributions' })}
            onStatusChange={handleDistStatusChange}
            onGenerateContract={(id) => setView({ type: 'distribution-contract', id })}
          />
        );
      }

      case 'distribution-contract': {
        const data = distributions.find(d => d.id === view.id);
        if (!data) {
          setView({ type: 'distributions' });
          return null;
        }
        return (
          <ContractGenerator
            data={data}
            onBack={() => setView({ type: 'distribution-detail', id: view.id })}
            onUpdateContractNumber={handleContractNumberUpdate}
          />
        );
      }

      case 'promos':
        return (
          <PromoList
            promos={promos}
            onView={(id) => setView({ type: 'promo-detail', id })}
            onDelete={handlePromoDelete}
            onStatusChange={handlePromoStatusChange}
          />
        );

      case 'promo-detail': {
        const data = promos.find(p => p.id === view.id);
        if (!data) {
          setView({ type: 'promos' });
          return null;
        }
        return (
          <PromoDetail
            data={data}
            onBack={() => setView({ type: 'promos' })}
            onStatusChange={handlePromoStatusChange}
          />
        );
      }

      case 'promocodes':
        return <PromoCodesPage />;

      case 'settings':
        return (
          <SettingsPage
            distributions={distributions}
            promos={promos}
            onResetData={handleResetData}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-950 text-white">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
      />
      <main className="flex-1 min-w-0 lg:ml-0">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-6 max-w-7xl">
          {/* Data source indicator + manual reload */}
          <div className="flex items-center justify-end gap-3 mb-4">
            {remoteInfo.source === 'remote' ? (
              <div className="text-xs text-emerald-300 bg-emerald-900/20 px-3 py-1 rounded-full">
                Данные: Google Sheets — {remoteInfo.distCount ?? 0} релиз(ов), {remoteInfo.promoCount ?? 0} промо
              </div>
            ) : remoteInfo.source === 'local' ? (
              <div className="text-xs text-gray-300 bg-gray-900/20 px-3 py-1 rounded-full">
                Данные: локально
              </div>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <div className="text-xs text-yellow-200 bg-yellow-900/10 px-3 py-1 rounded-full">
                  Источник данных: не установлен
                </div>
                {remoteInfo.error ? (
                  <div className="text-xs text-red-300 bg-red-900/10 px-2 py-1 rounded-md max-w-xl break-words">
                    Ошибка загрузки: {remoteInfo.error}
                  </div>
                ) : null}
              </div>
            )}

            <button
              onClick={() => loadRemote()}
              className="text-xs px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors"
            >
              Загрузить из Sheets
            </button>
          </div>

          {renderContent()}
        </div>
      </main>
    </div>
  );
}
