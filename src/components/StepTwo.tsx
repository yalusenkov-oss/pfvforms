import { Input, InfoBox, StepCard, Divider } from './UI';
import { FileText, User, CreditCard, Mail, Calendar, Shield, MapPin } from 'lucide-react';

interface StepTwoProps {
  data: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export function StepTwo({ data, onChange }: StepTwoProps) {
  return (
    <StepCard
      title="Договор"
      subtitle="Заполните данные для оформления договора"
      icon={<FileText className="w-5 h-5" />}
    >
      <InfoBox variant="purple">
        <div>
          <p className="font-semibold mb-2">📋 Дистрибуция на договорной основе</p>
          <p className="text-xs mb-3">В настоящее время мы запускаем дистрибуцию на договорной основе. Пожалуйста, ознакомьтесь с договором перед заполнением.</p>
          <a
            href="https://disk.yandex.ru/i/pvZXPt4B7t5FIA"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            Открыть договор
          </a>
        </div>
      </InfoBox>

      <Divider label="Личные данные" />

      <Input
        label="ФИО"
        required
        icon={<User className="w-4 h-4" />}
        value={data.fullName || ''}
        onChange={(e) => onChange('fullName', e.target.value)}
        placeholder="Иванов Иван Иванович"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Серия и номер паспорта"
          required
          icon={<Shield className="w-4 h-4" />}
          value={data.passportNumber || ''}
          onChange={(e) => onChange('passportNumber', e.target.value)}
          placeholder="0000 000000"
        />

        <Input
          label="Дата выдачи"
          required
          type="date"
          icon={<Calendar className="w-4 h-4" />}
          value={data.issueDate || ''}
          onChange={(e) => onChange('issueDate', e.target.value)}
        />
      </div>

      <Input
        label="Кем выдан"
        required
        icon={<MapPin className="w-4 h-4" />}
        value={data.issuedBy || ''}
        onChange={(e) => onChange('issuedBy', e.target.value)}
        placeholder="Отделением УФМС России по..."
      />

      <Divider label="Реквизиты" />

      <Input
        label="Банковские реквизиты / номер карты"
        required
        icon={<CreditCard className="w-4 h-4" />}
        value={data.bankDetails || ''}
        onChange={(e) => onChange('bankDetails', e.target.value)}
        placeholder="Номер карты или реквизиты"
      />

      <Input
        label="Электронная почта"
        required
        type="email"
        icon={<Mail className="w-4 h-4" />}
        value={data.email || ''}
        onChange={(e) => onChange('email', e.target.value)}
        placeholder="your@email.com"
      />

      <InfoBox variant="info">
        <p className="text-xs">
          🔒 Все персональные данные защищены и используются исключительно для оформления договора в соответствии с ФЗ-152.
        </p>
      </InfoBox>
    </StepCard>
  );
}
