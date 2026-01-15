import { useState } from 'react'
import './App.css'

function App() {
  // --- 状態(State)の定義 ---
  const [serviceName, setServiceName] = useState('');
  const [monthly, setMonthly] = useState('');
  const [yearly, setYearly] = useState('');
  
  // 登録されたサブスクのリスト
  const [subs, setSubs] = useState([]);

  // --- リアルタイム計算ロジック ---
  const monthlyNum = Number(monthly) || 0;
  const yearlyNum = Number(yearly) || 0;
  const currentYearlyFromMonthly = monthlyNum * 12;
  const currentDiff = (yearlyNum > 0) ? currentYearlyFromMonthly - yearlyNum : 0;

  // --- アクション ---
  const addSubscription = () => {
    if (monthlyNum <= 0) return;

    const newSub = {
      id: Date.now(),
      name: serviceName || "無名のサブスク",
      monthly: monthlyNum,
      yearly: yearlyNum,
      saving: currentDiff
    };

    setSubs([...subs, newSub]);
    
    // 入力欄をリセット
    setServiceName('');
    setMonthly('');
    setYearly('');
  };

  const deleteSub = (id) => {
    setSubs(subs.filter(sub => sub.id !== id));
  };

  // 全体の合計計算
  const totalMonthly = subs.reduce((sum, s) => sum + s.monthly, 0);
  const totalPotentialSaving = subs.reduce((sum, s) => sum + s.saving, 0);

  return (
    <div className="container">
      <header className="app-header">
        <h1>SUB SAVE</h1>
        <p>あなたのサブスク診断</p>
      </header>

      <main>
        <section className="card">
          <h2>サブスクを入力</h2>
          <div className="form-group">
            <label>サブスク名</label>
            <input 
              type="text" 
              placeholder="例：Netflix" 
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>月額（円）</label>
            <input 
              type="number" 
              placeholder="例：1490" 
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>年額プラン（ある場合）</label>
            <input 
              type="number" 
              placeholder="例：14900" 
              value={yearly}
              onChange={(e) => setYearly(e.target.value)}
            />
          </div>

          {/* リアルタイム表示エリア */}
          {monthlyNum > 0 && (
            <div className="message" style={{ background: '#eef2ff', marginBottom: '10px' }}>
              <p>現在の入力：年間 <strong>{currentYearlyFromMonthly.toLocaleString()}</strong> 円</p>
              {currentDiff > 0 && (
                <p style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                  → 年額プランで <strong>{currentDiff.toLocaleString()}</strong> 円 節約可能！
                </p>
              )}
            </div>
          )}

          <button onClick={addSubscription} id="diagnoseBtn">
            リストに追加する
          </button>
        </section>

        {/* 登録済みリスト */}
        {subs.length > 0 && (
          <section className="card">
            <h2>登録済みリスト</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {subs.map(sub => (
                <li key={sub.id} className="message" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <strong>{sub.name}</strong>：月 {sub.monthly.toLocaleString()}円
                    {sub.saving > 0 && <div style={{ fontSize: '12px', color: '#d32f2f' }}>節約可能：{sub.saving.toLocaleString()}円</div>}
                  </div>
                  <button 
                    onClick={() => deleteSub(sub.id)}
                    style={{ background: '#ffcdd2', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px' }}
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>

            <div style={{ marginTop: '20px', borderTop: '2px solid #1e88e5', paddingTop: '10px' }}>
              <p>合計月額：<strong>{totalMonthly.toLocaleString()}</strong> 円</p>
              <p style={{ fontSize: '18px', color: '#1e88e5' }}>
                年間最大節約額：<strong>{totalPotentialSaving.toLocaleString()}</strong> 円
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App