"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { TransactionType, EXPENSE_CATEGORIES, INCOME_CATEGORIES, Transaction } from "@/types";
import { addTransaction } from "@/lib/storage";

export default function AddPage() {
  const router = useRouter();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("식비");
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;
  });

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleTypeChange = (t: TransactionType) => {
    setType(t);
    setCategory(t === "expense" ? "식비" : "용돈");
  };

  const displayAmount = amount ? new Intl.NumberFormat("ko-KR").format(parseInt(amount)) : "";

  const handleSubmit = async () => {
    if (!amount || parseInt(amount) <= 0 || !description || !date) return;
    setSaving(true);
    try {
      await addTransaction({ id: uuidv4(), type, amount: parseInt(amount), category, description, date, createdAt: Date.now() });
      router.push("/");
    } catch { alert("저장 중 오류가 발생했어요."); }
    finally { setSaving(false); }
  };

  const isValid = amount && parseInt(amount) > 0 && description.trim() && date;
  const activeColor = type === "expense" ? "text-expense" : "text-income";
  const activeBg    = type === "expense" ? "bg-expense"   : "bg-income";
  const activeBorder= type === "expense" ? "border-expense": "border-income";
  const activeLine  = type === "expense" ? "bg-expense"   : "bg-income";

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-surface dark:bg-dark-card flex flex-col">
      <div className="flex items-center px-page pt-14 pb-gap-lg">
        <button onClick={() => router.back()} className="w-icon h-icon flex items-center justify-center rounded-pill hover:bg-page-bg dark:hover:bg-dark-bg transition-colors mr-gap">
          <ChevronLeft size={22} className="text-ink dark:text-white" />
        </button>
        <h1 className="text-title text-ink dark:text-white">내역 추가</h1>
      </div>

      {/* 수입/지출 토글 */}
      <div className="px-page mb-gap-lg">
        <div className="flex bg-page-bg dark:bg-dark-bg rounded-card p-1">
          {(["expense","income"] as TransactionType[]).map(t => (
            <button key={t} onClick={() => handleTypeChange(t)}
              className={`flex-1 py-2.5 rounded-item text-body font-semibold transition-all ${
                type===t ? `bg-surface dark:bg-dark-card ${activeColor} shadow-card` : "text-text-muted"
              }`}>
              {t === "expense" ? "지출" : "수입"}
            </button>
          ))}
        </div>
      </div>

      {/* 금액 */}
      <div className="px-page mb-gap-lg">
        <p className="text-label text-text-muted mb-gap-sm font-medium">금액</p>
        <input type="text" inputMode="numeric" placeholder="0" value={displayAmount}
          onChange={e => setAmount(e.target.value.replace(/[^0-9]/g,""))}
          className="w-full text-amount-lg text-ink dark:text-white bg-transparent border-none outline-none placeholder:text-text-disabled" />
        <div className={`h-0.5 mt-gap-sm rounded-pill transition-colors ${amount ? activeLine : "bg-border dark:bg-dark-border"}`} />
      </div>

      {/* 내용 */}
      <div className="px-page mb-gap-lg">
        <p className="text-label text-text-muted mb-gap-sm font-medium">내용</p>
        <input type="text" placeholder="어디에 썼나요?" value={description} onChange={e => setDescription(e.target.value)}
          className="w-full text-subtitle text-ink dark:text-white bg-transparent border-none outline-none placeholder:text-text-disabled" />
        <div className={`h-0.5 mt-gap-sm rounded-pill transition-colors ${description ? activeLine : "bg-border dark:bg-dark-border"}`} />
      </div>

      {/* 날짜 */}
      <div className="px-page mb-gap-lg">
        <p className="text-label text-text-muted mb-gap-sm font-medium">날짜</p>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="w-full text-subtitle text-ink dark:text-white bg-transparent border-none outline-none" />
        <div className="h-0.5 mt-gap-sm rounded-pill bg-border dark:bg-dark-border" />
      </div>

      {/* 카테고리 */}
      <div className="px-page mb-section">
        <p className="text-label text-text-muted mb-gap font-medium">카테고리</p>
        <div className="grid grid-cols-3 gap-gap">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className={`flex items-center justify-center gap-gap-sm px-gap py-gap-lg rounded-card text-body font-medium transition-all border ${
                category===cat.id
                  ? `${activeBg} text-white ${activeBorder}`
                  : "bg-surface dark:bg-dark-card text-text-secondary border-border dark:border-dark-border"
              }`}>
              <span className="text-[16px]">{cat.emoji}</span>
              <span className="truncate">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="px-page mt-auto pb-10">
        <button onClick={handleSubmit} disabled={!isValid || saving}
          className={`w-full py-gap-lg rounded-card text-subtitle font-semibold transition-all flex items-center justify-center gap-gap ${
            isValid && !saving ? "bg-primary text-white active:scale-[0.98] shadow-primary" : "bg-page-bg dark:bg-dark-bg text-text-disabled cursor-not-allowed"
          }`}>
          {saving
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-pill animate-spin" />
            : <><Check size={18} strokeWidth={2.5} />저장하기</>
          }
        </button>
      </div>
    </div>
  );
}
