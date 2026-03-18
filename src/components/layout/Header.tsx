"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { ChevronDown, Sprout, LogOut, User } from "lucide-react";
import { getCurrentFiscalYear } from "@/lib/utils";
import { useYearStore } from "@/lib/stores/yearStore";

export function Header() {
  const { data: session } = useSession();
  const { year, setYear } = useYearStore();
  const currentYear = getCurrentFiscalYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#2d6a4f] text-white shadow-md">
      <div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-14">
        {/* ロゴ */}
        <div className="flex items-center gap-2">
          <Sprout size={22} />
          <span className="font-bold text-lg tracking-wide">のうち管理</span>
        </div>

        <div className="flex items-center gap-3">
          {/* 年度選択 */}
          <div className="relative">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="appearance-none bg-[#1b4332] text-white text-sm rounded-lg px-3 py-1.5 pr-7 cursor-pointer border border-[#52b788] focus:outline-none"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}年度
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
            />
          </div>

          {/* ユーザーメニュー */}
          {session && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-1 bg-[#1b4332] rounded-full p-1.5 touch-target"
              >
                <User size={18} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-10 bg-white text-gray-800 rounded-xl shadow-xl w-44 py-2 border border-gray-100">
                  <div className="px-4 py-2 text-sm font-medium border-b border-gray-100">
                    {session.user?.name ?? session.user?.email}
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    ログアウト
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
