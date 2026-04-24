"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function ProtocoloEntregaPage() {
  const steps = [
    {
      id: 1,
      title: "Inicio y Configuración",
      icon: "rocket_launch",
      desc: "Se habilitan las credenciales básicas (Correo Administrativo) para que el cliente pueda supervisar el avance de los servicios vinculados.",
      status: "Acceso Parcial"
    },
    {
      id: 2,
      title: "Desarrollo y Pruebas",
      icon: "frame_inspect",
      desc: "El proyecto se construye en servidores de Sneyder Studio. El cliente recibe reportes periódicos pero el código fuente permanece en reserva.",
      status: "Reserva de Dominio"
    },
    {
      id: 3,
      title: "Liquidación y Saldo",
      icon: "account_balance_wallet",
      desc: "Al finalizar el desarrollo, se solicita la niquilación del saldo pendiente. Este paso es el disparador automático para la liberación de activos.",
      status: "Punto Crítico"
    },
    {
      id: 4,
      title: "Liberación de Activos",
      icon: "verified_user",
      desc: "Con saldo cero, el sistema desbloquea instantáneamente la descarga del código fuente, contraseñas maestras y certificados de propiedad.",
      status: "Acceso Total"
    }
  ];

  return (
    <div className="bg-[#0a0e1a] text-white min-h-screen selection:bg-cyan-400/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-600/5 rounded-full blur-[120px]"></div>
      </div>

      <header className="fixed top-0 w-full z-50 bg-[#0c1324]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 h-20">
        <div className="flex items-center gap-4">
          <Link href="/recurso-adquirido">
            <button className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold font-headline uppercase tracking-tight text-white">Seguridad & Entrega</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Protocolo Sneyder Studio</p>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto relative z-10">
        {/* Intro */}
        <section className="text-center mb-20">
          <div className="inline-block px-4 py-1.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full mb-6">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              Sistema de Transparencia Digital
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-headline font-black italic uppercase tracking-tighter mb-6 leading-tight">
            ¿Cómo funciona nuestro <span className="text-cyan-400">Sistema de Entrega?</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            Hemos diseñado un protocolo de seguridad que protege tanto el trabajo intelectual de nuestro estudio como la inversión de nuestros clientes.
          </p>
          
          <div className="flex justify-center">
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
              <Image 
                src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png"
                alt="Sneyder Studio"
                width={140}
                height={35}
                className="rounded-xl opacity-80"
              />
            </div>
          </div>
        </section>

        {/* Timeline */}
        <div className="space-y-4 relative">
          <div className="absolute left-[39px] top-10 bottom-10 w-0.5 bg-gradient-to-b from-cyan-400/0 via-cyan-400/20 to-cyan-400/0 hidden md:block"></div>
          
          {steps.map((step, i) => (
            <div key={step.id} className="relative group animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-10 hover:bg-white/[0.07] hover:border-white/10 transition-all flex flex-col md:flex-row items-center md:items-start gap-8 backdrop-blur-sm">
                <div className="w-20 h-20 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center shrink-0 relative z-10 group-hover:border-cyan-400/50 transition-colors shadow-2xl">
                  <span className="material-symbols-outlined text-4xl text-cyan-400 group-hover:scale-110 transition-transform">{step.icon}</span>
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-cyan-400 text-black font-black text-xs rounded-full flex items-center justify-center shadow-lg">
                    {step.id}
                  </div>
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <h3 className="text-2xl font-bold italic uppercase tracking-tight">{step.title}</h3>
                    <span className="px-4 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-400/30 transition-colors">
                      {step.status}
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed font-light text-base">
                    {step.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Closing card */}
        <div className="mt-20 p-12 bg-gradient-to-br from-cyan-400/10 to-purple-500/10 border border-white/10 rounded-[3rem] text-center overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
          <h4 className="text-3xl font-black uppercase tracking-tighter mb-4 italic">Seguridad Garantizada</h4>
          <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed mb-8">
            Este sistema automatizado asegura que el 100% de los activos sean entregados sin errores humanos una vez completada la relación comercial.
          </p>
          <Link href="/recurso-adquirido">
            <button className="bg-white text-black px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-cyan-400/10">
              Volver a mi Inventario
            </button>
          </Link>
        </div>
      </main>

      <footer className="py-12 text-center">
        <p className="text-[10px] text-slate-600 uppercase tracking-[0.5em] font-bold">
          Sneyder Studio Protocols • v2.0
        </p>
      </footer>

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
