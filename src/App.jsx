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
  const d = new Date(dateStr);
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`;
}

function todayStr() {
  return TODAY.toISOString().slice(0, 10);
}

// ── HP Bar ────────────────────────────────────────────────────────
function HpBar({ remaining, totalBudget }) {
  const pct = Math.max(0, Math.min(100, (remaining / totalBudget) * 100));
  const isLow = pct < 25;
  const isMid = pct >= 25 && pct < 50;
  const barColor = isLow ? '#ef4444' : isMid ? '#f59e0b' : '#22c55e';
  const trackColor = isLow ? '#fef2f2' : isMid ? '#fffbeb' : '#f0fdf4';
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (!isLow) { setBlink(false); return; }
    const t = setInterval(() => setBlink((b) => !b), 500);
    return () => clearInterval(t);
  }, [isLow]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{
          fontFamily: "'Press Start 2P'", fontSize: 22, color: barColor, letterSpacing: -1,
        }}>
          ¥{remaining >= 0 ? remaining : 0}
        </span>
        <span style={{ fontFamily: "'Press Start 2P'", fontSize: 9, color: '#9ca3af' }}>
          / {totalBudget}
        </span>
      </div>

      <div style={{
        width: '100%', height: 18, background: trackColor,
        border: '2px solid', borderColor: isLow ? '#fca5a5' : isMid ? '#fcd34d' : '#86efac',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: barColor,
          transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)', position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: 2, left: 4, right: 4, height: 3, background: 'rgba(255,255,255,0.45)' }} />
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} style={{ position: 'absolute', top: 0, left: `${i * (100 / 30)}%`, width: 1, height: '100%', background: 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>
      </div>

      {isLow && (
        <p style={{
          fontFamily: "'Press Start 2P'", fontSize: 7, color: '#ef4444',
          marginTop: 7, textAlign: 'center',
          opacity: blink ? 1 : 0.35, transition: 'opacity 0.15s', letterSpacing: 2,
        }}>
          ！ LOW BUDGET WARNING ！
        </p>
      )}
    </div>
  );
}

// ── Loading ───────────────────────────────────────────────────────
function LoadingScreen({ text = 'LOADING...' }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#f5f0e8',
      backgroundImage: `
        repeating-linear-gradient(0deg, transparent, transparent 23px, #00000008 23px, #00000008 24px),
        repeating-linear-gradient(90deg, transparent, transparent 23px, #00000008 23px, #00000008 24px)
      `,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <p style={{ fontFamily: "'Press Start 2P'", fontSize: 9, color: '#9ca3af', letterSpacing: 3 }}>{text}</p>
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────────
function LoginScreen({ onSignIn, error }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#f5f0e8',
      backgroundImage: `
        repeating-linear-gradient(0deg, transparent, transparent 23px, #00000008 23px, #00000008 24px),
        repeating-linear-gradient(90deg, transparent, transparent 23px, #00000008 23px, #00000008 24px)
      `,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
    }}>
      <p style={{ fontFamily: "'Press Start 2P'", fontSize: 16, color: '#1f2937', letterSpacing: 2 }}>🍽 MEAL TRACKER</p>
      <p style={{ fontFamily: "'Noto Sans TC'", fontSize: 13, color: '#9ca3af' }}>資料儲存於你的 Google Sheets</p>
      {error && (
        <p style={{ fontFamily: "'Noto Sans TC'", fontSize: 12, color: '#ef4444', background: '#fef2f2', border: '2px solid #fca5a5', padding: '8px 14px' }}>
          {error}
        </p>
      )}
      <button
        onClick={onSignIn}
        style={{
          fontFamily: "'Press Start 2P'", fontSize: 10, cursor: 'pointer',
          padding: '14px 28px', color: '#1f2937', border: '3px solid #1f2937',
          background: '#facc15', boxShadow: '4px 4px 0 #1f2937', letterSpacing: 2,
        }}
      >
        ▶ SIGN IN
      </button>
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

  // ── Screens ──
  if (authLoading) return <LoadingScreen text="LOADING..." />;
  if (!isSignedIn) return <LoginScreen onSignIn={signIn} error={authError} />;
  if (isLoadingData) return <LoadingScreen text="SYNCING..." />;

  const categoryList = CATEGORIES || ['早餐', '午餐', '晚餐', '飲料', '零食'];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f0e8',
      backgroundImage: `
        repeating-linear-gradient(0deg, transparent, transparent 23px, #00000008 23px, #00000008 24px),
        repeating-linear-gradient(90deg, transparent, transparent 23px, #00000008 23px, #00000008 24px)
      `,
      display: 'flex', justifyContent: 'center',
      padding: '24px 16px 80px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Noto+Sans+TC:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
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
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .px-btn {
          font-family: 'Press Start 2P', monospace;
          cursor: pointer; border: 2px solid;
          background: transparent; letter-spacing: 1px;
          image-rendering: pixelated;
        }
        .px-btn:active { transform: translate(2px, 2px); }
        .px-input {
          font-family: 'Noto Sans TC', sans-serif;
          font-size: 14px; background: #fff; color: #1f2937;
          border: 2px solid #d1d5db; padding: 10px 12px; width: 100%; outline: none;
        }
        .px-input:focus { border-color: #22c55e; }
        .record-row .del-btn { opacity: 0; transition: opacity 0.15s; }
        .record-row:hover .del-btn { opacity: 1; }
      `}</style>

      <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Sign out */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="px-btn" onClick={signOut}
            style={{ padding: '6px 10px', fontSize: 7, color: '#9ca3af', borderColor: '#d1d5db', boxShadow: 'none' }}>
            SIGN OUT
          </button>
        </div>

        {/* HP Card */}
        <div style={{
          background: '#fff', border: '3px solid #1f2937',
          boxShadow: '4px 4px 0 #1f2937', padding: 20,
          position: 'relative',
          animation: shake ? 'shake 0.4s ease' : 'none',
        }}>
          {damageText && (
            <div style={{
              position: 'absolute', top: 10, right: 20,
              fontFamily: "'Press Start 2P'", fontSize: 18, color: '#ef4444',
              textShadow: '2px 2px 0 #fca5a5',
              animation: 'floatDmg 1.2s ease forwards',
              pointerEvents: 'none', zIndex: 10,
            }}>{damageText}</div>
          )}
          <HpBar remaining={remaining} totalBudget={totalBudget} />
        </div>

        {/* Error */}
        {dataError && (
          <div style={{
            fontFamily: "'Noto Sans TC'", fontSize: 12, color: '#ef4444',
            background: '#fef2f2', border: '2px solid #fca5a5', padding: '8px 14px',
          }}>{dataError}</div>
        )}

        {/* Add Button / Form */}
        {!showAdd ? (
          <button className="px-btn" onClick={() => setShowAdd(true)}
            style={{
              width: '100%', padding: '14px', fontSize: 10,
              color: '#1f2937', borderColor: '#1f2937',
              background: '#facc15', boxShadow: '4px 4px 0 #1f2937', letterSpacing: 2,
            }}>
            ⚔ ADD RECORD
          </button>
        ) : (
          <div style={{
            background: '#fff', border: '3px solid #1f2937',
            boxShadow: '4px 4px 0 #1f2937', padding: 18,
            display: 'flex', flexDirection: 'column', gap: 14,
            animation: 'slideDown 0.15s ease',
          }}>
            <input className="px-input" placeholder="品項名稱"
              value={form.item}
              onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))}
            />

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {categoryList.map((cat) => {
                const active = form.category === cat;
                return (
                  <button key={cat} className="px-btn"
                    onClick={() => setForm((f) => ({ ...f, category: cat }))}
                    style={{
                      padding: '7px 10px', fontSize: 9,
                      color: active ? '#fff' : '#6b7280',
                      borderColor: active ? '#1f2937' : '#d1d5db',
                      background: active ? '#1f2937' : 'transparent',
                      boxShadow: active ? '2px 2px 0 #6b7280' : 'none',
                    }}>
                    {CATEGORY_ICON[cat] || ''} {cat}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input className="px-input" type="number" placeholder="金額"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
              <input className="px-input" type="date" value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button className="px-btn" onClick={() => setShowAdd(false)}
                style={{ padding: '11px', fontSize: 9, color: '#6b7280', borderColor: '#d1d5db', boxShadow: '2px 2px 0 #d1d5db' }}>
                CANCEL
              </button>
              <button className="px-btn" onClick={handleAdd}
                style={{ padding: '11px', fontSize: 9, color: '#fff', borderColor: '#1f2937', background: '#22c55e', boxShadow: '3px 3px 0 #1f2937' }}>
                CONFIRM
              </button>
            </div>
          </div>
        )}

        {/* Record List */}
        <div style={{ background: '#fff', border: '3px solid #1f2937', boxShadow: '4px 4px 0 #1f2937' }}>
          {/* List header with single toggle */}
          <button className="px-btn" onClick={() => setListCollapsed((v) => !v)}
            style={{
              width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', borderColor: 'transparent', background: '#f9fafb', boxShadow: 'none',
              borderBottom: listCollapsed ? 'none' : '2px solid #1f2937',
            }}>
            <span style={{ fontFamily: "'Press Start 2P'", fontSize: 8, color: '#1f2937', letterSpacing: 1 }}>
              📜 BATTLE LOG
            </span>
            <span style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: '#9ca3af' }}>
              {listCollapsed ? '▼ SHOW' : '▲ HIDE'}
            </span>
          </button>

          {!listCollapsed && (
            <>
              {grouped.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 8, color: '#d1d5db', fontFamily: "'Press Start 2P'" }}>
                  NO RECORDS YET
                </div>
              )}

              {grouped.map(([date, dayRecords], gi) => {
            const dayTotal = dayRecords.reduce((s, r) => s + Number(r.amount), 0);
            const isToday = date === todayStr();

            return (
              <div key={date} style={{ borderTop: gi === 0 ? 'none' : '2px solid #1f2937' }}>
                {/* Date header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px',
                  background: isToday ? '#f0fdf4' : 'transparent',
                }}>
                  <span style={{ fontFamily: "'Noto Sans TC'", fontSize: 13, fontWeight: 700, color: isToday ? '#22c55e' : '#6b7280' }}>
                    {isToday && '▶ '}{formatDate(date)}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: "'Press Start 2P'", fontSize: 8, color: '#ef4444' }}>-¥{dayTotal}</span>
                  </div>
                </div>

                {dayRecords.map((r, ri) => (
                  editingId === r.id ? (
                    /* ── Edit form inline ── */
                    <div key={r.id} style={{
                      padding: '12px 16px', borderTop: '1px solid #f3f4f6',
                      background: '#fffbeb', display: 'flex', flexDirection: 'column', gap: 10,
                    }}>
                      <input className="px-input" placeholder="品項名稱"
                        value={editForm.item}
                        onChange={(e) => setEditForm((f) => ({ ...f, item: e.target.value }))}
                      />
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {categoryList.map((cat) => {
                          const active = editForm.category === cat;
                          return (
                            <button key={cat} className="px-btn"
                              onClick={() => setEditForm((f) => ({ ...f, category: cat }))}
                              style={{
                                padding: '6px 9px', fontSize: 9,
                                color: active ? '#fff' : '#6b7280',
                                borderColor: active ? '#1f2937' : '#d1d5db',
                                background: active ? '#1f2937' : 'transparent',
                                boxShadow: active ? '2px 2px 0 #6b7280' : 'none',
                              }}>
                              {CATEGORY_ICON[cat] || ''} {cat}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <input className="px-input" type="number" placeholder="金額"
                          value={editForm.amount}
                          onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                        />
                        <input className="px-input" type="date" value={editForm.date}
                          onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <button className="px-btn" onClick={() => setEditingId(null)}
                          style={{ padding: '9px', fontSize: 9, color: '#6b7280', borderColor: '#d1d5db', boxShadow: '2px 2px 0 #d1d5db' }}>
                          CANCEL
                        </button>
                        <button className="px-btn" onClick={handleEditSave}
                          style={{ padding: '9px', fontSize: 9, color: '#fff', borderColor: '#1f2937', background: '#22c55e', boxShadow: '3px 3px 0 #1f2937' }}>
                          SAVE
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Normal row ── */
                    <div key={r.id} className="record-row"
                      style={{
                        display: 'flex', alignItems: 'center',
                        padding: '10px 16px',
                        background: ri % 2 === 0 ? '#fafafa' : '#fff',
                        borderTop: '1px solid #f3f4f6', gap: 10,
                      }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{CATEGORY_ICON[r.category] || '🍽'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: "'Noto Sans TC'", fontSize: 14, fontWeight: 500, color: '#1f2937',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{r.item}</div>
                        <div style={{ fontFamily: "'Noto Sans TC'", fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                          {r.category}
                        </div>
                      </div>
                      <span style={{ fontFamily: "'Press Start 2P'", fontSize: 11, color: '#ef4444', flexShrink: 0 }}>
                        -{r.amount}
                      </span>
                      <button className="px-btn del-btn" onClick={() => handleEdit(r)}
                        style={{ padding: '4px 7px', fontSize: 10, color: '#6b7280', borderColor: '#d1d5db', boxShadow: 'none', lineHeight: 1, flexShrink: 0 }}>
                        ✎
                      </button>
                      <button className="px-btn del-btn" onClick={() => deleteRecord(r.id)}
                        style={{ padding: '4px 7px', fontSize: 10, color: '#ef4444', borderColor: '#fca5a5', boxShadow: 'none', lineHeight: 1, flexShrink: 0 }}>
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
