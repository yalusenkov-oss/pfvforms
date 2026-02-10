import { useState, useEffect } from 'react';
import {
  Ticket,
  Plus,
  Search,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Copy,
  Check,
  X,
  Edit3,
  Filter,
  Percent,
  DollarSign,
} from 'lucide-react';
import { PromoCode, TARIFF_LABELS, RELEASE_TYPE_LABELS } from '../types';
import { fetchPromoCodes, upsertPromoCode, deletePromoCodeRemote, updateSheetRow } from '../services/googleSheetsAdmin';
import { cn } from '../utils/cn';

function generatePromoId(): string {
  return 'PC-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const ALL_TARIFFS: ('basic' | 'advanced' | 'premium' | 'platinum')[] = ['basic', 'advanced', 'premium', 'platinum'];
const ALL_RELEASE_TYPES: ('single' | 'ep' | 'album')[] = ['single', 'ep', 'album'];

interface PromoFormData {
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  applicableTariffs: ('basic' | 'advanced' | 'premium' | 'platinum')[];
  applicableReleaseTypes: ('single' | 'ep' | 'album')[];
  maxUses: number;
  validFrom: string;
  validUntil: string;
  description: string;
}

const emptyForm: PromoFormData = {
  code: '',
  discountType: 'percent',
  discountValue: 10,
  applicableTariffs: ['basic', 'advanced', 'premium', 'platinum'],
  applicableReleaseTypes: ['single', 'ep', 'album'],
  maxUses: 100,
  validFrom: new Date().toISOString().split('T')[0],
  validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  description: '',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button type="button" onClick={handleCopy} className="p-1 rounded text-dark-500 hover:text-white transition-colors" title="Копировать">
      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
    </button>
  );
}

export function PromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PromoFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const refresh = async () => {
    try {
      const rows = await fetchPromoCodes();
      const mapped = (Array.isArray(rows) ? rows : []).map((r: any) => {
        const toArray = (v: any) => {
          if (!v) return [];
          if (Array.isArray(v)) return v;
          return String(v).split(',').map(s => s.trim()).filter(Boolean);
        };
        const toBool = (v: any) => v === true || v === 'true' || v === '1' || v === 'Да' || v === 'yes';
        const toNum = (v: any) => typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.-]/g, '')) || 0;
        return {
          id: String(r.id || r.ID || ''),
          code: String(r.code || r.promo_code || '').toUpperCase(),
          discountType: (r.discountType || r.discount_type || 'percent') as 'percent' | 'fixed',
          discountValue: toNum(r.discountValue ?? r.discount_value),
          applicableTariffs: toArray(r.applicableTariffs || r.applicable_tariffs),
          applicableReleaseTypes: toArray(r.applicableReleaseTypes || r.applicable_release_types),
          maxUses: toNum(r.maxUses ?? r.max_uses),
          currentUses: toNum(r.currentUses ?? r.current_uses),
          isActive: toBool(r.isActive ?? r.is_active),
          validFrom: String(r.validFrom || r.valid_from || ''),
          validUntil: String(r.validUntil || r.valid_until || ''),
          createdAt: String(r.createdAt || r.created_at || ''),
          description: String(r.description || ''),
          rowIndex: r._row || r.rowIndex || r.row || undefined,
        } as PromoCode;
      }).filter(c => c.id || c.code);
      setCodes(mapped);
    } catch {
      setCodes([]);
    }
  };
  useEffect(() => { refresh(); }, []);

  const filtered = codes.filter(c => {
    const matchSearch =
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase());
    const matchActive =
      filterActive === 'all' ? true :
      filterActive === 'active' ? c.isActive :
      !c.isActive;
    return matchSearch && matchActive;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors([]);
    setShowForm(true);
  };

  const handleEdit = (code: PromoCode) => {
    setEditingId(code.id);
    setForm({
      code: code.code,
      discountType: code.discountType,
      discountValue: code.discountValue,
      applicableTariffs: code.applicableTariffs,
      applicableReleaseTypes: code.applicableReleaseTypes,
      maxUses: code.maxUses,
      validFrom: code.validFrom,
      validUntil: code.validUntil,
      description: code.description,
    });
    setFormErrors([]);
    setShowForm(true);
  };

  const handleToggle = async (id: string) => {
    const item = codes.find(c => c.id === id);
    if (!item) return;
    if (item.rowIndex) {
      await updateSheetRow('promocodes', item.rowIndex, { is_active: !item.isActive });
      await refresh();
      return;
    }
    // fallback: update by id via upsert
    await upsertPromoCode({ id, isActive: !item.isActive });
    await refresh();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Удалить промокод?')) {
      await deletePromoCodeRemote(id);
      await refresh();
    }
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    if (!form.code.trim()) errors.push('Введите код промокода');
    if (form.code.trim().length < 3) errors.push('Код должен быть не менее 3 символов');
    if (form.discountValue <= 0) errors.push('Скидка должна быть больше 0');
    if (form.discountType === 'percent' && form.discountValue > 100) errors.push('Процент скидки не может быть больше 100');
    if (form.applicableTariffs.length === 0) errors.push('Выберите хотя бы один тариф');
    if (form.applicableReleaseTypes.length === 0) errors.push('Выберите хотя бы один тип релиза');
    if (form.maxUses <= 0) errors.push('Макс. количество использований должно быть больше 0');
    if (!form.validFrom) errors.push('Укажите дату начала');
    if (!form.validUntil) errors.push('Укажите дату окончания');
    if (form.validFrom && form.validUntil && new Date(form.validFrom) > new Date(form.validUntil)) {
      errors.push('Дата начала не может быть позже даты окончания');
    }
    // Check uniqueness
    if (!editingId) {
      const existing = codes.find(c => c.code.toLowerCase() === form.code.trim().toLowerCase());
      if (existing) errors.push('Промокод с таким кодом уже существует');
    }
    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingId) {
      await upsertPromoCode({
        id: editingId,
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: form.discountValue,
        applicableTariffs: form.applicableTariffs,
        applicableReleaseTypes: form.applicableReleaseTypes,
        maxUses: form.maxUses,
        validFrom: form.validFrom,
        validUntil: form.validUntil,
        description: form.description.trim(),
      });
    } else {
      const newCode: PromoCode = {
        id: generatePromoId(),
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: form.discountValue,
        applicableTariffs: form.applicableTariffs,
        applicableReleaseTypes: form.applicableReleaseTypes,
        maxUses: form.maxUses,
        currentUses: 0,
        isActive: true,
        validFrom: form.validFrom,
        validUntil: form.validUntil,
        createdAt: new Date().toISOString(),
        description: form.description.trim(),
      };
      await upsertPromoCode(newCode);
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    await refresh();
  };

  const toggleTariff = (tariff: 'basic' | 'advanced' | 'premium' | 'platinum') => {
    setForm(prev => ({
      ...prev,
      applicableTariffs: prev.applicableTariffs.includes(tariff)
        ? prev.applicableTariffs.filter(t => t !== tariff)
        : [...prev.applicableTariffs, tariff],
    }));
  };

  const toggleReleaseType = (type: 'single' | 'ep' | 'album') => {
    setForm(prev => ({
      ...prev,
      applicableReleaseTypes: prev.applicableReleaseTypes.includes(type)
        ? prev.applicableReleaseTypes.filter(t => t !== type)
        : [...prev.applicableReleaseTypes, type],
    }));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Ticket size={24} className="text-primary-400" />
            Промокоды
          </h2>
          <p className="text-dark-400 mt-1">Управление промокодами и скидками · Всего: {codes.length}</p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="px-4 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-500 transition-colors flex items-center gap-2 shadow-lg shadow-primary-600/20"
        >
          <Plus size={16} />
          Создать промокод
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-4">
          <p className="text-xs text-dark-400">Всего промокодов</p>
          <p className="text-xl font-bold text-white mt-1">{codes.length}</p>
        </div>
        <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-4">
          <p className="text-xs text-dark-400">Активных</p>
          <p className="text-xl font-bold text-green-400 mt-1">{codes.filter(c => c.isActive).length}</p>
        </div>
        <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-4">
          <p className="text-xs text-dark-400">Неактивных</p>
          <p className="text-xl font-bold text-dark-400 mt-1">{codes.filter(c => !c.isActive).length}</p>
        </div>
        <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-4">
          <p className="text-xs text-dark-400">Общее кол-во использований</p>
          <p className="text-xl font-bold text-primary-400 mt-1">{codes.reduce((s, c) => s + c.currentUses, 0)}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="Поиск по коду, описанию..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
          <button
            type="button"
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
              value={filterActive}
              onChange={e => setFilterActive(e.target.value)}
              className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
            >
              <option value="all">Все</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
            </select>
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="bg-dark-800/50 border border-primary-700/30 rounded-xl overflow-hidden animate-fade-in">
          <div className="px-5 py-3 border-b border-dark-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Ticket size={16} className="text-primary-400" />
              {editingId ? 'Редактирование промокода' : 'Новый промокод'}
            </h3>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="p-1 rounded text-dark-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-5 space-y-4">
            {formErrors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-1">
                {formErrors.map((err, i) => (
                  <p key={i} className="text-xs text-red-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                    {err}
                  </p>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Code */}
              <div className="space-y-1.5">
                <label className="text-xs text-dark-400 font-medium">Код промокода *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="WELCOME20"
                  className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white font-mono uppercase placeholder:text-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs text-dark-400 font-medium">Описание</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Описание промокода..."
                  className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Discount Type */}
              <div className="space-y-1.5">
                <label className="text-xs text-dark-400 font-medium">Тип скидки *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, discountType: 'percent' }))}
                    className={cn(
                      'flex-1 py-2 rounded-lg border text-sm flex items-center justify-center gap-1.5 transition-colors',
                      form.discountType === 'percent'
                        ? 'bg-primary-600/20 border-primary-500 text-primary-400'
                        : 'bg-dark-700/50 border-dark-600 text-dark-400 hover:text-white'
                    )}
                  >
                    <Percent size={14} />
                    Процент
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, discountType: 'fixed' }))}
                    className={cn(
                      'flex-1 py-2 rounded-lg border text-sm flex items-center justify-center gap-1.5 transition-colors',
                      form.discountType === 'fixed'
                        ? 'bg-primary-600/20 border-primary-500 text-primary-400'
                        : 'bg-dark-700/50 border-dark-600 text-dark-400 hover:text-white'
                    )}
                  >
                    <DollarSign size={14} />
                    Фикс. ₽
                  </button>
                </div>
              </div>

              {/* Discount Value */}
              <div className="space-y-1.5">
                <label className="text-xs text-dark-400 font-medium">
                  Размер скидки * ({form.discountType === 'percent' ? '%' : '₽'})
                </label>
                <input
                  type="number"
                  value={form.discountValue}
                  onChange={e => setForm(prev => ({ ...prev, discountValue: Number(e.target.value) }))}
                  min={1}
                  max={form.discountType === 'percent' ? 100 : 99999}
                  className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              {/* Max Uses */}
              <div className="space-y-1.5">
                <label className="text-xs text-dark-400 font-medium">Макс. использований *</label>
                <input
                  type="number"
                  value={form.maxUses}
                  onChange={e => setForm(prev => ({ ...prev, maxUses: Number(e.target.value) }))}
                  min={1}
                  className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Valid From */}
              <div className="space-y-1.5">
                <label className="text-xs text-dark-400 font-medium">Действует с *</label>
                <input
                  type="date"
                  value={form.validFrom}
                  onChange={e => setForm(prev => ({ ...prev, validFrom: e.target.value }))}
                  className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors [color-scheme:dark]"
                />
              </div>

              {/* Valid Until */}
              <div className="space-y-1.5">
                <label className="text-xs text-dark-400 font-medium">Действует до *</label>
                <input
                  type="date"
                  value={form.validUntil}
                  onChange={e => setForm(prev => ({ ...prev, validUntil: e.target.value }))}
                  className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Applicable Tariffs */}
            <div className="space-y-1.5">
              <label className="text-xs text-dark-400 font-medium">Применимые тарифы *</label>
              <div className="flex flex-wrap gap-2">
                {ALL_TARIFFS.map(t => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => toggleTariff(t)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                      form.applicableTariffs.includes(t)
                        ? t === 'basic' ? 'bg-slate-500/20 border-slate-500/30 text-slate-400'
                        : t === 'advanced' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                        : t === 'premium' ? 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                        : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                        : 'bg-dark-700/50 border-dark-600 text-dark-500'
                    )}
                  >
                    {TARIFF_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Applicable Release Types */}
            <div className="space-y-1.5">
              <label className="text-xs text-dark-400 font-medium">Применимые типы релизов *</label>
              <div className="flex flex-wrap gap-2">
                {ALL_RELEASE_TYPES.map(t => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => toggleReleaseType(t)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                      form.applicableReleaseTypes.includes(t)
                        ? 'bg-primary-600/20 border-primary-500/30 text-primary-400'
                        : 'bg-dark-700/50 border-dark-600 text-dark-500'
                    )}
                  >
                    {RELEASE_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-500 transition-colors flex items-center gap-2"
              >
                <Check size={16} />
                {editingId ? 'Сохранить изменения' : 'Создать промокод'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-4 py-2.5 rounded-lg bg-dark-700 border border-dark-600 text-dark-300 text-sm hover:text-white transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promo Codes List */}
      <div className="bg-dark-800/50 border border-dark-700 rounded-xl overflow-hidden">
        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left text-xs text-dark-400 font-medium px-4 py-3">Код</th>
                <th className="text-left text-xs text-dark-400 font-medium px-4 py-3">Описание</th>
                <th className="text-left text-xs text-dark-400 font-medium px-4 py-3">Скидка</th>
                <th className="text-left text-xs text-dark-400 font-medium px-4 py-3">Тарифы</th>
                <th className="text-left text-xs text-dark-400 font-medium px-4 py-3">Типы</th>
                <th className="text-left text-xs text-dark-400 font-medium px-4 py-3">Использовано</th>
                <th className="text-left text-xs text-dark-400 font-medium px-4 py-3">Период</th>
                <th className="text-left text-xs text-dark-400 font-medium px-4 py-3">Статус</th>
                <th className="text-right text-xs text-dark-400 font-medium px-4 py-3">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
              {filtered.map(code => {
                const isExpired = new Date(code.validUntil) < new Date();
                const isMaxed = code.currentUses >= code.maxUses;
                return (
                  <tr key={code.id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-sm text-primary-400 font-mono font-bold bg-primary-500/10 px-2 py-0.5 rounded">
                          {code.code}
                        </code>
                        <CopyButton text={code.code} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-300 max-w-[200px] truncate">{code.description || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-white">
                        {code.discountType === 'percent' ? `${code.discountValue}%` : `${code.discountValue} ₽`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {code.applicableTariffs.map(t => (
                          <span key={t} className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded',
                            t === 'basic' ? 'bg-slate-500/20 text-slate-400' :
                            t === 'advanced' ? 'bg-blue-500/20 text-blue-400' :
                            t === 'premium' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-amber-500/20 text-amber-400'
                          )}>
                            {TARIFF_LABELS[t]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {code.applicableReleaseTypes.map(t => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-dark-600 text-dark-300">
                            {RELEASE_TYPE_LABELS[t]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <span className={cn('font-medium', isMaxed ? 'text-red-400' : 'text-white')}>
                          {code.currentUses}
                        </span>
                        <span className="text-dark-500"> / {code.maxUses}</span>
                      </div>
                      <div className="w-full h-1 bg-dark-700 rounded-full mt-1 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            isMaxed ? 'bg-red-500' : 'bg-primary-500'
                          )}
                          style={{ width: `${Math.min((code.currentUses / code.maxUses) * 100, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-dark-400">
                      <div>{formatDate(code.validFrom)}</div>
                      <div className={isExpired ? 'text-red-400' : ''}>— {formatDate(code.validUntil)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <button type="button"
                        onClick={() => handleToggle(code.id)}
                        className={cn(
                          'flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border transition-colors',
                          code.isActive
                            ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
                            : 'bg-dark-600 text-dark-400 border-dark-500 hover:text-white'
                        )}
                      >
                        {code.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        {code.isActive ? 'Активен' : 'Выключен'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(code)}
                          className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
                          title="Редактировать"
                        >
                          <Edit3 size={16} />
                        </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(code.id)}
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
          {filtered.map(code => (
            <div key={code.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm text-primary-400 font-mono font-bold bg-primary-500/10 px-2 py-0.5 rounded">
                      {code.code}
                    </code>
                    <CopyButton text={code.code} />
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full border',
                      code.isActive
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-dark-600 text-dark-400 border-dark-500'
                    )}>
                      {code.isActive ? 'Активен' : 'Выключен'}
                    </span>
                  </div>
                  {code.description && (
                    <p className="text-xs text-dark-400">{code.description}</p>
                  )}
                </div>
                <span className="text-sm font-bold text-white">
                  {code.discountType === 'percent' ? `${code.discountValue}%` : `${code.discountValue} ₽`}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-dark-400">
                <span>Использовано: {code.currentUses} / {code.maxUses}</span>
                <span>{formatDate(code.validFrom)} — {formatDate(code.validUntil)}</span>
              </div>

              <div className="flex flex-wrap gap-1">
                {code.applicableTariffs.map(t => (
                  <span key={t} className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded',
                    t === 'basic' ? 'bg-slate-500/20 text-slate-400' :
                    t === 'advanced' ? 'bg-blue-500/20 text-blue-400' :
                    t === 'premium' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-amber-500/20 text-amber-400'
                  )}>
                    {TARIFF_LABELS[t]}
                  </span>
                ))}
                <span className="text-dark-600">|</span>
                {code.applicableReleaseTypes.map(t => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-dark-600 text-dark-300">
                    {RELEASE_TYPE_LABELS[t]}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button type="button"
                  onClick={() => handleToggle(code.id)}
                  className="flex-1 py-2 rounded-lg bg-dark-700 text-dark-300 text-xs font-medium hover:text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  {code.isActive ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                  {code.isActive ? 'Выключить' : 'Включить'}
                </button>
                <button type="button"
                  onClick={() => handleEdit(code)}
                  className="py-2 px-3 rounded-lg bg-primary-600/20 text-primary-400 text-xs hover:bg-primary-600/30 transition-colors"
                >
                  <Edit3 size={14} />
                </button>
                <button type="button"
                  onClick={() => handleDelete(code.id)}
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
            <Ticket size={40} className="mx-auto text-dark-600 mb-3" />
            <p className="text-dark-400 text-sm">Промокоды не найдены</p>
            <button type="button"
              onClick={handleCreate}
              className="mt-3 text-primary-400 text-sm hover:text-primary-300 transition-colors"
            >
              Создать первый промокод
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
