"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { legalData } from "@/data/legalData";
import { getAdminSettings } from "@/lib/settings";

const ADMIN_EMAIL = "sneyder23081994@gmail.com";

export default function NosotrosPage() {
  const [data, setData] = useState<any>(legalData.nosotros);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const loadContent = async () => {
      const settings = await getAdminSettings();
      if (settings.about_us_content) {
        setData((prev: any) => ({
          ...prev,
          content: settings.about_us_content
        }));
      }
    };

    loadContent();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profileDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
          if (profileDoc.exists()) {
            setUserProfile(profileDoc.data());
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="text-on-background selection:bg-tertiary/30 selection:text-tertiary min-h-screen bg-background relative overflow-x-hidden">
      <header className={`fixed top-0 w-full z-60 bg-[#0c1324] border-b border-slate-800 flex justify-between items-center px-6 h-16 shadow-xl transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-80" : "pl-0"}`}>
        <div className="flex items-center gap-0">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-cyan-400 hover:bg-slate-800 p-1 rounded-full transition-colors">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
          <Link href="/" className="-ml-4 h-10 w-auto relative cursor-pointer hover:scale-105 transition-all bg-white/5 rounded-xl border border-white/10 overflow-hidden p-1.5 shadow-lg group">
            <Image
              src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png"
              alt="Sneyder Studio"
              width={140}
              height={28}
              className="h-full w-auto object-contain group-hover:brightness-110"
            />
          </Link>
        </div>
        {!user && (
          <Link href="/" className="bg-tertiary/10 border border-tertiary/50 text-tertiary px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-tertiary hover:text-on-tertiary transition-all">Acceder</Link>
        )}
      </header>

      <aside className={`fixed left-0 top-0 z-[70] h-[100dvh] w-80 bg-[#0c1324] border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out font-headline text-slate-200 overflow-hidden ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-8 flex flex-col gap-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-slate-800">
              <Image
                src={userProfile?.avatar_url || user?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuBH_btGfHFWWHfApXWyzqu90p_2NBQZttyesQz6QlhsHASGNW17CG8J-xx8fF8jKJaPPfgtyTfolOPvAFnGM4gcX9ci9UmYI9bOziFWipLW0G_G3gtXXyBt4wq-ItmBSk5uKJraqJBEUPuv_ArRh18s3sVoJsjbr7ok9twnXcNobC6z0JiJlozlUbb6eL6KTjktk58yD7_vE1e63rOTk-xD7njqMy5SJaVxWwWikP2LOrMVuGfMcVTru4Wiih7wq_IOZ1WRsOIvKt0"}
                alt="User" width={48} height={48}
              />
            </div>
            <div><p className="font-bold text-white truncate">{userProfile?.manager_name?.split(' ')[0] || user?.displayName?.split(' ')[0] || "Visitante"}</p></div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 space-y-1">
          <NavItem icon="home" label="Inicio" href="/" />
          <div className="pt-6 pb-2 px-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Legal</div>
          <NavItem icon="policy" label="Política y condiciones" href="/politicas" small />
          <NavItem icon="gavel" label="Términos de servicio" href="/terminos" small />
          <NavItem icon="description" label="Contrato de servicios" href="/contrato" small />
          <NavItem icon="info" label="Acerca de nosotros" href="/nosotros" active small />
        </nav>
      </aside>

      {isMenuOpen && <div className="fixed inset-0 bg-black/40 z-[65] backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />}

      <main className={`transition-all duration-300 min-h-screen pb-20 pt-24 ${isMenuOpen ? "pl-0 lg:pl-80" : "pl-0"}`}>
        <div className="max-w-4xl mx-auto px-6">
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span className="font-label text-[10px] font-bold tracking-[0.4em] uppercase text-cyan-400">Perfil Corporativo</span>
            </div>
            <h1 className="font-headline text-4xl md:text-5xl font-black text-white mb-4">
              Acerca de <span className="text-tertiary">Nosotros</span>
            </h1>
            <p className="text-slate-500 text-xs uppercase tracking-widest">Última actualización: {data.lastUpdated}</p>
          </header>

          <div className="bg-surface-container-low rounded-[2rem] border border-white/5 shadow-2xl p-8 md:p-16 space-y-8 prose prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: data.content.replace(/\n\s*##\s*(.*)/g, '<h2 class="text-white font-bold mt-12 mb-6 flex items-center gap-4"><span class="w-8 h-px bg-tertiary/30"></span>$1</h2>').replace(/\n/g, '<br/>') }} />
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, href, active = false, small = false }: { icon: string; label: string; href: string; active?: boolean; small?: boolean }) {
  return (
    <Link href={href} className={`flex items-center gap-4 px-4 py-3 transition-colors ${active ? "text-cyan-400 font-bold bg-slate-800/50" : "text-slate-400 hover:bg-slate-800 hover:text-white"} ${small ? "text-sm" : ""}`}>
      <span className="material-symbols-outlined">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}


