"use client";

import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { siteData as initialSiteData } from "@/data/siteData";

export default function Home() {
  const [data, setData] = useState(initialSiteData);
  const [sectionsOrder, setSectionsOrder] = useState(initialSiteData.sectionsOrder);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVideoLocked, setIsVideoLocked] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Toggle body scroll locking based on whether video is locked
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Unlock instantly if user reloads already scrolled down
    if (window.scrollY > 10) {
      setIsVideoLocked(false);
    }
    
    if (isVideoLocked) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isVideoLocked]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // If menu is open, let its scroll work normally
      if (document.body.classList.contains('menu-open')) return;

      if (isVideoLocked) {
        e.preventDefault();
        if (videoRef.current && videoRef.current.duration) {
          // Adjust scrub sensitivity for wheel (Slower)
          const newTime = videoRef.current.currentTime + (e.deltaY * 0.002);
          if (newTime >= videoRef.current.duration) {
             videoRef.current.currentTime = videoRef.current.duration;
             setIsVideoLocked(false);
          } else if (newTime <= 0) {
             videoRef.current.currentTime = 0;
          } else {
             videoRef.current.currentTime = newTime;
          }
          setIsScrolled(videoRef.current.currentTime > 0.5);
        }
      } else {
        // Unlock when scrolling back up
        if (window.scrollY <= 0 && e.deltaY < 0) {
           e.preventDefault();
           setIsVideoLocked(true);
           if (videoRef.current) {
             videoRef.current.currentTime = Math.max(0, videoRef.current.duration - 0.1); 
           }
        } else {
           setIsScrolled(window.scrollY > 50);
        }
      }
    };
    
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (document.body.classList.contains('menu-open')) return;

      if (isVideoLocked) {
        e.preventDefault();
        const deltaY = touchStartY - e.touches[0].clientY;
        touchStartY = e.touches[0].clientY;
        
        if (videoRef.current && videoRef.current.duration) {
          // Slower touch sensitivity
          const newTime = videoRef.current.currentTime + (deltaY * 0.006);
          if (newTime >= videoRef.current.duration) {
             videoRef.current.currentTime = videoRef.current.duration;
             setIsVideoLocked(false);
          } else if (newTime <= 0) {
             videoRef.current.currentTime = 0;
          } else {
             videoRef.current.currentTime = newTime;
          }
          setIsScrolled(videoRef.current.currentTime > 0.5);
        }
      } else {
        if (window.scrollY <= 0) {
          const deltaY = touchStartY - e.touches[0].clientY;
          if (deltaY < 0) { // dragging down at the top
             e.preventDefault();
             setIsVideoLocked(true);
             if (videoRef.current) {
                videoRef.current.currentTime = Math.max(0, videoRef.current.duration - 0.1);
             }
          }
        }
      }
    };
    
    const handleDefaultScroll = () => {
      if (!isVideoLocked) {
        setIsScrolled(window.scrollY > 50);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('scroll', handleDefaultScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('scroll', handleDefaultScroll);
    };
  }, [isVideoLocked]);

  useEffect(() => {
    const savedData = localStorage.getItem("sneyder_cms_data");
    const savedOrder = localStorage.getItem("sneyder_cms_order");
    if (savedData) setData(JSON.parse(savedData));
    if (savedOrder) setSectionsOrder(JSON.parse(savedOrder));
  }, []);

  return (
    <div className="text-on-background selection:bg-tertiary/30 selection:text-tertiary min-h-screen bg-background relative overflow-x-hidden">
      {/* TopAppBar */}
      <header className={`fixed top-0 w-full z-60 bg-[#0c1324] border-b border-slate-800 flex justify-between items-center px-6 h-16 shadow-[0px_2px_10px_rgba(0,0,0,0.5)] transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-80" : "pl-0"}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-cyan-400 hover:bg-slate-800 p-1 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <span className="text-lg font-black tracking-wider text-cyan-400 font-headline uppercase">Sneyder Studio</span>
        </div>
        <div className="h-8 w-8 rounded-full overflow-hidden bg-surface-container border border-cyan-400/30">
          <Image 
            alt="User Avatar" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCO8RUk1wD7WV7O7IKZ_NBnLhlsnuVdHeC9x_CyLRsEpavDT9Qu9rC4-F4JAFIMwExYTNXtPsW04RAgXxe2vZ_1xgd0Wpqlz62JTPKFItouFbiVzuuvaA3Jr4zodwxrF3k5SScHvPKbmmQvNvCnMsjMY1m7yzSHBq-NVdD2N3qaTUfNHCwYii6gD_VVnTZrwbjzB-EmuUn_Y4QYasiBWkPdcLN2PPRgr4tyrGNvjDYnaz1WSLw73itY4B6zTZAWRKzhDVirP2Wyrcw"
            width={32}
            height={32}
          />
        </div>
      </header>

      {/* NavigationDrawer */}
      <aside 
        className={`fixed left-0 top-0 z-[70] h-full w-80 bg-[#0c1324] border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out font-headline text-slate-200 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-8 flex flex-col gap-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <Image 
                alt="User Profile Avatar" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBH_btGfHFWWHfApXWyzqu90p_2NBQZttyesQz6QlhsHASGNW17CG8J-xx8fF8jKJaPPfgtyTfolOPvAFnGM4gcX9ci9UmYI9bOziFWipLW0G_G3gtXXyBt4wq-ItmBSk5uKJraqJBEUPuv_ArRh18s3sVoJsjbr7ok9twnXcNobC6z0JiJlozlUbb6eL6KTjktk58yD7_vE1e63rOTk-xD7njqMy5SJaVxWwWikP2LOrMVuGfMcVTru4Wiih7wq_IOZ1WRsOIvKt0"
                width={48}
                height={48}
              />
            </div>
            <div>
              <p className="font-bold text-white">User Name</p>
              <p className="text-xs text-cyan-400 uppercase tracking-widest">Premium Account</p>
            </div>
          </div>
          <div className="text-xl font-bold text-cyan-400 mb-8">Sneyder Studio</div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-1 scrollbar-hide">
          <NavItem icon="account_circle" label="Perfil de usuario" href="/" active />
          <NavItem icon="settings" label="Administración" href="/admin" />
          <NavItem icon="shopping_bag" label="Mis pedidos" href="/" />
          <NavItem icon="bolt" label="Servicios" href="/" />
          <NavItem icon="psychology" label="Modelo de IA" href="/" />
          <NavItem icon="mail" label="Contacto" href="/" />
          
          <div className="pt-6 pb-2 px-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Legal</div>
          <NavItem icon="policy" label="Política y condiciones" href="/" small />
          <NavItem icon="gavel" label="Términos de servicio" href="/" small />
          <NavItem icon="description" label="Contrato de servicios" href="/" small />
          
          <div className="pt-6 pb-2 px-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Empresa</div>
          <NavItem icon="info" label="Acerca de nosotros" href="/" small />
          <NavItem icon="language" label="Idioma" href="/" small className="mb-10" />
        </nav>
      </aside>

      {/* Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-[65] backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`transition-all duration-300 min-h-screen pb-20 pt-16 ${isMenuOpen ? "pl-0 lg:pl-80" : "pl-0"}`}>
        <div>
          {sectionsOrder.map((sectionId: string) => {
            if (sectionId === 'hero') return (
              <React.Fragment key="hero-fragment">
                {/* True Scroll-Locked Hero adaptativo */}
                <section key="hero" className="relative w-full min-h-[100dvh] overflow-hidden flex flex-col items-center justify-center bg-black">
                  
                  {/* Fondo de Video - top on mobile, absolute full-cover on desktop */}
                  <div className="w-full relative md:absolute md:inset-0 z-0 flex items-center justify-center bg-black shrink-0">
                    <video 
                      ref={videoRef}
                      src="/video/baner.mp4"
                      muted
                      playsInline
                      preload="auto"
                      className="w-full h-auto md:w-full md:h-full md:object-cover z-0"
                    />
                    {/* Subtle Dark Overlay solo visible si el texto se monta encima (Desktop) */}
                    <div className="hidden md:block absolute inset-0 bg-black/40 z-10 pointer-events-none" />

                    {/* Watermark Cover - Fuente Animada Derecha */}
                    <CodeFountain />
                  </div>
                  
                  {/* Contenedor Responsivo del Texto (Flujo normal en móvil, overlap en desktop) */}
                  <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 py-8 md:px-6 md:py-0 flex-1 w-full pointer-events-none">
                    <div className="w-full max-w-4xl space-y-6 md:space-y-8 animate-fade-in pointer-events-auto">
                        <div className="flex items-center justify-center gap-2 mb-2 md:mb-4">
                          <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse shadow-[0_0_10px_rgba(47,217,244,0.8)]"></span>
                          <span className="font-label text-[9px] md:text-[10px] font-bold tracking-[0.3em] uppercase text-tertiary">{data.hero.tagline}</span>
                        </div>
                        
                        {/* Responsive text size adjustments to prevent overflow */}
                        <h1 className="font-headline text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black leading-tight tracking-tighter text-white drop-shadow-2xl">
                          {data.hero.title.split(data.hero.titleHighlight)[0]}
                          <span className="text-tertiary">{data.hero.titleHighlight}</span>
                          {data.hero.title.split(data.hero.titleHighlight)[1]}
                        </h1>
                        
                        <p className="text-body text-base md:text-xl leading-relaxed text-slate-200 w-full max-w-2xl mx-auto drop-shadow-lg">
                          {data.hero.description}
                        </p>
                        
                        {/* Responsive buttons: stack on small screens */}
                        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                          <button className="bg-tertiary text-on-tertiary px-6 py-4 md:px-10 md:py-5 font-bold text-xs md:text-sm uppercase tracking-widest rounded-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(47,217,244,0.3)] w-full sm:w-auto">
                            {data.hero.primaryCta} <span className="material-symbols-outlined text-sm md:text-base">arrow_forward</span>
                          </button>
                          <button className="backdrop-blur-md bg-white/5 border border-white/10 text-white px-6 py-4 md:px-10 md:py-5 font-bold text-xs md:text-sm uppercase tracking-widest rounded-sm hover:bg-white/10 transition-all w-full sm:w-auto">
                            {data.hero.secondaryCta}
                          </button>
                        </div>
                        
                        <div className="pt-6 md:pt-12 flex flex-col items-center gap-3 md:gap-4 opacity-70">
                          <span className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] font-bold text-white">
                            {isVideoLocked ? "Deslice para avanzar" : "Video finalizado"}
                          </span>
                          <div className={`w-px h-8 md:h-12 bg-gradient-to-b from-tertiary to-transparent ${isVideoLocked ? "animate-bounce" : "opacity-30"}`}></div>
                        </div>
                      </div>
                    </div>
                    {/* Tech Marquee Component Injected inside the Hero, fixed at bottom */}
                    <div className="absolute bottom-0 left-0 w-full z-40">
                      <TechMarquee />
                    </div>
                  </section>
              </React.Fragment>
            );

            return (
              <div key={sectionId} className={`max-w-7xl mx-auto px-6 ${sectionId === 'services' ? 'mt-12' : 'mt-32'}`}>
                {sectionId === 'services' && (
                  /* Bento Grid - Core Competencies */
                  <section>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Apps Web */}
                      <div className="md:col-span-2 bg-surface-container-low p-10 rounded-sm inner-glow-top relative group">
                        <span className="material-symbols-outlined text-tertiary mb-6 text-4xl">{data.services[0].icon}</span>
                        <h3 className="font-headline text-3xl font-bold mb-4">{data.services[0].title}</h3>
                        <p className="text-on-surface-variant leading-relaxed max-w-lg mb-8">
                          {data.services[0].description}
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {data.services[0].tags?.map((tag, i) => (
                            <span key={i} className="px-3 py-1 bg-surface-container-highest text-primary text-[10px] font-bold uppercase rounded-full">{tag}</span>
                          ))}
                        </div>
                      </div>

                      {/* Ciberseguridad */}
                      <div className="bg-surface-container-high p-10 rounded-sm inner-glow-top border-t border-cyan-400/10">
                        <span className="material-symbols-outlined text-tertiary mb-6 text-4xl">{data.services[1].icon}</span>
                        <h3 className="font-headline text-3xl font-bold mb-4">{data.services[1].title}</h3>
                        <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
                          {data.services[1].description}
                        </p>
                        <ul className="space-y-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                          {data.services[1].items?.map((item, i) => (
                            <li key={i} className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-cyan-400"></span> {item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>
                )}

                {sectionId === 'ai' && (
                  /* AI Orchestration */
                  <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-surface-container p-10 rounded-sm inner-glow-top">
                      <span className="material-symbols-outlined text-tertiary mb-6 text-4xl">auto_awesome</span>
                      <h3 className="font-headline text-3xl font-bold mb-4">{data.aiModels.title}</h3>
                      <p className="text-on-surface-variant leading-relaxed mb-6">
                        {data.aiModels.description}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {data.aiModels.models.map((model, i) => (
                          <div key={i} className="bg-surface-container-lowest p-4 rounded-sm border border-outline-variant/10 text-center hover:border-tertiary/30 transition-colors cursor-default">
                            <p className="font-headline text-sm font-bold text-white mb-1">{model.name}</p>
                            <p className="text-[9px] text-cyan-400 uppercase tracking-widest">{model.sub}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="relative overflow-hidden rounded-sm group min-h-[300px]">
                      <Image 
                        alt="Cybersecurity Server Room" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8g8ZfR7uXXfys5NEokNbCaHjaLz0CADi1gowHp8gb-7noJlMRljr3-mVbZP_I-FVv3sRqDQK3aUa5Au4M0zWp8e2VanLwjjeZJ5m-UdWR6Y_vkXc6icAl_JAHpeRdfxzoFh_l7NLP2HPGWifyLXpyzvHNdvwNxzqrG0G-7sQ_nqTF04XpUr-WTtef4vCakefTuACtn0qQkrMKl1DppbSiA4lIgomSkxKkOJcfpwpwpLZwLxtvWyURUB43Z_sqTjS9i8T_6t3bll0"
                        fill
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0c1324] via-transparent to-transparent"></div>
                      <div className="absolute bottom-10 left-10">
                        <h4 className="font-headline text-2xl font-bold mb-2">Infraestructura Crítica</h4>
                        <p className="text-sm text-slate-400">Diseñada para la resiliencia absoluta.</p>
                      </div>
                    </div>
                  </section>
                )}

                {sectionId === 'cyber' && (
                  /* Cybersecurity Detailed Section */
                  <section className="relative group">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                      <div>
                        <div className="flex items-center gap-3 mb-6">
                          <span className="text-tertiary font-bold tracking-[0.3em] uppercase text-xs">{data.cybersecurity.tagline}</span>
                          <div className="h-px flex-1 bg-gradient-to-r from-tertiary/50 to-transparent"></div>
                        </div>
                        <h2 className="font-headline text-4xl lg:text-5xl font-bold mb-8">{data.cybersecurity.title}</h2>
                        <p className="text-on-surface-variant text-lg leading-relaxed mb-10">
                          {data.cybersecurity.description}
                        </p>
                        <div className="space-y-6">
                          {data.cybersecurity.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-4 group/item">
                              <div className="w-12 h-12 rounded-sm bg-surface-container-high border border-outline-variant/20 flex items-center justify-center group-hover/item:border-tertiary/50 transition-colors">
                                <span className="material-symbols-outlined text-tertiary">{item.icon}</span>
                              </div>
                              <span className="font-bold text-sm uppercase tracking-wider">{item.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="relative aspect-video lg:aspect-square rounded-sm overflow-hidden border border-outline-variant/10">
                        <Image 
                          alt="Cyber Security Visual" 
                          className="w-full h-full object-cover opacity-40 mix-blend-screen" 
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnf8v0_i5GZgU7W0XvN-iX8Z_hR0_vS9C-f-m0e-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c" 
                          fill
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-tertiary/10 to-transparent"></div>
                      </div>
                    </div>
                  </section>
                )}

                {sectionId === 'cta' && (
                  /* Newsletter Section */
                  <section className="bg-surface-container-low p-12 rounded-sm text-center border-t border-cyan-400/10 relative">
                    <h2 className="font-headline text-4xl font-bold mb-6">{data.cta.title}</h2>
                    <p className="text-on-surface-variant max-w-2xl mx-auto mb-10 text-lg">
                      {data.cta.description}
                    </p>
                    <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
                      <input 
                        className="flex-1 bg-surface-container-lowest border-b border-outline-variant/30 focus:border-tertiary outline-none text-white px-4 py-3 transition-all" 
                        placeholder="Su correo corporativo" 
                        type="email"
                      />
                      <button className="bg-tertiary text-on-tertiary px-6 py-3 font-bold uppercase tracking-widest text-xs rounded-sm whitespace-nowrap hover:brightness-110 active:scale-95 transition-all">
                        {data.cta.buttonText}
                      </button>
                    </form>
                  </section>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="mt-6 border-t border-slate-800/50 bg-black overflow-hidden bg-transparent">
          {/* Second instance of TechMarquee */}
          <div className="w-full relative z-30">
            <TechMarquee transparent={true} />
          </div>
          
          <div className="py-6 px-8 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-40 bg-surface-container-lowest">
            <div className="font-headline font-bold text-xl text-cyan-400">Sneyder Studio</div>
            <div className="flex gap-12 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              <a className="hover:text-cyan-400 transition-colors" href="#">LinkedIn</a>
              <a className="hover:text-cyan-400 transition-colors" href="#">GitHub</a>
              <a className="hover:text-cyan-400 transition-colors" href="#">Twitter X</a>
            </div>
            <div className="text-[10px] font-medium text-slate-600 uppercase tracking-widest">
              © 2024 Sneyder Studio. All Rights Reserved.
            </div>
          </div>
        </footer>
      </main>

      {/* BottomNavBar (Hidden on desktop, shown on mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-[#0c1324]/90 backdrop-blur-xl border-t border-slate-800">
        <BottomNavItem icon="home" label="Inicio" href="/" active />
        <BottomNavItem icon="explore" label="Explorar" href="/" />
        <BottomNavItem icon="insights" label="Insights" href="/admin" />
        <BottomNavItem icon="person" label="Perfil" href="/" />
      </nav>
    </div>
  );
}

function NavItem({ icon, label, href, active = false, small = false, className = "" }: { icon: string; label: string; href: string; active?: boolean; small?: boolean; className?: string }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-4 px-4 py-3 transition-colors ${
        active 
          ? "text-cyan-400 font-bold bg-slate-800/50" 
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      } ${small ? "text-sm" : ""} ${className}`}
    >
      <span className={`material-symbols-outlined ${small ? "text-base" : ""}`}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function BottomNavItem({ icon, label, href, active = false }: { icon: string; label: string; href: string; active?: boolean }) {
  return (
    <Link 
      href={href}
      className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${active ? "text-cyan-400 scale-110" : "text-slate-500 hover:text-cyan-200"}`}>
      <span className="material-symbols-outlined">{icon}</span>
      <span className="text-[10px] font-medium mt-0.5">{label}</span>
    </Link>
  );
}

function CodeFountain() {
  const codes = [
    "Sneyder",
    "011001",
    "Studio",
    "init()",
    "Sneyder",
    "sys.io",
    "Studio"
  ];
  return (
    <div className={`absolute bottom-0 right-[4px] z-[25] w-24 sm:w-28 md:w-40 h-14 sm:h-16 md:h-20 bg-black/70 backdrop-blur-md overflow-hidden rounded-tl-lg border-t border-l border-tertiary/30 shadow-[0_-5px_15px_rgba(47,217,244,0.15)] pointer-events-none flex justify-around p-1`}>
      
      {/* 3 Columns of code to look like a fountain */}
      <div className="flex flex-col text-tertiary font-mono text-[8px] md:text-[10px] font-bold leading-tight opacity-80 animate-code-1 w-1/3">
        {codes.slice(0, 4).map((c, i) => <span key={i} className="my-0.5">{c}</span>)}
        {codes.slice(0, 4).map((c, i) => <span key={`rep-${i}`} className="my-0.5 text-cyan-200">{c}</span>)}
      </div>

      <div className="flex flex-col text-white font-mono text-[8px] md:text-[10px] font-black leading-tight animate-code-2 w-1/3">
        {codes.slice(3, 7).map((c, i) => <span key={i} className="my-0.5 text-center drop-shadow-[0_0_5px_rgba(255,255,255,1)]">{c}</span>)}
        {codes.slice(3, 7).map((c, i) => <span key={`rep-${i}`} className="my-0.5 text-center text-cyan-400 drop-shadow-[0_0_5px_rgba(47,217,244,1)]">{c}</span>)}
      </div>

      <div className="flex flex-col text-tertiary font-mono text-[8px] md:text-[10px] font-bold leading-tight opacity-70 animate-code-3 w-1/3">
        {codes.slice(1, 5).map((c, i) => <span key={i} className="my-0.5 text-right">{c}</span>)}
        {codes.slice(1, 5).map((c, i) => <span key={`rep-${i}`} className="my-0.5 text-right text-white">{c}</span>)}
      </div>

      {/* Glow overlay shooting up */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-tertiary/50 to-transparent"></div>
      <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black to-transparent z-10"></div>
    </div>
  );
}

// Devicon Logos URLs
const techLogos = [
  { name: 'Flutter', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/flutter/flutter-original.svg', about: 'Desarrollo de aplicaciones móviles multiplataforma y nativas con alto rendimiento. Ideal para llevar un producto o servicio rápidamente a iOS y Android.' },
  { name: 'Next.js', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg', invert: true, about: 'Framework avanzado para React ideal para optimización SEO, velocidad extrema de carga y desarrollo de Web Apps (SSR/SSG).' },
  { name: 'React', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg', about: 'Construcción de interfaces de usuario altamente interactivas a gran escalabilidad. El núcleo ideal para paneles administrativos y UX dinámicas.' },
  { name: 'TypeScript', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg', about: 'Tipado estricto para escalar proyectos JavaScript complejos sin perder el control de la calidad, depurando bugs lógicos previo a despliegues.' },
  { name: 'Python', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg', about: 'Lider en desarrollo de modelos de Inteligencia Artificial (AI), pipelines de robótica de datos y backends de alto procesamiento.' },
  { name: 'Node.js', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg', about: 'Backend de altísima concurrencia y conexiones en tiempo real. Perfecto para chats, sockets y unificación completa en stacks JavaScript.' },
  { name: 'Tailwind CSS', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg', about: 'Configuración de diseño atómico ultrarrápido empleado para maquetar estéticas puras, exactas y milimétricamente adaptables al dispositivo.' },
  { name: 'Firebase', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/firebase/firebase-plain.svg', about: 'Backend-as-a-Service por excelencia, otorgando bases de datos en tiempo real ultrarrápidas y gestión de autenticaciones seguras.' },
  { name: 'Docker', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg', about: 'Contenedorización robusta que garantiza el inquebrantable funcionamiento de ambientes virtuales independientemente del servidor subyacente.' },
  { name: 'AWS', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original-wordmark.svg', invert: true, about: 'La infraestructura corporativa cloud de Amazon Web Services, albergando la máxima disponibilidad, CDN y hosting inquebrantable disponible a escala.' },
  { name: 'Figma', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg', about: 'Prototipado inmersivo utilizado para modelar iteraciones exclusivas de UX/UI incluso antes de teclear la primera línea de código.' },
  { name: 'Swift', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/swift/swift-original.svg', about: 'Lenguaje nativo Premium de la manzana; aplicado en casos donde requerimos exprimir al máximo el hardware y la ergonomía de productos Apple.' },
  { name: 'Supabase', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/supabase/supabase-original.svg', about: 'Backend integral Open Source basado en PostgreSQL. Bases de datos asombrosamente rápidas y autenticaciones robustas.' },
  { name: 'Kotlin', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kotlin/kotlin-original.svg', about: 'El estándar de modernidad para el desarrollo de apps nativas en Android, otorgando un rendimiento de máquina puro sin bloqueos.' },
  { name: 'Android', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/android/android-original.svg', about: 'Sustento del ecosistema móvil base; permite integración quirúrgica a nivel hardware para Android Smartphones, Tablets y Wearables.' },
  { name: 'Ionic', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ionic/ionic-original.svg', about: 'Desarrollo veloz de apps multiplataforma, traduciendo tecnología web a un framework robusto. Excelente inversión para MVP iniciales.' },
  { name: 'Dart', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/dart/dart-original.svg', about: 'Lenguaje ultra-optimizado por Google; el motor fundamental de Flutter, compilado Ahead-of-Time para animaciones hasta a 120 FPS fluidos.' },
  
  // --- Herramientas de Programación y Más ---
  { name: 'Cursor IDE', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vscode/vscode-original.svg', about: 'El entorno de desarrollo impulsado por IA más avanzado. Utilizado para escribir software hiper-velozmente guiado por inteligencia artificial.' },
  { name: 'Google Antigravity', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/google/google-original.svg', about: 'Plataforma experimental interna y Agente de Código Autónomo de Google Deepmind. Capacidades sobrehumanas de construcción.' },
  { name: 'GitHub Copilot', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg', invert: true, about: 'La IA complementaria que sugiere funciones enteras y soluciona problemas en tiempo real al unísono con el desarrollador.' },
  
  // --- Las Mejores Tecnologías de Inteligencia Artificial ---
  { name: 'TensorFlow', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tensorflow/tensorflow-original.svg', about: 'La principal biblioteca open-source de Google para aprendizaje automático (Machine Learning) y construcción de redes neuronales profundas.' },
  { name: 'PyTorch', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/pytorch/pytorch-original.svg', about: 'El framework de IA líder en investigación impulsado por Meta. Destacado por su alta flexibilidad matemática y computacional gráfica.' },
  { name: 'Scikit-learn', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/scikitlearn/scikitlearn-original.svg', about: 'El estándar maestro en Python para Data Science pura, permitiendo algoritmos de clustering, regresión y clasificación con altísimo rigor matemático.' },
  { name: 'Keras', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/keras/keras-original.svg', about: 'Interfaz neuronal focalizada en experimentación humana veloz. Transforma conceptos teóricos a modelos escalables de IA en tiempo récord.' },
  { name: 'OpenCV', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/opencv/opencv-original.svg', about: 'El monstruo de la Visión Computarizada. Interpreta y analiza transmisiones de cámaras y videos en tiempo real identificando patrones y objetos.' },
];

// Tech Stack Scrolling Marquee Wrapper
function TechMarquee({ transparent = false }: { transparent?: boolean }) {
  const [selectedTech, setSelectedTech] = useState<{name: string, src: string, about: string, invert?: boolean} | null>(null);

  // Close modal when hitting ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedTech(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <>
      <div className={`${transparent ? 'bg-transparent' : 'bg-black/50 backdrop-blur-md border-t border-white/5'} py-4 overflow-hidden w-full relative z-[20]`}>
        <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
          <ul className="flex items-center justify-center animate-marquee whitespace-nowrap hover:[animation-play-state:paused]">
            {/* Duplicate arrays to create continuous infinite scroll effect */}
            {[...techLogos, ...techLogos, ...techLogos].map((tech, i) => (
              <li 
                key={`logo-${i}`} 
                onClick={() => setSelectedTech(tech)}
                className="flex flex-col items-center mx-6 sm:mx-10 group min-w-[60px] cursor-pointer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={tech.src} 
                  alt={tech.name} 
                  title={tech.name}
                  className={`w-6 h-6 sm:w-8 sm:h-8 object-contain opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300 ${tech.invert ? 'filter invert' : ''}`}
                  loading="lazy"
                />
                <span className="text-[9px] sm:text-[10px] text-white/50 group-hover:text-tertiary font-mono pt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                  {tech.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tech Modal Popup */}
      {selectedTech && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer animate-fade-in" 
            onClick={() => setSelectedTech(null)} 
          />
          <div className="relative w-full max-w-sm sm:max-w-md bg-surface/90 border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 animate-slide-up backdrop-blur-md">
            <button 
              onClick={() => setSelectedTech(null)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <div className="flex flex-col items-center text-center gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 p-4 rounded-full bg-white/5 border border-tertiary/20 flex items-center justify-center shadow-[0_0_30px_rgba(47,217,244,0.15)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={selectedTech.src} 
                  alt={selectedTech.name} 
                  className={`w-full h-full object-contain ${selectedTech.invert ? 'filter invert' : ''}`} 
                />
              </div>
              <div>
                <h3 className="text-2xl font-headline font-black text-white mb-2">{selectedTech.name}</h3>
                <div className="w-12 h-1 bg-tertiary mx-auto mb-4 rounded-full"></div>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-body">
                  {selectedTech.about}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
