// ====================================================
// 在這裡填入你的 Google Cloud Console 設定
// ====================================================

export const GOOGLE_CONFIG = {
  // Google Cloud Console → 憑證 → OAuth 2.0 用戶端 ID
  CLIENT_ID: '959248905540-ad4f3gmq4eb33sgvi43vi40q0upkhqta.apps.googleusercontent.com',

  // 需要的 API 權限
  SCOPES: 'https://www.googleapis.com/auth/spreadsheets',

  // Google Sheets API 探索文件
  DISCOVERY_DOC: 'https://sheets.googleapis.com/$discovery/rest?version=v4',
};

// ====================================================
// 應用程式設定（可以之後在 UI 裡調整）
// ====================================================

export const DEFAULT_DAILY_BUDGET = 300;

export const CATEGORIES = ['早餐', '午餐', '晚餐', '飲料', '零食'];

// localStorage key 名稱
export const STORAGE_KEYS = {
  SHEET_ID: 'meal_tracker_sheet_id',
  DAILY_BUDGET: 'meal_tracker_daily_budget',
};
