"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Pencil, Check, X } from "lucide-react";
import { Transaction, EXPENSE_CATEGORIES, Budget } from "@/types";
import { getTransactions, getBudgets, upsertBudget, deleteBudget, formatKRW, getMonthKey, getMonthLabel } from "@/lib/storage";
import BottomNav from "@/components/BottomNav";

function addMonths(date: Date, n: number) { const d = new Date(date); d.setMonth(d.getMonth()+n); return d; }

function GaugeChart({ spent, budget }: { spent: number; budget: number }) {
  const pct = budget > 0 ? Math.min(100, (spent/budget)*100) : 0;
  const radius = 80, cx = 110, cy = 110;
  const toRad = (deg: number) => (deg*Math.PI)/180;
  const arcPath = (start: number, end: number) => {
    const s = { x: cx+radius*Math.cos(toRad(start)), y: cy+radius*Math.sin(toRad(start)) };
    const e = { x: cx+radius*Math.cos(toRad(end)),   y: cy+radius*Math.sin(toRad(end)) };
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${end-start>180?1:0} 1 ${e.x} ${e.y}`;
  };
  const endAngle = 150 + (240*pct)/100;
  const color = pct>=100?"#F04452":pct>=80?"#F7C244":"#00B493";

  return (
    <svg viewBox="0 0 220 175" className="w-full max-w-[260px] mx-auto">
      <path d={arcPath(150,390)} fill="none" stroke="#E5E8EB" strokeWidth="14" strokeLinecap="round"/>
      {pct>0 && <path d={arcPath(150,endAngle)} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"/>}
      {/* % 중앙 */}
      <text x={cx} y={cy+8} textAnchor="middle" fontSize="30" fontWeight="700" fill={color} fontFamily="Pretendard,sans-serif">{Math.round(pct)}%</text>
      {/* 하단 빈 공간 */}
      <text x={cx} y={cy+52} textAnchor="middle" fontSize="14" fontWeight="600" fill={color} fontFamily="Pretendard,sans-serif">{formatKRW(spent)}</text>
      <line x1={cx-24} y1={cy+58} x2={cx+24} y2={cy+58} stroke="#8B95A1" strokeWidth="1"/>
      <text x={cx} y={cy+72} textAnchor="middle" fontSize="14" fill="#8B95A1" fontFamily="Pretendard,sans-serif">{budget>0?formatKRW(budget):"미설정"}</text>
    </svg>
  );
}

export default function BudgetPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [editingCat, setEditingCat] = useState<string|null>(null);
  const [editValue, setEditValue] = useState("");
  const [totalBudgetEdit, setTotalBudgetEdit] = useState(false);
  const [totalBudgetValue, setTotalBudgetValue] = useState("");

  useEffect(() => {
    Promise.all([getTransactions(), getBudgets()]).then(([txs,buds]) => { setTransactions(txs); setBudgets(buds); setLoading(false); });
  }, []);

  const monthKey = getMonthKey(currentMonth);
  const monthlyExpenses = useMemo(() => {
    const map: Record<string,number> = {};
    transactions.filter(t=>t.type==="expense"&&t.date.startsWith(monthKey)).forEach(t => { map[t.category]=(map[t.category]||0)+t.amount; });
    return map;
  }, [transactions, monthKey]);

  const totalExpense = useMemo(() => Object.values(monthlyExpenses).reduce((s,v)=>s+v,0), [monthlyExpenses]);
  const getBudgetAmt = (cat: string) => budgets.find(b=>b.category===cat&&b.month===monthKey)?.amount??0;

  const handleUpsert = async (cat: string, amount: number) => {
    if (amount>0) {
      const b: Budget = {category:cat, amount, month:monthKey};
      await upsertBudget(b);
      setBudgets(prev=>[...prev.filter(x=>!(x.category===cat&&x.month===monthKey)),b]);
    } else {
      await deleteBudget(cat, monthKey);
      setBudgets(prev=>prev.filter(x=>!(x.category===cat&&x.month===monthKey)));
    }
  };

  const totalBudget = getBudgetAmt("__total__");
  const totalPct = totalBudget>0 ? Math.min(100,Math.round((totalExpense/totalBudget)*100)) : 0;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-page-bg dark:bg-dark-bg">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-pill animate-spin"/>
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
        {/* 총 예산 게이지 */}
        <div className="bg-surface dark:bg-dark-card rounded-card p-card shadow-card">
          <div className="flex items-center justify-between mb-gap-sm">
            <p className="text-caption font-medium text-text-muted">이번 달 총 예산</p>
            <button onClick={() => { setTotalBudgetEdit(true); setTotalBudgetValue(totalBudget>0?String(totalBudget):""); }}
              className="w-icon-sm h-icon-sm flex items-center justify-center rounded-pill hover:bg-page-bg dark:hover:bg-dark-bg">
              <Pencil size={14} className="text-text-muted"/>
            </button>
          </div>
          {totalBudgetEdit ? (
            <div className="flex items-center gap-gap py-gap">
              <input autoFocus type="text" inputMode="numeric" placeholder="예산 입력"
                value={totalBudgetValue ? new Intl.NumberFormat("ko-KR").format(parseInt(totalBudgetValue)||0) : ""}
                onChange={e=>setTotalBudgetValue(e.target.value.replace(/[^0-9]/g,""))}
                className="flex-1 text-amount text-ink dark:text-white bg-page-bg dark:bg-dark-bg rounded-item px-gap py-gap-sm outline-none"/>
              <button onClick={async()=>{ await handleUpsert("__total__",parseInt(totalBudgetValue)||0); setTotalBudgetEdit(false); }}
                className="w-icon h-icon bg-primary rounded-pill flex items-center justify-center flex-shrink-0">
                <Check size={14} className="text-white"/>
              </button>
              <button onClick={()=>setTotalBudgetEdit(false)}
                className="w-icon h-icon bg-page-bg dark:bg-dark-bg rounded-pill flex items-center justify-center flex-shrink-0">
                <X size={14} className="text-text-secondary"/>
              </button>
            </div>
          ) : (
            <GaugeChart spent={totalExpense} budget={totalBudget}/>
          )}
          {totalBudget>0 && !totalBudgetEdit && (
            <p className={`text-center text-caption mt-1 font-medium ${totalPct>=100?"text-expense":totalPct>=80?"text-yellow-500":"text-text-muted"}`}>
              {totalPct>=100 ? "예산을 초과했어요 😅" : `남은 예산 ${formatKRW(totalBudget-totalExpense)}`}
            </p>
          )}
          {totalBudget===0 && !totalBudgetEdit && (
            <p className="text-center text-caption text-text-disabled mt-1">연필 버튼을 눌러 예산을 설정해보세요</p>
          )}
        </div>

        {/* 카테고리별 예산 */}
        <div className="bg-surface dark:bg-dark-card rounded-card shadow-card overflow-hidden">
          <p className="text-caption font-medium text-text-muted px-card pt-card pb-gap-sm">카테고리별 예산</p>
          {EXPENSE_CATEGORIES.map((cat,i) => {
            const spent = monthlyExpenses[cat.id]||0;
            const budget = getBudgetAmt(cat.id);
            const pct = budget>0 ? Math.min(100,Math.round((spent/budget)*100)) : 0;
            const isEditing = editingCat===cat.id;
            return (
              <div key={cat.id} className={`px-card py-item ${i<EXPENSE_CATEGORIES.length-1?"border-b border-border dark:border-dark-border":""}`}>
                <div className="flex items-center gap-gap">
                  <div className="w-icon h-icon rounded-pill bg-page-bg dark:bg-dark-bg flex items-center justify-center text-body flex-shrink-0">{cat.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-body font-medium text-ink dark:text-white">{cat.label}</span>
                      {isEditing ? (
                        <div className="flex items-center gap-gap-sm">
                          <input autoFocus type="text" inputMode="numeric" placeholder="금액"
                            value={editValue ? new Intl.NumberFormat("ko-KR").format(parseInt(editValue)||0) : ""}
                            onChange={e=>setEditValue(e.target.value.replace(/[^0-9]/g,""))}
                            className="w-28 text-caption bg-page-bg dark:bg-dark-bg rounded-item px-gap-sm py-1 outline-none text-right text-ink dark:text-white"/>
                          <button onClick={async()=>{ await handleUpsert(cat.id,parseInt(editValue)||0); setEditingCat(null); setEditValue(""); }}
                            className="w-icon-sm h-icon-sm bg-primary rounded-pill flex items-center justify-center"><Check size={12} className="text-white"/></button>
                          <button onClick={()=>setEditingCat(null)}
                            className="w-icon-sm h-icon-sm bg-page-bg dark:bg-dark-bg rounded-pill flex items-center justify-center"><X size={12} className="text-text-secondary"/></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-gap-sm">
                          <span className="text-caption text-text-muted">
                            {spent>0 && <span className={`font-medium ${pct>=100?"text-expense":"text-ink dark:text-white"}`}>{formatKRW(spent)}</span>}
                            {budget>0 && <span className="text-text-disabled"> / {formatKRW(budget)}</span>}
                            {budget===0&&spent===0 && <span className="text-text-disabled">미설정</span>}
                          </span>
                          <button onClick={()=>{ setEditingCat(cat.id); setEditValue(budget>0?String(budget):""); }}
                            className="w-icon-sm h-icon-sm flex items-center justify-center rounded-pill hover:bg-page-bg dark:hover:bg-dark-bg">
                            <Pencil size={12} className="text-text-disabled"/>
                          </button>
                        </div>
                      )}
                    </div>
                    {budget>0 && (
                      <div className="h-1.5 bg-page-bg dark:bg-dark-bg rounded-pill overflow-hidden">
                        <div className={`h-full rounded-pill transition-all duration-500 ${pct>=100?"bg-expense":pct>=80?"bg-yellow-400":"bg-income"}`} style={{width:`${pct}%`}}/>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <BottomNav active="budget"/>
    </div>
  );
}
