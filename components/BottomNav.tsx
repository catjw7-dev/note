"use client";

import { useRouter } from "next/navigation";
import { Home, BarChart2, CalendarDays, PiggyBank, Settings } from "lucide-react";

type Tab = "home" | "stats" | "budget" | "calendar" | "settings";

export default function BottomNav({ active }: { active: Tab }) {
  const router = useRouter();

  const tabs: { id: Tab; label: string; icon: React.ReactNode; path: string }[] = [
    { id: "home",     label: "홈",     icon: <Home size={20} />,        path: "/" },
    { id: "stats",    label: "통계",   icon: <BarChart2 size={20} />,   path: "/stats" },
    { id: "budget",   label: "예산",   icon: <PiggyBank size={20} />,   path: "/budget" },
    { id: "calendar", label: "캘린더", icon: <CalendarDays size={20} />, path: "/calendar" },
    { id: "settings", label: "설정",   icon: <Settings size={20} />,    path: "/settings" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center">
      <nav className="w-full max-w-[430px] bg-surface dark:bg-dark-card border-t border-border dark:border-dark-border">
        <div className="flex">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => router.push(tab.path)}
              className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
                active === tab.id ? "text-primary" : "text-text-muted"
              }`}>
              {tab.icon}
              <span className="text-label font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
        <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
      </nav>
    </div>
  );
}
