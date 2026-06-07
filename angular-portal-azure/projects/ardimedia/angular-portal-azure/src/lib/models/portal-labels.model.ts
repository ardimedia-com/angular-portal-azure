/**
 * Localization labels for the angular-portal-azure library.
 * All labels default to German (de-CH). Override via PortalConfig.labels.
 */
export interface PortalLabels {
  // CRUD status messages
  loading: string;
  saving: string;
  saved: string;
  deleting: string;
  deleted: string;
  loadError: string;
  saveError: string;
  deleteError: string;

  // Command bar buttons
  cmdNew: string;
  cmdSave: string;
  cmdDelete: string;
  cmdCancel: string;

  // Search
  search: string;

  // Blade actions
  close: string;

  // Panorama
  noAppsTitle: string;
  noAppsMessage: string;

  // Notification panel
  closePanel: string;

  // Appearance
  lightMode: string;
  darkMode: string;
  switchToLight: string;
  switchToDark: string;

  // Settings dropdown
  settings: string;
  language: string;
  appearance: string;

  // Unsaved-changes guard
  unsavedChangesConfirm: string;
}

/** Language preset definition for the built-in language registry. */
export interface LanguagePreset {
  code: string;
  displayName: string;
  labels: PortalLabels;
}

// ── Built-in label sets ─────────────────────────────────────────────

/** German (Switzerland / Liechtenstein) — default */
export const LABELS_DE_CH: PortalLabels = {
  loading: 'Laden...',
  saving: 'Speichern...',
  saved: 'Gespeichert',
  deleting: 'Löschen...',
  deleted: 'Gelöscht',
  loadError: 'Fehler beim Laden',
  saveError: 'Fehler beim Speichern',
  deleteError: 'Fehler beim Löschen',
  cmdNew: 'Neu',
  cmdSave: 'Speichern',
  cmdDelete: 'Löschen',
  cmdCancel: 'Abbrechen',
  search: 'Suchen...',
  close: 'Schliessen',
  noAppsTitle: 'Keine Applikationen zugeordnet',
  noAppsMessage: 'Wende dich bitte an den Administrator, damit die Applikationen zugeordnet werden können.',
  closePanel: 'Schliessen',
  lightMode: 'Hellmodus',
  darkMode: 'Dunkelmodus',
  switchToLight: 'Zum Hellmodus wechseln',
  switchToDark: 'Zum Dunkelmodus wechseln',
  settings: 'Einstellungen',
  language: 'Sprache',
  appearance: 'Darstellung',
  unsavedChangesConfirm: 'Die Änderungen wurden noch nicht gespeichert. Trotzdem verlassen?',
};

/** German (Germany) — Swiss spelling rules apply (no ß) */
export const LABELS_DE_DE: PortalLabels = { ...LABELS_DE_CH };

/** English */
export const LABELS_EN: PortalLabels = {
  loading: 'Loading...',
  saving: 'Saving...',
  saved: 'Saved',
  deleting: 'Deleting...',
  deleted: 'Deleted',
  loadError: 'Error loading data',
  saveError: 'Error saving data',
  deleteError: 'Error deleting data',
  cmdNew: 'New',
  cmdSave: 'Save',
  cmdDelete: 'Delete',
  cmdCancel: 'Cancel',
  search: 'Search...',
  close: 'Close',
  noAppsTitle: 'No applications assigned',
  noAppsMessage: 'Please contact the administrator to have applications assigned.',
  closePanel: 'Close',
  lightMode: 'Light mode',
  darkMode: 'Dark mode',
  switchToLight: 'Switch to light mode',
  switchToDark: 'Switch to dark mode',
  settings: 'Settings',
  language: 'Language',
  appearance: 'Appearance',
  unsavedChangesConfirm: 'You have unsaved changes. Leave anyway?',
};

/** French */
export const LABELS_FR: PortalLabels = {
  loading: 'Chargement...',
  saving: 'Enregistrement...',
  saved: 'Enregistré',
  deleting: 'Suppression...',
  deleted: 'Supprimé',
  loadError: 'Erreur lors du chargement',
  saveError: 'Erreur lors de l\'enregistrement',
  deleteError: 'Erreur lors de la suppression',
  cmdNew: 'Nouveau',
  cmdSave: 'Enregistrer',
  cmdDelete: 'Supprimer',
  cmdCancel: 'Annuler',
  search: 'Rechercher...',
  close: 'Fermer',
  noAppsTitle: 'Aucune application attribuée',
  noAppsMessage: 'Veuillez contacter l\'administrateur pour que les applications soient attribuées.',
  closePanel: 'Fermer',
  lightMode: 'Mode clair',
  darkMode: 'Mode sombre',
  switchToLight: 'Passer au mode clair',
  switchToDark: 'Passer au mode sombre',
  settings: 'Paramètres',
  language: 'Langue',
  appearance: 'Apparence',
  unsavedChangesConfirm: 'Les modifications n\'ont pas été enregistrées. Quitter quand même ?',
};

/** Spanish */
export const LABELS_ES: PortalLabels = {
  loading: 'Cargando...',
  saving: 'Guardando...',
  saved: 'Guardado',
  deleting: 'Eliminando...',
  deleted: 'Eliminado',
  loadError: 'Error al cargar',
  saveError: 'Error al guardar',
  deleteError: 'Error al eliminar',
  cmdNew: 'Nuevo',
  cmdSave: 'Guardar',
  cmdDelete: 'Eliminar',
  cmdCancel: 'Cancelar',
  search: 'Buscar...',
  close: 'Cerrar',
  noAppsTitle: 'No hay aplicaciones asignadas',
  noAppsMessage: 'Póngase en contacto con el administrador para que se asignen las aplicaciones.',
  closePanel: 'Cerrar',
  lightMode: 'Modo claro',
  darkMode: 'Modo oscuro',
  switchToLight: 'Cambiar a modo claro',
  switchToDark: 'Cambiar a modo oscuro',
  settings: 'Configuración',
  language: 'Idioma',
  appearance: 'Apariencia',
  unsavedChangesConfirm: 'Hay cambios sin guardar. ¿Salir de todos modos?',
};

/** Italian */
export const LABELS_IT: PortalLabels = {
  loading: 'Caricamento...',
  saving: 'Salvataggio...',
  saved: 'Salvato',
  deleting: 'Eliminazione...',
  deleted: 'Eliminato',
  loadError: 'Errore durante il caricamento',
  saveError: 'Errore durante il salvataggio',
  deleteError: 'Errore durante l\'eliminazione',
  cmdNew: 'Nuovo',
  cmdSave: 'Salva',
  cmdDelete: 'Elimina',
  cmdCancel: 'Annulla',
  search: 'Cerca...',
  close: 'Chiudi',
  noAppsTitle: 'Nessuna applicazione assegnata',
  noAppsMessage: 'Contattare l\'amministratore per l\'assegnazione delle applicazioni.',
  closePanel: 'Chiudi',
  lightMode: 'Modalità chiara',
  darkMode: 'Modalità scura',
  switchToLight: 'Passa alla modalità chiara',
  switchToDark: 'Passa alla modalità scura',
  settings: 'Impostazioni',
  language: 'Lingua',
  appearance: 'Aspetto',
  unsavedChangesConfirm: 'Le modifiche non sono state salvate. Uscire comunque?',
};

// ── Language preset registry ────────────────────────────────────────

/** Keep DEFAULT_LABELS as alias for backward compatibility */
export const DEFAULT_LABELS: PortalLabels = LABELS_DE_CH;

/** Built-in language presets. Consumers can add custom presets via registerLanguagePreset(). */
export const LANGUAGE_PRESETS = new Map<string, LanguagePreset>([
  ['de-CH', { code: 'de-CH', displayName: 'Deutsch (CH)', labels: LABELS_DE_CH }],
  ['de-DE', { code: 'de-DE', displayName: 'Deutsch (DE)', labels: LABELS_DE_DE }],
  ['en',    { code: 'en',    displayName: 'English',       labels: LABELS_EN }],
  ['fr',    { code: 'fr',    displayName: 'Français',      labels: LABELS_FR }],
  ['es',    { code: 'es',    displayName: 'Español',       labels: LABELS_ES }],
  ['it',    { code: 'it',    displayName: 'Italiano',      labels: LABELS_IT }],
]);

/** Register a custom language preset. */
export function registerLanguagePreset(preset: LanguagePreset): void {
  LANGUAGE_PRESETS.set(preset.code, preset);
}
