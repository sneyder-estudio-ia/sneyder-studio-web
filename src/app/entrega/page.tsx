'use client';

import React from 'react';
import Link from 'next/link';

export default function EntregaPage() {
  return (
    <main className="min-h-screen bg-[#050810] text-white selection:bg-tertiary/30">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-tertiary/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 md:py-32">
        {/* Header */}
        <header className="mb-16 animate-fade-in">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-px w-8 bg-tertiary"></div>
            <span className="text-tertiary text-[10px] uppercase font-black tracking-[0.3em]">Protocolo Oficial</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-headline font-black mb-8 leading-tight">
            Información de <span className="text-tertiary">Entrega del Producto</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-2xl">
            Transparencia, seguridad y control total sobre los activos digitales de su empresa durante todo el proceso de desarrollo.
          </p>
        </header>

        {/* Content Section */}
        <div className="space-y-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          
          {/* Section 1 */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-xl">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-tertiary/20 rounded-2xl flex items-center justify-center shrink-0 border border-tertiary/30">
                <span className="material-symbols-outlined text-tertiary">mail</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-4">1. Identidad Digital Centralizada</h2>
                <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                  Para garantizar la integridad y escalabilidad de su proyecto, Sneyder Studio crea una cuenta de correo electrónico maestra dedicada exclusivamente a su empresa. Todos los recursos, desde dominios hasta bases de datos y consolas de administración, se vinculan y "atan" a esta identidad digital única.
                </p>
                <ul className="mt-6 space-y-3">
                  {['Registro de dominios y certificados SSL', 'Consolas de Google Cloud y Firebase', 'Cuentas de desarrollador en App Store y Play Store', 'Servidores y servicios de infraestructura cloud'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-xs text-slate-300">
                      <div className="w-1 h-1 bg-tertiary rounded-full"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-xl">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center shrink-0 border border-blue-500/30">
                <span className="material-symbols-outlined text-blue-400">admin_panel_settings</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-4">2. Uso vs. Gestión Administrativa</h2>
                <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                  Durante el desarrollo y fase de entrega inicial, el cliente tiene pleno derecho al uso de la aplicación o web para sus operaciones comerciales. Sin embargo, por seguridad técnica y financiera, **Sneyder Studio mantiene el control administrativo de las credenciales de ajuste, dominios de correo y código fuente**.
                </p>
                <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                  <p className="text-yellow-200 text-xs leading-relaxed italic">
                    "Usted opera el negocio, nosotros resguardamos la tecnología hasta la finalización del contrato."
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-tertiary/5 border border-tertiary/10 rounded-3xl p-8 md:p-12 backdrop-blur-xl">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center shrink-0 border border-green-500/30">
                <span className="material-symbols-outlined text-green-400">key</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-4">3. Liquidación y Transferencia de Propiedad</h2>
                <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                  El proceso de liberación de contraseñas es automático tras la liquidación total de la deuda asociada al proyecto. Una vez niquilada la deuda pendiente:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                    <h4 className="text-tertiary font-bold text-xs uppercase tracking-widest mb-2">Entrega Total</h4>
                    <p className="text-slate-500 text-[10px]">Liberación de todas las contraseñas maestras y acceso root a cada servicio.</p>
                  </div>
                  <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                    <h4 className="text-tertiary font-bold text-xs uppercase tracking-widest mb-2">Propiedad Legal</h4>
                    <p className="text-slate-500 text-[10px]">Transferencia completa de la titularidad de los dominios y activos digitales.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Legal Notice */}
          <section className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 md:p-8 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-left">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center shrink-0 border border-red-500/30">
                <span className="material-symbols-outlined text-red-500 text-xl">gavel</span>
              </div>
              <div>
                <h4 className="text-white font-bold text-sm mb-1">Importancia Legal</h4>
                <p className="text-slate-400 text-xs leading-relaxed max-w-xl">
                  Es de vital importancia leer nuestro <span className="text-white font-bold underline cursor-pointer">Contrato de Servicios</span>, ya que todas nuestras operaciones y entregas se rigen estrictamente bajo el <span className="text-red-400 font-black">Marco Legal Costarricense</span>.
                </p>
              </div>
            </div>
            <Link 
              href="/"
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold uppercase text-[9px] tracking-[0.2em] hover:bg-red-500/10 hover:border-red-500/30 transition-all shrink-0"
            >
              Ver Contrato
            </Link>
          </section>

          {/* CTA / Footer Info */}
          <div className="text-center pt-8">
            <p className="text-slate-500 text-sm mb-8">
              ¿Tiene preguntas sobre nuestra política de entrega?
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/contacto"
                className="px-8 py-4 bg-tertiary text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(0,195,255,0.3)]"
              >
                Volver a Contacto
              </Link>
              <Link 
                href="/"
                className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-white/10 transition-all"
              >
                Ir al Inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
