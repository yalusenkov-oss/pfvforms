import { useState } from 'react';
import { Search, Filter, Megaphone, Trash2, Eye, ChevronDown } from 'lucide-react';
import { PromoData, DetailedPromoData, STATUS_LABELS, STATUS_COLORS } from '../types';
import { cn } from '../utils/cn';

interface PromoListProps {
  promos: PromoData[];
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: PromoData['status']) => void;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const ALL_STATUSES: PromoData['status'][] = ['new', 'in_progress', 'done', 'rejected'];

export function PromoList({ promos, onView, onDelete, onStatusChange }: PromoListProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);

  const filtered = promos.filter(p => {
    const title = p.type === 'detailed' ? (p as DetailedPromoData).artistAndTitle || p.upc : p.upc;
    const matchSearch =
      title.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.genre.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchType = filterType === 'all' || p.type === filterType;
    return matchSearch && matchStatus && matchType;
  }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Промо</h2>
        <p className="text-dark-400 mt-1">Всего заявок: {promos.length}</p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="Поиск по названию, ID, жанру..."
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
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
            >
              <option value="all">Все типы</option>
              <option value="detailed">Детальное</option>
              <option value="weekly">Еженедельное</option>
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-dark-800/50 border border-dark-700 rounded-xl overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left text-xs text-dark-400 font-medium px-4 py-3">ID</th>
                <th className="text-left text-xs text-dark-400 font-medium px-4 py-3">Тип</th>
                <th className="text-left text-xs text-dark-400 font-medium px-4 py-3">Название / UPC</th>
                <th className="text-left text-xs text-dark-400 font-medium px-4 py-3">Жанр</th>
                <th className="text-left text-xs text-dark-400 font-medium px-4 py-3">Дата релиза</th>
                <th className="text-left text-xs text-dark-400 font-medium px-4 py-3">Подано</th>
                <th className="text-left text-xs text-dark-400 font-medium px-4 py-3">Контакты</th>
                <th className="text-left text-xs text-dark-400 font-medium px-4 py-3">Статус</th>
                <th className="text-right text-xs text-dark-400 font-medium px-4 py-3">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
              {filtered.map(p => {
                const title = p.type === 'detailed' ? (p as DetailedPromoData).artistAndTitle || p.upc : p.upc;
                return (
                  <tr key={p.id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-dark-400 font-mono">{p.id}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        p.type === 'detailed' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                      )}>
                        {p.type === 'detailed' ? 'Детальное' : 'Еженедельное'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center shrink-0">
                          <Megaphone size={14} className="text-blue-400" />
                        </div>
                        <span className="text-sm text-white font-medium truncate max-w-[200px]">{title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-300">{p.genre}</td>
                    <td className="px-4 py-3 text-sm text-dark-400">{formatDate(p.releaseDate)}</td>
                    <td className="px-4 py-3 text-sm text-dark-400">{formatDate(p.submittedAt)}</td>
                    <td className="px-4 py-3 text-sm text-dark-300">{p.contacts}</td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={() => setStatusDropdown(statusDropdown === p.id ? null : p.id)}
                          className={cn('text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 cursor-pointer hover:opacity-80', STATUS_COLORS[p.status])}
                        >
                          {STATUS_LABELS[p.status]}
                          <ChevronDown size={12} />
                        </button>
                        {statusDropdown === p.id && (
                          <div className="absolute z-20 top-full mt-1 left-0 bg-dark-800 border border-dark-600 rounded-lg shadow-xl py-1 min-w-[140px]">
                            {ALL_STATUSES.map(s => (
                              <button
                                key={s}
                                onClick={() => {
                                  onStatusChange(p.id, s);
                                  setStatusDropdown(null);
                                }}
                                className={cn(
                                  'w-full text-left px-3 py-1.5 text-xs hover:bg-dark-700 transition-colors',
                                  p.status === s ? 'text-primary-400' : 'text-dark-300'
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
                          onClick={() => onView(p.id)}
                          className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
                          title="Просмотр"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => { if (confirm('Удалить заявку?')) onDelete(p.id); }}
                          className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden divide-y divide-dark-700/50">
          {filtered.map(p => {
            const title = p.type === 'detailed' ? (p as DetailedPromoData).artistAndTitle || p.upc : p.upc;
            return (
              <div key={p.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                      <Megaphone size={18} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">{title}</p>
                      <p className="text-xs text-dark-400">{p.type === 'detailed' ? 'Детальное' : 'Еженедельное'} · {p.id}</p>
                    </div>
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border shrink-0', STATUS_COLORS[p.status])}>
                    {STATUS_LABELS[p.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-dark-400">
                  <span>{p.genre} · {formatDate(p.releaseDate)}</span>
                  <span>{p.contacts}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onView(p.id)}
                    className="flex-1 py-2 rounded-lg bg-primary-600/20 text-primary-400 text-xs font-medium hover:bg-primary-600/30 transition-colors"
                  >
                    Подробнее
                  </button>
                  <button
                    onClick={() => { if (confirm('Удалить?')) onDelete(p.id); }}
                    className="py-2 px-3 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <Megaphone size={40} className="mx-auto text-dark-600 mb-3" />
            <p className="text-dark-400 text-sm">Заявки не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
}
