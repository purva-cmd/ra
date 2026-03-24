"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserSearch,
  Building2,
  Users,
  Activity,
  MessageSquare,
  Settings,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/enrich", label: "Enrich", icon: UserSearch },
  { href: "/discover", label: "Discover", icon: Building2 },
  { href: "/agents", label: "Agents", icon: Users },
  { href: "/chat", label: "Claude AI", icon: MessageSquare, highlight: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-gray-200">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-gray-900 text-sm">SMARTe</span>
          <span className="block text-[10px] text-gray-400 leading-tight">B2B Intelligence</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-3 pt-2 pb-1.5">
          Platform
        </p>
        {navItems.map(({ href, label, icon: Icon, highlight }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                highlight && !isActive && "text-brand-600 hover:bg-brand-50"
              )}
            >
              <Icon className={clsx("w-4 h-4", isActive ? "text-brand-600" : highlight ? "text-brand-500" : "text-gray-400")} />
              {label}
              {highlight && (
                <span className="ml-auto text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-semibold">
                  AI
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-3 pb-1.5">
            Account
          </p>
          <Link
            href="/settings"
            className={clsx(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === "/settings"
                ? "bg-brand-50 text-brand-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Settings className="w-4 h-4 text-gray-400" />
            Settings
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-green-500" />
          <span className="text-xs text-gray-500">API Connected</span>
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">229M+ contacts · 60M+ companies</p>
      </div>
    </aside>
  );
}
