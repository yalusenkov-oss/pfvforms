import { ArrowLeft, Disc3, FileText, Music2, ExternalLink, ChevronDown, Copy, Check, Send, Download } from 'lucide-react';
import { useState } from 'react';
import { DistributionData, TARIFF_LABELS, RELEASE_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS, PRICES, KARAOKE_PRICES, VIDEOSHOT_PRICE } from '../types';
import { cn } from '../utils/cn';
import { createSignLink } from '../services/googleSheetsAdmin';
import { copyToClipboard } from '../utils/clipboard';

interface DistributionDetailProps {
  data: DistributionData;
  onBack: () => void;
  onStatusChange: (id: string, status: DistributionData['status']) => void;
  onGenerateContract?: (id: string) => void;
  onCreateSignLink?: (id: string) => void;
}

const ALL_STATUSES: DistributionData['status'][] = ['new', 'in_progress', 'paid', 'signed', 'released', 'rejected'];

function InfoRow({ label, value, mono, link }: { label: string; value: string; mono?: boolean; link?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const copiedOk = await copyToClipboard(value);
    if (!copiedOk) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2.5 border-b border-dark-700/50 last:border-0">
      <span className="text-xs text-dark-400 sm:w-44 shrink-0 font-medium">{label}</span>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {link ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className={cn('text-sm text-primary-400 hover:text-primary-300 truncate', mono && 'font-mono')}>
            {value}
          </a>
        ) : (
          <span className={cn('text-sm text-white break-words', mono && 'font-mono')}>{value}</span>
        )}
        <button type="button" onClick={handleCopy} className="p-1 rounded text-dark-500 hover:text-white shrink-0 transition-colors" title="Копировать">
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
        </button>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-dark-800/50 border border-dark-700 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-dark-700 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="px-5 py-2">
        {children}
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

function formatPrice(p: number) {
  return p.toLocaleString('ru-RU') + ' ₽';
}

export function DistributionDetail({ data, onBack, onStatusChange, onGenerateContract, onCreateSignLink }: DistributionDetailProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const tracks = Array.isArray(data.tracks) ? data.tracks : [];
  const trackCount = tracks.length || 1;
  const basePrice = PRICES[data.tariff]?.[data.releaseType] || 0;
  const karaokePerTrack = KARAOKE_PRICES[data.tariff] || 0;
  const karaokeCost = data.karaoke ? karaokePerTrack * trackCount : 0;
  const videoshotCost = data.videoshot ? (data.videoshotPrice ?? VIDEOSHOT_PRICE) : 0;

  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleSendEmail = async () => {
    if (!data.signLink) return;
    setSendingEmail(true);
    setEmailSuccess('');
    setEmailError('');
    try {
      const res = await createSignLink(data.contractNumber, data.rowIndex, {
        forceRegenerate: false,
      });
      if (!res?.success) throw new Error('Не удалось отправить письмо');
      if (res.emailSent === false) throw new Error(res.emailError || 'Сервер не подтвердил отправку письма');
      setEmailSuccess('Письмо успешно отправлено (через GAS)');
      setTimeout(() => setEmailSuccess(''), 3000);
    } catch (err: any) {
      setEmailError('Ошибка: ' + err.message);
      setTimeout(() => setEmailError(''), 4000);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDownload = () => {
    const line = (label: string, value: string | number | boolean | undefined | null) => {
      if (value === undefined || value === null || value === '') return '';
      return `${label}: ${value}`;
    };
    const sep = (title: string) => `\n${'─'.repeat(50)}\n  ${title}\n${'─'.repeat(50)}`;

    const trackLines = tracks.map((t, i) => {
      const artists = Array.isArray(t?.artists) ? t.artists : [];
      const artistStr = artists.map((a, ai) => ai === 0 ? a.name : `${a.separator === 'feat.' ? ' feat. ' : ', '}${a.name}`).join('');
      const composers = Array.isArray(t?.composers) ? t.composers.join(', ') : '';
      const lyricists = Array.isArray(t?.lyricists) ? t.lyricists.join(', ') : '';
      return [
        `  Трек ${i + 1}: ${t.name}${t.version ? ` (${t.version})` : ''}`,
        artistStr ? `    Артисты: ${artistStr}` : '',
        composers ? `    Композиторы: ${composers}` : '',
        lyricists ? `    Авторы текста: ${lyricists}` : '',
        t.explicit ? `    18+: Да` : '',
        t.lyrics ? `    Текст:\n${t.lyrics.split('\n').map(l => `      ${l}`).join('\n')}` : '',
      ].filter(Boolean).join('\n');
    }).join('\n\n');

    const sections = [
      `PFVMUSIC — Данные релиза`,
      `Сформировано: ${new Date().toLocaleString('ru-RU')}`,
      sep('ОСНОВНОЕ'),
      line('ID заявки', data.id),
      line('Номер договора', data.contractNumber),
      line('Статус', STATUS_LABELS[data.status]),
      line('Подано', formatDateTime(data.submittedAt)),
      line('Тариф', TARIFF_LABELS[data.tariff]),
      line('Итого к оплате', formatPrice(data.totalPrice)),
      sep('РЕЛИЗ'),
      line('Название', data.releaseName),
      line('Основной артист', data.mainArtist),
      line('Версия', data.releaseVersion),
      line('Тип релиза', RELEASE_TYPE_LABELS[data.releaseType]),
      line('Жанр', data.genre),
      line('Язык', data.language),
      line('Площадки', data.platforms === 'no-apple' ? 'Без Apple Music' : 'Все площадки'),
      line('Дата релиза', formatDate(data.releaseDate)),
      line('Ссылка на релиз', data.releaseLink),
      line('Обложка', data.coverLink),
      line('TikTok начало', data.tiktokStart),
      line('Полная версия TikTok', data.tiktokFull ? 'Да' : 'Нет'),
      line('Pre-Save Яндекс', data.preSaveYandex ? 'Да' : 'Нет'),
      line('Караоке', data.karaoke ? 'Да' : 'Нет'),
      line('Видеошот', data.videoshot ? 'Да' : 'Нет'),
      ...(data.videoshot && data.videoshotLink ? [line('Ссылка на видеошот', data.videoshotLink)] : []),
      sep('ДАННЫЕ ДОГОВОРА'),
      line('ФИО', data.fullName),
      line('Паспорт', data.passportSeries),
      line('Кем выдан', data.passportIssuedBy),
      line('Дата выдачи', formatDate(data.passportIssuedDate)),
      line('Банковские реквизиты', data.bankDetails),
      line('Email', data.email),
      line('Контакты', data.contacts),
      line('Профили артиста', data.artistProfileLinks),
      line('Статус оплаты', 'Оплата успешна'),
      sep('ПОДПИСАНИЕ'),
      line('Статус подписания', data.signStatus === 'signed' || data.signedUrl ? 'Подписан' : data.signLink ? 'Ссылка создана' : 'Не создано'),
      line('Ссылка на подписание', data.signLink),
      line('Подписан', data.signedAt ? formatDateTime(data.signedAt) : ''),
      line('Подписанный договор', data.signedUrl),
      ...(tracks.length > 0 ? [sep(`ТРЕКИ (${tracks.length})`), trackLines] : []),
    ].filter(Boolean).join('\n');

    const blob = new Blob([sections], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Релиз_${data.contractNumber || data.id}_${data.releaseName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="p-2 rounded-lg bg-dark-800 border border-dark-700 text-dark-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white">{data.releaseName}</h2>
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                data.tariff === 'basic' ? 'bg-slate-500/20 text-slate-400' :
                  data.tariff === 'advanced' ? 'bg-blue-500/20 text-blue-400' :
                    data.tariff === 'premium' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-amber-500/20 text-amber-400'
              )}>
                {TARIFF_LABELS[data.tariff]}
              </span>
            </div>
            <p className="text-sm text-dark-400 mt-0.5">{data.mainArtist} · {data.id} · Подано: {formatDateTime(data.submittedAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            title="Скачать данные релиза"
            className="p-2 rounded-lg bg-dark-800 border border-dark-700 text-dark-400 hover:text-white hover:border-dark-500 transition-colors"
          >
            <Download size={16} />
          </button>
        <div className="relative z-30 inline-block">
          <button
            type="button"
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={cn('text-sm px-3 py-1.5 rounded-lg border flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity', STATUS_COLORS[data.status])}
          >
            {STATUS_LABELS[data.status]}
            <ChevronDown size={14} />
          </button>
          {showStatusMenu && (
            <div className="absolute z-50 top-full mt-2 left-0 w-full min-w-[180px] bg-dark-800 border border-dark-600 rounded-lg shadow-2xl py-1 ring-1 ring-black/30">
              {ALL_STATUSES.map(s => (
                <button
                  type="button"
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
      </div>

      {/* Price summary */}
      <div className="bg-gradient-to-r from-primary-900/30 to-primary-800/20 border border-primary-700/30 rounded-xl p-5">
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-primary-300/70">Тариф + Тип</p>
            <p className="text-lg font-bold text-white">{formatPrice(basePrice)}</p>
          </div>
          {data.karaoke && karaokeCost > 0 && (
            <div>
              <p className="text-xs text-primary-300/70">Караоке ({tracks.length} × {formatPrice(karaokePerTrack)})</p>
              <p className="text-lg font-bold text-white">{formatPrice(karaokeCost)}</p>
            </div>
          )}
          {data.videoshot && videoshotCost > 0 && (
            <div>
              <p className="text-xs text-primary-300/70">Видеошот</p>
              <p className="text-lg font-bold text-white">{formatPrice(videoshotCost)}</p>
            </div>
          )}
          <div className="border-l border-primary-700/50 pl-6">
            <p className="text-xs text-primary-300/70">Итого к оплате</p>
            <p className="text-2xl font-bold text-primary-400">{formatPrice(data.totalPrice)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Release Info */}
        <Section title="Информация о релизе" icon={<Disc3 size={16} className="text-primary-400" />}>
          <InfoRow label="Название" value={data.releaseName} />
          <InfoRow label="Основной артист" value={data.mainArtist} />
          <InfoRow label="Версия" value={data.releaseVersion} />
          <InfoRow label="Тип релиза" value={RELEASE_TYPE_LABELS[data.releaseType]} />
          <InfoRow label="Жанр" value={data.genre} />
          <InfoRow label="Язык" value={data.language} />
          <InfoRow label="Площадки" value={data.platforms === 'no-apple' ? 'Без Apple Music' : 'Все площадки'} />
          <InfoRow label="Дата релиза" value={formatDate(data.releaseDate)} />
          <InfoRow label="Ссылка на релиз" value={data.releaseLink} link />
          <InfoRow label="Обложка" value={data.coverLink} link />
          <InfoRow label="TikTok начало" value={data.tiktokStart} />
          <InfoRow label="Полная версия TikTok" value={data.tiktokFull ? 'Да' : 'Нет'} />
          <InfoRow label="Pre-Save Яндекс" value={data.preSaveYandex ? 'Да' : 'Нет'} />
          <InfoRow label="Караоке" value={data.karaoke ? 'Да' : 'Нет'} />
          <InfoRow label="Видеошот" value={data.videoshot ? 'Да' : 'Нет'} />
          {data.videoshot && data.videoshotLink && (
            <InfoRow label="Ссылка на видеошот" value={data.videoshotLink} link />
          )}
        </Section>

        {/* Contract Info */}
        <Section title="Данные договора" icon={<FileText size={16} className="text-blue-400" />}>
          <InfoRow label="ФИО" value={data.fullName} />
          <InfoRow label="Паспорт" value={data.passportSeries} mono />
          <InfoRow label="Кем выдан" value={data.passportIssuedBy} />
          <InfoRow label="Дата выдачи" value={formatDate(data.passportIssuedDate)} />
          <InfoRow label="Банковские реквизиты" value={data.bankDetails} mono />
          <InfoRow label="Статус оплаты" value="✅ Оплата успешна" />
          <InfoRow label="Email" value={data.email} />
          <InfoRow label="Контакты" value={data.contacts} />
          <InfoRow label="Профили артиста" value={data.artistProfileLinks} link />
        </Section>

        {/* Signing */}
        <Section title="Подписание" icon={<FileText size={16} className="text-emerald-400" />}>
          <InfoRow
            label="Статус"
            value={
              data.signStatus === 'signed' || data.signedUrl ? 'Подписан' :
                data.signLink ? 'Ссылка создана' :
                  'Не создано'
            }
          />
          <InfoRow label="Ссылка на подпись" value={data.signLink || ''} link />
          <InfoRow label="Подписанный договор" value={data.signedUrl || ''} link />
          {onCreateSignLink && (
            <div className="py-2 flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={() => onCreateSignLink(data.id)}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors"
              >
                Создать ссылку на подпись
              </button>
              {data.signLink && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSendEmail}
                    disabled={sendingEmail}
                    className="text-xs px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition-colors disabled:opacity-60 flex items-center gap-1.5"
                  >
                    <Send size={12} />
                    {sendingEmail ? 'Отправка...' : 'Отправить письмо'}
                  </button>
                  {emailSuccess && <span className="text-xs text-purple-400">✓ {emailSuccess}</span>}
                  {emailError && <span className="text-xs text-red-400">{emailError}</span>}
                </div>
              )}
            </div>
          )}
        </Section>
      </div>

      {/* Tracks */}
      <Section title={`Треки (${tracks.length})`} icon={<Music2 size={16} className="text-green-400" />}>
        <div className="space-y-4 py-2">
          {tracks.map((track, idx) => {
            const artists = Array.isArray(track?.artists) ? track.artists : [];
            const lyricists = Array.isArray(track?.lyricists) ? track.lyricists : [];
            const composers = Array.isArray(track?.composers) ? track.composers : [];
            const artistDisplay = artists.map((a, i) => {
              if (i === 0) return a.name;
              return `${a.separator === 'feat.' ? ' feat. ' : ', '}${a.name}`;
            }).join('');

            return (
              <div key={track?.id || `${idx}-${track?.name || 'track'}`} className="bg-dark-700/40 rounded-lg p-4 border border-dark-600/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">
                      {track.name}
                      {track.version && <span className="text-dark-400 ml-1">({track.version})</span>}
                    </p>
                    <p className="text-xs text-dark-400">{artistDisplay}</p>
                  </div>
                  <div className="flex gap-2 ml-auto">
                    {track.explicit && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-medium">18+</span>
                    )}
                    {!track.noSubstances && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 font-medium" title="Не подтверждено отсутствие запрещённых веществ">⚠️ В-ва</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div><span className="text-dark-500">Авторы текста:</span> <span className="text-dark-300">{lyricists.join(', ')}</span></div>
                  <div><span className="text-dark-500">Композиторы:</span> <span className="text-dark-300">{composers.join(', ')}</span></div>
                </div>
                {track.lyrics && (
                  <details className="mt-2">
                    <summary className="text-xs text-primary-400 cursor-pointer hover:text-primary-300">Показать текст</summary>
                    <pre className="mt-2 text-xs text-dark-300 whitespace-pre-wrap bg-dark-800 p-3 rounded">{track.lyrics}</pre>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Contract Generation */}
      <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-700/30 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
              <FileText size={16} className="text-green-400" />
              Генерация договора
            </h3>
            <p className="text-xs text-dark-400">
              {data.contractNumber
                ? `Договор № ${data.contractNumber} создан`
                : 'Создайте лицензионный договор для этого релиза'}
            </p>
          </div>
          {onGenerateContract && (
            <button
              type="button"
              onClick={() => onGenerateContract(data.id)}
              className="px-4 py-2.5 rounded-lg bg-green-600/20 border border-green-500/30 text-green-400 text-sm font-medium hover:bg-green-600/30 transition-colors flex items-center gap-2 shrink-0"
            >
              <FileText size={16} />
              {data.contractNumber ? 'Открыть договор' : 'Создать договор'}
            </button>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <ExternalLink size={16} className="text-primary-400" />
          Быстрые ссылки
        </h3>
        <div className="flex flex-wrap gap-2">
          <a href="https://disk.yandex.ru/i/pvZXPt4B7t5FIA" target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg bg-dark-700 text-dark-300 hover:text-white transition-colors">
            📄 Шаблон договора
          </a>
          <a href="https://disk.yandex.ru/i/PaBzY2OUMJ2ncQ" target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg bg-dark-700 text-dark-300 hover:text-white transition-colors">
            📋 Оферта
          </a>
          <a href="https://clck.ru/3E6yBX" target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg bg-dark-700 text-dark-300 hover:text-white transition-colors">
            💰 Тарифы
          </a>
          {data.releaseLink && (
            <a href={data.releaseLink} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg bg-dark-700 text-dark-300 hover:text-white transition-colors">
              🎵 Файл релиза
            </a>
          )}
          {data.coverLink && (
            <a href={data.coverLink} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg bg-dark-700 text-dark-300 hover:text-white transition-colors">
              🖼️ Обложка
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
