"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun, Bell, RefreshCw, ChevronRight, Sparkles } from "lucide-react";
import { getTheme, setTheme } from "@/lib/theme";
import BottomNav from "@/components/BottomNav";

export default function SettingsPage() {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [notif, setNotif] = useState(false);

  useEffect(() => {
    setDark(getTheme() === "dark");
    if ("Notification" in window) setNotif(Notification.permission === "granted");
  }, []);

  const toggleDark = () => { const next = !dark; setDark(next); setTheme(next ? "dark" : "light"); };
  const requestNotif = async () => { const r = await Notification.requestPermission(); setNotif(r === "granted"); };

  const Row = ({ icon, label, onClick, children }: { icon: React.ReactNode; label: string; onClick?: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} className="w-full flex items-center justify-between px-card py-item border-b border-border dark:border-dark-border last:border-0 hover:bg-page-bg dark:hover:bg-dark-bg transition-colors">
      <div className="flex items-center gap-gap">
        <div className="w-icon h-icon rounded-pill bg-page-bg dark:bg-dark-bg flex items-center justify-center text-text-secondary">
          {icon}
        </div>
        <span className="text-subtitle text-ink dark:text-white">{label}</span>
      </div>
      {children}
    </button>
  );

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-page-bg dark:bg-dark-bg">
      <div className="bg-surface dark:bg-dark-card px-page pt-14 pb-card sticky top-0 z-10 shadow-card">
        <h1 className="text-title text-ink dark:text-white">설정</h1>
      </div>

      <div className="px-page pt-gap-lg space-y-gap">
        <div className="bg-surface dark:bg-dark-card rounded-card shadow-card overflow-hidden">
          <p className="text-label font-medium text-text-muted px-card pt-card pb-gap-sm">화면</p>
          <Row icon={dark ? <Moon size={16}/> : <Sun size={16}/>} label="다크모드">
            <button onClick={toggleDark} className={`relative w-12 h-6 rounded-pill transition-colors ${dark ? "bg-primary" : "bg-border"}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-pill shadow transition-transform ${dark ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </Row>
        </div>

        <div className="bg-surface dark:bg-dark-card rounded-card shadow-card overflow-hidden">
          <p className="text-label font-medium text-text-muted px-card pt-card pb-gap-sm">알림</p>
          <Row icon={<Bell size={16}/>} label="푸시 알림">
            {notif
              ? <span className="text-caption text-income font-medium">허용됨</span>
              : <button onClick={requestNotif} className="px-gap py-1.5 bg-primary text-white text-caption font-medium rounded-pill">허용하기</button>
            }
          </Row>
        </div>

        <div className="bg-surface dark:bg-dark-card rounded-card shadow-card overflow-hidden">
          <p className="text-label font-medium text-text-muted px-card pt-card pb-gap-sm">기능</p>
          <Row icon={<RefreshCw size={16}/>} label="반복 내역" onClick={() => router.push("/recurring")}>
            <ChevronRight size={16} className="text-text-disabled"/>
          </Row>
          <Row icon={<Sparkles size={16}/>} label="AI 소비 분석" onClick={() => router.push("/ai")}>
            <ChevronRight size={16} className="text-text-disabled"/>
          </Row>
        </div>

        <p className="text-center text-label text-text-disabled py-gap-lg">용돈 기입장 v1.0.0</p>
      </div>

      <BottomNav active="settings" />
    </div>
  );
}
