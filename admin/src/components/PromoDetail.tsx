import { useState } from 'react';
import { ArrowLeft, Megaphone, ChevronDown, Copy, Check, ExternalLink } from 'lucide-react';
import { PromoData, DetailedPromoData, WeeklyPromoData, STATUS_LABELS, STATUS_COLORS } from '../types';
import { cn } from '../utils/cn';

interface PromoDetailProps {
  data: PromoData;
  onBack: () => void;
  onStatusChange: (id: string, status: PromoData['status']) => void;
}

const ALL_STATUSES: PromoData['status'][] = ['new', 'in_progress', 'done', 'rejected'];

function InfoRow({ label, value, link }: { label: string; value: string; link?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2.5 border-b border-dark-700/50 last:border-0">
      <span className="text-xs text-dark-400 sm:w-48 shrink-0 font-medium">{label}</span>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {link ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-400 hover:text-primary-300 truncate">
            {value}
          </a>
        ) : (
          <span className="text-sm text-white break-words">{value}</span>
        )}
        <button onClick={handleCopy} className="p-1 rounded text-dark-500 hover:text-white shrink-0 transition-colors" title="Копировать">
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
        </button>
      </div>
    </div>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function PromoDetail({ data, onBack, onStatusChange }: PromoDetailProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const isDetailed = data.type === 'detailed';
  const detailed = data as DetailedPromoData;
  const weekly = data as WeeklyPromoData;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg bg-dark-800 border border-dark-700 text-dark-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white">
                {isDetailed ? detailed.artistAndTitle || detailed.upc : weekly.upc}
              </h2>
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                isDetailed ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
              )}>
                {isDetailed ? 'Детальное промо' : 'Еженедельное промо'}
              </span>
            </div>
            <p className="text-sm text-dark-400 mt-0.5">{data.id} · Подано: {formatDateTime(data.submittedAt)}</p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={cn('text-sm px-3 py-1.5 rounded-lg border flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity', STATUS_COLORS[data.status])}
          >
            {STATUS_LABELS[data.status]}
            <ChevronDown size={14} />
          </button>
          {showStatusMenu && (
            <div className="absolute z-20 top-full mt-1 right-0 bg-dark-800 border border-dark-600 rounded-lg shadow-xl py-1 min-w-[160px]">
              {ALL_STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => {
                    onStatusChange(data.id, s);
                    setShowStatusMenu(false);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm hover:bg-dark-700 transition-colors',
                    data.status === s ? 'text-primary-400 font-medium' : 'text-dark-300'
                  )}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Block */}
      <div className={cn(
        'border rounded-xl p-4',
        isDetailed
          ? 'bg-purple-500/5 border-purple-500/20'
          : 'bg-blue-500/5 border-blue-500/20'
      )}>
        <p className="text-xs text-dark-400">
          {isDetailed
            ? '📋 Детальное промо — все ключевые площадки, минимум 20 дней до релиза'
            : '📋 Еженедельное промо — VK и МТС, до понедельника (релиз в пятницу)'
          }
        </p>
      </div>

      {/* Data */}
      <div className="bg-dark-800/50 border border-dark-700 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-dark-700 flex items-center gap-2">
          <Megaphone size={16} className="text-primary-400" />
          <h3 className="text-sm font-semibold text-white">Данные заявки</h3>
        </div>
        <div className="px-5 py-2">
          <InfoRow label="Ссылка на релиз (WAV)" value={data.trackLink} link />
          <InfoRow label="UPC / Название и псевдоним" value={data.upc} />
          <InfoRow label="Дата релиза" value={formatDate(data.releaseDate)} />
          <InfoRow label="Жанр" value={data.genre} />

          {isDetailed && (
            <>
              <InfoRow label="Исполнитель и название" value={detailed.artistAndTitle} />
              <InfoRow label="Описание релиза" value={detailed.releaseDescription} />
              <InfoRow label="Информация об артисте" value={detailed.artistInfo} />
              <InfoRow label="Фотографии артиста" value={detailed.artistPhotos} link />
              <InfoRow label="Ссылки на соцсети" value={detailed.socialLinks} />
              <InfoRow label="Фокус-трек" value={detailed.focusTrack} />
              <InfoRow label="Доп. информация" value={detailed.additionalInfo} />
            </>
          )}

          {!isDetailed && (
            <>
              <InfoRow label="Фокус-трек" value={weekly.focusTrack} />
              <InfoRow label="Доп. информация" value={weekly.additionalInfo} />
            </>
          )}

          <InfoRow label="Контакты" value={data.contacts} />
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <ExternalLink size={16} className="text-primary-400" />
          Быстрые ссылки
        </h3>
        <div className="flex flex-wrap gap-2">
          {data.trackLink && (
            <a href={data.trackLink} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg bg-dark-700 text-dark-300 hover:text-white transition-colors">
              🎵 Файл релиза
            </a>
          )}
          {isDetailed && detailed.artistPhotos && (
            <a href={detailed.artistPhotos} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg bg-dark-700 text-dark-300 hover:text-white transition-colors">
              📸 Фото артиста
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
