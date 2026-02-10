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
import { fetchSheetRows } from './services/googleSheetsAdmin';

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
  const [remoteInfo, setRemoteInfo] = useState<{ loaded: boolean; source: 'remote' | 'local' | 'none'; distCount?: number; promoCount?: number }>({ loaded: false, source: 'none' });

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
      let distCount = 0;
      if (Array.isArray(rows) && rows.length > 0) {
        distCount = rows.length;
        const mapped = rows.map((r: any, idx: number) => ({
          id: r.id || r.ID || `remote-${idx}`,
          tariff: (r.tariff as any) || (r.Tariff as any) || 'basic',
          releaseType: (r.releaseType as any) || (r.ReleaseType as any) || 'single',
          releaseName: r.releaseName || r.ReleaseName || r.title || '',
          mainArtist: r.mainArtist || r.MainArtist || r.artist || '',
          releaseVersion: r.releaseVersion || '',
          releaseLink: r.releaseLink || '',
          genre: r.genre || '',
          language: r.language || '',
          releaseDate: r.releaseDate || '',
          coverLink: r.coverLink || '',
          tracks: r.tracks ? JSON.parse(String(r.tracks)) : [],
          tiktokStart: r.tiktokStart || '',
          tiktokFull: !!r.tiktokFull,
          preSaveYandex: !!r.yandexPreSave,
          karaoke: !!r.addKaraoke,
          fullName: r.fullName || r.FullName || '',
          passportSeries: r.passportNumber || r.passportSeries || '',
          passportIssuedBy: r.issuedBy || r.passportIssuedBy || '',
          passportIssuedDate: r.issueDate || r.passportIssueDate || '',
          bankDetails: r.bankDetails || '',
          email: r.email || '',
          consentAccepted: true,
          contacts: r.contactInfo || r.contacts || '',
          artistProfileLinks: r.artistProfileLinks || '',
          submittedAt: r.timestamp || r.submittedAt || new Date().toISOString(),
          status: (r.status as any) || 'new',
          totalPrice: Number(r.totalPrice || r.total || 0),
        }));
        setDistributions(mapped as DistributionData[]);
      }

      const promoRows = await fetchSheetRows('promos');
      let promoCount = 0;
      if (Array.isArray(promoRows) && promoRows.length > 0) {
        promoCount = promoRows.length;
        const mappedPromos = promoRows.map((p: any, idx: number) => ({
          id: p.id || p.ID || `remote-promo-${idx}`,
          type: p.promoType || p.type || 'detailed',
          trackLink: p.releaseLink || p.trackLink || '',
          upc: p.upcOrName || p.upc || '',
          releaseDate: p.releaseDate || '',
          genre: p.genre || '',
          artistAndTitle: p.artistAndTitle || p.artistAndTitle || '',
          releaseDescription: p.releaseDescription || p.releaseDescription || '',
          artistInfo: p.artistInfo || '',
          artistPhotos: p.artistPhotos || '',
          socialLinks: p.socialLinks || '',
          focusTrack: p.focusTrack || '',
          additionalInfo: p.additionalInfo || '',
          contacts: p.contactInfo || p.contacts || '',
          submittedAt: p.timestamp || p.submittedAt || new Date().toISOString(),
          status: p.status || 'new',
        }));
        setPromos(mappedPromos as PromoData[]);
      }

      if (distCount || promoCount) {
        setRemoteInfo({ loaded: true, source: 'remote', distCount, promoCount });
      } else {
        setRemoteInfo({ loaded: false, source: 'local' });
      }
    } catch (e) {
      setRemoteInfo({ loaded: false, source: 'local' });
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
    updateDistributionStatus(id, status);
    setRefreshKey(k => k + 1);
  };

  const handlePromoStatusChange = (id: string, status: PromoData['status']) => {
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

  const handleContractNumberUpdate = (id: string, contractNumber: string) => {
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
                Данные: локально (mocks)
              </div>
            ) : (
              <div className="text-xs text-yellow-200 bg-yellow-900/10 px-3 py-1 rounded-full">
                Источник данных: не установлен
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
