import { useState } from 'react';
import { groupByDate } from '../utils/budget';

const CATEGORY_EMOJI = {
  早餐: '🌅',
  午餐: '☀️',
  晚餐: '🌙',
  飲料: '🧋',
  零食: '🍿',
};

/**
 * 依日期分組顯示消費紀錄
 */
export default function RecordList({ records, onDelete }) {
  const [expanded, setExpanded] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const grouped = groupByDate(records);

  const handleDelete = async (id) => {
    if (!confirm('確定要刪除這筆紀錄？')) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (err) {
      alert('刪除失敗：' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={styles.container}>
      {/* 收合標題 */}
      <button
        style={styles.toggleBtn}
        onClick={() => setExpanded((v) => !v)}
      >
        <span>消費紀錄</span>
        <span style={styles.badge}>{records.length} 筆</span>
        <span style={styles.arrow}>{expanded ? '▲' : '▼'}</span>
      </button>

      {/* 紀錄列表 */}
      {expanded && (
        <div>
          {grouped.length === 0 ? (
            <div style={styles.empty}>本月還沒有紀錄</div>
          ) : (
            grouped.map(({ date, records: dayRecords, dayTotal }) => (
              <DayGroup
                key={date}
                date={date}
                records={dayRecords}
                dayTotal={dayTotal}
                onDelete={handleDelete}
                deletingId={deletingId}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function DayGroup({ date, records, dayTotal, onDelete, deletingId }) {
  const [open, setOpen] = useState(true);

  // 把 "2025-03-04" 轉成比較好讀的格式
  const [y, m, d] = date.split('-');
  const dateLabel = `${m}/${d}`;
  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
  const dayName = dayNames[new Date(Number(y), Number(m) - 1, Number(d)).getDay()];

  return (
    <div style={styles.dayGroup}>
      {/* 日期標題列 */}
      <div style={styles.dayHeader} onClick={() => setOpen((v) => !v)}>
        <div style={styles.dayLabel}>
          <span style={styles.dayDate}>{dateLabel}</span>
          <span style={styles.dayName}>（{dayName}）</span>
        </div>
        <div style={styles.dayTotal}>
          共 <strong>${dayTotal.toLocaleString()}</strong>
          <span style={styles.smallArrow}>{open ? ' ▲' : ' ▼'}</span>
        </div>
      </div>

      {/* 當日紀錄 */}
      {open && records.map((record) => (
        <RecordItem
          key={record.id}
          record={record}
          onDelete={onDelete}
          isDeleting={deletingId === record.id}
        />
      ))}
    </div>
  );
}

function RecordItem({ record, onDelete, isDeleting }) {
  return (
    <div style={{ ...styles.recordRow, opacity: isDeleting ? 0.4 : 1 }}>
      <span style={styles.emoji}>
        {CATEGORY_EMOJI[record.category] || '🍽️'}
      </span>
      <div style={styles.recordInfo}>
        <div style={styles.recordItem}>{record.item}</div>
        <div style={styles.recordCat}>{record.category}</div>
      </div>
      <div style={styles.recordAmount}>
        ${Number(record.amount).toLocaleString()}
      </div>
      <button
        style={styles.deleteBtn}
        onClick={() => onDelete(record.id)}
        disabled={isDeleting}
        title="刪除"
      >
        ✕
      </button>
    </div>
  );
}

const styles = {
  container: {
    background: '#1e1e2e',
    borderRadius: 16,
    overflow: 'hidden',
  },
  toggleBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '16px 20px',
    background: 'transparent',
    border: 'none',
    color: '#eee',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left',
  },
  badge: {
    background: '#333',
    color: '#aaa',
    borderRadius: 99,
    padding: '2px 8px',
    fontSize: 12,
  },
  arrow: {
    marginLeft: 'auto',
    color: '#666',
    fontSize: 12,
  },
  empty: {
    color: '#555',
    textAlign: 'center',
    padding: '30px 20px',
    fontSize: 14,
  },
  dayGroup: {
    borderTop: '1px solid #2a2a3e',
  },
  dayHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    cursor: 'pointer',
    background: '#252535',
  },
  dayLabel: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 4,
  },
  dayDate: {
    color: '#ccc',
    fontSize: 15,
    fontWeight: 600,
  },
  dayName: {
    color: '#666',
    fontSize: 12,
  },
  dayTotal: {
    color: '#aaa',
    fontSize: 13,
  },
  smallArrow: {
    color: '#555',
    fontSize: 11,
  },
  recordRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 20px',
    borderTop: '1px solid #252535',
    transition: 'opacity 0.2s',
  },
  emoji: {
    fontSize: 20,
    minWidth: 28,
    textAlign: 'center',
  },
  recordInfo: {
    flex: 1,
    minWidth: 0,
  },
  recordItem: {
    color: '#ddd',
    fontSize: 14,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  recordCat: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  recordAmount: {
    color: '#eee',
    fontSize: 15,
    fontWeight: 600,
    flexShrink: 0,
  },
  deleteBtn: {
    background: 'transparent',
    border: 'none',
    color: '#555',
    cursor: 'pointer',
    fontSize: 14,
    padding: '4px 6px',
    borderRadius: 6,
    flexShrink: 0,
  },
};
