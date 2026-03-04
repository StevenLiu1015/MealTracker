import { useState } from 'react';
import { CATEGORIES } from '../config';
import { getTodayString, parseDate, formatDate } from '../utils/budget';

/**
 * 新增消費紀錄的表單（可收合）
 */
export default function AddRecord({ onAdd, isLoading }) {
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState('');
  const [category, setCategory] = useState(CATEGORIES[1]); // 預設午餐
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [submitting, setSubmitting] = useState(false);

  const adjustDate = (delta) => {
    const d = parseDate(date);
    d.setDate(d.getDate() + delta);
    setDate(formatDate(d));
  };

  const handleSubmit = async () => {
    if (!item.trim() || !amount || Number(amount) <= 0) return;

    setSubmitting(true);
    try {
      await onAdd({ item: item.trim(), category, amount: Number(amount), date });
      // 清空表單
      setItem('');
      setAmount('');
      setDate(getTodayString());
      setOpen(false);
    } catch (err) {
      alert('新增失敗：' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      {!open ? (
        <button style={styles.openBtn} onClick={() => setOpen(true)}>
          ＋ 記錄消費
        </button>
      ) : (
        <div style={styles.form}>
          <div style={styles.formTitle}>新增消費</div>

          {/* 品項 */}
          <label style={styles.label}>品項</label>
          <input
            style={styles.input}
            placeholder="例：雞腿便當"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            autoFocus
          />

          {/* 類別 */}
          <label style={styles.label}>類別</label>
          <div style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                style={{
                  ...styles.catBtn,
                  ...(category === cat ? styles.catBtnActive : {}),
                }}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 金額 */}
          <label style={styles.label}>金額（元）</label>
          <input
            style={styles.input}
            type="number"
            placeholder="0"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />

          {/* 日期 */}
          <label style={styles.label}>日期</label>
          <div style={styles.dateRow}>
            <button style={styles.dateArrow} onClick={() => adjustDate(-1)}>◀</button>
            <input
              style={{ ...styles.input, ...styles.dateInput }}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <button style={styles.dateArrow} onClick={() => adjustDate(1)}>▶</button>
          </div>

          {/* 按鈕 */}
          <div style={styles.btnRow}>
            <button
              style={styles.cancelBtn}
              onClick={() => setOpen(false)}
            >
              取消
            </button>
            <button
              style={{
                ...styles.submitBtn,
                opacity: submitting ? 0.6 : 1,
              }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? '儲存中...' : '確認新增'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    marginBottom: 16,
  },
  openBtn: {
    width: '100%',
    padding: '14px',
    background: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: 1,
  },
  form: {
    background: '#1e1e2e',
    borderRadius: 16,
    padding: '20px',
  },
  formTitle: {
    color: '#eee',
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 16,
  },
  label: {
    display: 'block',
    color: '#888',
    fontSize: 12,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    background: '#2a2a3e',
    border: '1px solid #444',
    borderRadius: 8,
    color: '#eee',
    fontSize: 15,
    boxSizing: 'border-box',
  },
  categoryRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  catBtn: {
    padding: '6px 14px',
    background: '#2a2a3e',
    border: '1px solid #444',
    borderRadius: 99,
    color: '#aaa',
    cursor: 'pointer',
    fontSize: 13,
  },
  catBtnActive: {
    background: '#e94560',
    border: '1px solid #e94560',
    color: '#fff',
  },
  dateRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  dateInput: {
    flex: 1,
    textAlign: 'center',
  },
  dateArrow: {
    padding: '10px 14px',
    background: '#2a2a3e',
    border: '1px solid #444',
    borderRadius: 8,
    color: '#eee',
    cursor: 'pointer',
    fontSize: 14,
  },
  btnRow: {
    display: 'flex',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    padding: '12px',
    background: 'transparent',
    border: '1px solid #444',
    borderRadius: 10,
    color: '#aaa',
    cursor: 'pointer',
    fontSize: 14,
  },
  submitBtn: {
    flex: 2,
    padding: '12px',
    background: '#e94560',
    border: 'none',
    borderRadius: 10,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },
};
