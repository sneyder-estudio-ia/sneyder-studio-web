"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";

export default function AdminSidebar({ isMenuOpen, setIsMenuOpen }: { isMenuOpen: boolean; setIsMenuOpen: (val: boolean) => void }) {

  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
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
      } else {
        setUserProfile(null);
      }
    });
    
    return () => unsubscribe();
  }, []);

  return (
    <>
      <aside className={`fixed inset-y-0 left-0 z-[60] flex flex-col h-full w-64 lg:w-72 bg-[#0c1324] border-r border-[#45464d]/15 shadow-2xl transition-transform duration-500 ease-in-out ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex items-center gap-4 mb-6 pt-2">
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-slate-800 shrink-0">
              {user ? (
                <Image 
                  alt="Admin Avatar" 
                  src={userProfile?.avatar_url || user?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuBH_btGfHFWWHfApXWyzqu90p_2NBQZttyesQz6QlhsHASGNW17CG8J-xx8fF8jKJaPPfgtyTfolOPvAFnGM4gcX9ci9UmYI9bOziFWipLW0G_G3gtXXyBt4wq-ItmBSk5uKJraqJBEUPuv_ArRh18s3sVoJsjbr7ok9twnXcNobC6z0JiJlozlUbb6eL6KTjktk58yD7_vE1e63rOTk-xD7njqMy5SJaVxWwWikP2LOrMVuGfMcVTru4Wiih7wq_IOZ1WRsOIvKt0"}
                  width={40}
                  height={40}
                />
              ) : (
                <span className="material-symbols-outlined text-slate-500 text-2xl">person</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white text-sm truncate">
                {userProfile?.manager_name?.split(' ')[0] || user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || "Visitante"}
              </p>
              <p className="text-[10px] text-cyan-400 uppercase tracking-widest truncate">Administrador</p>
            </div>
          </div>
          <div className="flex justify-between items-center mb-10">

            <Link 
              href="/" 
              className="h-10 w-auto relative mr-4 bg-white/5 rounded-xl border border-white/10 overflow-hidden p-1.5 shadow-lg hover:scale-105 transition-all group"
            >
              <Image 
                src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png"
                alt="Sneyder Studio"
                width={150}
                height={32}
                className="h-full w-auto object-contain group-hover:brightness-110"
              />
            </Link>
            <button onClick={() => setIsMenuOpen(false)} className="md:hidden text-slate-500">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto pr-2 space-y-4 lg:space-y-6 custom-scrollbar" style={{ overscrollBehavior: 'contain' }}>
            <SidebarItem icon="home" label="Inicio" href="/" />
            <SidebarItem icon="person" label="Perfil de usuario" href="/admin/profile" active={pathname === "/admin/profile"} />
            <SidebarItem icon="admin_panel_settings" label="Administración" href="/admin" active={pathname === "/admin"} />
            <SidebarItem icon="visibility" label="Visitas" href="/admin/visitas" active={pathname === "/admin/visitas"} />
            <SidebarItem icon="group" label="Usuarios" href="/admin/users" active={pathname === "/admin/users"} />
            <SidebarItem icon="settings_suggest" label="Ajuste Admin" href="/admin/settings" active={pathname === "/admin/settings"} />
            <SidebarItem icon="shopping_cart" label="Mis pedidos" href="/mis-pedidos" active={pathname === "/mis-pedidos"} />
            <SidebarItem icon="build" label="Servicios" href="/servicios" active={pathname === "/servicios"} />
            <SidebarItem icon="psychology" label="Modelo de IA" href="/ia-models" active={pathname === "/ia-models"} />
            <SidebarItem icon="mail" label="Contacto" href="/contacto" active={pathname === "/contacto"} />
            <div className="pt-2 text-slate-500 font-headline text-[10px] uppercase tracking-widest">Legal</div>
            <SidebarItem icon="policy" label="Políticas" href="/politicas" />
            <SidebarItem icon="gavel" label="Términos" href="/terminos" />
            <SidebarItem icon="description" label="Contrato" href="/contrato" />
            <SidebarItem icon="info" label="Nosotros" href="/nosotros" />
          </nav>
        </div>
      </aside>

      {/* Overlay ONLY for mobile (sm) - Tablets (md) and up can see both */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-[55] backdrop-blur-sm md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </>
  );
}

function SidebarItem({ icon, label, href, active = false }: { icon: string; label: string; href: string; active?: boolean }) {
  return (
    <Link 
      href={href}
      className={`flex items-center gap-4 p-2 rounded cursor-pointer transition-all font-headline text-xs lg:text-sm uppercase tracking-widest ${
        active 
          ? "text-[#2fd9f4] border-l-2 border-[#2fd9f4] bg-tertiary/5 pl-4" 
          : "text-slate-500 hover:text-[#89ceff] hover:bg-[#0c1324]/50"
      }`}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}



