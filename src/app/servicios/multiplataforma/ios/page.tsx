"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function IOSPlatformPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="bg-[#0c1324] min-h-screen text-[#dce1fb] selection:bg-[#ffb4ab] selection:text-[#690005] font-sans overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ffb4ab]/5 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#89ceff]/10 blur-[150px] rounded-full"></div>
      </div>

      <header className="fixed top-0 w-full z-50 px-6 py-4 backdrop-blur-md bg-[#0c1324]/50 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="material-symbols-outlined text-[#89ceff] group-hover:-translate-x-1 transition-transform">arrow_back</span>
            <span className="font-headline font-bold uppercase tracking-widest text-xs">Volver al Inicio</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#89ceff]">Sneyder Studio</span>
            <div className="h-4 w-px bg-white/10"></div>
            <span className="text-[10px] font-medium uppercase tracking-widest text-[#ffb4ab]">iOS Premium</span>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto relative z-10">
        <div className={`transition-all duration-1000 transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex flex-col md:flex-row-reverse gap-12 items-center mb-20">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-6">
                <span className="material-symbols-outlined text-white text-sm">apple</span>
                <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Premium Experience</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-headline font-black mb-6 leading-tight">
                Elegancia <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#89ceff]">iOS</span>
              </h1>
              <p className="text-xl text-[#c6c6cd] leading-relaxed max-w-2xl mb-8">
                Diseñamos para el ecosistema Apple con una precisión milimétrica. Flutter nos permite entregar interfaces fluidas y gestos naturales que los usuarios de iOS esperan, con un rendimiento que desafía a lo nativo.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/contacto">
                  <div className="px-6 py-3 bg-white text-[#0c1324] font-bold rounded-sm hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer">
                    <span className="material-symbols-outlined">design_services</span>
                    Diseñar App Premium
                  </div>
                </Link>
                <Link href="/recurso-adquirido">
                  <div className="px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-sm hover:bg-white/10 transition-all flex items-center gap-2 cursor-pointer">
                    <span className="material-symbols-outlined text-[#89ceff] text-lg">inventory_2</span>
                    Recurso Adquirido
                  </div>
                </Link>
              </div>
            </div>
            <div className="flex-1 relative w-full aspect-square md:aspect-video rounded-sm overflow-hidden border border-white/5 shadow-2xl">
              <Image 
                src="/images/services/ios.png" 
                alt="iOS Development" 
                fill 
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1324] via-transparent to-transparent"></div>
            </div>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon="draw" 
              title="Cupertino Design" 
              desc="Implementación de widgets de iOS que se ven y se sienten exactamente como los de Apple." 
            />
            <FeatureCard 
              icon="speed" 
              title="Impulso Skia/Impeller" 
              desc="Renderizado de gráficos a 60/120 FPS utilizando el motor de gráficos más avanzado de Flutter." 
            />
            <FeatureCard 
              icon="lock" 
              title="Seguridad Apple" 
              desc="Integración nativa con FaceID, TouchID y Keychain para una seguridad impenetrable." 
            />
          </section>

          <section className="mt-24 p-8 md:p-16 bg-[#151b2d] rounded-sm border border-white/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <span className="material-symbols-outlined text-9xl">apple</span>
             </div>
            <div className="relative z-10">
              <h2 className="text-3xl font-headline font-bold mb-12">Características Únicas de Construcción</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <TechDetail 
                  num="ALPHA" 
                  title="Un solo código, Presencia Total" 
                  text="Desarrollamos una vez y lanzamos simultáneamente para iPhone y iPad con optimización de layout dinámica." 
                />
                <TechDetail 
                  num="BETA" 
                  title="Gestos Naturales" 
                  text="La respuesta táctil en nuestras apps de iOS es instantánea, respetando los estándares de UX de Apple." 
                />
                <TechDetail 
                  num="GAMMA" 
                  title="Integración iCloud" 
                  text="Sincronización fluida de datos para usuarios dentro del ecosistema Apple." 
                />
                <TechDetail 
                  num="DELTA" 
                  title="Optimización de Memoria" 
                  text="Gestión de recursos ultra-eficiente para mantener el dispositivo fresco y rápido." 
                />
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="py-12 border-t border-white/5 px-6 text-center">
        <p className="text-xs text-[#c6c6cd] uppercase tracking-[0.2em] font-medium opacity-50">
          &copy; 2026 Sneyder Studio • Defininedo el Futuro de iOS con Flutter
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-[#151b2d]/50 p-8 rounded-sm border border-white/5 hover:border-white/30 transition-all group">
      <span className="material-symbols-outlined text-[#89ceff] text-4xl mb-6 group-hover:scale-110 transition-transform">{icon}</span>
      <h3 className="text-xl font-headline font-bold mb-4">{title}</h3>
      <p className="text-[#c6c6cd] text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function TechDetail({ num, title, text }: { num: string; title: string; text: string }) {
  return (
    <div className="flex gap-6 border-b border-white/5 pb-8">
      <span className="text-[#89ceff] font-headline font-black text-2xl">{num}</span>
      <div>
        <h4 className="text-lg font-bold mb-2">{title}</h4>
        <p className="text-[#c6c6cd] leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
