/**
 * Registry centralisé de toutes les icônes utilisées dans l'app
 * Utilise des emojis Unicode natifs (0 KB de bundle)
 */

// ===== NAVIGATION =====
export const NavigationIcons = {
  dashboard: "\u{1F3E0}",
  calendar: "\u{1F4C5}",
  messages: "\u{1F4AC}",
  fmpa: "\u{1F525}",
  personnel: "\u{1F465}",
  formations: "\u{1F393}",
  settings: "\u2699\uFE0F",
  notifications: "\u{1F514}",
  documents: "\u{1F4C1}",
  tta: "\u{1F4B0}",
} as const;

// ===== TYPES FMPA =====
export const FMPAIcons = {
  formation: "\u{1F393}",
  manoeuvre: "\u{1F525}",
  presence: "\u{1F692}",
  all: "\u{1F4C2}",
} as const;

// ===== STATUTS PARTICIPATION =====
export const StatusIcons = {
  registered: "\u2705",
  present: "\u2714\uFE0F",
  absent: "\u274C",
  excused: "\u{1F4C5}",
  waiting: "\u23F3",
} as const;

// ===== ACTIONS =====
export const ActionIcons = {
  add: "\u2795",
  edit: "\u{1F4DD}",
  delete: "\u{1F5D1}\uFE0F",
  save: "\u{1F4BE}",
  cancel: "\u274C",
  search: "\u{1F50D}",
  filter: "\u{1F3AF}",
  download: "\u2B07\uFE0F",
  upload: "\u2B06\uFE0F",
  print: "\u{1F5A8}\uFE0F",
  share: "\u{1F517}",
  copy: "\u{1F4CB}",
  refresh: "\u{1F504}",
  more: "\u2026",
  file: "\u{1F4C1}",
  send: "\u{1F680}",
  settings: "\u2699\uFE0F",
  reply: "\u21A9\uFE0F",
  forward: "\u21AA\uFE0F",
  check: "\u2714\uFE0F",
} as const;

// ===== INFORMATIONS =====
export const InfoIcons = {
  date: "\u{1F4C5}",
  time: "\u23F0",
  location: "\u{1F4CD}",
  users: "\u{1F465}",
  user: "\u{1F464}",
  phone: "\u{1F4DE}",
  email: "\u{1F4E7}",
  info: "\u2139\uFE0F",
  warning: "\u26A0\uFE0F",
  success: "\u2705",
  error: "\u274C",
} as const;

// ===== POMPIERS SPÉCIFIQUES =====
export const PompierIcons = {
  camion: "\u{1F692}",
  ambulance: "\u{1F691}",
  casque: "\u26D1\uFE0F",
  extincteur: "\u{1F9EF}",
  feu: "\u{1F525}",
  eau: "\u{1F4A7}",
  secours: "\u{1F198}",
  alerte: "\u23F0",
  urgence: "\u26A0\uFE0F",
  caserne: "\u{1F3E2}",
  pompier: "\u{1F468}\u200D\u{1F692}",
  medecin: "\u{1F469}\u200D\u2695\uFE0F",
} as const;

// ===== MODULES =====
export const ModuleIcons = {
  fmpa: "\u{1F525}",
  messages: "\u{1F4AC}",
  agenda: "\u{1F4C5}",
  personnel: "\u{1F465}",
  formations: "\u{1F393}",
  materiel: "\u{1F4E6}",
  documents: "\u{1F4C1}",
  statistiques: "\u{1F4CA}",
} as const;

// ===== UI ELEMENTS =====
export const UIIcons = {
  chevronDown: "\u{1F53D}",
  chevronUp: "\u{1F53C}",
  chevronLeft: "\u25C0\uFE0F",
  chevronRight: "\u25B6\uFE0F",
  arrowLeft: "\u2B05\uFE0F",
  arrowRight: "\u27A1\uFE0F",
  eye: "\u{1F441}\uFE0F",
  eyeOff: "\u{1F648}",
  logout: "\u{1F6AA}",
  menu: "\u2630",
  close: "\u274C",
  expand: "\u{1F50D}",
  collapse: "\u{1F50D}",
} as const;

// ===== EXPORT GROUPÉ =====
export const Icons = {
  nav: NavigationIcons,
  fmpa: FMPAIcons,
  status: StatusIcons,
  action: ActionIcons,
  info: InfoIcons,
  pompier: PompierIcons,
  module: ModuleIcons,
  ui: UIIcons,
} as const;

// Type helper pour autocomplétion
export type IconName =
  | (typeof NavigationIcons)[keyof typeof NavigationIcons]
  | (typeof FMPAIcons)[keyof typeof FMPAIcons]
  | (typeof StatusIcons)[keyof typeof StatusIcons]
  | (typeof ActionIcons)[keyof typeof ActionIcons]
  | (typeof InfoIcons)[keyof typeof InfoIcons]
  | (typeof PompierIcons)[keyof typeof PompierIcons]
  | (typeof ModuleIcons)[keyof typeof ModuleIcons]
  | (typeof UIIcons)[keyof typeof UIIcons];
