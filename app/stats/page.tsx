"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Transaction, getCategoryEmoji } from "@/types";
import { getTransactions, formatKRW, getMonthKey, getMonthLabel } from "@/lib/storage";
import BottomNav from "@/components/BottomNav";

function addMonths(date: Date, n: number) { const d = new Date(date); d.setMonth(d.getMonth()+n); return d; }

const PIE_COLORS = ["#3185FC","#00B493","#F04452","#F7C244","#8B95A1","#7C3AED","#EA580C","#0891B2","#65A30D"];

export default function StatsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => { getTransactions().then(txs => { setTransactions(txs); setLoading(false); }); }, []);

  const monthKey = getMonthKey(currentMonth);
  const monthlyTxs = useMemo(() => transactions.filter(t => t.date.startsWith(monthKey)), [transactions, monthKey]);
  const income  = useMemo(() => monthlyTxs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0), [monthlyTxs]);
  const expense = useMemo(() => monthlyTxs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0), [monthlyTxs]);

  const catData = useMemo(() => {
    const map: Record<string,number> = {};
    monthlyTxs.filter(t=>t.type==="expense").forEach(t => { map[t.category]=(map[t.category]||0)+t.amount; });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([name,value])=>({name,value}));
  }, [monthlyTxs]);

  const barData = useMemo(() => Array.from({length:6},(_,i)=>{
    const d = addMonths(currentMonth, i-5);
    const key = getMonthKey(d);
    const txs = transactions.filter(t=>t.date.startsWith(key));
    return { month:`${parseInt(key.split("-")[1])}월`, income:txs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0), expense:txs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0) };
  }), [transactions, currentMonth]);

  const Tip = ({active,payload}: any) => active && payload?.length ? (
    <div className="bg-surface dark:bg-dark-card rounded-item px-gap py-gap-sm shadow-card-lg border border-border dark:border-dark-border">
      {payload.map((p:any) => <p key={p.name} style={{color:p.color}} className="text-caption font-semibold">{p.name==="income"?"수입":"지출"}: {formatKRW(p.value)}</p>)}
    </div>
  ) : null;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-page-bg dark:bg-dark-bg">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-pill animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-page-bg dark:bg-dark-bg">
      <div className="bg-surface dark:bg-dark-card px-page pt-14 pb-card sticky top-0 z-10 shadow-card">
        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentMonth(p=>addMonths(p,-1))} className="w-icon h-icon flex items-center justify-center rounded-pill hover:bg-page-bg dark:hover:bg-dark-bg transition-colors">
            <ChevronLeft size={20} className="text-text-secondary"/>
          </button>
          <span className="text-title text-ink dark:text-white">{getMonthLabel(monthKey)}</span>
          <button onClick={() => setCurrentMonth(p=>addMonths(p,1))} className="w-icon h-icon flex items-center justify-center rounded-pill hover:bg-page-bg dark:hover:bg-dark-bg transition-colors">
            <ChevronRight size={20} className="text-text-secondary"/>
          </button>
        </div>
      </div>

      <div className="px-page pt-gap-lg space-y-gap">
        {/* 요약 */}
        <div className="bg-surface dark:bg-dark-card rounded-card p-card shadow-card">
          <p className="text-caption text-text-muted mb-gap-lg font-medium">이번 달 요약</p>
          <div className="flex justify-between">
            <div><p className="text-label text-text-muted">수입</p><p className="text-amount-lg text-income mt-1">+{formatKRW(income)}</p></div>
            <div className="text-right"><p className="text-label text-text-muted">지출</p><p className="text-amount-lg text-expense mt-1">-{formatKRW(expense)}</p></div>
          </div>
          {income > 0 && (
            <div className="mt-gap-lg">
              <div className="h-2 bg-page-bg dark:bg-dark-bg rounded-pill overflow-hidden">
                <div className="h-full bg-expense rounded-pill transition-all duration-500" style={{width:`${Math.min(100,Math.round((expense/income)*100))}%`}} />
              </div>
              <p className="text-label text-text-muted mt-gap-sm">수입 대비 지출 {Math.min(100,Math.round((expense/income)*100))}%</p>
            </div>
          )}
        </div>

        {/* 6개월 추이 */}
        <div className="bg-surface dark:bg-dark-card rounded-card p-card shadow-card">
          <p className="text-caption text-text-muted mb-gap-lg font-medium">6개월 추이</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData} barSize={12} barGap={4}>
              <XAxis dataKey="month" tick={{fontSize:11,fill:"#8B95A1"}} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip content={<Tip/>} cursor={{fill:"#F2F4F6"}}/>
              <Bar dataKey="income"  fill="#00B493" radius={[4,4,0,0]}/>
              <Bar dataKey="expense" fill="#F04452" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-gap-lg mt-gap-sm">
            <div className="flex items-center gap-gap-sm"><div className="w-2.5 h-2.5 rounded-pill bg-income"/><span className="text-label text-text-muted">수입</span></div>
            <div className="flex items-center gap-gap-sm"><div className="w-2.5 h-2.5 rounded-pill bg-expense"/><span className="text-label text-text-muted">지출</span></div>
          </div>
        </div>

        {/* 카테고리 */}
        {catData.length > 0 ? (
          <div className="bg-surface dark:bg-dark-card rounded-card p-card shadow-card">
            <p className="text-caption text-text-muted mb-gap-lg font-medium">카테고리별 지출</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                  {catData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                </Pie>
                <Tooltip formatter={(v:number)=>formatKRW(v)}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-gap mt-gap">
              {catData.map((cat,i)=>(
                <div key={cat.name} className="flex items-center gap-gap">
                  <div className="w-icon-sm h-icon-sm rounded-pill bg-page-bg dark:bg-dark-bg flex items-center justify-center text-body flex-shrink-0">{getCategoryEmoji(cat.name)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-caption font-medium text-ink dark:text-white">{cat.name}</span>
                      <span className="text-caption font-semibold text-ink dark:text-white">{formatKRW(cat.value)}</span>
                    </div>
                    <div className="h-1.5 bg-page-bg dark:bg-dark-bg rounded-pill overflow-hidden">
                      <div className="h-full rounded-pill" style={{width:`${Math.round((cat.value/expense)*100)}%`,backgroundColor:PIE_COLORS[i%PIE_COLORS.length]}}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-surface dark:bg-dark-card rounded-card p-card shadow-card text-center">
            <p className="text-body text-text-muted">이번 달 지출 내역이 없어요</p>
          </div>
        )}
      </div>
      <BottomNav active="stats"/>
    </div>
  );
}
