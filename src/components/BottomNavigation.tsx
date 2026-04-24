"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { icon: "home", label: "Inicio", href: "/" },
  { icon: "psychology", label: "Modelo IA", href: "/ia-models" },
  { icon: "shopping_bag", label: "Mis Pedidos", href: "/mis-pedidos" },
  { icon: "person", label: "Perfil", href: "/profile" },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-lg z-[100] h-16 bg-[#0a0f1d]/60 backdrop-blur-2xl border border-white/10 flex justify-around items-center px-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center justify-center w-full h-full group transition-all duration-500`}
          >
            <div className={`relative flex flex-col items-center justify-center transition-all duration-500 ${
              isActive ? "text-tertiary -translate-y-1" : "text-slate-500 hover:text-slate-300"
            }`}>
              {/* Active Background Glow */}
              {isActive && (
                <div className="absolute inset-0 w-10 h-10 bg-tertiary/20 rounded-full blur-xl -z-10 animate-pulse" />
              )}
              
              <span className={`material-symbols-outlined text-[26px] transition-all duration-500 ${
                isActive ? "fill-1 scale-110" : "scale-100"
              }`}>
                {item.icon}
              </span>
              
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1 transition-all duration-500 ${
                isActive ? "opacity-100 max-h-4" : "opacity-0 max-h-0 scale-75 overflow-hidden"
              }`}>
                {item.label}
              </span>

              {/* Active Indicator Bar */}
              <div className={`mt-1 h-0.5 rounded-full bg-tertiary transition-all duration-500 shadow-[0_0_10px_rgba(47,217,244,0.8)] ${
                isActive ? "w-4 opacity-100" : "w-0 opacity-0"
              }`} />
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
