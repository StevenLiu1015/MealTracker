/**
 * 取得指定日期所在月份的字串，格式 "YYYY-MM"
 */
export function getMonthString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * 取得今天的日期字串，格式 "YYYY-MM-DD"
 */
export function getTodayString() {
  return formatDate(new Date());
}

/**
 * Date 轉 "YYYY-MM-DD" 字串
 */
export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * "YYYY-MM-DD" 字串轉 Date 物件
 */
export function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * 計算本月預算狀況
 * @param {Array} records - 所有紀錄
 * @param {number} dailyBudget - 每日預算
 * @param {Date} today - 今天（預設當下）
 * @returns {{ totalBudget, totalSpent, remaining, percentage, dayOfMonth }}
 */
export function calcBudget(records, dailyBudget, today = new Date()) {
  const monthStr = getMonthString(today);
  const dayOfMonth = today.getDate();

  // 本月已花費
  const monthRecords = records.filter((r) => r.date.startsWith(monthStr));
  const totalSpent = monthRecords.reduce((sum, r) => sum + Number(r.amount), 0);

  // 本月到今天為止累積的預算
  const totalBudget = dayOfMonth * dailyBudget;

  const remaining = totalBudget - totalSpent;
  const percentage = totalBudget > 0
    ? Math.max(0, Math.min(100, (remaining / totalBudget) * 100))
    : 0;

  return { totalBudget, totalSpent, remaining, percentage, dayOfMonth };
}

/**
 * 將 records 依日期分組，回傳排序後的陣列
 * @returns {Array} [{ date, records, dayTotal }, ...]  最新日期在前
 */
export function groupByDate(records) {
  const map = {};
  for (const r of records) {
    if (!map[r.date]) map[r.date] = [];
    map[r.date].push(r);
  }

  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a)) // 日期降序
    .map(([date, recs]) => ({
      date,
      records: recs.sort((a, b) => b.id.localeCompare(a.id)),
      dayTotal: recs.reduce((sum, r) => sum + Number(r.amount), 0),
    }));
}

/**
 * 產生唯一 ID（時間戳 + 隨機）
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
