"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

function RecursoAdquiridoContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [user, setUser] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRes, setSelectedRes] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && orderId) {
        try {
          const docRef = doc(db, 'orders', orderId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setOrder({ id: docSnap.id, ...docSnap.data() });
          }
        } catch (err) {
          console.error("Error fetching order:", err);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="bg-[#0a0e1a] text-white flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 relative">
            <div className="absolute inset-0 border-2 border-cyan-400/20 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400 animate-pulse">Sincronizando Recursos...</p>
        </div>
      </div>
    );
  }

  // Mock resources if order exists or if no order provided (for demo)
  const baseResources = [
    {
      id: "src-code",
      name: "Código Fuente (Main Branch)",
      size: "124 MB",
      icon: "code_blocks",
      status: order?.status === 'completed' ? "Disponible" : "Protegido",
      desc: "Acceso total a la lógica de negocio y componentes de la interfaz.",
      value: order?.source_code_link || "Pendiente de cargar"
    },
    {
      id: "admin-access",
      name: "Credenciales Administrativas",
      type: "Full Access",
      size: "Encriptado",
      icon: "admin_panel_settings",
      status: "Disponible",
      desc: "Acceso total a la cuenta maestra y contraseñas de administrador vinculadas al proyecto.",
      credentials: {
        email: order?.project_email || "admin@sneyderstudio.cloud",
        password: order?.status === 'completed' ? (order?.project_pass || "SN-8822-XP") : "********"
      }
    },
    {
      id: "email-password",
      name: "Contraseña del correo",
      type: "Private Key",
      size: "Protegido",
      icon: "lock",
      status: order?.status === 'completed' ? "Disponible" : "Bloqueado",
      desc: "Llave de seguridad para el acceso directo al servidor de correo corporativo.",
      credentials: {
        email: order?.project_email || "admin@sneyderstudio.cloud",
        password: order?.status === 'completed' ? (order?.email_pass || "EMAIL-SAFE-99") : "********"
      }
    },
    {
      id: "legal",
      name: "Documento de Garantía & Licencias",
      type: "PDF",
      size: "1.2 MB",
      icon: "verified",
      status: "Disponible",
      desc: "Certificación de propiedad y términos de mantenimiento."
    }
  ];

  const customMapped = (order?.custom_resources || []).map((cr: any) => ({
    id: cr.id,
    name: cr.title,
    type: cr.value.startsWith("http") ? "Enlace Externo" : "Información Extra",
    size: cr.isPrivate ? "Privado" : "Público",
    icon: cr.value.startsWith("http") ? "link" : "key",
    status: cr.isPrivate ? (order?.status === 'completed' ? "Disponible" : "Bloqueado") : "Disponible",
    desc: "Recurso adicional aprovisionado por la administración.",
    value: cr.isPrivate && order?.status !== 'completed' ? "Bloqueado (Requiere pago)" : cr.value
  }));

  const resources = [...baseResources, ...customMapped].sort((a, b) => {
    if (a.status === "Disponible" && b.status !== "Disponible") return -1;
    if (a.status !== "Disponible" && b.status === "Disponible") return 1;
    return 0;
  });

  const handleOpenModal = (res: any) => {
    if (res.status !== 'Disponible') return;
    setSelectedRes(res);
    setShowModal(true);
    setCopied(false);
    setShowPass(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0a0e1a] text-white min-h-screen selection:bg-cyan-400/30">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-cyan-400/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[120px]"></div>
      </div>

      <header className="fixed top-0 w-full z-50 bg-[#0c1324]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-5 h-16">
        <div className="flex items-center gap-4">
          <Link href={orderId ? `/mis-pedidos/${orderId}` : "/mis-pedidos"}>
            <button className="text-cyan-400 hover:scale-110 transition-transform p-1 rounded-full hover:bg-white/5">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          </Link>
          <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block"></div>
          <Link href="/" className="h-10 w-auto relative cursor-pointer hover:scale-105 transition-all bg-white/5 rounded-xl border border-white/10 overflow-hidden p-1.5 shadow-lg group">
            <Image
              src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png"
              alt="Sneyder Studio"
              width={140}
              height={28}
              className="h-full w-auto object-contain group-hover:brightness-110"
            />
          </Link>
          <h1 className="text-sm font-bold tracking-tight uppercase font-headline text-cyan-400 ml-2 hidden xs:block">Activos</h1>
        </div>

        <div className="text-right flex flex-col items-end">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <p className="text-[9px] md:text-[10px] text-cyan-400 font-bold uppercase tracking-widest truncate max-w-[120px] md:max-w-none">
              {order ? (order.items?.[0]?.name || 'Sneyder Resource') : 'Digital Assets'}
            </p>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-24 px-6 max-w-5xl mx-auto relative z-10">
        {/* Resource Header Card */}
        <div className="bg-gradient-to-br from-surface/80 to-surface-container-low/80 border border-white/10 rounded-3xl p-8 md:p-12 mb-12 backdrop-blur-2xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>

          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]"></span>
                <span className="text-xs font-bold uppercase tracking-widest text-green-400">Acceso Verificado</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-headline font-black leading-tight italic uppercase tracking-tighter">
                Sus Activos <span className="text-cyan-400">Digitales</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
                Bienvenido a su centro de recursos. Aquí encontrará toda la documentación, código fuente y credenciales administrativas de su proyecto en Sneyder Studio.
              </p>

              <div className="pt-4 flex flex-wrap gap-4">
                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
                  <span className="material-symbols-outlined text-cyan-400 text-lg">database</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Respaldo en Nube Activo</span>
                </div>
                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
                  <span className="material-symbols-outlined text-cyan-400 text-lg">security</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Encriptación de Punto a Punto</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-1/3 aspect-square relative group">
              <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-[60px] group-hover:bg-cyan-400/30 transition-all duration-700"></div>
              <div className="relative w-full h-full bg-slate-900 border border-white/10 rounded-[2rem] flex flex-col items-center justify-center p-8 text-center shadow-inner">
                <span className="material-symbols-outlined text-7xl text-cyan-400 mb-4 animate-float">folder_zip</span>
                <h4 className="text-sm font-bold uppercase tracking-widest mb-1">Master Pack</h4>
                <p className="text-[10px] text-slate-500 uppercase font-medium">Última actualización hoy</p>
                <button
                  onClick={() => {
                    if (order?.status !== 'completed') {
                      setShowBlockModal(true);
                    } else if (order?.source_code_link) {
                      window.open(order.source_code_link, '_blank');
                    } else {
                      alert("Los archivos fuente se subirán pronto. Contacta a soporte.");
                    }
                  }}
                  className="mt-8 w-full bg-cyan-400 text-black py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all"
                >
                  Descargar Todo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resources.map((res, i) => (
            <div
              key={res.id}
              className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/[0.08] hover:border-white/10 transition-all group flex flex-col justify-between"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:border-cyan-400/30 transition-all">
                  <span className="material-symbols-outlined text-3xl text-cyan-400">{res.icon}</span>
                </div>
                <div className="text-right">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${res.status === 'Disponible' ? 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                    {res.status}
                  </span>
                  <p className="text-[10px] font-medium text-slate-500 mt-2 uppercase tracking-tighter">{res.type} {res.size ? `• ${res.size}` : ''}</p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-bold mb-2 group-hover:text-cyan-400 transition-colors">{res.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{res.desc}</p>
              </div>

              <button
                onClick={() => handleOpenModal(res)}
                disabled={res.status !== 'Disponible'}
                className={`w-full py-3.5 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all ${res.status === 'Disponible'
                    ? 'bg-white/5 border border-white/10 text-white hover:bg-cyan-400 hover:text-black hover:border-cyan-400'
                    : 'bg-black/20 text-slate-600 border border-white/5 cursor-not-allowed'
                  }`}
              >
                <span className="material-symbols-outlined text-sm">{res.credentials ? 'visibility' : 'download'}</span>
                {res.status === 'Disponible'
                  ? (res.credentials ? 'Ver Credenciales' : 'Descargar Archivo')
                  : 'Próximamente'}
              </button>
            </div>
          ))}
        </div>

        {/* Modal Pago Pendiente (Blocking Modal) */}
        {showBlockModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-fade-in" onClick={() => setShowBlockModal(false)}></div>
            <div className="bg-[#1a0b0b] border border-red-500/20 w-full max-w-sm rounded-[2.5rem] p-10 shadow-[0_0_50px_rgba(239,68,68,0.1)] relative z-10 animate-scale-up text-center">
              <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8 mx-auto">
                <span className="material-symbols-outlined text-5xl text-red-500 animate-pulse">payments</span>
              </div>

              <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter text-white italic">Acceso Restringido</h3>
              <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                Esta acción está bloqueada debido a deudas pendientes en su cuenta. Por favor, liquide el saldo total para desbloquear todos sus activos digitales.
              </p>

              <div className="space-y-3">
                <Link href={orderId ? `/mis-pedidos/${orderId}` : "/mis-pedidos"}>
                  <button className="w-full py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-lg shadow-red-500/20">
                    Ir a realizar pago
                  </button>
                </Link>
                <button
                  onClick={() => setShowBlockModal(false)}
                  className="w-full py-4 bg-white/5 border border-white/10 text-slate-500 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 hover:text-white transition-all underline underline-offset-4 decoration-red-500/30"
                >
                  Cerrar aviso
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Flotante de Credenciales */}
        {showModal && selectedRes && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setShowModal(false)}></div>
            <div className="bg-[#151b2d] border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl relative z-10 animate-scale-up">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>

              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-cyan-400/10 rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-4xl text-cyan-400">{selectedRes.icon}</span>
                </div>
                <h3 className="text-xl font-bold mb-2 uppercase tracking-tight text-center">{selectedRes.name}</h3>
                <p className="text-xs text-slate-400 mb-8 font-medium uppercase tracking-[0.2em] text-center">{selectedRes.type}</p>

                {selectedRes.credentials ? (
                  <div className="w-full space-y-4">
                    {/* Email Field */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Correo Electrónico</label>
                      <div className="w-full bg-slate-900 rounded-2xl p-5 border border-white/5 relative flex items-center justify-between">
                        <p className="text-cyan-400 font-mono text-sm break-all pr-10">{selectedRes.credentials.email}</p>
                        <button
                          onClick={() => copyToClipboard(selectedRes.credentials.email)}
                          className="absolute right-3 w-8 h-8 bg-cyan-400/10 text-cyan-400 rounded-lg flex items-center justify-center hover:bg-cyan-400 hover:text-black transition-all"
                        >
                          <span className="material-symbols-outlined text-xs">{copied ? 'check' : 'content_copy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Contraseña Administrador</label>
                      <div className="w-full bg-slate-900 rounded-2xl p-5 border border-white/5 relative flex items-center justify-between">
                        <p className="text-cyan-400 font-mono text-sm break-all pr-20">
                          {selectedRes.credentials.password === '********'
                            ? '********'
                            : (showPass ? selectedRes.credentials.password : '••••••••••••')}
                        </p>
                        <div className="absolute right-3 flex items-center gap-2">
                          <button
                            onClick={() => setShowPass(!showPass)}
                            disabled={selectedRes.credentials.password === '********'}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${selectedRes.credentials.password === '********'
                                ? 'text-slate-700 cursor-not-allowed'
                                : 'text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-400/10'
                              }`}
                          >
                            <span className="material-symbols-outlined text-xs">{showPass ? 'visibility_off' : 'visibility'}</span>
                          </button>
                          <button
                            onClick={() => copyToClipboard(selectedRes.credentials.password)}
                            disabled={selectedRes.credentials.password === '********'}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${selectedRes.credentials.password === '********'
                                ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                                : 'bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400 hover:text-black'
                              }`}
                          >
                            <span className="material-symbols-outlined text-xs">{copied ? 'check' : 'content_copy'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full bg-slate-900 rounded-2xl p-6 border border-white/5 relative group mb-8 flex items-center justify-center">
                    {selectedRes.type === "Enlace Externo" ? (
                      <a href={selectedRes.value} target="_blank" rel="noopener noreferrer" className="text-cyan-400 font-mono text-center break-all underline hover:text-cyan-300">
                        Abrir Enlace Externo
                      </a>
                    ) : (
                      <p className="text-cyan-400 font-mono text-center break-all">{selectedRes.value}</p>
                    )}
                    <button
                      onClick={() => copyToClipboard(selectedRes.value)}
                      className="absolute -right-2 -top-2 w-10 h-10 bg-cyan-400 text-black rounded-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"
                    >
                      <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
                    </button>
                  </div>
                )}

                <p className="mt-8 text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed text-center">
                  Esta información es confidencial. No la comparta con terceros no autorizados.
                </p>

                <button
                  onClick={() => setShowModal(false)}
                  className="mt-8 w-full py-4 bg-white/5 border border-white/10 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all"
                >
                  Entendido, cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Legal Disclaimer */}
        <div className="mt-16 p-8 bg-red-500/5 border border-red-500/10 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center shrink-0 border border-red-500/20">
              <span className="material-symbols-outlined text-red-500">lock_person</span>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-2 uppercase tracking-widest">Protocolo de Seguridad de Activos</h4>
              <p className="text-slate-500 text-xs leading-relaxed max-w-xl">
                Todos los recursos están protegidos por el <span className="text-red-400 font-bold uppercase tracking-tighter">Copyright de Sneyder Studio</span> hasta la liquidación total del proyecto. La redistribución no autorizada está estrictamente prohibida por ley.
              </p>
            </div>
          </div>
          <Link href="/entrega">
            <button className="px-8 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold uppercase text-[9px] tracking-widest hover:bg-white/10 transition-all shrink-0">
              Protocolo de Entrega
            </button>
          </Link>
        </div>
      </main>

      <footer className="py-12 border-t border-white/5 bg-black/40 backdrop-blur-xl text-center">
        <p className="text-[10px] text-slate-600 uppercase tracking-[0.4em] font-bold">
          Sneyder Studio Expansion • © 2024 • Secured Assets Area
        </p>
      </footer>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-scale-up {
          animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}

export default function RecursoAdquiridoPage() {
  return (
    <Suspense fallback={
      <div className="bg-[#0a0e1a] text-white flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <span className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></span>
          <p className="text-xs text-slate-500 uppercase tracking-widest">Cargando módulos...</p>
        </div>
      </div>
    }>
      <RecursoAdquiridoContent />
    </Suspense>
  );
}
