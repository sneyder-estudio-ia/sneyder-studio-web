"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getCMSData } from "@/lib/cms";
import { getAdminSettings } from "@/lib/settings";

const ADMIN_EMAIL = "sneyder23081994@gmail.com";

export default function IAModelsPage() {
  const [data, setData] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  const [adminSettings, setAdminSettings] = useState<any>(null);

  useEffect(() => {
    const loadContent = async () => {
      const dbData = await getCMSData();
      setData(dbData);

      const settings = await getAdminSettings();
      setAdminSettings(settings);
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
        <span className="text-tertiary font-bold tracking-[0.5em] uppercase text-[10px]">Iniciando Motores de IA...</span>
      </div>
    </div>
  );

  const aiModels = [
    {
      id: "gpt-4o",
      name: "GPT-4o (OpenAI)",
      tagline: "Razonamiento Avanzado",
      description: "El modelo más versátil y conocido del mundo. Ideal para automatizaciones que requieren un razonamiento lógico complejo, comprensión profunda del lenguaje natural y generación de contenido creativo de alta fidelidad.",
      useCase: "Perfecto para chatbots de atención al cliente de alto nivel, asistentes de redacción corporativa y análisis de datos empresariales complejos.",
      logo: "/openai_logo_premium_1776816577526.png",
      color: "from-slate-400 to-slate-600",
      features: ["Multimodal (Texto y Voz)", "Velocidad Extrema", "Memoria Contextual Amplia"]
    },
    {
      id: "claude-3-5",
      name: "Claude 3.5 Sonnet",
      tagline: "Precisión y Código",
      description: "Desarrollado por Anthropic, Claude se destaca por su tono humano, seguridad intrínseca y una capacidad excepcional para seguir instrucciones técnicas detalladas y escribir código impecable.",
      useCase: "Ideal para automatizar flujos de trabajo de desarrollo de software, auditoría de documentos legales y comunicación corporativa con un tono natural y seguro.",
      logo: "/anthropic_claude_logo_premium_1776816593950.png",
      color: "from-amber-400 to-orange-600",
      features: ["Seguridad Ética", "Excelente en Programación", "Visión Artificial Avanzada"]
    },
    {
      id: "gemini-1-5",
      name: "Gemini 1.5 Pro",
      tagline: "Ecosistema Google",
      description: "La propuesta más potente de Google. Su principal ventaja es el manejo de una ventana de contexto masiva (hasta 2 millones de tokens) y su integración nativa con todas las herramientas de Google Cloud.",
      useCase: "La mejor opción para analizar libros enteros, colecciones masivas de documentos o videos largos en segundos para extraer insights críticos de negocio.",
      logo: "/google_gemini_logo_premium_1776816606350.png",
      color: "from-blue-400 via-pink-400 to-purple-600",
      features: ["Ventana de Contexto Gigante", "Integración con Workspace", "Multimodalidad Nativa"]
    },
    {
      id: "llama-3",
      name: "Llama 3 (Meta)",
      tagline: "Potencia Open Source",
      description: "El modelo de código abierto líder creado por Meta. Ofrece un rendimiento comparable a los modelos propietarios pero con la flexibilidad de poder ser ejecutado en servidores privados para máxima privacidad.",
      useCase: "Ideal para empresas que requieren procesar datos extremadamente sensibles localmente o que necesitan escalar automatizaciones con costos controlados.",
      logo: "/meta_llama_logo_premium_1776816619372.png",
      color: "from-indigo-400 to-blue-700",
      features: ["Privacidad de Datos", "Personalización Total", "Eficiencia en Costos"]
    }
  ];

  return (
    <div className="text-on-background selection:bg-tertiary/30 selection:text-tertiary min-h-screen bg-background relative overflow-x-hidden">
      {/* Header */}
      <header className={`fixed top-0 w-full z-60 bg-[#0c1324] border-b border-slate-800 flex justify-between items-center px-6 h-16 shadow-[0px_2px_10px_rgba(0,0,0,0.5)] transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-80" : "pl-0"}`}>
        <div className="flex items-center gap-0">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-cyan-400 hover:bg-slate-800 p-1 rounded-full transition-colors"
          >
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
          <Link
            href="/"
            className="bg-tertiary/10 border border-tertiary/50 text-tertiary px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-tertiary hover:text-on-tertiary transition-all"
          >
            Acceder
          </Link>
        )}
      </header>

      {/* Sidebar */}
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
                  src={user.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuBH_btGfHFWWHfApXWyzqu90p_2NBQZttyesQz6QlhsHASGNW17CG8J-xx8fF8jKJaPPfgtyTfolOPvAFnGM4gcX9ci9UmYI9bOziFWipLW0G_G3gtXXyBt4wq-ItmBSk5uKJraqJBEUPuv_ArRh18s3sVoJsjbr7ok9twnXcNobC6z0JiJlozlUbb6eL6KTjktk58yD7_vE1e63rOTk-xD7njqMy5SJaVxWwWikP2LOrMVuGfMcVTru4Wiih7wq_IOZ1WRsOIvKt0"}
                  width={48}
                  height={48}
                />
              ) : (
                <span className="material-symbols-outlined text-slate-500 text-3xl">person</span>
              )}
            </div>
            <div>
              <p className="font-bold text-white truncate max-w-[150px]">
                {userProfile?.manager_name?.split(' ')[0] || user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || "Visitante"}
              </p>
              <p className="text-xs text-cyan-400 uppercase tracking-widest">
                {user ? "Premium Account" : "Modo Invitado"}
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="relative w-full h-16 mb-8 cursor-pointer hover:scale-[1.02] transition-all bg-white/5 rounded-2xl border border-white/10 overflow-hidden p-3 shadow-xl group"
          >
            <Image
              src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png"
              alt="Sneyder Studio"
              fill
              className="object-contain object-left group-hover:brightness-110"
            />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-1">
          <NavItem icon="home" label="Inicio" href="/" onClick={() => setIsMenuOpen(false)} />
          <NavItem icon="account_circle" label="Perfil de usuario" href="/profile" onClick={() => setIsMenuOpen(false)} />
          {user?.email === ADMIN_EMAIL && <NavItem icon="settings" label="Administración" href="/admin" onClick={() => setIsMenuOpen(false)} />}
          <NavItem icon="shopping_bag" label="Mis pedidos" href="/mis-pedidos" onClick={() => setIsMenuOpen(false)} />
          <NavItem icon="bolt" label="Servicios" href="/servicios" onClick={() => setIsMenuOpen(false)} />
          <NavItem icon="psychology" label="Modelo de IA" href="/ia-models" active onClick={() => setIsMenuOpen(false)} />
          <NavItem icon="mail" label="Crea pedido" href="/contacto" onClick={() => setIsMenuOpen(false)} />

          <div className="pt-6 pb-2 px-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Legal</div>
          <NavItem icon="policy" label="Política y condiciones" href="/politicas" small onClick={() => setIsMenuOpen(false)} />
          <NavItem icon="gavel" label="Términos de servicio" href="/terminos" small onClick={() => setIsMenuOpen(false)} />
          <NavItem icon="description" label="Contrato de servicios" href="/contrato" small onClick={() => setIsMenuOpen(false)} />

          <div className="pt-6 pb-2 px-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Empresa</div>
          <NavItem icon="info" label="Acerca de nosotros" href="/nosotros" small onClick={() => setIsMenuOpen(false)} />
          <NavItem icon="support_agent" label="Soporte Técnico" href="https://wa.me/50688888888" small onClick={() => setIsMenuOpen(false)} />

          {user && (
            <button
              onClick={() => {
                handleSignOut();
                setIsMenuOpen(false);
              }}
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
      <main className={`transition-all duration-300 min-h-screen pb-20 pt-24 ${isMenuOpen ? "pl-0 lg:pl-80" : "pl-0"}`}>
        <div className="max-w-7xl mx-auto px-6">
          <header className="mb-20 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(47,217,244,0.8)]"></span>
              <span className="font-label text-xs font-bold tracking-[0.3em] uppercase text-cyan-400">Inteligencia Artificial Avanzada</span>
            </div>
            <h1 className="font-headline text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter">
              El Cerebro de su <span className="text-tertiary">Automatización</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Seleccionamos y personalizamos los modelos de IA más potentes del mercado para integrarlos directamente en sus procesos de negocio.
            </p>
          </header>

          <div className="space-y-32">
            {aiModels.map((model, index) => (
              <section key={model.id} className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${index % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}>
                <div className={`${index % 2 !== 0 ? 'lg:order-2' : ''}`}>
                  <div className={`inline-block px-4 py-1.5 rounded-full bg-gradient-to-r ${model.color} bg-opacity-20 backdrop-blur-xl border border-white/10 mb-6`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">{model.tagline}</span>
                  </div>
                  <h2 className="font-headline text-4xl md:text-6xl font-bold text-white mb-8">{model.name}</h2>
                  <p className="text-slate-300 text-lg leading-relaxed mb-8">
                    {model.description}
                  </p>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8 backdrop-blur-md">
                    <h4 className="text-cyan-400 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">rocket_launch</span> Aplicación en su Negocio
                    </h4>
                    <p className="text-slate-400 leading-relaxed italic">
                      "{model.useCase}"
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    {model.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <span className="material-symbols-outlined text-tertiary text-lg">check_circle</span>
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`relative aspect-square md:aspect-video lg:aspect-square flex items-center justify-center ${index % 2 !== 0 ? 'lg:order-1' : ''}`}>
                  {/* Decorative Background Glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${model.color} opacity-10 blur-[100px] rounded-full`}></div>

                  {/* Floating Logo Container */}
                  <div className="relative w-full h-full max-w-md max-h-md flex items-center justify-center group">
                    <div className="absolute inset-0 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm -rotate-3 group-hover:rotate-0 transition-transform duration-700"></div>
                    <div className="absolute inset-0 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm rotate-3 group-hover:rotate-0 transition-transform duration-700"></div>

                    <div className="relative w-4/5 h-4/5 flex items-center justify-center p-12 bg-surface-container-lowest rounded-3xl shadow-2xl border border-white/10 z-10 transition-transform duration-700 group-hover:scale-105">
                      <div className="relative w-full h-full">
                        <Image
                          src={model.logo}
                          alt={`${model.name} Logo`}
                          fill
                          className="object-contain drop-shadow-[0_0_30px_rgba(47,217,244,0.3)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>

          {/* CTA Section */}
          <section className="mt-48 bg-gradient-to-br from-surface-container-low to-background p-12 md:p-20 rounded-[3rem] border border-white/5 text-center relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-tertiary/10 rounded-full blur-[100px]"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px]"></div>

            <h2 className="font-headline text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">¿No sabe cuál elegir?</h2>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12">
              Nuestros expertos analizan su modelo de negocio y flujo de trabajo para recomendarle la combinación perfecta de modelos que maximice su ROI.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/"
                className="inline-flex items-center gap-3 bg-tertiary text-on-tertiary px-10 py-5 rounded-full font-bold uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_15px_40px_rgba(47,217,244,0.3)]"
              >
                Solicitar Auditoría de IA <span className="material-symbols-outlined">psychology</span>
              </Link>

              <Link
                href="/recurso-adquirido"
                className="inline-flex items-center gap-3 bg-white/5 border border-white/10 text-white px-10 py-5 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-white/10 active:scale-95 transition-all shadow-xl"
              >
                Recurso Adquirido <span className="material-symbols-outlined text-tertiary">inventory_2</span>
              </Link>
            </div>
          </section>
        </div>

        <footer className="mt-32 py-12 border-t border-white/5 bg-black/20 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[10px] text-slate-600 uppercase tracking-[0.3em] font-bold">© 2024 Sneyder Studio • Premium Digital Solutions</p>
            <div className="flex gap-8">
              <Link href={adminSettings?.linkedin_url || "https://www.linkedin.com/in/sneyder-studio-2b84793b7"} target="_blank" className="text-[10px] text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-widest">LinkedIn</Link>
              <Link href={adminSettings?.github_url || "#"} target="_blank" className="text-[10px] text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-widest">GitHub</Link>
              <Link href="/contacto" className="text-[10px] text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-widest">Contáctenos</Link>
            </div>
          </div>
        </footer>
      </main>

    </div>
  );
}

function NavItem({ icon, label, href, active = false, small = false, className = "", onClick }: { icon: string; label: string; href: string; active?: boolean; small?: boolean; className?: string; onClick?: () => void }) {
  const isExternal = href.startsWith('http');
  
  const content = (
    <>
      <span className={`material-symbols-outlined ${small ? "text-base" : ""}`}>{icon}</span>
      <span>{label}</span>
    </>
  );

  const baseStyles = `flex items-center gap-4 px-4 py-3 transition-colors ${active
          ? "text-cyan-400 font-bold bg-slate-800/50"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
        } ${small ? "text-sm" : ""} ${className}`;

  if (isExternal) {
    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={baseStyles}
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={baseStyles}
      onClick={onClick}
    >
      {content}
    </Link>
  );
}


