import { useState, useCallback } from 'react';
import { STORAGE_KEYS } from '../config';
import { generateId } from '../utils/budget';

const SHEET_NAME = 'Records';
const HEADERS = ['id', 'date', 'item', 'category', 'amount'];

/**
 * 管理 Google Sheets 的讀寫操作
 */
export function useSheets(isSignedIn) {
  const [records, setRecords] = useState([]);
  const [sheetId, setSheetId] = useState(
    () => localStorage.getItem(STORAGE_KEYS.SHEET_ID) || null
  );
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState(null);

  // ── 建立新試算表 ──────────────────────────────────────
  const createSpreadsheet = useCallback(async () => {
    const response = await window.gapi.client.sheets.spreadsheets.create({
      properties: { title: '餐費紀錄' },
      sheets: [{
        properties: { title: SHEET_NAME },
        data: [{
          startRow: 0,
          startColumn: 0,
          rowData: [{
            values: HEADERS.map((h) => ({
              userEnteredValue: { stringValue: h },
            })),
          }],
        }],
      }],
    });

    const id = response.result.spreadsheetId;
    localStorage.setItem(STORAGE_KEYS.SHEET_ID, id);
    setSheetId(id);
    return id;
  }, []);

  // ── 載入所有紀錄 ──────────────────────────────────────
  const loadRecords = useCallback(async (sid) => {
    const targetId = sid || sheetId;
    if (!targetId) return;

    setIsLoadingData(true);
    setDataError(null);
    try {
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: targetId,
        range: `${SHEET_NAME}!A2:E`,
      });

      const rows = response.result.values || [];
      const loaded = rows.map(([id, date, item, category, amount]) => ({
        id, date, item, category, amount: Number(amount),
      }));
      setRecords(loaded);
    } catch (err) {
      setDataError('載入資料失敗：' + (err.result?.error?.message || err.message));
    } finally {
      setIsLoadingData(false);
    }
  }, [sheetId]);

  // ── 初始化：確保試算表存在，然後載入資料 ──────────────
  const initSheet = useCallback(async () => {
    setIsLoadingData(true);
    try {
      let sid = sheetId;
      if (!sid) {
        sid = await createSpreadsheet();
      } else {
        // 確認試算表是否還存在
        try {
          await window.gapi.client.sheets.spreadsheets.get({ spreadsheetId: sid });
        } catch {
          // 試算表不存在，重新建立
          sid = await createSpreadsheet();
        }
      }
      await loadRecords(sid);
    } catch (err) {
      setDataError('初始化失敗：' + (err.result?.error?.message || err.message));
    } finally {
      setIsLoadingData(false);
    }
  }, [sheetId, createSpreadsheet, loadRecords]);

  // ── 新增紀錄 ──────────────────────────────────────────
  const addRecord = useCallback(async ({ date, item, category, amount }) => {
    const id = generateId();
    const newRow = [id, date, item, category, String(amount)];

    await window.gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${SHEET_NAME}!A:E`,
      valueInputOption: 'RAW',
      resource: { values: [newRow] },
    });

    // 樂觀更新本地狀態
    setRecords((prev) => [...prev, { id, date, item, category, amount: Number(amount) }]);
    return id;
  }, [sheetId]);

  // ── 刪除紀錄 ──────────────────────────────────────────
  const deleteRecord = useCallback(async (recordId) => {
    // 先找到該列在試算表的位置
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${SHEET_NAME}!A:A`,
    });

    const ids = (response.result.values || []).map((row) => row[0]);
    const rowIndex = ids.indexOf(recordId); // 0-based，但第0行是 header

    if (rowIndex <= 0) throw new Error('找不到該紀錄');

    // 取得 sheet 的 sheetId（數字 ID）
    const spreadsheet = await window.gapi.client.sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });
    const sheet = spreadsheet.result.sheets.find(
      (s) => s.properties.title === SHEET_NAME
    );

    await window.gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheet.properties.sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        }],
      },
    });

    setRecords((prev) => prev.filter((r) => r.id !== recordId));
  }, [sheetId]);

  return {
    records,
    sheetId,
    isLoadingData,
    dataError,
    initSheet,
    loadRecords,
    addRecord,
    deleteRecord,
  };
}
