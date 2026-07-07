"use client";

import Link from "next/link";
import { useTranslation, useAuth, STUB_USERS } from "@/app/providers";
import { useState } from "react";

export function Navbar() {
  const { t, locale, setLocale } = useTranslation();
  const { userId, role, userName, switchUser } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-lg font-bold text-indigo-600">
          {t("common.appName")}
        </Link>
        <Link
          href="/"
          className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
        >
          {t("nav.courses")}
        </Link>
        <Link
          href="/saved"
          className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
        >
          {t("nav.saved")}
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setLocale(locale === "en" ? "es" : "en")}
          className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
        >
          {t("nav.switchLang")}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 text-sm bg-gray-100 rounded-full px-3 py-1.5 hover:bg-gray-200 transition-colors"
          >
            <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-medium">
              {userName[0]}
            </span>
            <span>{userName}</span>
            <span className="text-xs text-gray-400">({role})</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-56 z-20">
              <p className="px-3 py-1.5 text-xs text-gray-400 uppercase">
                {t("auth.switchUser")}
              </p>
              {STUB_USERS.map((u) => (
                <button
                  key={u.userId}
                  onClick={() => {
                    switchUser(u.userId, u.role, u.name);
                    setShowUserMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between ${
                    u.userId === userId ? "bg-indigo-50 text-indigo-700" : ""
                  }`}
                >
                  <span>{u.name}</span>
                  <span className="text-xs text-gray-400">{u.role}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
