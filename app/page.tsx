"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil, Download } from "lucide-react";
import { Transaction, getCategoryEmoji } from "@/types";
import { getTransactions, deleteTransaction, formatKRW, getMonthKey, getMonthLabel } from "@/lib/storage";
import BottomNav from "@/components/BottomNav";

function addMonths(date: Date, n: number) {
  const d = new Date(date); d.setMonth(d.getMonth() + n); return d;
}

export default function HomePage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    getTransactions().then(txs => { setTransactions(txs); setLoading(false); });
  }, []);

  const monthKey = getMonthKey(currentMonth);
  const monthlyTxs = useMemo(() => transactions.filter(t => t.date.startsWith(monthKey)), [transactions, monthKey]);
  const income  = useMemo(() => monthlyTxs.filter(t => t.type === "income").reduce((s,t) => s+t.amount, 0), [monthlyTxs]);
  const expense = useMemo(() => monthlyTxs.filter(t => t.type === "expense").reduce((s,t) => s+t.amount, 0), [monthlyTxs]);
  const balance = useMemo(() => transactions.filter(t => t.date <= `${monthKey}-31`).reduce((s,t) => t.type==="income" ? s+t.amount : s-t.amount, 0), [transactions, monthKey]);

  const grouped = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    [...monthlyTxs].sort((a,b) => b.date.localeCompare(a.date)).forEach(t => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return Object.entries(map).sort((a,b) => b[0].localeCompare(a[0]));
  }, [monthlyTxs]);

  const formatDate = (d: string) => {
    const date = new Date(d + "T00:00:00");
    const days = ["일","월","화","수","목","금","토"];
    return `${parseInt(d.split("-")[1])}월 ${parseInt(d.split("-")[2])}일 ${days[date.getDay()]}요일`;
  };

  const isToday = (d: string) => {
    const t = new Date();
    return d === `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;
  };

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("삭제할까요?")) return;
    setDeletingId(id);
    try {
      await deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } finally { setDeletingId(null); }
  }, []);

  const handleCSV = () => {
    const rows = [
      ["날짜","유형","카테고리","내용","금액"],
      ...monthlyTxs.sort((a,b) => a.date.localeCompare(b.date)).map(t => [
        t.date, t.type==="income"?"수입":"지출", t.category, t.description,
        t.type==="income" ? t.amount : -t.amount,
      ])
    ];
    const blob = new Blob(["\uFEFF" + rows.map(r=>r.join(",")).join("\n")], { type:"text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${getMonthLabel(monthKey)}_지출내역.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-page-bg dark:bg-dark-bg">
      {/* 헤더 */}
      <div className="bg-surface dark:bg-dark-card px-page pt-14 pb-card sticky top-0 z-10 shadow-card">
        <div className="flex items-center justify-between mb-gap-lg">
          <button onClick={() => setCurrentMonth(p => addMonths(p,-1))} className="w-icon h-icon flex items-center justify-center rounded-pill hover:bg-page-bg dark:hover:bg-dark-bg transition-colors">
            <ChevronLeft size={20} className="text-text-secondary" />
          </button>
          <span className="text-title text-ink dark:text-white">{getMonthLabel(monthKey)}</span>
          <button onClick={() => setCurrentMonth(p => addMonths(p,1))} className="w-icon h-icon flex items-center justify-center rounded-pill hover:bg-page-bg dark:hover:bg-dark-bg transition-colors">
            <ChevronRight size={20} className="text-text-secondary" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-gap">
          {[
            { label:"수입", value:`+${formatKRW(income)}`, color:"text-income" },
            { label:"지출", value:`-${formatKRW(expense)}`, color:"text-expense" },
            { label:"잔액", value:`${balance<0?"-":""}${formatKRW(balance)}`, color: balance>=0 ? "text-ink dark:text-white" : "text-expense" },
          ].map(item => (
            <div key={item.label} className="bg-page-bg dark:bg-dark-bg rounded-item px-gap-lg py-gap">
              <p className="text-label text-text-muted mb-1">{item.label}</p>
              <p className={`text-amount-sm ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 내역 목록 */}
      <div className="flex-1 px-page pt-gap-lg">
        {monthlyTxs.length > 0 && (
          <button onClick={handleCSV} className="flex items-center gap-gap-sm ml-auto mb-gap-lg px-gap py-gap-sm bg-surface dark:bg-dark-card rounded-item border border-border dark:border-dark-border text-caption text-text-secondary font-medium shadow-card">
            <Download size={13} /> CSV 다운로드
          </button>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-gap">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-pill animate-spin" />
            <p className="text-caption text-text-muted">불러오는 중...</p>
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-gap-lg">💸</div>
            <p className="text-subtitle text-text-secondary">이번 달 내역이 없어요</p>
            <p className="text-caption text-text-muted mt-1">아래 + 버튼으로 추가해보세요</p>
          </div>
        ) : (
          grouped.map(([date, txs]) => {
            const di = txs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
            const de = txs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
            return (
              <div key={date} className="mb-section">
                <div className="flex items-center justify-between mb-gap px-1">
                  <span className="text-caption font-medium text-text-muted">{isToday(date) ? "오늘" : formatDate(date)}</span>
                  <div className="flex gap-gap text-caption">
                    {di > 0 && <span className="text-income">+{formatKRW(di)}</span>}
                    {de > 0 && <span className="text-expense">-{formatKRW(de)}</span>}
                  </div>
                </div>
                <div className="bg-surface dark:bg-dark-card rounded-card overflow-hidden shadow-card">
                  {txs.map((tx, i) => (
                    <div key={tx.id} className={`flex items-center px-card py-item ${i < txs.length-1 ? "border-b border-border dark:border-dark-border" : ""} ${deletingId===tx.id ? "opacity-40" : ""} transition-opacity`}>
                      <div className="w-icon-lg h-icon-lg rounded-pill bg-page-bg dark:bg-dark-bg flex items-center justify-center text-xl mr-gap flex-shrink-0">
                        {getCategoryEmoji(tx.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-subtitle text-ink dark:text-white truncate">{tx.description}</p>
                        <p className="text-label text-text-muted mt-0.5">{tx.category}</p>
                      </div>
                      <p className={`text-amount-sm mr-gap-sm ${tx.type==="income" ? "text-income" : "text-expense"}`}>
                        {tx.type==="income" ? "+" : "-"}{formatKRW(tx.amount)}
                      </p>
                      <button onClick={() => router.push(`/edit/${tx.id}`)} className="w-icon-sm h-icon-sm flex items-center justify-center rounded-pill hover:bg-page-bg dark:hover:bg-dark-bg transition-colors flex-shrink-0">
                        <Pencil size={13} className="text-text-disabled" />
                      </button>
                      <button onClick={() => handleDelete(tx.id)} disabled={deletingId===tx.id} className="w-icon-sm h-icon-sm flex items-center justify-center rounded-pill hover:bg-page-bg dark:hover:bg-dark-bg transition-colors flex-shrink-0">
                        <Trash2 size={13} className="text-text-disabled" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <button onClick={() => router.push("/add")}
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary rounded-pill flex items-center justify-center active:scale-95 transition-transform z-20 shadow-primary">
        <Plus size={24} className="text-white" strokeWidth={2.5} />
      </button>

      <BottomNav active="home" />
    </div>
  );
}
