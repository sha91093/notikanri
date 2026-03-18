"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Calendar, CloudSun, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/map", icon: Map, label: "マップ" },
  { href: "/calendar", icon: Calendar, label: "カレンダー" },
  { href: "/weather", icon: CloudSun, label: "天気" },
  { href: "/diary", icon: BookOpen, label: "日誌" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-2xl mx-auto flex">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-3 gap-0.5 touch-target transition-colors",
                active
                  ? "text-[#2d6a4f] font-semibold"
                  : "text-gray-500 hover:text-[#52b788]"
              )}
            >
              <Icon
                size={24}
                strokeWidth={active ? 2.5 : 1.8}
                className={active ? "text-[#2d6a4f]" : ""}
              />
              <span className="text-xs">{label}</span>
              {active && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-[#2d6a4f] rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
