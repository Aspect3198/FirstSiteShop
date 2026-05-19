// =============================================================
// utils/constants.js — App-wide constants & lookup tables
// =============================================================

export const SITE_NAME         = 'WONDERMARKET';
export const ADMIN_SECRET_CODE = 'MARKET2024';

export const CATEGORIES = [
  { id: 'all',         label: 'Всі товари',         icon: '🏪' },
  { id: 'tv',          label: 'Телевізори',          icon: '📺' },
  { id: 'smartphones', label: 'Смартфони',           icon: '📱' },
  { id: 'computers',   label: 'Ноутбуки та ПК',      icon: '💻' },
  { id: 'gaming',      label: 'Ігри та консолі',     icon: '🎮' },
  { id: 'audio',       label: 'Аудіо',               icon: '🎧' },
  { id: 'appliances',  label: 'Побутова техніка',    icon: '🏠' },
  { id: 'clothing',    label: 'Одяг та взуття',      icon: '👟' },
  { id: 'sports',      label: 'Спорт',               icon: '💪' },
  { id: 'food',        label: 'Їжа та напої',        icon: '🥗' },
  { id: 'beauty',      label: "Краса та здоров'я",   icon: '💄' },
];

export const CAT_LABELS = {
  tv:          'Телевізори',
  smartphones: 'Смартфони',
  computers:   'ПК/Ноутбуки',
  gaming:      'Ігри',
  audio:       'Аудіо',
  appliances:  'Техніка',
  clothing:    'Одяг',
  sports:      'Спорт',
  food:        'Їжа',
  beauty:      'Краса',
};

export const ORDER_STATUS_MAP = {
  pending:    { label: 'Очікує',      cls: 'status-pending'    },
  processing: { label: 'Обробка',     cls: 'status-processing' },
  shipped:    { label: 'Відправлено', cls: 'status-shipped'    },
  delivered:  { label: 'Доставлено',  cls: 'status-delivered'  },
  cancelled:  { label: 'Скасовано',   cls: 'status-cancelled'  },
};