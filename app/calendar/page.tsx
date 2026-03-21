"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Transaction, getCategoryEmoji } from "@/types";
import { getTransactions, formatKRW, getMonthKey, getMonthLabel } from "@/lib/storage";
import BottomNav from "@/components/BottomNav";

function addMonths(date: Date, n: number) { const d = new Date(date); d.setMonth(d.getMonth()+n); return d; }

export default function CalendarPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getTransactions().then(txs => { setTransactions(txs); setLoading(false); }); }, []);

  const monthKey = getMonthKey(currentMonth);
  const monthlyTxs = useMemo(() => transactions.filter(t=>t.date.startsWith(monthKey)), [transactions, monthKey]);

  const dayMap = useMemo(() => {
    const map: Record<string,{income:number;expense:number;txs:Transaction[]}> = {};
    monthlyTxs.forEach(t => {
      if (!map[t.date]) map[t.date] = {income:0,expense:0,txs:[]};
      if (t.type==="income") map[t.date].income+=t.amount;
      else map[t.date].expense+=t.amount;
      map[t.date].txs.push(t);
    });
    return map;
  }, [monthlyTxs]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear(), month = currentMonth.getMonth();
    const firstDay = new Date(year,month,1).getDay();
    const daysInMonth = new Date(year,month+1,0).getDate();
    const days: (number|null)[] = [];
    for (let i=0; i<firstDay; i++) days.push(null);
    for (let i=1; i<=daysInMonth; i++) days.push(i);
    return days;
  }, [currentMonth]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const getDateStr = (day: number) => `${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  const selectedTxs = selectedDate ? (dayMap[selectedDate]?.txs ?? []) : [];

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

      <div className="px-page pt-gap-lg">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mb-gap-sm">
          {["일","월","화","수","목","금","토"].map((d,i) => (
            <div key={d} className={`text-center text-label font-medium py-1 ${i===0?"text-expense":i===6?"text-primary":"text-text-muted"}`}>{d}</div>
          ))}
        </div>

        {/* 달력 */}
        <div className="grid grid-cols-7 gap-1 mb-gap-lg">
          {calendarDays.map((day,i) => {
            if (!day) return <div key={`e-${i}`}/>;
            const dateStr = getDateStr(day);
            const data = dayMap[dateStr];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const dow = i % 7;
            return (
              <button key={dateStr} onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`flex flex-col items-center py-1.5 px-0.5 rounded-item transition-all ${isSelected?"bg-primary":isToday?"bg-primary/10 dark:bg-primary/20":"hover:bg-page-bg dark:hover:bg-dark-bg"}`}>
                <span className={`text-label font-medium ${isSelected?"text-white":isToday?"text-primary":dow===0?"text-expense":dow===6?"text-primary":"text-ink dark:text-white"}`}>
                  {day}
                </span>
                {data && (
                  <div className="flex flex-col items-center w-full mt-0.5">
                    {data.income>0 && <span className={`text-[9px] font-medium truncate w-full text-center ${isSelected?"text-green-200":"text-income"}`}>+{Math.round(data.income/1000)}K</span>}
                    {data.expense>0 && <span className={`text-[9px] font-medium truncate w-full text-center ${isSelected?"text-red-200":"text-expense"}`}>-{Math.round(data.expense/1000)}K</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 선택된 날짜 내역 */}
        {selectedDate && (
          <div className="bg-surface dark:bg-dark-card rounded-card shadow-card overflow-hidden">
            <p className="text-caption font-medium text-text-muted px-card pt-card pb-gap-sm">
              {parseInt(selectedDate.split("-")[1])}월 {parseInt(selectedDate.split("-")[2])}일
            </p>
            {selectedTxs.length === 0 ? (
              <p className="text-body text-text-disabled px-card pb-card">내역이 없어요</p>
            ) : (
              selectedTxs.map((tx,i) => (
                <div key={tx.id} className={`flex items-center px-card py-item ${i<selectedTxs.length-1?"border-b border-border dark:border-dark-border":""}`}>
                  <div className="w-icon h-icon rounded-pill bg-page-bg dark:bg-dark-bg flex items-center justify-center text-body mr-gap flex-shrink-0">{getCategoryEmoji(tx.category)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-medium text-ink dark:text-white truncate">{tx.description}</p>
                    <p className="text-label text-text-muted mt-0.5">{tx.category}</p>
                  </div>
                  <p className={`text-body font-semibold ${tx.type==="income"?"text-income":"text-expense"}`}>
                    {tx.type==="income"?"+":"-"}{formatKRW(tx.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <BottomNav active="calendar"/>
    </div>
  );
}
