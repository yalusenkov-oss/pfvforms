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
import { fetchSheetRows, updateSheetRow, deleteSheetRow, createSignLink } from './services/googleSheetsAdmin';

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

  // Local status overrides that persist across page reloads
  const STATUS_OVERRIDES_KEY = 'pfvmusic_status_overrides';
  const getStatusOverrides = (): Record<string, string> => {
    try { return JSON.parse(localStorage.getItem(STATUS_OVERRIDES_KEY) || '{}'); } catch { return {}; }
  };
  const saveStatusOverride = (id: string, status: string) => {
    const overrides = getStatusOverrides();
    overrides[id] = status;
    localStorage.setItem(STATUS_OVERRIDES_KEY, JSON.stringify(overrides));
  };

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

  const parseTracks = (v: any): any[] => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    try {
      return JSON.parse(String(v));
    } catch {
      return [];
    }
  };

  const normalizeTariff = (v: any): DistributionData['tariff'] => {
    const raw = String(v || '').trim().toLowerCase();
    if (raw === 'базовый' || raw === 'basic') return 'basic';
    if (raw === 'продвинутый' || raw === 'advanced') return 'advanced';
    if (raw === 'премиум' || raw === 'premium') return 'premium';
    if (raw === 'платинум' || raw === 'platinum') return 'platinum';
    return 'basic';
  };

  const normalizeReleaseType = (v: any): DistributionData['releaseType'] => {
    const raw = String(v || '').trim().toLowerCase();
    if (raw === 'сингл' || raw === 'single') return 'single';
    if (raw === 'ep') return 'ep';
    if (raw === 'альбом' || raw === 'album') return 'album';
    return 'single';
  };

  const normalizeStatus = (v: any): DistributionData['status'] => {
    const raw = String(v || '').trim().toLowerCase();
    if (raw === 'new' || raw === 'новый') return 'new';
    if (raw === 'in_progress' || raw === 'в работе') return 'in_progress';
    if (raw === 'paid' || raw === 'оплачен') return 'paid';
    if (raw === 'signed' || raw === 'подписан') return 'signed';
    if (raw === 'released' || raw === 'выпущен') return 'released';
    if (raw === 'rejected' || raw === 'отклонён' || raw === 'отклонен') return 'rejected';
    return 'new';
  };

  const toStringArray = (v: any): string[] => {
    if (!v) return [];
    if (Array.isArray(v)) return v.map(String).filter(Boolean);
    if (typeof v === 'string') return v.split(',').map((s: string) => s.trim()).filter(Boolean);
    return [];
  };

  const normalizeTracks = (rawTracks: any): DistributionData['tracks'] => {
    const parsed = parseTracks(rawTracks);
    return parsed.map((track: any, idx: number) => ({
      id: String(track?.id || `track-${idx + 1}`),
      name: String(track?.name || ''),
      version: String(track?.version || ''),
      artists: Array.isArray(track?.artists) && track.artists.length > 0
        ? track.artists
          .map((a: any) => ({
            name: String(a?.name || ''),
            separator: a?.separator === 'feat.' ? 'feat.' : ',',
          }))
          .filter((a: any) => a.name)
        : typeof track?.artists === 'string' && track.artists.trim()
          ? [{ name: track.artists.trim(), separator: ',' }]
          : [{ name: String(track?.artist || ''), separator: ',' }],
      lyricists: toStringArray(track?.lyricists),
      composers: toStringArray(track?.composers),
      explicit: normalizeBool(track?.explicit ?? track?.explicitContent),
      substances: normalizeBool(track?.substances ?? track?.substanceMention),
      lyrics: String(track?.lyrics || ''),
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
        id: String(r.id || r.ID || r.contract_number || `remote-${idx}`),
        tariff: normalizeTariff((r.tariff as any) || (r.Tariff as any) || r.tariff_name),
        releaseType: normalizeReleaseType((r.releaseType as any) || (r.ReleaseType as any) || r.release_type),
        releaseName: r.releaseName || r.ReleaseName || r.title || r.work_title || '',
        mainArtist: r.mainArtist || r.MainArtist || r.artist || r.pseudonym || '',
        releaseVersion: r.releaseVersion || r.release_version || '',
        releaseLink: r.releaseLink || r.release_link || '',
        genre: r.genre || '',
        language: r.language || '',
        releaseDate: r.releaseDate || r.release_date || '',
        coverLink: r.coverLink || r.cover_link || '',
        tracks: normalizeTracks(r.tracks || r.tracks_json),
        tiktokStart: r.tiktokStart || r.tiktok_excerpt || '',
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
        status: normalizeStatus((r.status as any) || r.contract_status),
        totalPrice: normalizeNumber(r.totalPrice ?? r.total ?? r.total_price),
        contractNumber: r.contractNumber || r.contract_number || '',
        rowIndex: Number(r._row || r.row || 0) || undefined,
      }));

      // Apply local status overrides on top of remote data
      const overrides = getStatusOverrides();
      const finalMapped = mapped.map((d: any) => {
        if (overrides[d.id]) {
          return { ...d, status: overrides[d.id] };
        }
        return d;
      });
      setDistributions(finalMapped as DistributionData[]);

      const promoRows = await fetchSheetRows('promos');
      const promoCount = Array.isArray(promoRows) ? promoRows.length : 0;
      const mappedPromos = (Array.isArray(promoRows) ? promoRows : []).map((p: any, idx: number) => ({
        id: p.id || p.ID || `remote-promo-${idx}`,
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

  const handleDistStatusChange = (id: string, status: DistributionData['status']) => {
    // Update local state immediately
    setDistributions(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    updateDistributionStatus(id, status);
    saveStatusOverride(id, status);

    // Try to update remote in background (fire-and-forget)
    const current = distributions.find(d => d.id === id);
    if (current?.rowIndex) {
      updateSheetRow('distributions', current.rowIndex, {
        contract_status: status,
        status,
      }).catch(() => { /* ignore remote errors */ });
    }
  };

  const handlePromoStatusChange = (id: string, status: PromoData['status']) => {
    updatePromoStatus(id, status);
    // Update local state directly
    setPromos(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  const handleDistDelete = async (id: string) => {
    const current = distributions.find(d => d.id === id);
    if (current?.rowIndex) {
      await deleteSheetRow('distributions', current.rowIndex);
    }
    deleteDistribution(id);
    if ((view.type === 'distribution-detail' || view.type === 'distribution-contract') && view.id === id) {
      setView({ type: 'distributions' });
    }
    setDistributions(prev => prev.filter(d => d.id !== id));
  };

  const handleContractNumberUpdate = (id: string, contractNumber: string) => {
    updateDistributionContractNumber(id, contractNumber);
    setDistributions(prev => prev.map(d => d.id === id ? { ...d, contractNumber } : d));
  };

  const handlePromoDelete = (id: string) => {
    deletePromo(id);
    if (view.type === 'promo-detail' && view.id === id) {
      setView({ type: 'promos' });
    }
    setPromos(prev => prev.filter(p => p.id !== id));
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
            onCreateSignLink={async (id) => {
              const dist = distributions.find(d => d.id === id);
              if (!dist) return null;

              // Generate contract number if missing
              const contractNum = dist.contractNumber || (() => {
                const now = new Date();
                const yy = String(now.getFullYear()).slice(-2);
                const mm = String(now.getMonth() + 1).padStart(2, '0');
                const dd = String(now.getDate()).padStart(2, '0');
                const seq = String(Math.floor(Math.random() * 900) + 100);
                return `ЛД-${yy}${mm}${dd}-${seq}`;
              })();

              try {
                const res = await createSignLink(contractNum, dist.rowIndex);
                if (res?.signUrl) {
                  // Save to distribution data
                  setDistributions(prev => prev.map(d => d.id === id
                    ? { ...d, signLink: res.signUrl!, contractNumber: contractNum }
                    : d
                  ));
                  if (!dist.contractNumber) {
                    updateDistributionContractNumber(id, contractNum);
                  }
                  return res.signUrl;
                }
              } catch { /* fallback below */ }
              return null;
            }}
          />
        );

      case 'distribution-detail': {
        const data = distributions.find(d => d.id === view.id);
        if (!data) {
          return (
            <div className="text-center py-20">
              <p className="text-dark-400 mb-4">Заявка не найдена или данные ещё загружаются...</p>
              <button onClick={() => setView({ type: 'distributions' })} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700 transition-colors">← К списку</button>
            </div>
          );
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
          return (
            <div className="text-center py-20">
              <p className="text-dark-400 mb-4">Заявка не найдена или данные ещё загружаются...</p>
              <button onClick={() => setView({ type: 'distributions' })} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700 transition-colors">← К списку</button>
            </div>
          );
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
          return (
            <div className="text-center py-20">
              <p className="text-dark-400 mb-4">Промо не найдено или данные ещё загружаются...</p>
              <button onClick={() => setView({ type: 'promos' })} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700 transition-colors">← К списку</button>
            </div>
          );
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
