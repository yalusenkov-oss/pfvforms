import { Disc3, Megaphone, TrendingUp, DollarSign, Clock, ArrowRight } from 'lucide-react';
import { DistributionData, PromoData, TARIFF_LABELS, RELEASE_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from '../types';
import { cn } from '../utils/cn';

interface DashboardProps {
  distributions: DistributionData[];
  promos: PromoData[];
  onViewDistribution: (id: string) => void;
  onViewPromo: (id: string) => void;
  onGoToDistributions: () => void;
  onGoToPromos: () => void;
}

function StatCard({ icon, label, value, color, subtext }: { icon: React.ReactNode; label: string; value: string | number; color: string; subtext?: string }) {
  return (
    <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-5 hover:border-dark-600 transition-colors animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-dark-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtext && <p className="text-xs text-dark-500 mt-1">{subtext}</p>}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatPrice(p: number) {
  return p.toLocaleString('ru-RU') + ' ₽';
}

export function Dashboard({ distributions, promos, onViewDistribution, onViewPromo, onGoToDistributions, onGoToPromos }: DashboardProps) {
  const totalRevenue = distributions.reduce((sum, d) => sum + d.totalPrice, 0);
  const newOrders = distributions.filter(d => d.status === 'new').length + promos.filter(p => p.status === 'new').length;
  const recentDist = [...distributions].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 5);
  const recentPromo = [...promos].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 5);

  // Status breakdown for distributions
  const statusCounts = distributions.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Tariff breakdown
  const tariffCounts = distributions.reduce((acc, d) => {
    acc[d.tariff] = (acc[d.tariff] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Дашборд</h2>
        <p className="text-dark-400 mt-1">Обзор текущих заявок и статистики</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<Disc3 size={20} className="text-purple-400" />}
          label="Всего релизов"
          value={distributions.length}
          color="bg-purple-500/20"
          subtext={`${distributions.filter(d => d.status === 'new').length} новых`}
        />
        <StatCard
          icon={<Megaphone size={20} className="text-blue-400" />}
          label="Промо заявок"
          value={promos.length}
          color="bg-blue-500/20"
          subtext={`${promos.filter(p => p.status === 'new').length} новых`}
        />
        <StatCard
          icon={<Clock size={20} className="text-yellow-400" />}
          label="Новые заявки"
          value={newOrders}
          color="bg-yellow-500/20"
          subtext="Ожидают обработки"
        />
        <StatCard
          icon={<DollarSign size={20} className="text-green-400" />}
          label="Общий доход"
          value={formatPrice(totalRevenue)}
          color="bg-green-500/20"
          subtext={`Средний чек: ${formatPrice(Math.round(totalRevenue / (distributions.length || 1)))}`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Breakdown */}
        <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary-400" />
            Статусы дистрибуции
          </h3>
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => {
              const pct = Math.round((count / distributions.length) * 100);
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-dark-300">{STATUS_LABELS[status] || status}</span>
                    <span className="text-dark-400">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        status === 'new' ? 'bg-blue-500' :
                        status === 'in_progress' ? 'bg-yellow-500' :
                        status === 'paid' ? 'bg-green-500' :
                        status === 'released' ? 'bg-purple-500' :
                        'bg-red-500'
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tariff Breakdown */}
        <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign size={16} className="text-primary-400" />
            Популярность тарифов
          </h3>
          <div className="space-y-3">
            {Object.entries(tariffCounts).map(([tariff, count]) => {
              const pct = Math.round((count / distributions.length) * 100);
              return (
                <div key={tariff}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-dark-300">{TARIFF_LABELS[tariff] || tariff}</span>
                    <span className="text-dark-400">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        tariff === 'basic' ? 'bg-slate-400' :
                        tariff === 'advanced' ? 'bg-blue-400' :
                        tariff === 'premium' ? 'bg-purple-400' :
                        'bg-amber-400'
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Distributions */}
        <div className="bg-dark-800/50 border border-dark-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-dark-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Disc3 size={16} className="text-primary-400" />
              Последние релизы
            </h3>
            <button onClick={onGoToDistributions} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              Все <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-dark-700">
            {recentDist.map(d => (
              <button
                key={d.id}
                onClick={() => onViewDistribution(d.id)}
                className="w-full p-4 flex items-center gap-3 hover:bg-dark-700/50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-primary-600/20 flex items-center justify-center shrink-0">
                  <Disc3 size={16} className="text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{d.releaseName}</p>
                  <p className="text-xs text-dark-400">{d.mainArtist} · {TARIFF_LABELS[d.tariff]} · {RELEASE_TYPE_LABELS[d.releaseType]}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border', STATUS_COLORS[d.status])}>
                    {STATUS_LABELS[d.status]}
                  </span>
                  <p className="text-xs text-dark-500 mt-1">{formatDate(d.submittedAt)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Promos */}
        <div className="bg-dark-800/50 border border-dark-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-dark-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Megaphone size={16} className="text-primary-400" />
              Последние промо
            </h3>
            <button onClick={onGoToPromos} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              Все <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-dark-700">
            {recentPromo.map(p => (
              <button
                key={p.id}
                onClick={() => onViewPromo(p.id)}
                className="w-full p-4 flex items-center gap-3 hover:bg-dark-700/50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Megaphone size={16} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {p.type === 'detailed' ? (p as any).artistAndTitle || p.upc : p.upc}
                  </p>
                  <p className="text-xs text-dark-400">
                    {p.type === 'detailed' ? 'Детальное промо' : 'Еженедельное промо'} · {p.genre}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border', STATUS_COLORS[p.status])}>
                    {STATUS_LABELS[p.status]}
                  </span>
                  <p className="text-xs text-dark-500 mt-1">{formatDate(p.submittedAt)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
