import { useState } from 'react';
import { Input, TextArea, RadioGroup, InfoBox, StepCard, Divider, NumberStepper, DatePicker, Select } from './UI';
import {
  Music2, User, Link2, Disc3, Calendar, Image, Globe, Clock,
  Mic2, PenTool, Hash, Bookmark, TicketPercent, Pill, Type, Banknote,
  AlertCircle, ChevronDown, ChevronUp, Plus, X, Users, ChevronRight
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface StepOneProps {
  data: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

/* ═══ Pricing data ═══ */
const PRICES: Record<string, Record<string, number>> = {
  'Базовый':      { 'Single': 500,  'EP': 700,  'Album': 900  },
  'Продвинутый':  { 'Single': 690,  'EP': 890,  'Album': 1200 },
  'Премиум':      { 'Single': 1200, 'EP': 1690, 'Album': 2290 },
  'Платинум':     { 'Single': 4990, 'EP': 6490, 'Album': 7990 },
};

const KARAOKE_PRICES: Record<string, number> = {
  'Базовый': 350,
  'Продвинутый': 195,
  'Премиум': 140,
  'Платинум': 0,
};

export function getTrackCount(data: Record<string, string>): number {
  const type = data.releaseType;
  if (type === 'Single') return data.singleTrackCount === '2' ? 2 : 1;
  if (type === 'EP') return parseInt(data.epTrackCount || '3', 10);
  if (type === 'Album') return parseInt(data.albumTrackCount || '6', 10);
  return 1;
}

export function calcTotal(data: Record<string, string>): { base: number; karaoke: number; total: number } {
  const tariff = data.tariff;
  const type = data.releaseType;
  if (!tariff || !type || !PRICES[tariff] || !PRICES[tariff][type]) return { base: 0, karaoke: 0, total: 0 };
  const trackCount = getTrackCount(data);
  const albumExtraTracks = type === 'Album' ? Math.max(0, trackCount - 20) : 0;
  const base = PRICES[tariff][type] + (albumExtraTracks * 50);
  const karaokePerTrack = KARAOKE_PRICES[tariff] ?? 0;
  const karaoke = data.karaokeAddition === 'Да' ? karaokePerTrack * trackCount : 0;
  return { base, karaoke, total: base + karaoke };
}

/* ═══ Track data helpers ═══ */
interface TrackArtist {
  name: string;
  type: 'main' | 'comma' | 'feat';
}

interface TrackData {
  name: string;
  version: string;
  artists: TrackArtist[];
  lyricists: string[];
  composers: string[];
  explicitContent: string;
  substanceMention: string;
  lyrics: string;
}

function getDefaultTrack(): TrackData {
  return {
    name: '',
    version: '',
    artists: [{ name: '', type: 'main' }],
    lyricists: [''],
    composers: [''],
    explicitContent: '',
    substanceMention: '',
    lyrics: '',
  };
}

function getTracksData(data: Record<string, string>, count: number): TrackData[] {
  try {
    const parsed = JSON.parse(data._tracks || '[]');
    const arr: TrackData[] = [];
    for (let i = 0; i < count; i++) {
      const existing = parsed[i];
      if (existing) {
        // Ensure artists array has proper structure
        if (!existing.artists || !Array.isArray(existing.artists) || existing.artists.length === 0) {
          existing.artists = [{ name: '', type: 'main' }];
        }
        arr.push(existing);
      } else {
        arr.push(getDefaultTrack());
      }
    }
    return arr;
  } catch {
    return Array.from({ length: count }, () => getDefaultTrack());
  }
}

function setTracksData(onChange: (k: string, v: string) => void, tracks: TrackData[]) {
  onChange('_tracks', JSON.stringify(tracks));
}

export function StepOne({ data, onChange }: StepOneProps) {
  const releaseType = data.releaseType || '';
  const tariff = data.tariff || '';
  const trackCount = getTrackCount(data);
  const isPremiumOrPlatinum = tariff === 'Премиум' || tariff === 'Платинум';

  const tracks = getTracksData(data, trackCount);

  const updateTrack = (index: number, field: keyof TrackData, value: TrackData[keyof TrackData]) => {
    const newTracks = [...tracks];
    newTracks[index] = { ...newTracks[index], [field]: value };
    setTracksData(onChange, newTracks);
  };

  const [expandedTracks, setExpandedTracks] = useState<Record<number, boolean>>({});

  const toggleTrack = (i: number) => {
    setExpandedTracks(prev => ({ ...prev, [i]: !prev[i] }));
  };

  const expandAll = () => {
    const all: Record<number, boolean> = {};
    for (let i = 0; i < trackCount; i++) all[i] = true;
    setExpandedTracks(all);
  };

  const collapseAll = () => {
    setExpandedTracks({});
  };

  const { base } = calcTotal(data);

  const goToHomeTariffs = () => {
    window.location.hash = '';
    window.setTimeout(() => {
      const el = document.getElementById('tariffs-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  // Build display string for track artists
  const getArtistsDisplay = (track: TrackData): string => {
    if (!track.artists || track.artists.length === 0) return '';
    const parts: string[] = [];
    const featParts: string[] = [];
    
    track.artists.forEach(a => {
      if (a.name.trim()) {
        if (a.type === 'feat') {
          featParts.push(a.name.trim());
        } else {
          parts.push(a.name.trim());
        }
      }
    });
    
    let result = parts.join(', ');
    if (featParts.length > 0) {
      result += (result ? ' feat. ' : 'feat. ') + featParts.join(', ');
    }
    return result;
  };

  return (
    <div className="space-y-6">
      {/* ═══ CARD 1: Pricing Overview ═══ */}
      <StepCard
        title="Раздел тарифов"
        subtitle="Выберите подходящий план для вашего релиза"
        icon={<Banknote className="w-5 h-5" />}
      >
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          {/* Базовый */}
          <div className={cn(
            'relative rounded-lg border-2 p-4 transition-all',
            tariff === 'Базовый'
              ? 'border-green-500 bg-green-50 ring-2 ring-green-100 shadow-md'
              : 'border-gray-200 bg-white hover:shadow-sm'
          )}>
            {tariff === 'Базовый' && (
              <div className="absolute top-2 left-2">
                <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full bg-green-500">✓</span>
              </div>
            )}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 text-xl">📦</div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-gray-900">Базовый</h4>
                <p className="text-xs text-gray-600 mt-1">Стандартная дистрибуция</p>
              </div>
            </div>
            <div className="space-y-2 text-xs border-t border-gray-200/50 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-600">• Сингл</span>
                <span className="font-bold text-blue-900">500 ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">• EP (3-5 треков)</span>
                <span className="font-bold text-blue-900">700 ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">• Альбом</span>
                <span className="font-bold text-blue-900">900 ₽</span>
              </div>
            </div>
          </div>

          {/* Продвинутый */}
          <div className={cn(
            'relative rounded-lg border-2 p-4 transition-all',
            tariff === 'Продвинутый'
              ? 'border-green-500 bg-green-50 ring-2 ring-green-100 shadow-md'
              : 'border-gray-200 bg-white hover:shadow-sm'
          )}>
            {tariff === 'Продвинутый' && (
              <div className="absolute top-2 left-2">
                <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full bg-green-500">✓</span>
              </div>
            )}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 text-xl">🚀</div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-gray-900">Продвинутый</h4>
                <p className="text-xs text-gray-600 mt-1">Расширенные возможности</p>
              </div>
            </div>
            <div className="space-y-2 text-xs border-t border-gray-200/50 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-600">• Сингл</span>
                <span className="font-bold text-purple-900">690 ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">• EP (3-5 треков)</span>
                <span className="font-bold text-purple-900">890 ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">• Альбом</span>
                <span className="font-bold text-purple-900">1 200 ₽</span>
              </div>
            </div>
          </div>

          {/* Премиум */}
          <div className={cn(
            'relative rounded-lg border-2 p-4 transition-all',
            tariff === 'Премиум'
              ? 'border-green-500 bg-green-50 ring-2 ring-green-100 shadow-md'
              : 'border-yellow-300 bg-yellow-50 hover:shadow-sm'
          )}>
            {tariff === 'Премиум' && (
              <div className="absolute top-2 left-2">
                <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full bg-green-500">✓</span>
              </div>
            )}
            {tariff !== 'Премиум' && (
              <div className="absolute top-2 right-2">
                <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full bg-purple-600">⭐ Популярный</span>
              </div>
            )}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0 text-xl">⭐</div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-gray-900">Премиум</h4>
                <p className="text-xs text-gray-600 mt-1">Полный пакет услуг</p>
              </div>
            </div>
            <div className="space-y-2 text-xs border-t border-yellow-200/50 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-600">• Сингл</span>
                <span className="font-bold text-purple-900">1 200 ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">• EP (3-5 треков)</span>
                <span className="font-bold text-purple-900">1 690 ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">• Альбом</span>
                <span className="font-bold text-purple-900">2 290 ₽</span>
              </div>
            </div>
          </div>

          {/* Платинум */}
          <div className={cn(
            'relative rounded-lg border-2 p-4 transition-all',
            tariff === 'Платинум'
              ? 'border-green-500 bg-green-50 ring-2 ring-green-100 shadow-md'
              : 'border-amber-300 bg-amber-50 hover:shadow-sm'
          )}>
            {tariff === 'Платинум' && (
              <div className="absolute top-2 left-2">
                <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full bg-green-500">✓</span>
              </div>
            )}
            {tariff !== 'Платинум' && (
              <div className="absolute top-2 right-2">
                <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full bg-amber-600">👑 VIP</span>
              </div>
            )}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 text-xl">👑</div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-gray-900">Платинум</h4>
                <p className="text-xs text-gray-600 mt-1">Максимальные возможности</p>
              </div>
            </div>
            <div className="space-y-2 text-xs border-t border-amber-200/50 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-600">• Сингл</span>
                <span className="font-bold text-amber-900">4 990 ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">• EP (3-5 треков)</span>
                <span className="font-bold text-amber-900">6 490 ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">• Альбом</span>
                <span className="font-bold text-amber-900">7 990 ₽</span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={goToHomeTariffs}
          className="w-full flex items-center justify-between rounded-lg bg-gradient-to-r from-purple-50 to-purple-50/30 border border-purple-200 px-4 py-3 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-900">🎵 Подробнее о тарифах</span>
          </div>
          <ChevronRight className="w-4 h-4 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <p className="mt-2 text-[11px] text-gray-500">
          Для альбомов сверх лимита действует доплата: +50 ₽ за каждый дополнительный трек.
        </p>
      </StepCard>

      {/* ═══ CARD 2: Tariff & Release Type ═══ */}
      <StepCard
        title="Выбор тарифа и типа релиза"
        subtitle="Определите формат вашего выпуска"
        icon={<Disc3 className="w-5 h-5" />}
      >
        <RadioGroup
          label="Какой тариф вы выбрали?" required
          icon={<TicketPercent className="w-4 h-4" />} name="tariff"
          options={[
            { label: 'Базовый', description: 'Стандартная дистрибуция' },
            { label: 'Продвинутый', description: 'Расширенный функционал' },
            { label: 'Премиум', description: 'Полный пакет услуг' },
            { label: 'Платинум', description: 'Максимальные возможности' },
          ]}
          value={tariff} onChange={(v) => onChange('tariff', v)}
        />

        <Divider />

        <RadioGroup
          label="Выберите тип релиза" required
          icon={<Disc3 className="w-4 h-4" />} name="releaseType"
          options={[
            { label: 'Single', description: '1–2 трека' },
            { label: 'EP', description: '3–5 треков' },
            { label: 'Album', description: '6+ треков' },
          ]}
          value={releaseType}
          onChange={(v) => {
            onChange('releaseType', v);
            if (v === 'Single') onChange('singleTrackCount', '1');
            if (v === 'EP') onChange('epTrackCount', '3');
            if (v === 'Album') onChange('albumTrackCount', '6');
          }}
          horizontal
        />

        {releaseType === 'Single' && (
          <div className="animate-in">
            <RadioGroup
              label="Количество треков" required
              icon={<Hash className="w-4 h-4" />} name="singleTrackCount"
              options={[
                { label: '1', description: 'Стандартный сингл' },
                { label: '2', description: 'Максисингл' },
              ]}
              value={data.singleTrackCount || '1'}
              onChange={(v) => onChange('singleTrackCount', v)}
              horizontal
            />
          </div>
        )}

        {releaseType === 'EP' && (
          <div className="animate-in">
            <NumberStepper
              label="Количество треков в EP" required
              icon={<Hash className="w-4 h-4" />}
              hint="EP содержит от 3 до 5 треков"
              value={parseInt(data.epTrackCount || '3', 10)}
              onChange={(v) => onChange('epTrackCount', String(v))}
              min={3} max={5}
            />
          </div>
        )}

        {releaseType === 'Album' && (
          <div className="animate-in">
            <NumberStepper
              label="Количество треков в альбоме" required
              icon={<Hash className="w-4 h-4" />}
              hint="Альбом содержит от 6 треков"
              value={parseInt(data.albumTrackCount || '6', 10)}
              onChange={(v) => onChange('albumTrackCount', String(v))}
              min={6} max={30}
            />
          </div>
        )}

        {tariff && releaseType && (
          <div className="animate-in rounded-xl bg-gradient-to-r from-purple-50 to-purple-100/40 border border-purple-200/60 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Banknote className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-xs text-purple-600 font-medium">Базовая стоимость</p>
                <p className="text-xs text-purple-500">
                  «{tariff}» · {releaseType} · {trackCount} {trackCount === 1 ? 'трек' : trackCount < 5 ? 'трека' : 'треков'}
                </p>
              </div>
            </div>
            <p className="text-xl font-extrabold text-purple-800">{base.toLocaleString('ru-RU')} ₽</p>
          </div>
        )}
      </StepCard>

      {/* ═══ CARD 3: Release Info ═══ */}
      <StepCard
        title="Информация о релизе"
        subtitle="Основные данные о вашем релизе"
        icon={<Music2 className="w-5 h-5" />}
      >
        <Input label="Название релиза" required icon={<Type className="w-4 h-4" />}
          value={data.releaseName || ''} onChange={(e) => onChange('releaseName', e.target.value)}
          placeholder="Введите название релиза" />

        <Input label="Основной артист" required icon={<User className="w-4 h-4" />}
          hint="Укажите одного или нескольких исполнителей через запятую."
          value={data.mainArtist || ''} onChange={(e) => onChange('mainArtist', e.target.value)}
          placeholder="Имя артиста" />

        <TextArea label="Версия релиза" icon={<PenTool className="w-4 h-4" />}
          hint={'Версия, отображаемая во ВКонтакте. Варианты:\n• «prod by …»\n• «remix»\n• «radio edit»\n• «speed up»\n• «slowed»\nЕсли уточнений нет — оставьте пустым.'}
          value={data.releaseVersion || ''} onChange={(e) => onChange('releaseVersion', e.target.value)}
          placeholder="Например: remix, speed up..." className="min-h-[70px]" />

        <Divider label="Файл релиза" />

        <Input label="Ссылка на релиз" required icon={<Link2 className="w-4 h-4" />}
          value={data.releaseLink || ''} onChange={(e) => onChange('releaseLink', e.target.value)}
          placeholder="https://drive.google.com/..." />

        <InfoBox variant="warning">
          <div>
            <p className="font-semibold mb-2">📋 Требования к релизу</p>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <span>Формат <strong>.wav</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <span>Размер не более <strong>1 ГБ</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <span>В конце трека не должно быть тишины длиннее <strong>5 секунд</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <span>Избегайте использования фрагментов чужих песен, защищённых авторскими правами.</span>
              </li>
            </ul>
          </div>
        </InfoBox>

        <Divider label="Детали" />

        <Input label="Жанр" required icon={<Hash className="w-4 h-4" />}
          value={data.genre || ''} onChange={(e) => onChange('genre', e.target.value)}
          placeholder="Hip-Hop, Pop, Rock..." />

        <RadioGroup label="Язык релиза" required icon={<Globe className="w-4 h-4" />}
          name="language" options={['Русский']}
          value={data.language || ''} onChange={(v) => onChange('language', v)}
          withOther otherValue={data.languageOther || ''}
          onOtherChange={(v) => onChange('languageOther', v)} />

        <Divider label="Дата" />

        <DatePicker label="Дата релиза" required icon={<Calendar className="w-4 h-4" />}
          value={data.releaseDate || ''} onChange={(e) => onChange('releaseDate', e.target.value)} />

        <InfoBox variant="info">
          <div>
            <p className="font-semibold mb-1">📅 Сроки подачи на промо</p>
            <ul className="text-xs space-y-1 mt-2">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">20</span>
                <span><strong>Детальное промо</strong> — не менее 20 дней до релиза</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">7</span>
                <span><strong>Еженедельное промо</strong> — не менее 7 дней до релиза</span>
              </li>
            </ul>
          </div>
        </InfoBox>

        <Divider label="Оформление" />

        <Input label="Обложка релиза" required icon={<Image className="w-4 h-4" />}
          hint={'Загрузите обложку в облако (Яндекс Диск / Google Drive) и оставьте ссылку.\n• Разрешение: 3000×3000 px\n• Формат: JPEG'}
          value={data.coverLink || ''} onChange={(e) => onChange('coverLink', e.target.value)}
          placeholder="https://disk.yandex.ru/..." />

      </StepCard>

      {/* ═══ CARD 4: Per-Track Information ═══ */}
      <StepCard
        title={`Треки (${trackCount})`}
        subtitle="Заполните информацию для каждого трека"
        icon={<Mic2 className="w-5 h-5" />}
      >
        {trackCount > 1 && (
          <div className="flex items-center justify-between">
            <InfoBox variant="info">
              <p className="text-xs">
                Ваш релиз содержит <strong>{trackCount} {trackCount < 5 ? 'трека' : 'треков'}</strong>. Заполните карточку для каждого трека.
              </p>
            </InfoBox>
          </div>
        )}

        {trackCount > 2 && (
          <div className="flex items-center gap-2 justify-end">
            <button type="button" onClick={expandAll}
              className="text-xs text-purple-600 hover:text-purple-800 font-medium px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-all flex items-center gap-1">
              <ChevronDown className="w-3 h-3" /> Раскрыть все
            </button>
            <button type="button" onClick={collapseAll}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-1">
              <ChevronUp className="w-3 h-3" /> Свернуть все
            </button>
          </div>
        )}

        <div className="space-y-4">
          {tracks.map((track, i) => {
            const isOpen = trackCount <= 2 || expandedTracks[i] === true;
            const hasData = track.name || track.lyricists.some(l => l) || track.composers.some(c => c);
            const artistsDisplay = getArtistsDisplay(track);

            return (
              <div key={i} className={cn(
                'rounded-xl border-2 transition-all duration-300',
                isOpen ? 'border-purple-300 bg-purple-50/20 shadow-sm' : 'border-gray-200 bg-white hover:border-purple-200'
              )}>
                {/* Track header */}
                <button
                  type="button"
                  onClick={() => trackCount > 2 ? toggleTrack(i) : undefined}
                  className={cn(
                    'w-full flex items-center justify-between px-5 py-4 text-left',
                    trackCount > 2 && 'cursor-pointer group'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all',
                      isOpen
                        ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-md shadow-purple-200'
                        : 'bg-gray-100 text-gray-500 group-hover:bg-purple-100 group-hover:text-purple-600'
                    )}>
                      {i + 1}
                    </div>
                    <div>
                      <p className={cn(
                        'text-sm font-semibold transition-colors',
                        isOpen ? 'text-purple-800' : 'text-gray-700'
                      )}>
                        {track.name || `Трек ${i + 1}`}
                        {track.version && <span className="text-gray-400 font-normal text-xs ml-1">({track.version})</span>}
                        {artistsDisplay && <span className="text-gray-400 font-normal"> — {artistsDisplay}</span>}
                      </p>
                      {!isOpen && hasData && (
                        <p className="text-[10px] text-green-600 font-medium flex items-center gap-1">
                          ✓ Заполнено
                        </p>
                      )}
                      {!isOpen && !hasData && (
                        <p className="text-[10px] text-gray-400">Нажмите, чтобы заполнить</p>
                      )}
                    </div>
                  </div>
                  {trackCount > 2 && (
                    <div className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                      isOpen ? 'bg-purple-200 text-purple-700' : 'bg-gray-100 text-gray-400'
                    )}>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  )}
                </button>

                {/* Track content */}
                {isOpen && (
                  <div className="px-5 pb-5 space-y-5">
                    <div className="h-px bg-purple-200/50" />

                    {/* Track name */}
                    <Input
                      label="Название трека" required icon={<Type className="w-4 h-4" />}
                      value={track.name}
                      onChange={(e) => updateTrack(i, 'name', e.target.value)}
                      placeholder={`Название трека ${i + 1}`}
                    />

                    {/* Track version */}
                    <Input
                      label="Версия трека" icon={<PenTool className="w-4 h-4" />}
                      hint="Например: remix, speed up, slowed, prod by... Если нет — оставьте пустым."
                      value={track.version || ''}
                      onChange={(e) => updateTrack(i, 'version', e.target.value)}
                      placeholder="remix, speed up..."
                    />

                    {/* ═══ Artists Section ═══ */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                          <span className="text-purple-500"><Users className="w-4 h-4" /></span>
                          Исполнители трека
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const newArtists = [...track.artists, { name: '', type: 'comma' as const }];
                            updateTrack(i, 'artists', newArtists);
                          }}
                          className="flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-800 px-2 py-1 rounded-lg hover:bg-purple-50 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" /> Добавить исполнителя
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {track.artists.map((artist, ai) => (
                          <div key={ai} className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0 font-mono">{ai + 1}.</span>
                            
                            {ai > 0 && (
                              <Select
                                value={artist.type}
                                onChange={(value) => {
                                  const newArtists = [...track.artists];
                                  newArtists[ai] = { ...newArtists[ai], type: value as 'main' | 'comma' | 'feat' };
                                  updateTrack(i, 'artists', newArtists);
                                }}
                                options={[
                                  { value: 'comma', label: ', (запятая)' },
                                  { value: 'feat', label: 'feat.' }
                                ]}
                                className="w-28 flex-shrink-0 text-xs py-2.5"
                              />
                            )}
                            
                            <input
                              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-all placeholder:text-gray-400 focus:border-purple-400 focus:outline-none focus:ring-3 focus:ring-purple-100 hover:border-purple-300"
                              value={artist.name}
                              onChange={(e) => {
                                const newArtists = [...track.artists];
                                newArtists[ai] = { ...newArtists[ai], name: e.target.value };
                                updateTrack(i, 'artists', newArtists);
                              }}
                              placeholder={ai === 0 ? 'Основной исполнитель' : 'Имя исполнителя'}
                            />
                            
                            {track.artists.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newArtists = track.artists.filter((_, idx) => idx !== ai);
                                  updateTrack(i, 'artists', newArtists);
                                }}
                                className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all flex-shrink-0"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Preview of how it will look */}
                      {artistsDisplay && (
                        <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                          <p className="text-[10px] text-gray-500 mb-0.5">Отображение:</p>
                          <p className="text-xs font-medium text-gray-800">
                            {track.name || 'Название трека'}
                            {track.version && <span className="text-gray-500"> ({track.version})</span>}
                            {' — '}{artistsDisplay}
                          </p>
                        </div>
                      )}
                    </div>

                    <Divider label="Авторы" />

                    {/* Lyricists */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <span className="text-purple-500"><PenTool className="w-4 h-4" /></span>
                        ФИО Автора(ов) текста
                        <span className="text-red-400 text-xs">*</span>
                      </label>
                      <div className="space-y-2">
                        {track.lyricists.map((l, li) => (
                          <div key={li} className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0 font-mono">{li + 1}.</span>
                            <input
                              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-all placeholder:text-gray-400 focus:border-purple-400 focus:outline-none focus:ring-3 focus:ring-purple-100 hover:border-purple-300"
                              value={l}
                              onChange={(e) => {
                                const newLyricists = [...track.lyricists];
                                newLyricists[li] = e.target.value;
                                updateTrack(i, 'lyricists', newLyricists);
                              }}
                              placeholder="Иванов Иван Иванович"
                            />
                            {track.lyricists.length > 1 && (
                              <button type="button" onClick={() => {
                                const newLyricists = track.lyricists.filter((_, idx) => idx !== li);
                                updateTrack(i, 'lyricists', newLyricists);
                              }}
                                className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all flex-shrink-0">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={() => {
                        updateTrack(i, 'lyricists', [...track.lyricists, '']);
                      }}
                        className="flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-800 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-all">
                        <Plus className="w-3.5 h-3.5" /> Добавить автора
                      </button>
                    </div>

                    {/* Composers */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <span className="text-purple-500"><Music2 className="w-4 h-4" /></span>
                        ФИО Композитора(ов)
                        <span className="text-red-400 text-xs">*</span>
                      </label>
                      <div className="space-y-2">
                        {track.composers.map((c, ci) => (
                          <div key={ci} className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0 font-mono">{ci + 1}.</span>
                            <input
                              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-all placeholder:text-gray-400 focus:border-purple-400 focus:outline-none focus:ring-3 focus:ring-purple-100 hover:border-purple-300"
                              value={c}
                              onChange={(e) => {
                                const newComposers = [...track.composers];
                                newComposers[ci] = e.target.value;
                                updateTrack(i, 'composers', newComposers);
                              }}
                              placeholder="Петров Пётр Петрович"
                            />
                            {track.composers.length > 1 && (
                              <button type="button" onClick={() => {
                                const newComposers = track.composers.filter((_, idx) => idx !== ci);
                                updateTrack(i, 'composers', newComposers);
                              }}
                                className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all flex-shrink-0">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={() => {
                        updateTrack(i, 'composers', [...track.composers, '']);
                      }}
                        className="flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-800 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-all">
                        <Plus className="w-3.5 h-3.5" /> Добавить композитора
                      </button>
                    </div>

                    <Divider label="Контент" />

                    {/* Explicit & Substances */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <RadioGroup
                        label="Ненормативная лексика" required
                        icon={<AlertCircle className="w-4 h-4" />}
                        name={`explicit_${i}`}
                        options={['Да', 'Нет']}
                        value={track.explicitContent}
                        onChange={(v) => updateTrack(i, 'explicitContent', v)}
                        horizontal
                      />
                      <RadioGroup
                        label="Запрещённые вещества" required
                        icon={<Pill className="w-4 h-4" />}
                        name={`substance_${i}`}
                        options={['Да', 'Нет']}
                        value={track.substanceMention}
                        onChange={(v) => updateTrack(i, 'substanceMention', v)}
                        horizontal
                      />
                    </div>

                    {/* Lyrics */}
                    <TextArea
                      label="Текст трека" icon={<PenTool className="w-4 h-4" />}
                      value={track.lyrics}
                      onChange={(e) => updateTrack(i, 'lyrics', e.target.value)}
                      placeholder="Текст трека..."
                      className="min-h-[100px]"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </StepCard>

      {/* ═══ CARD 5: TikTok ═══ */}
      <StepCard
        title="TikTok"
        subtitle="Настройки отображения в TikTok"
        icon={<Clock className="w-5 h-5" />}
      >
        <Input label="Отрывок в TikTok" required icon={<Clock className="w-4 h-4" />}
          hint="С какой секунды начинать отрывок для TikTok? (Пример: 00:03)"
          value={data.tiktokExcerpt || ''} onChange={(e) => onChange('tiktokExcerpt', e.target.value)}
          placeholder="00:03" />

        {isPremiumOrPlatinum && (
          <>
            <Divider />
            <RadioGroup
              label="Полная версия в TikTok"
              name="tiktokFull"
              icon={<Clock className="w-4 h-4" />}
              hint="Разрешить полную версию трека в TikTok?"
              options={['Да', 'Нет']}
              value={data.tiktokFull || data.fullTiktok || ''}
              onChange={(v) => {
                onChange('tiktokFull', v);
                onChange('fullTiktok', v);
              }}
              horizontal
            />
          </>
        )}
      </StepCard>

      {/* ═══ CARD 6: Premium / Platinum Features ═══ */}
      {isPremiumOrPlatinum && (
        <StepCard
          title={`Возможности тарифа «${tariff}»`}
          subtitle="Дополнительные опции вашего тарифа"
          icon={<Bookmark className="w-5 h-5" />}
        >
          <InfoBox variant="success">
            <p className="text-xs">
              🎉 Вам доступны дополнительные возможности тарифа <strong>«{tariff}»</strong>.
            </p>
          </InfoBox>

          <RadioGroup
            label="Pre-Save в Яндекс Музыке"
            name="yandexPreSave"
            icon={<Bookmark className="w-4 h-4" />}
            hint="Разрешить предсохранение на Яндекс Музыке?"
            options={['Да', 'Нет']}
            value={data.yandexPreSave || data.preSaveYandex || ''}
            onChange={(v) => {
              onChange('yandexPreSave', v);
              onChange('preSaveYandex', v);
            }}
            horizontal
          />
        </StepCard>
      )}

      {/* ═══ CARD 7: Karaoke ═══ */}
      <StepCard
        title="Караоке"
        subtitle="Добавление караоке-версии к релизу"
        icon={<Mic2 className="w-5 h-5" />}
      >
        <RadioGroup label="Добавление Караоке" required name="karaokeAddition" icon={<Mic2 className="w-4 h-4" />}
          options={['Да', 'Нет']} value={data.karaokeAddition || ''} onChange={(v) => onChange('karaokeAddition', v)} horizontal />

        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">💰 Стоимость караоке (за каждый трек):</p>
          <div className="grid grid-cols-2 gap-2">
            <div className={cn("rounded-lg bg-white border px-3 py-2 text-xs", tariff === 'Базовый' ? 'border-purple-300 bg-purple-50' : 'border-gray-200')}>
              <span className="text-gray-500">Базовый:</span>{' '}
              <span className="font-bold text-gray-900">350 ₽</span>
            </div>
            <div className={cn("rounded-lg bg-white border px-3 py-2 text-xs", tariff === 'Продвинутый' ? 'border-purple-300 bg-purple-50' : 'border-gray-200')}>
              <span className="text-gray-500">Продвинутый:</span>{' '}
              <span className="font-bold text-gray-900">195 ₽</span>
              <span className="text-green-600 text-[10px] ml-1">−40%</span>
            </div>
            <div className={cn("rounded-lg bg-white border px-3 py-2 text-xs", tariff === 'Премиум' ? 'border-purple-300 bg-purple-50' : 'border-gray-200')}>
              <span className="text-gray-500">Премиум:</span>{' '}
              <span className="font-bold text-gray-900">140 ₽</span>
              <span className="text-green-600 text-[10px] ml-1">−60%</span>
            </div>
            <div className={cn("rounded-lg bg-white border px-3 py-2 text-xs", tariff === 'Платинум' ? 'border-purple-300 bg-purple-50' : 'border-gray-200')}>
              <span className="text-gray-500">Платинум:</span>{' '}
              <span className="font-bold text-emerald-600">Бесплатно</span>
            </div>
          </div>
          {trackCount > 1 && (
            <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
              ℹ️ Для вашего релиза ({trackCount} треков): стоимость × {trackCount}
            </p>
          )}
        </div>

      </StepCard>
    </div>
  );
}
