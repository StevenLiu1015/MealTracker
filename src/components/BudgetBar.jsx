import { calcBudget } from '../utils/budget';

/**
 * 主視覺血條元件
 */
export default function BudgetBar({ records, dailyBudget }) {
  const { totalBudget, totalSpent, remaining, percentage, dayOfMonth } =
    calcBudget(records, dailyBudget);

  // 根據剩餘比例決定顏色
  const barColor =
    percentage > 50 ? '#4caf50' :
    percentage > 20 ? '#ff9800' : '#f44336';

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>本月餐費預算</h2>

      {/* 血條 */}
      <div style={styles.barBg}>
        <div
          style={{
            ...styles.barFill,
            width: `${percentage}%`,
            backgroundColor: barColor,
            transition: 'width 0.5s ease, background-color 0.5s ease',
          }}
        />
      </div>

      {/* 剩餘金額大字 */}
      <div style={{ ...styles.remaining, color: barColor }}>
        $ {remaining.toLocaleString()}
      </div>
      <div style={styles.subLabel}>剩餘預算</div>

      {/* 詳細數字 */}
      <div style={styles.statsRow}>
        <StatItem label="今天是第" value={`${dayOfMonth} 天`} />
        <StatItem label="本月累積預算" value={`$${totalBudget.toLocaleString()}`} />
        <StatItem label="本月已花" value={`$${totalSpent.toLocaleString()}`} />
      </div>
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div style={styles.statItem}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

const styles = {
  container: {
    background: '#1e1e2e',
    borderRadius: 16,
    padding: '24px 20px',
    marginBottom: 16,
    textAlign: 'center',
  },
  title: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: 400,
    margin: '0 0 16px',
    letterSpacing: 1,
  },
  barBg: {
    background: '#333',
    borderRadius: 99,
    height: 24,
    overflow: 'hidden',
    margin: '0 0 12px',
  },
  barFill: {
    height: '100%',
    borderRadius: 99,
    minWidth: 4,
  },
  remaining: {
    fontSize: 48,
    fontWeight: 700,
    lineHeight: 1.1,
    marginBottom: 4,
  },
  subLabel: {
    color: '#666',
    fontSize: 13,
    marginBottom: 20,
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-around',
    borderTop: '1px solid #333',
    paddingTop: 16,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    color: '#666',
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    color: '#eee',
    fontSize: 15,
    fontWeight: 600,
  },
};
