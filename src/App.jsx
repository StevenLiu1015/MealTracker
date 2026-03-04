import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useSheets } from './hooks/useSheets';
import BudgetBar from './components/BudgetBar';
import AddRecord from './components/AddRecord';
import RecordList from './components/RecordList';
import { DEFAULT_DAILY_BUDGET, STORAGE_KEYS } from './config';

export default function App() {
  const { isSignedIn, isLoading: authLoading, error: authError, signIn, signOut } = useAuth();
  const {
    records, isLoadingData, dataError,
    initSheet, addRecord, deleteRecord,
  } = useSheets(isSignedIn);

  const [dailyBudget] = useState(
    () => Number(localStorage.getItem(STORAGE_KEYS.DAILY_BUDGET)) || DEFAULT_DAILY_BUDGET
  );

  useEffect(() => {
    if (isSignedIn) initSheet();
  }, [isSignedIn]);

  if (authLoading) {
    return <Screen><LoadingSpinner text="載入 Google API..." /></Screen>;
  }

  if (!isSignedIn) {
    return (
      <Screen>
        <div style={styles.loginBox}>
          <div style={styles.appIcon}>🍱</div>
          <h1 style={styles.appTitle}>餐費追蹤器</h1>
          <p style={styles.appDesc}>每日 {dailyBudget} 元，吃得精打細算</p>
          {authError && <div style={styles.errorMsg}>{authError}</div>}
          <button style={styles.loginBtn} onClick={signIn}>
            使用 Google 帳號登入
          </button>
          <p style={styles.note}>資料會儲存到你的 Google Sheets</p>
        </div>
      </Screen>
    );
  }

  if (isLoadingData) {
    return <Screen><LoadingSpinner text="同步資料中..." /></Screen>;
  }

  return (
    <Screen>
      <div style={styles.header}>
        <span style={styles.headerTitle}>🍱 餐費追蹤</span>
        <button style={styles.signOutBtn} onClick={signOut}>登出</button>
      </div>
      {dataError && <div style={styles.errorMsg}>{dataError}</div>}
      <BudgetBar records={records} dailyBudget={dailyBudget} />
      <AddRecord onAdd={addRecord} />
      <RecordList records={records} onDelete={deleteRecord} />
    </Screen>
  );
}

function Screen({ children }) {
  return (
    <div style={styles.screen}>
      <div style={styles.content}>{children}</div>
    </div>
  );
}

function LoadingSpinner({ text }) {
  return (
    <div style={styles.loading}>
      <div style={styles.spinner} />
      <div style={styles.loadingText}>{text}</div>
    </div>
  );
}

const styles = {
  screen: { minHeight: '100dvh', background: '#12121f', display: 'flex', justifyContent: 'center' },
  content: { width: '100%', maxWidth: 480, padding: '16px 16px 32px', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '4px 0' },
  headerTitle: { color: '#eee', fontSize: 17, fontWeight: 600 },
  signOutBtn: { background: 'transparent', border: '1px solid #444', borderRadius: 8, color: '#888', padding: '5px 12px', fontSize: 12, cursor: 'pointer' },
  loginBox: { marginTop: '25vh', textAlign: 'center' },
  appIcon: { fontSize: 64, marginBottom: 12 },
  appTitle: { color: '#eee', fontSize: 28, fontWeight: 700, margin: '0 0 8px' },
  appDesc: { color: '#888', fontSize: 14, marginBottom: 32 },
  loginBtn: { display: 'block', width: '100%', padding: '14px', background: '#e94560', border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 12 },
  note: { color: '#555', fontSize: 12 },
  errorMsg: { background: '#3a1a1a', border: '1px solid #7a2a2a', color: '#ff8888', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13 },
  loading: { marginTop: '35vh', textAlign: 'center' },
  spinner: { width: 36, height: 36, border: '3px solid #333', borderTop: '3px solid #e94560', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' },
  loadingText: { color: '#666', fontSize: 14 },
};
