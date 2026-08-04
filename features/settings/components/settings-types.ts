export type SettingsView =
  | 'root'
  | 'saved-items'
  | 'stores'
  | 'categories'
  | 'account';

export type SettingsSubmenu = Exclude<SettingsView, 'root'>;
