import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css'
import { supabase } from './supabaseClient'
// パスキー用の Fingerprint は一旦削除（またはコメントアウト）
import { Trash2, PlusCircle, PiggyBank } from 'lucide-react'

// 共通コンテナ（画面中央寄せ＆サイズ統一）
function Container({ children }) {
  return (
    // 画面全体はスクロールさせず、中央にカードをドンと置く
    <div className="h-screen bg-gray-100 flex flex-col justify-center items-center px-4 font-sans text-gray-800 overflow-hidden">
      {/* カードの高さを画面の90% (h-[90vh]) に固定し、中身を縦並び (flex-col) にする */}
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[90vh]">
        {children}
      </div>
    </div>
  )
}

// 共通ボタンデザイン
const PrimaryButton = ({ onClick, text, type = "button", disabled }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-md 
                 transform transition-all duration-200 
                 hover:bg-emerald-700 hover:shadow-lg hover:-translate-y-1 
                 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
  >
    {disabled ? '処理中...' : text}
  </button>
)

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [subs, setSubs] = useState([])

  // フォーム用
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoginMode, setIsLoginMode] = useState(true)

  const [serviceName, setServiceName] = useState('')
  const [monthly, setMonthly] = useState('')
  const [yearly, setYearly] = useState('')

  // --- ロジック部分 ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchSubscriptions()
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchSubscriptions()
      else {
        setSubs([])
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchSubscriptions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) console.error('Error:', error)
    else setSubs(data || [])
    setLoading(false)
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    let result
    if (isLoginMode) {
      result = await supabase.auth.signInWithPassword({ email, password })
    } else {
      result = await supabase.auth.signUp({ email, password })
    }
    const { error } = result
    if (error) alert(error.message)
    else if (!isLoginMode) alert('確認メールを送信しました！')
    setLoading(false)
  }

  const addSubscription = async (e) => {
    e.preventDefault()
    if (!monthly || !session) return
    const m = Number(monthly)
    const y = Number(yearly) || 0
    const diff = (y > 0) ? (m * 12) - y : 0

    const { data, error } = await supabase
      .from('subscriptions')
      .insert([{
        user_id: session.user.id,
        name: serviceName || "無名のサブスク",
        monthly: m,
        yearly: y,
        saving: diff
      }])
      .select()

    if (!error && data) {
      setSubs([...subs, data[0]])
      setServiceName('')
      setMonthly('')
      setYearly('')
    } else alert('保存に失敗しました')
  }

  const deleteSub = async (id) => {
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id)
    if (!error) setSubs(subs.filter(sub => sub.id !== id))
    else alert('削除できませんでした')
  }

  const totalMonthly = subs.reduce((sum, s) => sum + s.monthly, 0)
  const totalSaving = subs.reduce((sum, s) => sum + s.saving, 0)

  // 1. 予算管理用の状態
  const [budget, setBudget] = useState(10000)

  // 2. グラフ用のデータを作る
  const remaining = Math.max(0, budget - totalMonthly)
  const graphData = [
    { name: 'サブスク利用額', value: totalMonthly },
    { name: '残りの予算', value: remaining },
  ]
  const COLORS = ['#F59E0B', '#10B981']

  // ---------------------------------------------------------
  // デザイン部分
  // ---------------------------------------------------------

  // A. ログイン画面（ここもスクロール対応）
  if (!session) {
    return (
      <Container>
        <div className="bg-emerald-600 p-8 text-center flex-none">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-wider">SUB SAVE</h1>
          <p className="text-emerald-100 text-sm">自分だけのサブスク管理</p>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
          <div className="flex mb-8 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setIsLoginMode(true)}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${isLoginMode ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              ログイン
            </button>
            <button
              onClick={() => setIsLoginMode(false)}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${!isLoginMode ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              新規登録
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">メールアドレス</label>
              <input
                type="email" required
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">パスワード</label>
              <input
                type="password" required minLength={6}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <PrimaryButton type="submit" disabled={loading} text={isLoginMode ? 'ログインして始める' : 'アカウントを作成'} />
          </form>
        </div>
      </Container>
    )
  }

  // B. ダッシュボード画面（メイン）
  return (
    <Container>
      {/* 1. ヘッダー（固定：flex-none） */}
      <header className="bg-emerald-600 p-6 flex justify-between items-center flex-none z-10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">SUB SAVE</h1>
          <p className="text-xs text-emerald-100 mt-1">{session.user.email}</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-700 px-3 py-2 rounded-lg transition"
        >
          ログアウト
        </button>
      </header>

      {/* メインエリア：ここから下をFlexboxで分割 */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
        
        {/* 2. 固定エリア（入力フォーム ＋ グラフ） */}
        {/* flex-none にして高さを固定。中身が多い場合はここ自体もスクロール可能にする */}
        <div className="flex-none p-6 pb-2 overflow-y-auto custom-scrollbar max-h-[65%]">
          
          {/* 入力フォーム */}
          <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
            <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
              サブスクを追加
            </h2>
            <form onSubmit={addSubscription} className="space-y-4">
              <input
                type="text" required placeholder="サービス名 (例: Netflix)"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                value={serviceName} onChange={(e) => setServiceName(e.target.value)}
              />
              <div className="flex gap-3">
                <input
                  type="number" required placeholder="月額 (円)"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  value={monthly} onChange={(e) => setMonthly(e.target.value)}
                />
                <input
                  type="number" placeholder="年額 (任意)"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  value={yearly} onChange={(e) => setYearly(e.target.value)}
                />
              </div>

              {Number(monthly) > 0 && Number(yearly) > 0 && (
                <div className="text-sm bg-amber-50 text-amber-700 p-3 rounded-lg border border-amber-100 flex items-center justify-center gap-2">
                  <span>✨ 年額プランで</span>
                  <span className="font-bold text-lg">{((Number(monthly) * 12) - Number(yearly)).toLocaleString()}円</span>
                  <span>お得</span>
                </div>
              )}

              <PrimaryButton type="submit" text="リストに追加する" />
            </form>
          </section>

          {/* グラフと予算 */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* グラフ */}
              <div className="w-full md:w-1/2 h-56 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <Pie
                      data={graphData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {graphData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <p className="text-xs text-gray-400">利用率</p>
                  <p className="text-xl font-bold text-gray-700">
                    {Math.round((totalMonthly / budget) * 100)}%
                  </p>
                </div>
              </div>
              {/* 予算設定 */}
              <div className="w-full md:w-1/2 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">今月の予算設定</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={budget} 
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-right font-bold text-lg"
                    />
                    <span className="text-sm">円</span>
                  </div>
                </div>
                <div className={`p-4 rounded-lg text-sm font-bold ${remaining === 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {remaining === 0 
                    ? '⚠️ 予算オーバー！' 
                    : `あと ${remaining.toLocaleString()}円`
                  }
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* 3. スクロールエリア（リスト） */}
        {/* flex-1 で残りの高さを全部使い、overflow-y-auto でここだけスクロールさせる */}
        <div className="flex-1 p-6 pt-2 overflow-y-auto custom-scrollbar bg-gray-50/50">
          <div className="flex justify-between items-center mb-3 px-1 sticky top-0 bg-gray-50 py-2 backdrop-blur-sm z-10">
            <h2 className="text-sm font-bold text-gray-500">登録済みリスト</h2>
            <div className="text-right">
              <span className="text-xs text-gray-400">合計</span>
              <span className="text-xl font-bold text-gray-800 ml-2">{totalMonthly.toLocaleString()}</span>
              <span className="text-xs font-normal text-gray-500 ml-1">円/月</span>
            </div>
          </div>

          <div className="space-y-3 pb-6">
            {subs.length === 0 ? (
              <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                データがありません
              </div>
            ) : (
              subs.map(sub => (
                <div key={sub.id} className="group bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center transition hover:shadow-md animate-fade-in">
                  <div>
                    <h3 className="font-bold text-gray-800">{sub.name}</h3>
                    <div className="text-sm text-gray-500 mt-1">
                      月額 <span className="font-medium text-red-500">{Number(sub.monthly).toLocaleString()}</span> 円
                    </div>
                    {sub.saving > 0 && (
                      <div className="mt-2 inline-flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                        💰 年 {Number(sub.saving).toLocaleString()}円 節約可
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => deleteSub(sub.id)}
                    className="bg-red-500 text-white text-xs font-bold px-5 py-2 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                  >
                    <Trash2 size={16} className="inline-block mr-1" />
                    削除
                  </button>
                </div>
              ))
            )}
          </div>
          
          {totalSaving > 0 && (
            <div className="mt-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl shadow-lg text-center">
              <p className="text-sm opacity-90">見直しチャンス！</p>
              <p className="text-lg font-bold">年間 最大 {totalSaving.toLocaleString()} 円 の節約</p>
            </div>
          )}
        </div>

      </div>
    </Container>
  )
}

export default App