import { useState } from 'react';
import { Search, Filter, Disc3, Trash2, Eye, ChevronDown, FileText } from 'lucide-react';
import { DistributionData, TARIFF_LABELS, RELEASE_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from '../types';
import { cn } from '../utils/cn';

interface DistributionListProps {
  distributions: DistributionData[];
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: DistributionData['status']) => void;
  onGenerateContract?: (id: string) => void;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatPrice(p: number) {
  return p.toLocaleString('ru-RU') + ' ₽';
}

const ALL_STATUSES: DistributionData['status'][] = ['new', 'in_progress', 'paid', 'released', 'rejected'];

export function DistributionList({ distributions, onView, onDelete, onStatusChange, onGenerateContract }: DistributionListProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTariff, setFilterTariff] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);

  const filtered = distributions.filter(d => {
    const matchSearch =
      d.releaseName.toLowerCase().includes(search.toLowerCase()) ||
      d.mainArtist.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      d.fullName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    const matchTariff = filterTariff === 'all' || d.tariff === filterTariff;
    return matchSearch && matchStatus && matchTariff;
  }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Дистрибуция</h2>
          <p className="text-dark-400 mt-1">Всего заявок: {distributions.length}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="Поиск по названию, артисту, ID, ФИО..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'px-3 py-2.5 rounded-lg border text-sm flex items-center gap-2 transition-colors',
              showFilters
                ? 'bg-primary-600/20 border-primary-500 text-primary-400'
                : 'bg-dark-800 border-dark-700 text-dark-400 hover:text-white'
            )}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Фильтры</span>
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 animate-fade-in">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
            >
              <option value="all">Все статусы</option>
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <select
              value={filterTariff}
              onChange={e => setFilterTariff(e.target.value)}
              className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
            >
              <option value="all">Все тарифы</option>
              {Object.entries(TARIFF_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-dark-800/50 border border-dark-700 rounded-xl overflow-hidden">
        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left text-xs text-dark-400 font-medium px-4 py-3">ID</th>
                <th className="text-left text-xs text-dark-400 font-medium px-4 py-3">Релиз</th>
                <th className="text-left text-xs text-dark-400 font-medium px-4 py-3">Артист</th>
                <th className="text-left text-xs text-dark-400 font-medium px-4 py-3">Тариф</th>
                <th className="text-left text-xs text-dark-400 font-medium px-4 py-3">Тип</th>
                <th className="text-left text-xs text-dark-400 font-medium px-4 py-3">Дата подачи</th>
                <th className="text-left text-xs text-dark-400 font-medium px-4 py-3">Сумма</th>
                <th className="text-left text-xs text-dark-400 font-medium px-4 py-3">Статус</th>
                <th className="text-right text-xs text-dark-400 font-medium px-4 py-3">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-dark-700/30 transition-colors">
                  <td className="px-4 py-3 text-xs text-dark-400 font-mono">{d.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-primary-600/20 flex items-center justify-center shrink-0">
                        <Disc3 size={14} className="text-primary-400" />
                      </div>
                      <span className="text-sm text-white font-medium truncate max-w-[180px]">{d.releaseName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-dark-300">{d.mainArtist}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      d.tariff === 'basic' ? 'bg-slate-500/20 text-slate-400' :
                      d.tariff === 'advanced' ? 'bg-blue-500/20 text-blue-400' :
                      d.tariff === 'premium' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-amber-500/20 text-amber-400'
                    )}>
                      {TARIFF_LABELS[d.tariff]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-dark-300">{RELEASE_TYPE_LABELS[d.releaseType]}</td>
                  <td className="px-4 py-3 text-sm text-dark-400">{formatDate(d.submittedAt)}</td>
                  <td className="px-4 py-3 text-sm text-white font-medium">{formatPrice(d.totalPrice)}</td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <button
                        onClick={() => setStatusDropdown(statusDropdown === d.id ? null : d.id)}
                        className={cn('text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 cursor-pointer hover:opacity-80', STATUS_COLORS[d.status])}
                      >
                        {STATUS_LABELS[d.status]}
                        <ChevronDown size={12} />
                      </button>
                      {statusDropdown === d.id && (
                        <div className="absolute z-20 top-full mt-1 left-0 bg-dark-800 border border-dark-600 rounded-lg shadow-xl py-1 min-w-[140px]">
                          {ALL_STATUSES.map(s => (
                            <button
                              key={s}
                              onClick={() => {
                                onStatusChange(d.id, s);
                                setStatusDropdown(null);
                              }}
                              className={cn(
                                'w-full text-left px-3 py-1.5 text-xs hover:bg-dark-700 transition-colors',
                                d.status === s ? 'text-primary-400' : 'text-dark-300'
                              )}
                            >
                              {STATUS_LABELS[s]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onView(d.id)}
                        className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
                        title="Просмотр"
                      >
                        <Eye size={16} />
                      </button>
                      {onGenerateContract && (
                        <button
                          onClick={() => onGenerateContract(d.id)}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            d.contractNumber
                              ? 'text-green-400 hover:bg-green-500/10'
                              : 'text-dark-400 hover:text-green-400 hover:bg-green-500/10'
                          )}
                          title={d.contractNumber ? `Договор ${d.contractNumber}` : 'Создать договор'}
                        >
                          <FileText size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => { if (confirm('Удалить заявку?')) onDelete(d.id); }}
                        className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden divide-y divide-dark-700/50">
          {filtered.map(d => (
            <div key={d.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-600/20 flex items-center justify-center shrink-0">
                    <Disc3 size={18} className="text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{d.releaseName}</p>
                    <p className="text-xs text-dark-400">{d.mainArtist} · {d.id}</p>
                  </div>
                </div>
                <span className={cn('text-xs px-2 py-0.5 rounded-full border shrink-0', STATUS_COLORS[d.status])}>
                  {STATUS_LABELS[d.status]}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-dark-400">
                <span>{TARIFF_LABELS[d.tariff]} · {RELEASE_TYPE_LABELS[d.releaseType]}</span>
                <span className="text-white font-medium">{formatPrice(d.totalPrice)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onView(d.id)}
                  className="flex-1 py-2 rounded-lg bg-primary-600/20 text-primary-400 text-xs font-medium hover:bg-primary-600/30 transition-colors"
                >
                  Подробнее
                </button>
                <button
                  onClick={() => { if (confirm('Удалить?')) onDelete(d.id); }}
                  className="py-2 px-3 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <Disc3 size={40} className="mx-auto text-dark-600 mb-3" />
            <p className="text-dark-400 text-sm">Заявки не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
}
