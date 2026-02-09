import { StepCard } from './UI';
import { ShieldCheck, ExternalLink, FileText, Lock, Users, Database, Target, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StepThreeProps {
  agreed: boolean;
  onAgree: (v: boolean) => void;
}

export function StepThree({ agreed, onAgree }: StepThreeProps) {
  return (
    <StepCard
      title="Публичная оферта и согласие"
      subtitle="Ознакомьтесь с документами и подтвердите согласие"
      icon={<ShieldCheck className="w-5 h-5" />}
    >
      {/* Offer Link */}
      <div className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-purple-50/30 p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-200 flex-shrink-0">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-purple-900 text-base mb-1">Публичная оферта</h3>
            <p className="text-xs text-purple-700/70 mb-3">Ознакомьтесь с полным текстом публичной оферты перед подтверждением.</p>
            <a
              href="https://disk.yandex.ru/i/PaBzY2OUMJ2ncQ"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 transition-colors shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Открыть оферту
            </a>
          </div>
        </div>
      </div>

      {/* Consent document */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-500" />
            Согласие на обработку персональных данных
          </h3>
        </div>
        <div className="p-5 max-h-[400px] overflow-y-auto">
          <div className="text-xs text-gray-700 space-y-4 leading-relaxed">
            <p className="text-gray-600 italic">
              В соответствии с Федеральным законом № 152-ФЗ «О персональных данных» от 27.07.2006 года, я свободно, своей волей и в своем интересе выражаю согласие на обработку моих персональных данных Оператором — Индивидуальный предприниматель Орехов Данила Александрович (ОГРНИП 324710000080681).
            </p>

            {/* Personal Data */}
            <ConsentSection
              icon={<Users className="w-4 h-4" />}
              title="Персональные данные, которые могут быть обработаны"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {[
                  'Имя, фамилия',
                  'Псевдоним артиста/группы',
                  'Название трека',
                  'ФИО авторов текста и музыки',
                  'ФИО исполнителей',
                  'Жанр/поджанр',
                  'Наличие ненормативной лексики',
                  'Текст трека (по желанию)',
                  'Отрывок TikTok',
                  'Желаемая дата релиза',
                  'Промо-план',
                  'Карточка артиста (по желанию)',
                  'UPC / ISRC код (при наличии)',
                  'Паспортные данные',
                  'Банковские реквизиты',
                  'Электронная почта',
                  'Telegram / VK',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-1.5 py-0.5">
                    <span className="w-1 h-1 rounded-full bg-purple-400 flex-shrink-0" />
                    <span className="text-[11px]">{item}</span>
                  </div>
                ))}
              </div>
            </ConsentSection>

            {/* Actions */}
            <ConsentSection
              icon={<Database className="w-4 h-4" />}
              title="Действия оператора"
            >
              <p>Сбор, запись, систематизация, накопление, хранение, уточнение (обновление, изменение), извлечение, использование, блокирование, удаление, уничтожение.</p>
            </ConsentSection>

            {/* Methods */}
            <ConsentSection
              icon={<Lock className="w-4 h-4" />}
              title="Способы обработки"
            >
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                  <span>Передача третьим лицам — только в рамках законодательства РФ и заключённых договоров</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                  <span>Передача осуществляется исключительно в целях исполнения договора при наличии гарантий защиты</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                  <span>С использованием средств автоматизации и без них</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                  <span>Обработка через Google Документы с соблюдением требований законодательства</span>
                </li>
              </ul>
            </ConsentSection>

            {/* Purpose */}
            <ConsentSection
              icon={<Target className="w-4 h-4" />}
              title="Цель обработки"
            >
              <p>Предоставление услуг/работ, включая уведомления, подготовку ответов на запросы, информирование о мероприятиях/товарах/услугах Оператора.</p>
            </ConsentSection>

            {/* Protection */}
            <ConsentSection
              icon={<ShieldCheck className="w-4 h-4" />}
              title="Меры защиты"
            >
              <p>Оператор принимает все необходимые правовые, организационные и технические меры для защиты персональных данных от неправомерного доступа, уничтожения, изменения, блокирования, копирования и распространения.</p>
            </ConsentSection>

            {/* Validity */}
            <ConsentSection
              icon={<Clock className="w-4 h-4" />}
              title="Срок действия"
            >
              <p className="mb-2">Согласие действует до момента его отзыва. После отзыва данные подлежат удалению в установленные сроки, за исключением случаев, когда хранение необходимо для исполнения обязательств.</p>
              <p>
                Отзыв — уведомление на{' '}
                <a href="mailto:booking@pfvmusic.ru" className="text-purple-700 underline font-medium">booking@pfvmusic.ru</a>
              </p>
            </ConsentSection>

            {/* Warning */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">⚠️</span>
              <div>
                <p className="font-semibold text-amber-800 text-xs">Важно!</p>
                <p className="text-amber-700 text-[11px]">Нажимая кнопку «Согласен», я подтверждаю согласие и обязуюсь дождаться полной загрузки формы.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agree Button */}
      <button
        type="button"
        onClick={() => onAgree(!agreed)}
        className={cn(
          'w-full rounded-xl border-2 px-6 py-4 text-sm font-bold transition-all duration-300 flex items-center justify-center gap-3',
          agreed
            ? 'border-emerald-400 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 shadow-md shadow-emerald-100 hover:shadow-lg'
            : 'border-purple-300 bg-white text-purple-700 hover:bg-purple-50 hover:border-purple-400 hover:shadow-md hover:shadow-purple-100'
        )}
      >
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
          agreed ? 'bg-emerald-500' : 'bg-purple-100'
        )}>
          <ShieldCheck className={cn('w-4 h-4', agreed ? 'text-white' : 'text-purple-600')} />
        </div>
        {agreed ? 'Согласие подтверждено ✓' : 'Нажмите, чтобы подтвердить согласие'}
      </button>
    </StepCard>
  );
}

function ConsentSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-gray-50/80 border border-gray-100 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-purple-500">{icon}</span>
        <h4 className="font-semibold text-gray-800 text-[11px] uppercase tracking-wide">{title}</h4>
      </div>
      <div className="text-[11px] text-gray-600 leading-relaxed">
        {children}
      </div>
    </div>
  );
}
