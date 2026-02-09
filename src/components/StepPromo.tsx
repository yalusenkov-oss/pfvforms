import React from 'react';
import { Music, Send, Calendar, AlertTriangle, Clock, Zap } from 'lucide-react';
import { StepCard, Input, TextArea, InfoBox } from './UI';

interface StepPromoProps {
  data: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export const StepPromo: React.FC<StepPromoProps> = ({ data, onChange }) => {
  const promoType = data.promoType || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Send size={16} />
          <span>Промо релиза</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Отправка информации для промо</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Данная форма предназначена для артистов PFVMUSIC, отправляющих информацию о релизе для продвижения на цифровых площадках.
        </p>
      </div>

      {/* Promo Type Selection */}
      <StepCard
        icon={<Zap size={20} />}
        title="Выберите тип промо"
        subtitle="📌 Выберите подходящий вариант продвижения"
      >
        <div className="space-y-4 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Detailed Promo Card */}
            <div
              onClick={() => onChange('promoType', 'detailed')}
              className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all ${
                promoType === 'detailed'
                  ? 'border-purple-500 bg-purple-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
              }`}
            >
              {promoType === 'detailed' && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  promoType === 'detailed' ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-600'
                }`}>
                  <Calendar size={20} />
                </div>
                <h3 className="font-semibold text-gray-900">Детальное промо</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Отправляется на <span className="font-medium text-purple-700">все ключевые площадки</span> не менее чем за <span className="font-medium text-purple-700">20 дней</span> с момента получения UPC релиза
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-purple-600 font-medium">
                <Clock size={14} />
                <span>Минимум 20 дней до релиза</span>
              </div>
            </div>

            {/* Weekly Promo Card */}
            <div
              onClick={() => onChange('promoType', 'weekly')}
              className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all ${
                promoType === 'weekly'
                  ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
              }`}
            >
              {promoType === 'weekly' && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  promoType === 'weekly' ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  <Zap size={20} />
                </div>
                <h3 className="font-semibold text-gray-900">Еженедельное промо</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Предназначено для <span className="font-medium text-indigo-700">ВК и МТС</span>. Подавать заявку нужно <span className="font-medium text-indigo-700">не позднее понедельника</span>, если релиз выходит в пятницу.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-indigo-600 font-medium">
                <Clock size={14} />
                <span>Не позднее понедельника</span>
              </div>
            </div>
          </div>
        </div>

        <InfoBox variant="warning" icon={<AlertTriangle size={18} />}>
          <div className="space-y-2">
            <p><strong>⚠️ Обратите внимание:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Дата релиза должна приходиться на <strong>пятницу</strong> – это международный день обновления витрин цифровых площадок.</li>
              <li>Пожалуйста, отправляйте только <strong>качественные и приоритетные</strong> релизы.</li>
              <li>Заполняйте форму внимательно, следуя всем требованиям – это увеличит шансы на успешное промо!</li>
            </ul>
          </div>
        </InfoBox>
      </StepCard>

      {/* Detailed Promo Form */}
      {promoType === 'detailed' && (
        <StepCard
          icon={<Calendar size={20} />}
          title="Детальное промо"
          subtitle="Информация направляется на все ключевые площадки не менее чем за 20 дней с момента получения UPC"
        >
          <div className="space-y-5">
            <Input
              label="Ссылка на релиз в формате WAV"
              required
              value={data.promoReleaseLink || ''}
              onChange={(e) => onChange('promoReleaseLink', e.target.value)}
              placeholder="https://drive.google.com/..."
              hint="Файлообменник. Просьба корректно подписывать файлы по названию"
            />

            <Input
              label="UPC релиза / Название релиза и псевдоним"
              required
              value={data.promoUPC || ''}
              onChange={(e) => onChange('promoUPC', e.target.value)}
              placeholder="UPC код или Название — Артист"
              hint="Если UPC-код ещё не получен, укажите название релиза и ваш псевдоним"
            />

            <Input
              label="Дата релиза"
              required
              type="date"
              value={data.promoReleaseDate || ''}
              onChange={(e) => onChange('promoReleaseDate', e.target.value)}
              hint="Обратите внимание, что международный релизный день – пятница"
            />

            <Input
              label="Жанр релиза"
              required
              value={data.promoGenre || ''}
              onChange={(e) => onChange('promoGenre', e.target.value)}
              placeholder="Pop, Hip-Hop, Electronic..."
            />

            <Input
              label="Исполнитель(и) и название релиза"
              required
              value={data.promoArtistTitle || ''}
              onChange={(e) => onChange('promoArtistTitle', e.target.value)}
              placeholder="Артист — Название"
              hint="Точно так, как будет указано на площадках"
            />

            <TextArea
              label="Описание релиза"
              required
              value={data.promoDescription || ''}
              onChange={(e) => onChange('promoDescription', e.target.value)}
              placeholder="Расскажите о чём релиз, его концепция..."
              hint="О чём релиз, его концепция"
              rows={4}
            />

            <TextArea
              label="Информация об артисте"
              required
              value={data.promoArtistInfo || ''}
              onChange={(e) => onChange('promoArtistInfo', e.target.value)}
              placeholder="Краткое описание артиста от третьего лица..."
              hint="Краткое описание от третьего лица"
              rows={4}
            />

            <Input
              label="Фотографии артиста"
              required
              value={data.promoPhotos || ''}
              onChange={(e) => onChange('promoPhotos', e.target.value)}
              placeholder="https://drive.google.com/..."
              hint="Ссылка на файлообменник"
            />

            <Input
              label="Ссылки на соцсети артиста"
              required
              value={data.promoSocials || ''}
              onChange={(e) => onChange('promoSocials', e.target.value)}
              placeholder="VK, Telegram, YouTube..."
              hint="Не запрещённые в РФ"
            />

            <Input
              label="Фокус-трек"
              value={data.promoFocusTrack || ''}
              onChange={(e) => onChange('promoFocusTrack', e.target.value)}
              placeholder="Название трека"
              hint="Если релиз не является синглом"
            />

            <TextArea
              label="Дополнительная информация для редакции"
              required
              value={data.promoExtra || ''}
              onChange={(e) => onChange('promoExtra', e.target.value)}
              placeholder="Планируемая маркетинговая активность, достижения, пресс-релиз..."
              hint="Планируемая маркетинговая активность, достижения и т.д."
              rows={5}
            />
          </div>
        </StepCard>
      )}

      {/* Weekly Promo Form */}
      {promoType === 'weekly' && (
        <StepCard
          icon={<Zap size={20} />}
          title="Еженедельное промо"
          subtitle="Информация направляется на ВК и МТС не позднее понедельника, если релиз выходит в пятницу"
        >
          <InfoBox variant="info" icon={<Clock size={18} />}>
            <p><strong>Когда используется:</strong></p>
            <p className="text-sm mt-1">
              Если у вас не было возможности отправить информацию за 20 дней до релиза в рамках Детального промо, вы можете воспользоваться еженедельным промо.
            </p>
          </InfoBox>

          <div className="space-y-5 mt-6">
            <Input
              label="Ссылка на релиз в формате WAV"
              required
              value={data.promoWeeklyReleaseLink || ''}
              onChange={(e) => onChange('promoWeeklyReleaseLink', e.target.value)}
              placeholder="https://drive.google.com/..."
              hint="Файлообменник. Просьба корректно подписывать файлы по названию"
            />

            <Input
              label="UPC релиза / Название релиза и псевдоним"
              required
              value={data.promoWeeklyUPC || ''}
              onChange={(e) => onChange('promoWeeklyUPC', e.target.value)}
              placeholder="UPC код или Название — Артист"
              hint="Если UPC-код ещё не получен, укажите название релиза и ваш псевдоним"
            />

            <Input
              label="Дата релиза"
              required
              type="date"
              value={data.promoWeeklyReleaseDate || ''}
              onChange={(e) => onChange('promoWeeklyReleaseDate', e.target.value)}
              hint="Обратите внимание, что международный релизный день – пятница"
            />

            <Input
              label="Жанр релиза"
              required
              value={data.promoWeeklyGenre || ''}
              onChange={(e) => onChange('promoWeeklyGenre', e.target.value)}
              placeholder="Pop, Hip-Hop, Electronic..."
            />

            <Input
              label="Фокус-трек"
              value={data.promoWeeklyFocusTrack || ''}
              onChange={(e) => onChange('promoWeeklyFocusTrack', e.target.value)}
              placeholder="Название трека"
              hint="Если релиз не является синглом"
            />

            <TextArea
              label="Дополнительная информация для редакции"
              value={data.promoWeeklyExtra || ''}
              onChange={(e) => onChange('promoWeeklyExtra', e.target.value)}
              placeholder="Планируемая маркетинговая активность, достижения, пресс-релиз..."
              hint="Планируемая маркетинговая активность, достижения и т.д."
              rows={5}
            />
          </div>
        </StepCard>
      )}

      {/* Contacts - always shown at the end */}
      {promoType && (
        <StepCard
          icon={<Music size={20} />}
          title="Контакты для связи"
          subtitle="Оставьте контакт для обратной связи"
        >
          <Input
            label="Контакт для связи"
            required
            value={data.promoContact || ''}
            onChange={(e) => onChange('promoContact', e.target.value)}
            placeholder="@username или ссылка на профиль"
            hint="Telegram или ВКонтакте"
          />
        </StepCard>
      )}
    </div>
  );
};
