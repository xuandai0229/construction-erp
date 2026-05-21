/**
 * ENTERPRISE Z-INDEX ARCHITECTURE
 * 
 * Standardized layering system for Construction ERP
 * All overlay components must use these constants
 * DO NOT hardcode z-index values
 */

export const Z_INDEX = {
  // Layer 100: Content & Static Elements
  CONTENT: 100,
  STICKY_TABLE_HEADER: 110,
  
  // Layer 200: Sticky & Persistent UI
  STICKY_NAVIGATION: 200,
  FIXED_SEARCH: 210,
  
  // Layer 300: Dropdowns & Select Menus
  DROPDOWN: 300,
  STATUS_FILTER: 310,
  COMMAND_DROPDOWN: 320,
  
  // Layer 400: Popovers & Tooltips
  POPOVER: 400,
  TOOLTIP: 410,
  CONTEXT_MENU: 420,
  
  // Layer 500: Action Menus
  ACTION_MENU: 500,
  BULK_ACTIONS: 510,
  
  // Layer 600: Date Pickers & Calendars
  DATE_PICKER: 600,
  TIME_PICKER: 610,
  
  // Layer 700: Drawers & Sidebars
  DRAWER: 700,
  SLIDE_PANEL: 710,
  
  // Layer 800: Modals & Dialogs
  MODAL: 800,
  CONFIRMATION_DIALOG: 810,
  LOADING_OVERLAY: 820,
  
  // Layer 900: Toasts & Notifications
  TOAST: 900,
  NOTIFICATION: 910,
  SNACKBAR: 920,
  
  // Layer 1000: System Alerts
  SYSTEM_ALERT: 1000,
  SYSTEM_ERROR: 1010,
  SYSTEM_WARNING: 1020,
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;

/**
 * Get z-index value by key
 * @param key - Key from Z_INDEX object
 * @returns z-index value
 */
export function getZIndex(key: ZIndexKey): number {
  return Z_INDEX[key];
}

/**
 * Shadow elevation levels matching z-index layers
 */
export const ELEVATION_SHADOWS = {
  DROPDOWN: '0 10px 28px rgba(15, 23, 42, 0.12)',
  POPOVER: '0 12px 32px rgba(15, 23, 42, 0.15)',
  MODAL: '0 20px 48px rgba(15, 23, 42, 0.20)',
  TOAST: '0 8px 20px rgba(15, 23, 42, 0.10)',
} as const;
