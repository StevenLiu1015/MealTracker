import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useSheets } from './hooks/useSheets';
import { DEFAULT_DAILY_BUDGET, STORAGE_KEYS, CATEGORIES } from './config';

const TODAY = new Date();
const DAY_OF_MONTH = TODAY.getDate();

const CATEGORY_ICON = { 早餐: '☀️', 午餐: '🍱', 晚餐: '🌙', 飲料: '🧋', 零食: '🍡' };

function calcBudget(records, dailyBudget) {
  const thisMonth = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, '0')}`;
  const monthSpent = records
    .filter((r) => r.date.startsWith(thisMonth))
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const totalBudget = DAY_OF_MONTH * dailyBudget;
  return { remaining: totalBudget - monthSpent, totalBudget };
}

function groupByDate(records) {
  const groups = {};
  records.forEach((r) => {
    if (!groups[r.date]) groups[r.date] = [];
    groups[r.date].push(r);
  });
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`;
}

function todayStr() {
  return TODAY.toISOString().slice(0, 10);
}

// ── Budget Bar ────────────────────────────────────────────────────
function BudgetBar({ remaining, totalBudget }) {
  const pct = Math.max(0, Math.min(100, (remaining / totalBudget) * 100));
  const isLow = pct < 10;
  const isMid = pct >= 10 && pct < 20;
  const barColor = isLow ? '#ef4444' : isMid ? '#f59e0b' : '#4ade80';
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (!isLow) { setBlink(false); return; }
    const t = setInterval(() => setBlink((b) => !b), 600);
    return () => clearInterval(t);
  }, [isLow]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 2, fontWeight: 600 }}>本月剩餘預算</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: isLow ? '#ef4444' : '#1a1a2e', lineHeight: 1 }}>
            {remaining >= 0 ? `¥${remaining}` : `-¥${Math.abs(remaining)}`}
          </div>
        </div>
        <div style={{ fontSize: 13, color: '#aaa', fontWeight: 600 }}>/ ¥{totalBudget}</div>
      </div>

      <div style={{
        width: '100%', height: 14, background: '#f0ebe0',
        borderRadius: 999, overflow: 'hidden',
        border: '2px solid #1a1a2e',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: barColor,
          borderRadius: 999,
          transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>

      {isLow && (
        <p style={{
          fontSize: 11, color: '#ef4444', fontWeight: 700,
          marginTop: 8, textAlign: 'center',
          opacity: blink ? 1 : 0.3, transition: 'opacity 0.2s',
          letterSpacing: 1,
        }}>
          ⚠️ 預算快用完了！
        </p>
      )}
    </div>
  );
}

// ── Loading ───────────────────────────────────────────────────────
function LoadingScreen({ text = '載入中...' }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#f5f0e6',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <div style={{ fontSize: 40 }}>🍽️</div>
      <p style={{ fontSize: 14, color: '#aaa', fontWeight: 600, letterSpacing: 1 }}>{text}</p>
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────────
function LoginScreen({ onSignIn, error }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#f5f0e6',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
      padding: '0 24px',
    }}>
      <div style={{
        background: '#fff', border: '3px solid #1a1a2e',
        borderRadius: 24, padding: '40px 32px',
        boxShadow: '6px 6px 0 #1a1a2e',
        width: '100%', maxWidth: 360,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
      }}>
        <div style={{ fontSize: 52 }}>🍜</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e' }}>餐費追蹤器</div>
          <div style={{ fontSize: 13, color: '#aaa', marginTop: 4 }}>資料儲存於你的 Google Sheets</div>
        </div>
        {error && (
          <div style={{
            fontSize: 12, color: '#ef4444', background: '#fef2f2',
            border: '2px solid #fca5a5', borderRadius: 12,
            padding: '8px 14px', textAlign: 'center', width: '100%',
          }}>
            {error}
          </div>
        )}
        <button onClick={onSignIn} style={{
          width: '100%', padding: '14px',
          fontSize: 15, fontWeight: 800, cursor: 'pointer',
          color: '#1a1a2e', border: '3px solid #1a1a2e',
          borderRadius: 14, background: '#fbbf24',
          boxShadow: '4px 4px 0 #1a1a2e',
          transition: 'transform 0.1s, box-shadow 0.1s',
        }}
          onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = '2px 2px 0 #1a1a2e'; }}
          onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '4px 4px 0 #1a1a2e'; }}
          onTouchStart={e => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = '2px 2px 0 #1a1a2e'; }}
          onTouchEnd={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '4px 4px 0 #1a1a2e'; }}
        >
          Google 登入
        </button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────
export default function App() {
  const { isSignedIn, isLoading: authLoading, error: authError, signIn, signOut } = useAuth();
  const { records, isLoadingData, dataError, initSheet, addRecord, deleteRecord } = useSheets(isSignedIn);

  const [dailyBudget] = useState(
    () => Number(localStorage.getItem(STORAGE_KEYS.DAILY_BUDGET)) || DEFAULT_DAILY_BUDGET
  );
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ item: '', category: '午餐', amount: '', date: todayStr() });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [listCollapsed, setListCollapsed] = useState(false);
  const [shake, setShake] = useState(false);
  const [damageText, setDamageText] = useState(null);

  useEffect(() => {
    if (isSignedIn) initSheet();
  }, [isSignedIn]);

  const { remaining, totalBudget } = calcBudget(records, dailyBudget);
  const grouped = groupByDate(records);

  async function handleAdd() {
    if (!form.item || !form.amount) return;
    const newRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: form.date,
      item: form.item,
      category: form.category,
      amount: Number(form.amount),
    };
    setShowAdd(false);
    setForm({ item: '', category: '午餐', amount: '', date: todayStr() });
    setDamageText(`-${newRecord.amount}`);
    setShake(true);
    setTimeout(() => setDamageText(null), 1200);
    setTimeout(() => setShake(false), 400);
    await addRecord(newRecord);
  }

  function handleEdit(r) {
    setEditingId(r.id);
    setEditForm({ item: r.item, category: r.category, amount: String(r.amount), date: r.date });
  }

  async function handleEditSave() {
    if (!editForm.item || !editForm.amount) return;
    await deleteRecord(editingId);
    await addRecord({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: editForm.date,
      item: editForm.item,
      category: editForm.category,
      amount: Number(editForm.amount),
    });
    setEditingId(null);
  }

  if (authLoading) return <LoadingScreen text="載入中..." />;
  if (!isSignedIn) return <LoginScreen onSignIn={signIn} error={authError} />;
  if (isLoadingData) return <LoadingScreen text="同步資料中..." />;

  const categoryList = CATEGORIES || ['早餐', '午餐', '晚餐', '飲料', '零食'];

  // shared card style
  const card = {
    background: '#fff',
    border: '3px solid #1a1a2e',
    borderRadius: 20,
    boxShadow: '5px 5px 0 #1a1a2e',
    padding: 20,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0e6', display: 'flex', justifyContent: 'center', padding: '20px 16px 80px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'M PLUS Rounded 1c', 'Noto Sans TC', sans-serif; background: #f5f0e6; }

        @keyframes floatDmg {
          0%   { opacity: 1; transform: translateY(0) scale(1.1); }
          60%  { opacity: 1; transform: translateY(-40px) scale(1.2); }
          100% { opacity: 0; transform: translateY(-65px) scale(0.9); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-5px); }
          40%     { transform: translateX(5px); }
          60%     { transform: translateX(-3px); }
          80%     { transform: translateX(3px); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .rnd-btn {
          font-family: 'M PLUS Rounded 1c', sans-serif;
          cursor: pointer;
          border-radius: 12px;
          border: 2.5px solid #1a1a2e;
          background: transparent;
          font-weight: 700;
          transition: transform 0.08s, box-shadow 0.08s;
        }
        .rnd-btn:active { transform: translate(2px, 2px) !important; box-shadow: 1px 1px 0 #1a1a2e !important; }

        .rnd-input {
          font-family: 'M PLUS Rounded 1c', sans-serif;
          font-size: 15px; font-weight: 500;
          background: #faf8f4; color: #1a1a2e;
          border: 2.5px solid #e2d9cc; border-radius: 12px;
          padding: 11px 14px; width: 100%; outline: none;
          transition: border-color 0.15s;
        }
        .rnd-input:focus { border-color: #1a1a2e; background: #fff; }

        .record-row .action-btn { opacity: 0; transition: opacity 0.15s; }
        .record-row:hover .action-btn { opacity: 1; }
        @media (pointer: coarse) {
          .record-row .action-btn { opacity: 1; }
        }
      `}</style>

      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 4 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e' }}>🍽️ 餐費追蹤</div>
          <button className="rnd-btn" onClick={signOut}
            style={{ padding: '6px 12px', fontSize: 12, color: '#999', borderColor: '#ddd', boxShadow: 'none' }}>
            登出
          </button>
        </div>

        {/* Budget Card */}
        <div style={{
          ...card,
          position: 'relative',
          animation: shake ? 'shake 0.4s ease' : 'none',
        }}>
          {damageText && (
            <div style={{
              position: 'absolute', top: 12, right: 20,
              fontSize: 22, fontWeight: 800, color: '#ef4444',
              animation: 'floatDmg 1.2s ease forwards',
              pointerEvents: 'none', zIndex: 10,
            }}>{damageText}</div>
          )}
          <BudgetBar remaining={remaining} totalBudget={totalBudget} />
        </div>

        {/* Error */}
        {dataError && (
          <div style={{
            fontSize: 13, color: '#ef4444', background: '#fef2f2',
            border: '2px solid #fca5a5', borderRadius: 12,
            padding: '10px 14px',
          }}>{dataError}</div>
        )}

        {/* Add Button */}
        {!showAdd ? (
          <button className="rnd-btn" onClick={() => setShowAdd(true)}
            style={{
              width: '100%', padding: '15px', fontSize: 15,
              color: '#1a1a2e', borderColor: '#1a1a2e',
              background: '#fbbf24', boxShadow: '4px 4px 0 #1a1a2e',
            }}>
            ＋ 新增消費
          </button>
        ) : (
          /* Add Form */
          <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 12, animation: 'slideDown 0.15s ease' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>新增消費紀錄</div>

            <input className="rnd-input" placeholder="品項名稱（例：雞腿飯）"
              value={form.item}
              onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))}
            />

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {categoryList.map((cat) => {
                const active = form.category === cat;
                return (
                  <button key={cat} className="rnd-btn"
                    onClick={() => setForm((f) => ({ ...f, category: cat }))}
                    style={{
                      padding: '7px 12px', fontSize: 13,
                      color: active ? '#fff' : '#666',
                      borderColor: active ? '#1a1a2e' : '#ddd',
                      background: active ? '#1a1a2e' : 'transparent',
                      boxShadow: active ? '2px 2px 0 #666' : 'none',
                    }}>
                    {CATEGORY_ICON[cat] || ''} {cat}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input className="rnd-input" type="number" placeholder="金額"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
              <input className="rnd-input" type="date" value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button className="rnd-btn" onClick={() => setShowAdd(false)}
                style={{ padding: '12px', fontSize: 13, color: '#888', borderColor: '#ddd', boxShadow: '3px 3px 0 #ddd' }}>
                取消
              </button>
              <button className="rnd-btn" onClick={handleAdd}
                style={{ padding: '12px', fontSize: 13, color: '#fff', borderColor: '#1a1a2e', background: '#4ade80', boxShadow: '3px 3px 0 #1a1a2e' }}>
                確認
              </button>
            </div>
          </div>
        )}

        {/* Record List */}
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <button className="rnd-btn" onClick={() => setListCollapsed((v) => !v)}
            style={{
              width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 18px', borderColor: 'transparent', background: '#faf8f4',
              boxShadow: 'none', borderRadius: 0,
              borderBottom: listCollapsed ? 'none' : '2px solid #ede8de',
            }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>📋 消費紀錄</span>
            <span style={{ fontSize: 12, color: '#aaa', fontWeight: 600 }}>
              {listCollapsed ? '▼ 展開' : '▲ 收合'}
            </span>
          </button>

          {!listCollapsed && (
            <>
              {grouped.length === 0 && (
                <div style={{ textAlign: 'center', padding: '36px 0', fontSize: 14, color: '#ccc', fontWeight: 700 }}>
                  還沒有紀錄
                </div>
              )}

              {grouped.map(([date, dayRecords], gi) => {
                const dayTotal = dayRecords.reduce((s, r) => s + Number(r.amount), 0);
                const isToday = date === todayStr();

                return (
                  <div key={date} style={{ borderTop: gi === 0 ? 'none' : '2px solid #ede8de' }}>
                    {/* Date header */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 18px',
                      background: isToday ? '#fef9ee' : '#faf8f4',
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: isToday ? '#f59e0b' : '#888' }}>
                        {isToday && '▶ '}{formatDate(date)}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>-¥{dayTotal}</span>
                    </div>

                    {dayRecords.map((r, ri) => (
                      editingId === r.id ? (
                        /* Edit form */
                        <div key={r.id} style={{
                          padding: '14px 18px', borderTop: '1px solid #f0ebe0',
                          background: '#fffbee', display: 'flex', flexDirection: 'column', gap: 10,
                        }}>
                          <input className="rnd-input" placeholder="品項名稱"
                            value={editForm.item}
                            onChange={(e) => setEditForm((f) => ({ ...f, item: e.target.value }))}
                          />
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {categoryList.map((cat) => {
                              const active = editForm.category === cat;
                              return (
                                <button key={cat} className="rnd-btn"
                                  onClick={() => setEditForm((f) => ({ ...f, category: cat }))}
                                  style={{
                                    padding: '6px 10px', fontSize: 12,
                                    color: active ? '#fff' : '#666',
                                    borderColor: active ? '#1a1a2e' : '#ddd',
                                    background: active ? '#1a1a2e' : 'transparent',
                                    boxShadow: active ? '2px 2px 0 #666' : 'none',
                                  }}>
                                  {CATEGORY_ICON[cat] || ''} {cat}
                                </button>
                              );
                            })}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <input className="rnd-input" type="number" placeholder="金額"
                              value={editForm.amount}
                              onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                            />
                            <input className="rnd-input" type="date" value={editForm.date}
                              onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <button className="rnd-btn" onClick={() => setEditingId(null)}
                              style={{ padding: '10px', fontSize: 13, color: '#888', borderColor: '#ddd', boxShadow: '2px 2px 0 #ddd' }}>
                              取消
                            </button>
                            <button className="rnd-btn" onClick={handleEditSave}
                              style={{ padding: '10px', fontSize: 13, color: '#fff', borderColor: '#1a1a2e', background: '#4ade80', boxShadow: '3px 3px 0 #1a1a2e' }}>
                              儲存
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Normal row */
                        <div key={r.id} className="record-row"
                          style={{
                            display: 'flex', alignItems: 'center',
                            padding: '11px 18px',
                            background: ri % 2 === 0 ? '#fff' : '#fdf9f4',
                            borderTop: '1px solid #f0ebe0', gap: 12,
                          }}>
                          <span style={{ fontSize: 20, flexShrink: 0 }}>{CATEGORY_ICON[r.category] || '🍽'}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 15, fontWeight: 700, color: '#1a1a2e',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>{r.item}</div>
                            <div style={{ fontSize: 11, color: '#bbb', marginTop: 2, fontWeight: 500 }}>{r.category}</div>
                          </div>
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#ef4444', flexShrink: 0 }}>
                            -¥{r.amount}
                          </span>
                          <button className="rnd-btn action-btn" onClick={() => handleEdit(r)}
                            style={{ padding: '5px 9px', fontSize: 13, color: '#888', borderColor: '#ddd', boxShadow: 'none', flexShrink: 0 }}>
                            ✎
                          </button>
                          <button className="rnd-btn action-btn" onClick={() => deleteRecord(r.id)}
                            style={{ padding: '5px 9px', fontSize: 13, color: '#ef4444', borderColor: '#fca5a5', boxShadow: 'none', flexShrink: 0 }}>
                            ×
                          </button>
                        </div>
                      )
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
