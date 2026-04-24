"use client";

import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getCMSData } from "@/lib/cms";
import { getAdminSettings } from "@/lib/settings";
import { siteData } from "@/data/siteData";

const ADMIN_EMAIL = "sneyder23081994@gmail.com";

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [sectionsOrder, setSectionsOrder] = useState<string[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLogoViewer, setShowLogoViewer] = useState(false);
  const [viewerImage, setViewerImage] = useState("");
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isVideoLocked, setIsVideoLocked] = useState(true);

  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef(1);
  const touchStartY = useRef(0);
  const totalFrames = 40;

  const updateFrame = (newFrame: number) => {
    frameRef.current = newFrame;
    if (imgRef.current) {
      const frameInt = Math.min(Math.max(Math.floor(newFrame), 1), totalFrames);
      imgRef.current.src = `/video/frames/ezgif-frame-${frameInt.toString().padStart(3, '0')}.jpg`;
    }
  };

  const [adminSettings, setAdminSettings] = useState<any>(null);

  useEffect(() => {
    const loadContent = async () => {
      const dbData = await getCMSData();

      // Fusionar dinámicamente para asegurar que nuevas estructuras (como platforms) estén presentes
      const mergedData = {
        ...siteData,
        ...dbData,
        aiModels: siteData.aiModels, // Priorize local new architecture for AI models
        services: siteData.services.map((s: any, i: number) => {
          const dbService = dbData.services?.[i] || {};
          // Priorizamos el contenido local para "Desarrollo Multiplataforma" para asegurar la integración de Flutter
          if (s.title === "Desarrollo Multiplataforma") {
            return {
              ...dbService,
              ...s,
              platforms: s.platforms
            };
          }
          return {
            ...s,
            ...dbService
          };
        })
      };

      setData(mergedData);
      if (mergedData.sectionsOrder) setSectionsOrder(mergedData.sectionsOrder);

      const settings = await getAdminSettings();
      setAdminSettings(settings);
    };
    loadContent();

    const preloadImg = new window.Image();
    preloadImg.src = `/video/frames/ezgif-frame-001.jpg`;
    preloadImg.onload = () => setIsVideoLoaded(true);

    for (let i = 2; i <= totalFrames; i++) {
      const img = new window.Image();
      img.src = `/video/frames/ezgif-frame-${i.toString().padStart(3, '0')}.jpg`;
    }
  }, []);

  // Toggle body scroll locking based on whether video is locked
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Unlock instantly if user reloads already scrolled down
    if (window.scrollY > 10) {
      updateFrame(totalFrames);
      setIsVideoLocked(false);
    }

    if (isVideoLocked || showAuthModal || isMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      if (isMenuOpen) {
        document.body.classList.add('menu-open');
        document.documentElement.classList.add('menu-open');
      }
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('menu-open');
      document.documentElement.classList.remove('menu-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('menu-open');
      document.documentElement.classList.remove('menu-open');
    };
  }, [isVideoLocked, showAuthModal, isMenuOpen]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // If menu is open or modal is open, let its scroll work normally
      if (document.body.classList.contains('menu-open') || showAuthModal) {
        if (!(e.target as HTMLElement)?.closest('aside') && !(e.target as HTMLElement)?.closest('.auth-modal-content')) {
          e.preventDefault();
        }
        return;
      }

      if (isVideoLocked) {
        e.preventDefault();
        if (!isVideoLoaded) return;

        // Adjust scrub sensitivity for wheel (Slower)
        const newFrame = frameRef.current + (e.deltaY * 0.02);
        if (newFrame >= totalFrames) {
          updateFrame(totalFrames);
          setIsVideoLocked(false);
        } else if (newFrame <= 1) {
          updateFrame(1);
        } else {
          updateFrame(newFrame);
        }
        setIsScrolled(frameRef.current > (totalFrames / 2));
      } else {
        // Unlock when scrolling back up
        if (window.scrollY <= 0 && e.deltaY < 0) {
          e.preventDefault();
          setIsVideoLocked(true);
          updateFrame(Math.max(1, totalFrames - 2));
        } else {
          setIsScrolled(window.scrollY > 50);
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (document.body.classList.contains('menu-open') || showAuthModal) {
        if (!(e.target as HTMLElement)?.closest('aside') && !(e.target as HTMLElement)?.closest('.auth-modal-content')) {
          e.preventDefault();
        }
        return;
      }

      if (isVideoLocked) {
        e.preventDefault();
        if (!isVideoLoaded) return;

        const deltaY = touchStartY.current - e.touches[0].clientY;
        touchStartY.current = e.touches[0].clientY;

        // Slower touch sensitivity
        const newFrame = frameRef.current + (deltaY * 0.04);
        if (newFrame >= totalFrames) {
          updateFrame(totalFrames);
          setIsVideoLocked(false);
        } else if (newFrame <= 1) {
          updateFrame(1);
        } else {
          updateFrame(newFrame);
        }
        setIsScrolled(frameRef.current > (totalFrames / 2));
      } else {
        if (window.scrollY <= 0) {
          const deltaY = touchStartY.current - e.touches[0].clientY;
          if (deltaY < 0) { // dragging down at the top
            e.preventDefault();
            setIsVideoLocked(true);
            updateFrame(Math.max(1, totalFrames - 2));
          }
        }
        touchStartY.current = e.touches[0].clientY;
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
  }, [isVideoLocked, isVideoLoaded, showAuthModal]);

  const [showVerificationToast, setShowVerificationToast] = useState(false);

  useEffect(() => {
    // Content is now loaded via loadContent in the main useEffect

    // Firebase Auth Listener
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Fetch profile from Firestore
        try {
          const profileDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
          if (profileDoc.exists()) {
            setUserProfile(profileDoc.data());
          } else {
            setUserProfile(null);
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
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



  if (!data) return (
    <div className="bg-background min-h-screen flex items-center justify-center text-center px-6">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-32 h-32 mb-4">
          <Image
            src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png"
            alt="Sneyder Studio Logo"
            fill
            className="object-contain animate-pulse"
          />
        </div>
        <div className="w-16 h-1 bg-tertiary/20 rounded-full overflow-hidden relative">
          <div className="absolute inset-0 bg-tertiary animate-loading-bar"></div>
        </div>
        <span className="text-tertiary font-bold tracking-[0.5em] uppercase text-[10px]">Sneyder Studio está iniciando...</span>
      </div>
    </div>
  );

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
          <div
            className="h-10 w-auto relative cursor-pointer hover:scale-105 transition-all bg-white/5 rounded-xl border border-white/10 overflow-hidden p-1.5 shadow-lg group"
            onClick={() => { setViewerImage("https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png"); setShowLogoViewer(true); }}
          >
            <Image
              src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png"
              alt="Sneyder Studio"
              width={140}
              height={28}
              className="h-full w-auto object-contain group-hover:brightness-110"
            />
          </div>
        </div>

        {user ? (
          <div className="h-8 w-8 rounded-full overflow-hidden bg-surface-container border border-cyan-400/30">
            <Image
              alt="User Avatar"
              src={user.user_metadata?.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuCO8RUk1wD7WV7O7IKZ_NBnLhlsnuVdHeC9x_CyLRsEpavDT9Qu9rC4-F4JAFIMwExYTNXtPsW04RAgXxe2vZ_1xgd0Wpqlz62JTPKFItouFbiVzuuvaA3Jr4zodwxrF3k5SScHvPKbmmQvNvCnMsjMY1m7yzSHBq-NVdD2N3qaTUfNHCwYii6gD_VVnTZrwbjzB-EmuUn_Y4QYasiBWkPdcLN2PPRgr4tyrGNvjDYnaz1WSLw73itY4B6zTZAWRKzhDVirP2Wyrcw"}
              width={32}
              height={32}
            />
          </div>
        ) : (
          <button
            onClick={() => { setShowAuthModal(true); setAuthView('login'); }}
            className="bg-tertiary/10 border border-tertiary/50 text-tertiary px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-tertiary hover:text-on-tertiary transition-all"
          >
            Acceder
          </button>
        )}
      </header>


      <aside
        className={`fixed left-0 top-0 z-[70] h-[100dvh] w-80 bg-[#0c1324] border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out font-headline text-slate-200 overflow-hidden ${isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="p-8 flex flex-col gap-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-slate-800">
              {user ? (
                <Image
                  alt="User Profile Avatar"
                  src={user.user_metadata?.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuBH_btGfHFWWHfApXWyzqu90p_2NBQZttyesQz6QlhsHASGNW17CG8J-xx8fF8jKJaPPfgtyTfolOPvAFnGM4gcX9ci9UmYI9bOziFWipLW0G_G3gtXXyBt4wq-ItmBSk5uKJraqJBEUPuv_ArRh18s3sVoJsjbr7ok9twnXcNobC6z0JiJlozlUbb6eL6KTjktk58yD7_vE1e63rOTk-xD7njqMy5SJaVxWwWikP2LOrMVuGfMcVTru4Wiih7wq_IOZ1WRsOIvKt0"}
                  width={48}
                  height={48}
                />
              ) : (
                <span className="material-symbols-outlined text-slate-500 text-3xl">person</span>
              )}
            </div>
            <div>
              <p className="font-bold text-white truncate max-w-[150px]">
                {userProfile?.manager_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || "Visitante"}
              </p>
              <p className="text-xs text-cyan-400 uppercase tracking-widest">
                {user ? "Premium Account" : "Modo Invitado"}
              </p>
            </div>

          </div>
          <div
            className="relative w-full h-16 mb-8 cursor-pointer hover:scale-[1.02] transition-all bg-white/5 rounded-2xl border border-white/10 overflow-hidden p-3 shadow-xl group"
            onClick={() => { setViewerImage("https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png"); setShowLogoViewer(true); }}
          >
            <Image
              src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png"
              alt="Sneyder Studio"
              fill
              className="object-contain object-left group-hover:brightness-110"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-1 scrollbar-hide overscroll-behavior-contain" style={{ overscrollBehavior: 'contain' }}>
          <NavItem icon="account_circle" label="Perfil de usuario" href="/profile" active />
          {user?.email === ADMIN_EMAIL && <NavItem icon="settings" label="Administración" href="/admin" />}
          <NavItem icon="shopping_bag" label="Mis pedidos" href="/mis-pedidos" />
          <NavItem icon="bolt" label="Servicios" href="/servicios" />
          <NavItem icon="psychology" label="Modelo de IA" href="/ia-models" />
          <NavItem icon="mail" label="Contacto" href="/contacto" />

          <div className="pt-6 pb-2 px-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Legal</div>
          <NavItem icon="policy" label="Política y condiciones" href="/contrato" small />
          <NavItem icon="gavel" label="Términos de servicio" href="/contrato" small />
          <NavItem icon="description" label="Contrato de servicios" href="/contrato" small />

          <div className="pt-6 pb-2 px-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Empresa</div>
          <NavItem icon="info" label="Acerca de nosotros" href="/" small />
          <NavItem icon="language" label="Idioma" href="/" small className="mb-4" />

          {user && (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors w-full text-left"
            >
              <span className="material-symbols-outlined">logout</span>
              <span>Cerrar Sesión</span>
            </button>
          )}
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
                <section key="hero" className="relative w-full min-h-[100dvh] overflow-hidden flex flex-col items-center justify-start md:justify-center bg-black">

                  {/* Fondo de Video - top on mobile, absolute full-cover on desktop */}
                  <div className="w-full relative md:absolute md:inset-0 z-0 flex items-start md:items-center justify-center bg-black shrink-0 md:min-h-full">
                    {!isVideoLoaded && (
                      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
                        <span className="w-8 h-8 rounded-full border-2 border-tertiary border-t-transparent animate-spin mb-4"></span>
                        <span className="text-tertiary text-xs font-bold uppercase tracking-widest animate-pulse">Cargando experiencia...</span>
                      </div>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      ref={imgRef}
                      src="/video/frames/ezgif-frame-001.jpg"
                      alt="Banner Frame"
                      className={`w-full h-auto md:w-full md:h-full md:object-cover z-0 transition-opacity duration-1000 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}
                    />
                    {/* Subtle Dark Overlay solo visible si el texto se monta encima (Desktop) */}
                    <div className="hidden md:block absolute inset-0 bg-black/40 z-10 pointer-events-none" />
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
                        <button
                          onClick={() => setShowAuthModal(true)}
                          className="bg-tertiary text-on-tertiary px-6 py-4 md:px-10 md:py-5 font-bold text-xs md:text-sm uppercase tracking-widest rounded-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(47,217,244,0.3)] w-full sm:w-auto pointer-events-auto"
                        >
                          {data.hero.primaryCta} <span className="material-symbols-outlined text-sm md:text-base">arrow_forward</span>
                        </button>
                        <Link href="/servicios" className="w-full sm:w-auto">
                          <button className="backdrop-blur-md bg-white/5 border border-white/10 text-white px-6 py-4 md:px-10 md:py-5 font-bold text-xs md:text-sm uppercase tracking-widest rounded-sm hover:bg-white/10 transition-all w-full sm:w-auto">
                            {data.hero.secondaryCta}
                          </button>
                        </Link>
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
                      {/* Desarrollo Multiplataforma */}
                      <div className="md:col-span-2 bg-surface-container-low p-8 md:p-12 rounded-sm inner-glow-top relative group overflow-hidden border border-white/5 shadow-2xl">
                        {/* Background Flutter Watermark */}
                        <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.03] -mr-20 -mt-20 group-hover:opacity-[0.07] transition-opacity duration-1000 rotate-12">
                          <Image src="/images/flutter_logo.png" alt="" fill className="object-contain" />
                        </div>

                        <div className="relative z-10">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-tertiary/10 rounded-full flex items-center justify-center border border-tertiary/20 shadow-[0_0_20px_rgba(47,217,244,0.1)]">
                                <span className="material-symbols-outlined text-tertiary text-3xl animate-pulse">{data.services[0].icon}</span>
                              </div>
                              <h3 className="font-headline text-3xl md:text-4xl font-black tracking-tight text-white">{data.services[0].title}</h3>
                            </div>
                            {/* Technology Tag */}
                            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md self-start md:self-auto">
                              <div className="w-6 h-6 relative">
                                <Image src="/images/flutter_logo.png" alt="Flutter" fill className="object-contain" />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#89ceff]">Powered by Flutter</span>
                            </div>
                          </div>

                          <p className="text-on-surface-variant leading-relaxed max-w-2xl mb-12 text-lg">
                            {data.services[0].description.split("**").map((part: string, i: number) =>
                              i % 2 === 1 ? <strong key={i} className="text-[#2fd9f4]">{part}</strong> : part
                            )}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                            {data.services[0].platforms?.map((platform: any, i: number) => (
                              <Link
                                key={i}
                                href={`/servicios/multiplataforma/${platform.name.toLowerCase()}`}
                                className="bg-surface-container-lowest/40 backdrop-blur-sm p-6 rounded-sm border border-outline-variant/10 hover:border-tertiary/40 transition-all hover:bg-surface-container-high group/platform animate-fade-in relative overflow-hidden h-full flex flex-col hover:shadow-2xl hover:shadow-tertiary/5 hover:-translate-y-1"
                                style={{ animationDelay: `${i * 150}ms` }}
                              >
                                {/* Platform Image Background (Subtle) */}
                                <div className="absolute -top-4 -right-4 w-32 h-32 opacity-10 group-hover/platform:opacity-40 transition-all duration-700 -rotate-12 group-hover/platform:rotate-0 group-hover/platform:scale-110">
                                  <Image src={platform.image} alt="" fill className="object-cover grayscale group-hover/platform:grayscale-0 transition-all duration-700" />
                                </div>

                                <div className="flex items-center gap-3 mb-4 relative z-10">
                                  <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 group-hover/platform:border-tertiary/30 transition-colors shadow-inner backdrop-blur-md">
                                    {platform.icon === "apple" ? (
                                      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-tertiary scale-90 group-hover/platform:scale-110 transition-transform shadow-tertiary/20 drop-shadow-sm" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.039 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.844-1.026 1.404-2.455 1.248-3.883-1.234.052-2.73.818-3.61 1.844-.793.91-1.48 2.364-1.286 3.753 1.376.104 2.805-.69 3.648-1.714z" />
                                      </svg>
                                    ) : (
                                      <span className="material-symbols-outlined text-tertiary scale-90 group-hover/platform:scale-110 transition-transform shadow-tertiary/20 drop-shadow-sm">{platform.icon}</span>
                                    )}
                                  </div>
                                  <h4 className="font-headline text-xl font-bold text-white group-hover/platform:text-tertiary transition-colors">{platform.name}</h4>
                                </div>
                                <p className="text-on-surface-variant text-sm leading-relaxed mb-4 relative z-10 flex-grow">
                                  {platform.detail}
                                </p>

                                <div className="flex items-center gap-2 text-[10px] font-bold text-tertiary uppercase tracking-widest relative z-10 opacity-0 group-hover/platform:opacity-100 transition-opacity">
                                  <span>Explorar Tecnología</span>
                                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                </div>

                                <div className="h-1 w-0 bg-tertiary group-hover/platform:w-full transition-all duration-500 absolute bottom-0 left-0"></div>
                              </Link>
                            ))}
                          </div>

                          <div className="mt-12 flex flex-wrap gap-3">
                            {data.services[0].tags?.map((tag: any, i: number) => (
                              <span key={i} className="px-4 py-1.5 bg-surface-container-highest text-tertiary text-[10px] font-black uppercase tracking-widest rounded-full border border-tertiary/20 hover:bg-tertiary hover:text-on-tertiary transition-all cursor-default shadow-sm">{tag}</span>
                            ))}
                          </div>
                        </div>

                        {/* High-tech background accents */}
                        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-tertiary/5 rounded-full blur-[120px] pointer-events-none group-hover:bg-tertiary/10 transition-all duration-1000"></div>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-tertiary/30 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-1000"></div>
                      </div>

                      {/* Expansión de Negocios */}
                      <div className="bg-surface-container-high p-8 md:p-12 rounded-sm inner-glow-top border border-white/5 relative group/expansion overflow-hidden flex flex-col h-full">
                        {/* Dynamic background effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-tertiary/5 via-transparent to-transparent opacity-0 group-hover/expansion:opacity-100 transition-opacity duration-1000"></div>

                        <div className="relative z-10 flex flex-col h-full">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-tertiary/10 rounded-full flex items-center justify-center border border-tertiary/20">
                              <span className="material-symbols-outlined text-tertiary text-2xl group-hover/expansion:rotate-[360deg] transition-transform duration-[2000ms] ease-in-out">{data.services[1].icon}</span>
                            </div>
                            <h3 className="font-headline text-2xl md:text-3xl font-black text-white">{data.services[1].title}</h3>
                          </div>

                          <p className="text-on-surface-variant text-sm leading-relaxed mb-10 opacity-80 group-hover/expansion:opacity-100 transition-opacity">
                            {data.services[1].description}
                          </p>

                          <div className="space-y-6 flex-grow" style={{ perspective: '1200px' }}>
                            {data.services[1].subCards?.map((card: any, i: number) => (
                              <div
                                key={i}
                                className="relative p-6 bg-surface-container-low rounded-xl border border-white/10 hover:border-tertiary/40 shadow-[0_10px_30px_rgba(0,0,0,0.5)] group/subcard overflow-visible"
                                style={{ transformStyle: 'preserve-3d', transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out' }}
                                onMouseMove={(e) => {
                                  const target = e.currentTarget;
                                  const rect = target.getBoundingClientRect();
                                  const x = e.clientX - rect.left;
                                  const y = e.clientY - rect.top;
                                  const centerX = rect.width / 2;
                                  const centerY = rect.height / 2;
                                  // Intense 3D multiplier
                                  const rotateX = ((y - centerY) / centerY) * -20;
                                  const rotateY = ((x - centerX) / centerX) * 20;
                                  target.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
                                  target.style.boxShadow = `0 30px 60px rgba(47, 217, 244, 0.2), ${-rotateY}px ${rotateX}px 20px rgba(0,0,0,0.5)`;
                                }}
                                onMouseLeave={(e) => {
                                  const target = e.currentTarget;
                                  target.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
                                  target.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
                                  // Restore slow transition for snapping back
                                  target.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transition = 'transform 0.1s ease-out, box-shadow 0.1s ease-out';
                                }}
                              >
                                {/* 3D Image Background */}
                                <div
                                  className="absolute inset-0 opacity-20 group-hover/subcard:opacity-40 transition-all duration-700 pointer-events-none rounded-xl overflow-hidden [mask-image:linear-gradient(to_left,white_40%,transparent)]"
                                  style={{ transform: 'translateZ(-10px)' }}
                                >
                                  <Image src={card.image} alt="" fill className="object-cover scale-125 group-hover/subcard:scale-100 group-hover/subcard:rotate-2 transition-all duration-[1500ms]" />
                                  <div className="absolute inset-0 bg-gradient-to-r from-surface-container-low via-surface-container-low/80 to-transparent"></div>
                                </div>

                                <div className="relative z-10 pointer-events-none" style={{ transform: 'translateZ(50px)' }}>
                                  <div className="flex items-center gap-4 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-black/40 border border-tertiary/20 flex items-center justify-center backdrop-blur-md shadow-[inset_0_0_10px_rgba(47,217,244,0.2)] group-hover/subcard:bg-tertiary/20 group-hover/subcard:border-tertiary/50 group-hover/subcard:shadow-[0_0_15px_rgba(47,217,244,0.5)] transition-all duration-500">
                                      <span className="material-symbols-outlined text-tertiary text-lg drop-shadow-[0_0_8px_rgba(47,217,244,1)]">{card.icon}</span>
                                    </div>
                                    <h4 className="font-headline font-black text-white text-lg tracking-wide drop-shadow-lg">{card.title}</h4>
                                  </div>
                                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed italic opacity-90 group-hover/subcard:opacity-100 transition-opacity drop-shadow-md pr-4">
                                    "{card.desc}"
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-10 pt-6 border-t border-white/5 flex justify-between items-center opacity-40 group-hover/expansion:opacity-100 transition-opacity">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#89ceff]">Infraestructura Crítica</span>
                            <span className="material-symbols-outlined text-tertiary animate-pulse">analytics</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {sectionId === 'ai' && (
                  /* AI Orchestration */
                  <section className="flex flex-col gap-6">
                    <div className="bg-surface-container-high p-8 md:p-12 rounded-sm inner-glow-top border border-white/5 relative group/ai overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover/ai:opacity-100 transition-opacity duration-1000"></div>

                      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div className="max-w-3xl">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20">
                              <span className="material-symbols-outlined text-purple-400 text-2xl group-hover/ai:rotate-[360deg] transition-transform duration-[2000ms] ease-in-out">psychology</span>
                            </div>
                            <h3 className="font-headline text-3xl md:text-4xl font-black text-white px-2 py-1 bg-purple-500/10 inline-block rounded-md border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]">{data.aiModels.title}</h3>
                          </div>
                          <p className="text-on-surface-variant text-base leading-relaxed opacity-90 pl-2">
                            {data.aiModels.description}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8" style={{ perspective: '1200px' }}>
                        {data.aiModels.models.map((model: any, i: number) => (
                          <div
                            key={i}
                            className="relative bg-surface-container-lowest rounded-xl border border-white/10 hover:border-purple-500/40 shadow-[0_10px_30px_rgba(0,0,0,0.5)] group/model overflow-hidden flex flex-col h-full"
                            style={{ transformStyle: 'preserve-3d', transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}
                            onMouseMove={(e) => {
                              const target = e.currentTarget;
                              const rect = target.getBoundingClientRect();
                              const x = e.clientX - rect.left;
                              const y = e.clientY - rect.top;
                              const centerX = rect.width / 2;
                              const centerY = rect.height / 2;
                              const rotateX = ((y - centerY) / centerY) * -15;
                              const rotateY = ((x - centerX) / centerX) * 15;
                              target.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
                              target.style.boxShadow = `0 30px 60px rgba(168, 85, 247, 0.2), ${-rotateY}px ${rotateX}px 30px rgba(0,0,0,0.6)`;
                            }}
                            onMouseLeave={(e) => {
                              const target = e.currentTarget;
                              target.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
                              target.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
                              target.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transition = 'transform 0.1s ease-out, box-shadow 0.1s ease-out';
                            }}
                          >
                            {/* Fully Visible Hero Image Container */}
                            <div
                              className="relative h-64 md:h-72 w-full shrink-0 pointer-events-none bg-black"
                              style={{ transform: 'translateZ(10px)' }}
                            >
                              <Image src={model.image} alt={model.name} fill className="object-cover scale-105 group-hover/model:scale-110 group-hover/model:rotate-1 transition-all duration-[2000ms]" />
                              {/* Gradient only fades the bottom part to seamlessly connect with the solid content */}
                              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/10 to-transparent"></div>
                              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                            </div>

                            {/* Foreground 3D Content */}
                            <div className="relative z-10 flex flex-col h-full pointer-events-none p-6 md:p-8 pt-4 md:pt-6" style={{ transform: 'translateZ(40px)' }}>
                              <div className="flex justify-between items-start mb-6">
                                <div>
                                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#000000]/60 border border-white/10 rounded-full mb-3 backdrop-blur-md shadow-inner group-hover/model:bg-purple-500/20 group-hover/model:border-purple-500/50 transition-all">
                                    <span className="material-symbols-outlined text-purple-400 text-xs drop-shadow-[0_0_5px_rgba(168,85,247,1)]">{model.icon}</span>
                                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{model.tagline}</span>
                                  </div>
                                  <h4 className="font-headline font-black text-white text-3xl tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight">{model.name}</h4>
                                </div>
                              </div>

                              <p className="text-sm md:text-base text-slate-300 leading-relaxed mb-6 flex-grow drop-shadow-md">
                                {model.description}
                              </p>

                              <div className="bg-black/60 p-5 rounded-lg border border-purple-500/10 mb-8 group-hover/model:bg-purple-500/10 group-hover/model:border-purple-500/30 group-hover/model:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all backdrop-blur-md">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                                    <span className="material-symbols-outlined text-purple-400 text-sm">rocket_launch</span>
                                  </div>
                                  <span className="text-sm font-bold text-white uppercase tracking-wider">Aplicación en su Negocio</span>
                                </div>
                                <p className="text-sm text-slate-300 italic font-medium leading-relaxed drop-shadow-sm">"{model.application}"</p>
                              </div>

                              <ul className="space-y-3 md:space-y-4">
                                {model.features.map((feature: string, idx: number) => (
                                  <li key={idx} className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/5 group-hover/model:bg-white/10 group-hover/model:border-white/10 transition-colors">
                                    <div className="w-6 h-6 shrink-0 rounded-full bg-cyan-400/20 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_8px_rgba(47,217,244,0.3)]">
                                      <span className="material-symbols-outlined text-cyan-400 text-[10px] font-bold">check</span>
                                    </div>
                                    <span className="text-xs md:text-sm font-bold text-white uppercase tracking-widest">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* AI CTA Footer */}
                      <div className="mt-12 p-8 md:p-10 bg-gradient-to-r from-purple-500/20 via-surface-container to-transparent rounded-2xl border border-purple-500/20 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group/footer cursor-pointer hover:border-purple-500/40 transition-colors shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] group-hover/footer:bg-purple-500/30 transition-colors duration-1000"></div>
                        <div className="relative z-10 flex-grow max-w-3xl">
                          <h4 className="font-headline text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">{data.aiModels.footer.title}</h4>
                          <p className="text-sm md:text-base text-slate-300 leading-relaxed font-medium">{data.aiModels.footer.description}</p>
                        </div>
                        <button className="relative z-10 whitespace-nowrap bg-purple-500 text-white px-8 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] flex items-center gap-3 border border-purple-400/50">
                          <span className="material-symbols-outlined text-sm">support_agent</span>
                          Asesoría Gratis
                        </button>
                      </div>
                    </div>
                  </section>
                )}

                {sectionId === 'expansion' && (
                  /* Business Expansion Section */
                  <section className="relative group">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                      <div>
                        <div className="flex items-center gap-3 mb-6">
                          <span className="text-tertiary font-bold tracking-[0.3em] uppercase text-xs">{data.expansion.tagline}</span>
                          <div className="h-px flex-1 bg-gradient-to-r from-tertiary/50 to-transparent"></div>
                        </div>
                        <h2 className="font-headline text-4xl lg:text-5xl font-black mb-8 text-white tracking-tight leading-tight">
                          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-tertiary/50">
                            {data.expansion.title}
                          </span>
                        </h2>
                        <p className="text-slate-300 text-lg md:text-xl leading-relaxed mb-10 font-medium opacity-90 delay-100 transition-all">
                          {data.expansion.description}
                        </p>
                        <div className="space-y-4">
                          {data.expansion.items.map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-5 group/item bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 hover:border-tertiary/30 transition-all hover:-translate-y-1 shadow-lg backdrop-blur-sm">
                              <div className="w-12 h-12 rounded-full bg-tertiary/10 border border-tertiary/30 flex items-center justify-center group-hover/item:bg-tertiary group-hover/item:text-on-tertiary transition-all shadow-[0_0_15px_rgba(47,217,244,0.15)] group-hover/item:shadow-[0_0_20px_rgba(47,217,244,0.4)]">
                                <span className="material-symbols-outlined text-tertiary group-hover/item:text-on-tertiary transition-colors">{item.icon}</span>
                              </div>
                              <span className="font-black text-sm md:text-base uppercase tracking-wider text-white drop-shadow-sm">{item.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="relative aspect-video lg:aspect-square rounded-sm overflow-hidden border border-white/10 flex items-center justify-center bg-white/5">
                        <Image
                          alt="Sneyder Studio Logo"
                          className="w-1/2 h-1/2 object-contain"
                          src="https://i.postimg.cc/mDgqGyw3/Picsart-25-03-28-04-00-43-410.png"
                          fill
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-tertiary/5 to-transparent"></div>
                      </div>
                    </div>
                  </section>
                )}

                {sectionId === 'cta' && (
                  /* Elegant CTA Section */
                  <section className="bg-surface-container-low p-12 md:p-24 rounded-3xl text-center border border-white/10 relative overflow-hidden group shadow-2xl mt-32 mb-20 mx-4 md:mx-0">
                    {/* Decorative elements */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-tertiary/10 rounded-full blur-[100px] group-hover:bg-tertiary/20 transition-all duration-1000"></div>
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] group-hover:bg-purple-500/20 transition-all duration-1000"></div>

                    <div className="relative z-10 max-w-3xl mx-auto">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-tertiary/10 border border-tertiary/30 rounded-full mb-8 backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                        <span className="text-[10px] font-black text-tertiary uppercase tracking-[0.3em]">Transformación Digital</span>
                      </div>

                      <h2 className="font-headline text-4xl md:text-6xl font-black mb-8 text-white tracking-tight leading-tight">
                        {data.cta.title}
                      </h2>

                      <p className="text-slate-300 max-w-2xl mx-auto mb-12 text-lg md:text-xl leading-relaxed font-medium opacity-90">
                        {data.cta.description}
                      </p>

                      <div className="flex justify-center">
                        <button
                          onClick={() => {
                            if (user) {
                              router.push('/contacto');
                            } else {
                              setAuthView('login');
                              setShowAuthModal(true);
                            }
                          }}
                          className="group/btn relative overflow-hidden bg-tertiary text-on-tertiary px-10 py-5 font-black uppercase tracking-[0.2em] text-xs md:text-sm rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_20px_50px_rgba(47,217,244,0.3)] hover:shadow-[0_20px_70px_rgba(47,217,244,0.5)] flex items-center gap-4"
                        >
                          <span className="relative z-10">{data.cta.buttonText}</span>
                          <span className="material-symbols-outlined relative z-10 group-hover/btn:translate-x-2 transition-transform">arrow_forward</span>
                          <div className="absolute inset-0 w-1/2 h-full bg-white/20 -skew-x-12 -translate-x-[200%] group-hover/btn:animate-shine"></div>
                        </button>
                      </div>
                    </div>
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
            <div
              className="h-12 w-auto relative cursor-pointer hover:scale-105 transition-all bg-white/5 rounded-xl border border-white/10 overflow-hidden p-2 group shadow-lg"
              onClick={() => { setViewerImage("https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png"); setShowLogoViewer(true); }}
            >
              <Image
                src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png"
                alt="Sneyder Studio Secondary Logo"
                width={120}
                height={40}
                className="h-full w-auto object-contain opacity-80 group-hover:opacity-100 group-hover:brightness-110 transition-all"
              />
            </div>
            <div className="flex gap-12 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              <a className="hover:text-cyan-400 transition-colors" href={adminSettings?.linkedin_url || "https://www.linkedin.com/in/sneyder-studio-2b84793b7"} target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a className="hover:text-cyan-400 transition-colors" href={adminSettings?.github_url || "#"} target="_blank" rel="noopener noreferrer">GitHub</a>
              <Link className="hover:text-cyan-400 transition-colors" href="/contacto">Contáctenos</Link>
            </div>
            <div className="text-[10px] font-medium text-slate-600 uppercase tracking-widest">
              © 2024 Sneyder Studio. All Rights Reserved.
            </div>
          </div>
        </footer>
      </main>

      {/* Image Viewer Modal */}
      {showLogoViewer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-fade-in">
          <div
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
            onClick={() => setShowLogoViewer(false)}
          ></div>
          <div className="relative max-w-5xl w-full h-full max-h-[80vh] flex flex-col items-center justify-center animate-scale-up">
            <button
              onClick={() => setShowLogoViewer(false)}
              className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white/5 p-4 border border-white/10 shadow-2xl">
              <Image
                src={viewerImage}
                alt="Sneyder Studio Logo Detail"
                fill
                className="object-contain"
                priority
              />
            </div>
            <p className="mt-6 text-cyan-400 font-bold uppercase tracking-[0.3em] text-xs">Identidad Visual Premium</p>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialView={authView}
          setView={setAuthView}
          setShowVerificationToast={setShowVerificationToast}
        />
      )}

      {showVerificationToast && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
            onClick={() => setShowVerificationToast(false)}
          />
          <div className="w-full max-w-sm bg-[#111827] border border-cyan-400/20 rounded-3xl shadow-[0_20px_80px_rgba(47,217,244,0.15)] p-10 animate-slide-up backdrop-blur-3xl relative pointer-events-auto overflow-hidden">
            {/* Animated Glow Effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-400/10 rounded-full blur-[80px]"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px]"></div>

            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400"></div>

            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 bg-cyan-400/10 rounded-full flex items-center justify-center border border-cyan-400/20">
                  <span className="material-symbols-outlined text-cyan-400 text-4xl animate-pulse">mail</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center border-2 border-[#111827]">
                  <span className="material-symbols-outlined text-white text-xs">check</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-2xl font-headline font-black text-white tracking-tight">Confirmar Registro</h4>
                <p className="text-sm text-slate-400 font-body leading-relaxed px-2">
                  Hemos enviado un <span className="text-cyan-400">enlace de seguridad personalizado</span> a tu correo. Por favor, revísalo para activar tu acceso.
                </p>
              </div>

              <div className="w-full space-y-3 pt-2">
                <button
                  onClick={() => setShowVerificationToast(false)}
                  className="w-full bg-cyan-400 text-black py-4 rounded-xl font-bold uppercase tracking-wider text-[11px] hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_10px_20px_rgba(47,217,244,0.3)]"
                >
                  Abrir mi Correo
                </button>
                <button
                  onClick={() => {
                    window.open('https://wa.me/50688888888', '_blank'); // Example support number
                  }}
                  className="w-full bg-white/5 border border-white/10 text-white/70 py-3 rounded-xl font-bold uppercase tracking-wider text-[10px] hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">support_agent</span>
                  Problemas al recibir
                </button>
              </div>

              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-medium">Revisa también tu carpeta de Spam</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// User Authentication Modal (Login / Register)
function AuthModal({ isOpen, onClose, initialView, setView, setShowVerificationToast }: { isOpen: boolean; onClose: () => void; initialView: 'login' | 'register'; setView: (view: 'login' | 'register') => void; setShowVerificationToast: (val: boolean) => void }) {
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    managerName: '',
    companyName: '',
    whatsapp: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleResetPassword = async () => {
    if (!formData.email) {
      setError("Por favor ingresa tu correo electrónico.");
      return;
    }
    setIsResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, formData.email);
      setSaveMessage("Correo de recuperación enviado. Revisa tu bandeja de entrada.");
    } catch (err: any) {
      setError("Error al enviar correo: " + (err.code === 'auth/user-not-found' ? 'Usuario no encontrado' : err.message));
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (initialView === 'register') {
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Las contraseñas no coinciden");
        }

        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        // Skip email verification as requested
        // await sendEmailVerification(user);

        // Update basic profile
        await updateProfile(user, {
          displayName: formData.managerName
        });

        // Store extra data in Firestore
        await setDoc(doc(db, "profiles", user.uid), {
          id: user.uid,
          email: formData.email,
          manager_name: formData.managerName,
          company_name: formData.companyName,
          whatsapp: formData.whatsapp,
          created_at: new Date().toISOString()
        });

        // setShowVerificationToast(true);
        onClose();
      } else {
        // Sign In
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);

        // Bypassing email verification check as requested
        /*
        if (!userCredential.user.emailVerified) {
          setError("Tu correo electrónico no ha sido verificado. Revisa tu bandeja de entrada para activarlo.");
          return;
        }
        */

        onClose();
      }
    } catch (err: any) {
      console.error("Auth error:", err.code, err.message);
      if (err.code === 'auth/email-already-in-use') {
        setError("Este correo electrónico ya está registrado.");
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-email' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Credenciales inválidas. Verifica tu correo y contraseña.");
      } else if (err.code === 'auth/weak-password') {
        setError("La contraseña debe tener al menos 6 caracteres.");
      } else {
        setError("Error de autenticación: " + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };



  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={onClose}
        />

        <div className="auth-modal-content relative w-full max-w-lg max-h-[85dvh] overflow-y-auto bg-surface/80 border border-white/10 rounded-2xl shadow-2xl overflow-x-hidden animate-slide-up backdrop-blur-xl">
          {/* Decorative Top Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-tertiary to-transparent"></div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-10"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          <div className="p-5 sm:p-8 md:p-12">
            {/* Tabs */}
            <div className="flex gap-8 mb-10 border-b border-white/5">
              <button
                onClick={() => setView('login')}
                className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${initialView === 'login' ? 'text-tertiary' : 'text-white/40 hover:text-white/60'}`}
              >
                Iniciar Sesión
                {initialView === 'login' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-tertiary shadow-[0_0_10px_rgba(47,217,244,0.5)]"></div>}
              </button>
              <button
                onClick={() => setView('register')}
                className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${initialView === 'register' ? 'text-tertiary' : 'text-white/40 hover:text-white/60'}`}
              >
                Crear Cuenta
                {initialView === 'register' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-tertiary shadow-[0_0_10px_rgba(47,217,244,0.5)]"></div>}
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-headline font-black text-white">
                  {initialView === 'login' ? 'Bienvenido a Sneyder' : 'Únete al Futuro'}
                </h3>
                <p className="text-sm text-slate-400 font-body">
                  {initialView === 'login'
                    ? 'Ingresa tus credenciales para acceder a la plataforma.'
                    : 'Completa el formulario para iniciar tu primer proyecto.'}
                </p>
              </div>

              <form className="space-y-6 pt-4" onSubmit={handleAuth}>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] p-3 rounded-lg animate-shake">
                    {error}
                  </div>
                )}
                {saveMessage && (
                  <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] p-3 rounded-lg">
                    {saveMessage}
                  </div>
                )}

                {initialView === 'register' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Nombre y Apellido del Encargado</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg">person</span>
                        <input
                          type="text"
                          name="managerName"
                          value={formData.managerName}
                          onChange={handleChange}
                          required
                          placeholder="Ej. Juan Pérez"
                          className="w-full bg-white/5 border border-white/10 rounded-lg py-4 pl-12 pr-4 text-white focus:border-tertiary focus:ring-1 focus:ring-tertiary/20 outline-none transition-all font-body text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Nombre de la Empresa</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg">domain</span>
                        <input
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                          required
                          placeholder="Ej. Sneyder Studio S.A."
                          className="w-full bg-white/5 border border-white/10 rounded-lg py-4 pl-12 pr-4 text-white focus:border-tertiary focus:ring-1 focus:ring-tertiary/20 outline-none transition-all font-body text-sm"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Correo Electrónico</label>
                  <div className="relative">
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-lg transition-colors ${isEmailFocused ? 'text-tertiary' : 'text-slate-500'}`}>mail</span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="nombre@empresa.com"
                      onFocus={() => setIsEmailFocused(true)}
                      onBlur={() => setIsEmailFocused(false)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-4 pl-12 pr-4 text-white focus:border-tertiary focus:ring-1 focus:ring-tertiary/20 outline-none transition-all font-body text-sm"
                    />
                  </div>
                </div>

                {initialView === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Número de WhatsApp (Opcional)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg">chat</span>
                      <input
                        type="tel"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleChange}
                        placeholder="+506 8888-8888"
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-4 pl-12 pr-4 text-white focus:border-tertiary focus:ring-1 focus:ring-tertiary/20 outline-none transition-all font-body text-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Contraseña</label>
                  <div className="relative">
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-lg transition-colors ${isPasswordFocused ? 'text-tertiary' : 'text-slate-500'}`}>lock</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="••••••••"
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-4 pl-12 pr-12 text-white focus:border-tertiary focus:ring-1 focus:ring-tertiary/20 outline-none transition-all font-body text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-tertiary transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {initialView === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Confirmar Contraseña</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg">lock_reset</span>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required={initialView === 'register'}
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-4 pl-12 pr-12 text-white focus:border-tertiary focus:ring-1 focus:ring-tertiary/20 outline-none transition-all font-body text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-tertiary transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {showConfirmPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {initialView === 'login' && (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={isResettingPassword}
                    className="text-tertiary text-[10px] uppercase tracking-widest font-bold hover:underline mb-2 disabled:opacity-50"
                  >
                    {isResettingPassword ? "Enviando..." : "¿Olvidaste tu contraseña?"}
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-tertiary text-on-tertiary py-4 rounded-lg font-bold uppercase tracking-[0.2em] text-xs shadow-[0_10px_30px_rgba(47,217,244,0.2)] hover:shadow-[0_10px_40px_rgba(47,217,244,0.4)] hover:brightness-110 active:scale-95 transition-all text-center flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-on-tertiary/30 border-t-on-tertiary rounded-full animate-spin"></span>
                      Procesando...
                    </span>
                  ) : (
                    initialView === 'login' ? 'Entrar al Sistema' : 'Empezar ahora'
                  )}
                </button>

              </form>
            </div>
          </div>

          {/* Premium Bottom Bar */}
          <div className="bg-white/5 p-4 text-center border-t border-white/5">
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-body">
              Protegido por Sneyder Studio Expansion • 2024
            </p>
          </div>
        </div>

        {/* Verification Window placeholder moved to Home */}
      </div>
    </div>
  );
}

function NavItem({ icon, label, href, active = false, small = false, className = "" }: { icon: string; label: string; href: string; active?: boolean; small?: boolean; className?: string }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 px-4 py-3 transition-colors ${active
        ? "text-cyan-400 font-bold bg-slate-800/50"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
        } ${small ? "text-sm" : ""} ${className}`}
    >
      <span className={`material-symbols-outlined ${small ? "text-base" : ""}`}>{icon}</span>
      <span>{label}</span>
    </Link>
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
  { name: 'Firebase', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/firebase/firebase-plain.svg', about: 'Backend-as-a-Service por excelencia de Google, otorgando bases de datos en tiempo real ultrarrápidas y gestión de autenticaciones seguras.' },
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
  const [selectedTech, setSelectedTech] = useState<{ name: string, src: string, about: string, invert?: boolean } | null>(null);

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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
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


