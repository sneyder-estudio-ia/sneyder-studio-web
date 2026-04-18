"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: "Sneyder Admin",
    email: "admin@sneyder.studio",
    phone: "+34 600 000 000"
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.classList.add("menu-open");
      document.documentElement.classList.add("menu-open");
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.classList.remove("menu-open");
      document.documentElement.classList.remove("menu-open");
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.classList.remove("menu-open");
      document.documentElement.classList.remove("menu-open");
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const savedProfile = localStorage.getItem("sneyder_profile");
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("sneyder_profile", JSON.stringify(profile));
    alert("Configuración de identidad actualizada con éxito.");
  };

  const updateField = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-background text-on-surface selection:bg-tertiary/30 min-h-screen">
      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}</style>
      
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#0c1324] backdrop-blur-xl bg-opacity-60 shadow-[0px_20px_50px_rgba(12,19,36,0.4)] flex justify-between items-center px-4 md:px-6 py-4">
        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-[#89ceff] hover:bg-white/5 p-1 rounded transition-colors">
            <span className="material-symbols-outlined">{isMenuOpen ? "close" : "menu"}</span>
          </button>
          <Link href="/admin">
            <span className="text-lg md:text-xl font-bold tracking-tighter text-[#2fd9f4] font-headline uppercase">SNEYDER STUDIO</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border border-tertiary/20">
            <Image 
              alt="User profile avatar" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEuvLSphVUOtwaDyUT1sq8lcbsS0VkaMs8dw85lYH7LcPzWHNhbFtUBejOqqvc1TUuCQ95U4HoDeMIQB_vnf-XQVJKjqWQVOCSGCMX-zKKxu5iw38KhXWMyluljmJSheJTR-3mKAuASkH68qHyZmbCyRIeJ2ntiaAA009T5d1V4LFKgzHbezOnU2vsSSOhaiNvncl5Dl0JkfmF3HeKyQ_27602d2-ThKLx3NCvmfMIBrAi9G3LL6w4ViqlQc6TCacCviAsqzGOIUY" 
              width={40} 
              height={40} 
              className="object-cover"
            />
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] md:hidden"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}

      {/* NavigationDrawer */}
      <aside className={`fixed left-0 top-0 h-full z-[60] bg-[#0c1324] w-72 border-r border-[#45464d]/15 flex-col pt-24 px-4 transition-transform duration-300 md:translate-x-0 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-10 px-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center overflow-hidden">
            <Image 
              alt="Sneyder User" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0qoO0MVT8KlIafVqffdZNlgZKRI_eDLp-JRpWzIXcZOfHfBWubnZtry26kqLEne1FylgGmx62CB_lcFrH7iOly9mlhl01pWx9uwsufJgS8-G9vbZMOc_MV-Ulnk7ODWhhtgtMEZxwKHrdr3E5rUrGsGN7s0LKQ_KU6ciAC2afAkD0lv7O6Bq82MshfD0zMqpXVUpfahmkAYAMLztybDKKxLrxXG7aN7EvleLwshb0RlwaOCkgSnnl0BqDxSdAb68LaPIPB2eA6a4" 
              width={48} 
              height={48} 
            />
          </div>
          <div>
            <p className="text-[#2fd9f4] font-headline font-bold">Sneyder Admin</p>
            <p className="text-[#89ceff]/70 text-xs font-body">Sentinel Level 4</p>
          </div>
        </div>
        <nav className="space-y-2">
          <Link href="/" onClick={() => setIsMenuOpen(false)}>
            <div className="flex items-center gap-3 px-4 py-3 text-[#89ceff]/70 hover:text-[#2fd9f4] hover:bg-[#2fd9f4]/5 transition-all duration-200 cursor-pointer">
              <span className="material-symbols-outlined">home</span>
              <span className="text-sm font-body">Inicio</span>
            </div>
          </Link>
          <Link href="/admin/profile" onClick={() => setIsMenuOpen(false)}>
            <div className="flex items-center gap-3 px-4 py-3 text-[#2fd9f4] font-bold border-l-2 border-[#2fd9f4] bg-[#2fd9f4]/5 transition-all duration-200">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              <span className="text-sm">Perfil</span>
            </div>
          </Link>
          <Link href="/admin/products" onClick={() => setIsMenuOpen(false)}>
            <div className="flex items-center gap-3 px-4 py-3 text-[#89ceff]/70 hover:text-[#2fd9f4] hover:bg-[#2fd9f4]/5 transition-all duration-200 cursor-pointer">
              <span className="material-symbols-outlined">shopping_bag</span>
              <span className="text-sm font-body">Productos CMS</span>
            </div>
          </Link>
          <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
            <div className="flex items-center gap-3 px-4 py-3 text-[#89ceff]/70 hover:text-[#2fd9f4] hover:bg-[#2fd9f4]/5 transition-all duration-200 cursor-pointer">
              <span className="material-symbols-outlined">admin_panel_settings</span>
              <span className="text-sm font-body">Administración</span>
            </div>
          </Link>
          <a className="flex items-center gap-3 px-4 py-3 text-[#89ceff]/70 hover:text-[#2fd9f4] hover:bg-[#2fd9f4]/5 transition-all duration-200" href="#">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-sm font-body">Ajustes</span>
          </a>
        </nav>
      </aside>

      {/* Main Content Canvas */}
      <main className="min-h-screen pt-20 md:pt-24 pb-32 md:pl-80 px-4 md:px-6 max-w-7xl mx-auto overflow-x-hidden transition-all duration-300">
        
        {/* Profile Header Section */}
        <section className="relative mb-8 md:mb-12">
          <div className="h-32 md:h-48 w-full bg-surface-container-low rounded-lg overflow-hidden relative mb-12 md:mb-16">
            <Image 
              className="w-full h-full object-cover opacity-40 mix-blend-overlay" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWDP06L30_s7j8tyl-Q8slpQbSPPGp4JPrS25Ek4MweAd5qhA_lglgsP7XLTvU8LQ4j2U3tlzAEwGIrfwTsHS8DUSZvGHks1pDylbWM4lnRq3A59dZa-l2SKH-D6R1KtRQhY1YZvgc-KEhYv-ZErqHp6znm9EpGJ6gyOaokLBFFtMKkJ2kaMTwHVcxmN5wOTRL7PoDZwVDZ97qSDJa7QHh9YJ4Mr9ipIWuBLl46RiofXiFkig1oopsV9LPSaPrAF98AeTHsm0t8yU" 
              alt="Profile Header"
              fill
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
          </div>
          <div className="absolute -bottom-8 md:-bottom-10 left-4 md:left-8 flex items-end gap-4 md:gap-6 w-full pr-4">
            <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-lg bg-surface-container-high border-4 border-background shadow-2xl overflow-hidden relative group">
              <Image 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXxm6GpFVn-3UahttBPpjPnBxXvs5gvA2m_CGOmUrPrX_NUG4ABfJ5ocnEVzmwbZZZyVwdRBliPccV5vdp8tw0a1Y_kRPD4hrFGjI9ja5VxnQ3rGRUyLHbXu73Qc7Q12_GtXwhgdu9adj4mN5kw-EAQEb8sxhxk0jEscIZiKRsgOJBVB_9YLyOBCmr_ZcaRDMxZzqQBCdj1WfafDDzFFC-eOFL2XcTnPOZ6eupNpyaT6LfSfavXITZL4j9BToTL5eO6VqhGdBfSEA"
                alt="Profile Avatar"
                fill
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-white">photo_camera</span>
              </div>
            </div>
            <div className="pb-2 overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                <h1 className="text-xl md:text-3xl font-bold tracking-tight text-on-surface truncate">{profile.name}</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-tertiary/10 text-tertiary border border-tertiary/20">SENTINEL</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse flex-shrink-0"></div>
                <p className="text-xs md:text-sm text-on-surface-variant font-medium uppercase tracking-[0.1em] md:tracking-[0.2em] truncate">Sentinel Level 4</p>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid Layout for Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 mt-12 md:mt-16">
          {/* Left Column: Form */}
          <div className="lg:col-span-7 space-y-6 md:space-y-8">
            <div className="bg-surface-container-low rounded-lg p-5 md:p-8 relative overflow-hidden group">
              {/* Subtle AI Inner Glow */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
              <h2 className="text-lg md:text-xl font-bold mb-6 md:mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">edit_square</span>
                Configuración de Identidad
              </h2>
              <form onSubmit={handleSave} className="space-y-8 md:space-y-10">
                <div className="relative">
                  <input 
                    className="block w-full bg-transparent border-0 border-b border-outline-variant/30 px-0 py-2.5 text-on-surface focus:ring-0 focus:border-primary transition-colors peer placeholder-transparent text-sm md:text-base" 
                    id="name" 
                    placeholder="Nombre completo" 
                    type="text" 
                    value={profile.name}
                    onChange={(e) => updateField("name", e.target.value)}
                  />
                  <label className="absolute text-xs md:text-sm text-on-surface-variant duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 peer-focus:text-primary" htmlFor="name">Nombre completo</label>
                </div>
                <div className="relative">
                  <input 
                    className="block w-full bg-transparent border-0 border-b border-outline-variant/30 px-0 py-2.5 text-on-surface focus:ring-0 focus:border-primary transition-colors peer placeholder-transparent text-sm md:text-base" 
                    id="email" 
                    placeholder="Correo electrónico" 
                    type="email" 
                    value={profile.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                  <label className="absolute text-xs md:text-sm text-on-surface-variant duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 peer-focus:text-primary" htmlFor="email">Correo electrónico</label>
                </div>
                <div className="relative">
                  <input 
                    className="block w-full bg-transparent border-0 border-b border-outline-variant/30 px-0 py-2.5 text-on-surface focus:ring-0 focus:border-primary transition-colors peer placeholder-transparent text-sm md:text-base" 
                    id="phone" 
                    placeholder="Número de teléfono" 
                    type="tel" 
                    value={profile.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                  <label className="absolute text-xs md:text-sm text-on-surface-variant duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 peer-focus:text-primary" htmlFor="phone">Número de teléfono</label>
                </div>
                <div className="pt-4 flex justify-end">
                  <button className="w-full md:w-auto bg-tertiary text-on-tertiary px-8 py-3 rounded-sm font-bold tracking-tight hover:shadow-[0_0_20px_rgba(47,217,244,0.3)] transition-all duration-300 active:scale-95 text-sm" type="submit">
                    GUARDAR CAMBIOS
                  </button>
                </div>
              </form>
            </div>
            {/* Danger Zone */}
            <div className="bg-error-container/10 rounded-lg p-5 md:p-8 border border-error-container/20">
              <h2 className="text-lg md:text-xl font-bold mb-4 text-error flex items-center gap-2">
                <span className="material-symbols-outlined">warning</span>
                Zona de Peligro
              </h2>
              <p className="text-on-surface-variant text-xs md:text-sm mb-6 max-w-md">
                Una vez que elimines tu cuenta de Sentinel, no habrá vuelta atrás. Todos tus datos de inteligencia y contratos se perderán permanentemente.
              </p>
              <button className="w-full md:w-auto bg-transparent border border-error text-error px-6 py-2.5 rounded-sm text-xs font-bold hover:bg-error hover:text-on-error transition-all duration-300">
                ELIMINAR CUENTA DEFINITIVAMENTE
              </button>
            </div>
          </div>
          {/* Right Column: Contracts & Activity */}
          <div className="lg:col-span-5 space-y-6 md:space-y-8">
            <div className="bg-surface-container-high rounded-lg p-5 md:p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
              <h2 className="text-lg md:text-xl font-bold mb-6 md:mb-8 relative">Contratos Vigentes</h2>
              <div className="space-y-4 md:space-y-6 relative">
                {/* Contract 1 */}
                <div className="flex items-start justify-between p-3 md:p-4 bg-surface-container-low rounded border-l-4 border-tertiary">
                  <div className="max-w-[70%]">
                    <h3 className="font-bold text-on-surface text-sm md:text-base truncate">Servicio de IA Gabriel</h3>
                    <p className="text-[10px] md:text-xs text-on-surface-variant mt-1">ID: #GAB-8802-AI</p>
                  </div>
                  <span className="px-2 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] font-bold bg-tertiary/10 text-tertiary uppercase tracking-wider">Activo</span>
                </div>
                {/* Contract 2 */}
                <div className="flex items-start justify-between p-3 md:p-4 bg-surface-container-low rounded border-l-4 border-outline-variant">
                  <div className="max-w-[65%]">
                    <h3 className="font-bold text-on-surface text-sm md:text-base truncate">Ciberseguridad Quantum</h3>
                    <p className="text-[10px] md:text-xs text-on-surface-variant mt-1">ID: #QNT-1144-SEC</p>
                  </div>
                  <span className="px-2 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] font-bold bg-surface-variant text-on-surface-variant uppercase tracking-wider text-center">Pendiente</span>
                </div>
                {/* Contract 3 */}
                <div className="flex items-start justify-between p-3 md:p-4 bg-surface-container-low rounded border-l-4 border-tertiary">
                  <div className="max-w-[70%]">
                    <h3 className="font-bold text-on-surface text-sm md:text-base truncate">Nexo Neural Enterprise</h3>
                    <p className="text-[10px] md:text-xs text-on-surface-variant mt-1">ID: #NEX-0021-SYS</p>
                  </div>
                  <span className="px-2 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] font-bold bg-tertiary/10 text-tertiary uppercase tracking-wider">Activo</span>
                </div>
              </div>
              <button className="w-full mt-6 md:mt-8 py-3 text-xs md:text-sm font-bold text-[#89ceff] hover:text-[#2fd9f4] transition-colors border border-[#45464d]/15 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm md:text-base">history</span>
                VER HISTORIAL COMPLETO
              </button>
            </div>
            {/* Stats Module */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="bg-surface-container rounded-lg p-4 md:p-6 flex flex-col items-center justify-center text-center">
                <span className="text-xl md:text-2xl font-bold text-tertiary font-headline">12</span>
                <span className="text-[9px] md:text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Sesiones Activas</span>
              </div>
              <div className="bg-surface-container rounded-lg p-4 md:p-6 flex flex-col items-center justify-center text-center">
                <span className="text-xl md:text-2xl font-bold text-primary font-headline">99.8%</span>
                <span className="text-[9px] md:text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Sync de Datos</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* BottomNavBar (Mobile only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0c1324]/80 backdrop-blur-2xl border-t border-[#45464d]/15 flex justify-around items-center pb-6 pt-2 z-50">
        <Link href="/">
          <div className="flex flex-col items-center text-[#89ceff]/50 pt-2 transition-transform scale-95 active:scale-90">
            <span className="material-symbols-outlined">home</span>
            <span className="font-body text-[10px] uppercase tracking-widest mt-1">Inicio</span>
          </div>
        </Link>
        <Link href="/admin">
          <div className="flex flex-col items-center text-[#89ceff]/50 pt-2 transition-transform scale-95 active:scale-90">
            <span className="material-symbols-outlined">grid_view</span>
            <span className="font-body text-[10px] uppercase tracking-widest mt-1">Panel</span>
          </div>
        </Link>
        <Link href="/admin/products">
          <div className="flex flex-col items-center text-[#89ceff]/50 pt-2 transition-transform scale-95 active:scale-90">
            <span className="material-symbols-outlined">insights</span>
            <span className="font-body text-[10px] uppercase tracking-widest mt-1">Insights</span>
          </div>
        </Link>
        <Link href="/admin/profile">
          <div className="flex flex-col items-center text-[#2fd9f4] border-t-2 border-[#2fd9f4] pt-2 transition-transform scale-95 active:scale-90">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
            <span className="font-body text-[10px] uppercase tracking-widest mt-1">Perfil</span>
          </div>
        </Link>
        <a className="flex flex-col items-center text-[#89ceff]/50 pt-2 transition-transform scale-95 active:scale-90" href="#">
          <span className="material-symbols-outlined">more_horiz</span>
          <span className="font-body text-[10px] uppercase tracking-widest mt-1">Más</span>
        </a>
      </nav>
    </div>
  );
}
