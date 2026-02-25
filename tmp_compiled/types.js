"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TARIFF_PERCENTAGES = exports.KARAOKE_PRICES = exports.PRICES = exports.STATUS_COLORS = exports.STATUS_LABELS = exports.RELEASE_TYPE_LABELS = exports.TARIFF_LABELS = void 0;
exports.TARIFF_LABELS = {
    basic: 'Базовый',
    advanced: 'Продвинутый',
    premium: 'Премиум',
    platinum: 'Платинум',
};
exports.RELEASE_TYPE_LABELS = {
    single: 'Сингл',
    ep: 'EP',
    album: 'Альбом',
};
exports.STATUS_LABELS = {
    new: 'Новый',
    in_progress: 'В работе',
    paid: 'Оплачен',
    signed: 'Подписан',
    released: 'Выпущен',
    rejected: 'Отклонён',
    done: 'Готово',
};
exports.STATUS_COLORS = {
    new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    paid: 'bg-green-500/20 text-green-400 border-green-500/30',
    signed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    released: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    done: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};
exports.PRICES = {
    basic: { single: 500, ep: 700, album: 900 },
    advanced: { single: 690, ep: 890, album: 1200 },
    premium: { single: 1200, ep: 1690, album: 2290 },
    platinum: { single: 4990, ep: 6490, album: 7990 },
};
exports.KARAOKE_PRICES = {
    basic: 350,
    advanced: 195,
    premium: 140,
    platinum: 0,
};
exports.TARIFF_PERCENTAGES = {
    basic: 55,
    advanced: 70,
    premium: 90,
    platinum: 95,
};
