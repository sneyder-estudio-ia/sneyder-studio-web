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

export default function TerminosPage() {
  const [data, setData] = useState<any>(legalData.terminos);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const loadContent = async () => {
      const settings = await getAdminSettings();
      if (settings.terms_content) {
        setData((prev: any) => ({
          ...prev,
          content: settings.terms_content
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

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
    setIsMenuOpen(false);
  };

  return (
    <div className="text-on-background selection:bg-tertiary/30 selection:text-tertiary min-h-screen bg-background relative overflow-x-hidden">
      <header className={`fixed top-0 w-full z-60 bg-[#0c1324] border-b border-slate-800 flex justify-between items-center px-6 h-16 shadow-xl transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-80" : "pl-0"}`}>
        <div className="flex items-center gap-2">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-800/50 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </Link>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
          <h2 className="text-white font-headline text-sm md:text-base font-bold uppercase tracking-wider truncate max-w-[200px] md:max-w-none">
            {data.title}
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          {!user && (
            <Link href="/" className="bg-tertiary/10 border border-tertiary/50 text-tertiary px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-tertiary hover:text-on-tertiary transition-all">Acceder</Link>
          )}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-cyan-400 hover:bg-slate-800 p-2 rounded-full transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">more_vert</span>
          </button>
        </div>
      </header>

      <aside className={`fixed left-0 top-0 z-[70] h-[100dvh] w-80 bg-[#0c1324] border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out font-headline text-slate-200 overflow-hidden ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-8 flex flex-col gap-2">
           <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-slate-800">
                <Image 
                  src={userProfile?.avatar_url || user?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuBH_btGfHFWWHfApXWyzqu90p_2NBQZttyesQz6QlhsHASGNW17CG8J-xx8fF8jKJaPPfgtyTfolOPvAFnGM4gcX9ci9UmYI9bOziFWipLW0G_G3gtXXyBt4wq-ItmBSk5uKJraqJBEUPuv_ArRh18s3sVoJsjbr7ok9twnXcNobC6z0JiJlozlUbb6eL6KTjktk58yD7_vE1e63rOTk-xD7njqMy5SJaVxWwWikP2LOrMVuGfMcVTru4Wiih7wq_IOZ1WRsOIvKt0"} 
                  alt="User" 
                  width={48} 
                  height={48} 
                />
            </div>
            <div><p className="font-bold text-white truncate">{userProfile?.manager_name?.split(' ')[0] || user?.displayName?.split(' ')[0] || "Visitante"}</p></div>
           </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 space-y-1">
          <NavItem icon="home" label="Inicio" href="/" />
          <div className="pt-6 pb-2 px-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Legal</div>
          <NavItem icon="policy" label="Política y condiciones" href="/politicas" small />
          <NavItem icon="gavel" label="Términos de servicio" href="/terminos" active small />
          <NavItem icon="description" label="Contrato de servicios" href="/contrato" small />
          <NavItem icon="info" label="Acerca de nosotros" href="/nosotros" small />
        </nav>
      </aside>

      {isMenuOpen && <div className="fixed inset-0 bg-black/40 z-[65] backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />}

      <main className={`transition-all duration-300 min-h-screen pb-20 pt-16 ${isMenuOpen ? "pl-0 lg:pl-80" : "pl-0"}`}>
        <div className="max-w-7xl mx-auto px-2 md:px-6 py-6 md:py-12">
          <div className="mb-12 text-center">
            <p className="text-cyan-400/60 text-[10px] uppercase tracking-[0.4em] font-bold">Documentación Legal • Sneyder Studio</p>
          </div>

          <div className="bg-surface-container-low border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.4)] p-4 md:p-12 lg:p-16 rounded-[2rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
              <span className="material-symbols-outlined text-[10rem]">description</span>
            </div>
            
            <div 
              className="rich-text-content legal-content-renderer"
              dangerouslySetInnerHTML={{ 
                __html: data.content?.includes('<') 
                  ? data.content 
                  : data.content
                      .replace(/\n\s*#\s*(.*)/g, '<h1 class="text-white">$1</h1>')
                      .replace(/\n\s*##\s*(.*)/g, '<h2 class="text-white">$1</h2>')
                      .replace(/\n/g, '<br/>') 
              }} 
            />
          </div>

          <div className="mt-12 flex flex-col items-center gap-2">
            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Última actualización: {data.lastUpdated}</p>
            <div className="flex items-center gap-3 text-slate-600 text-[9px] font-bold uppercase tracking-[0.2em] mt-4 pt-6 border-t border-white/5 w-full justify-between">
              <p>Sneyder Studio © 2026</p>
              <p>Seguridad Jurídica</p>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .legal-content-renderer {
          color: #94a3b8;
          line-height: 1.8;
        }
        .legal-content-renderer h1 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 2.5rem;
          font-weight: 900;
          margin-bottom: 2rem;
          color: white;
          border-bottom: 2px solid rgba(47, 217, 244, 0.1);
          padding-bottom: 0.75rem;
        }
        .legal-content-renderer h2 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 3rem;
          margin-bottom: 1.25rem;
          color: white;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .legal-content-renderer h2::before {
          content: "";
          width: 1.5rem;
          height: 1px;
          background: #2fd9f4;
          opacity: 0.5;
        }
        .legal-content-renderer p {
          margin-bottom: 1.5rem;
          font-size: 1rem;
        }
        .legal-content-renderer strong, .legal-content-renderer b {
          color: white;
          font-weight: 800;
        }
        .legal-content-renderer ul {
          list-style-type: disc;
          margin-left: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .legal-content-renderer ol {
          list-style-type: decimal;
          margin-left: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .legal-content-renderer li {
          margin-bottom: 0.5rem;
        }
      `}</style>
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


