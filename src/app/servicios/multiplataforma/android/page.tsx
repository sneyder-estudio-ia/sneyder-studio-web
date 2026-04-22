"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function AndroidPlatformPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="bg-[#0c1324] min-h-screen text-[#dce1fb] selection:bg-[#2fd9f4] selection:text-[#00363e] font-sans overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#89ceff]/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#2fd9f4]/10 blur-[150px] rounded-full"></div>
      </div>

      <header className="fixed top-0 w-full z-50 px-6 py-4 backdrop-blur-md bg-[#0c1324]/50 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="material-symbols-outlined text-[#2fd9f4] group-hover:-translate-x-1 transition-transform">arrow_back</span>
            <span className="font-headline font-bold uppercase tracking-widest text-xs">Volver al Inicio</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#2fd9f4]">Sneyder Studio</span>
            <div className="h-4 w-px bg-white/10"></div>
            <span className="text-[10px] font-medium uppercase tracking-widest text-[#89ceff]">Android Build</span>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto relative z-10">
        <div className={`transition-all duration-1000 transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex flex-col md:flex-row gap-12 items-center mb-20">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2fd9f4]/10 border border-[#2fd9f4]/20 rounded-full mb-6">
                <span className="material-symbols-outlined text-[#2fd9f4] text-sm">android</span>
                <span className="text-[10px] font-bold text-[#2fd9f4] uppercase tracking-tighter">Native Performance</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-headline font-black mb-6 leading-tight">
                Dominio <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2fd9f4] to-[#89ceff]">Android</span>
              </h1>
              <p className="text-xl text-[#c6c6cd] leading-relaxed max-w-2xl mb-8">
                Utilizando Flutter, creamos aplicaciones para Android que no solo funcionan, sino que lideran. Código nativo optimizado para una fragmentación mínima y una experiencia de usuario máxima.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="px-6 py-3 bg-[#2fd9f4] text-[#00363e] font-bold rounded-sm hover:scale-105 transition-transform flex items-center gap-2">
                  <span className="material-symbols-outlined">rocket_launch</span>
                  Consultar Proyecto
                </div>
              </div>
            </div>
            <div className="flex-1 relative w-full aspect-square md:aspect-video rounded-sm overflow-hidden border border-white/5 shadow-2xl">
              <Image 
                src="/images/services/android.png" 
                alt="Android Development" 
                fill 
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1324] via-transparent to-transparent"></div>
            </div>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon="bolt" 
              title="Compilación AOT" 
              desc="Flutter compila directamente a código de máquina ARM y x86, eliminando el lag de interpretación." 
            />
            <FeatureCard 
              icon="palette" 
              title="Material Design 3" 
              desc="Implementación perfecta de la última visión de diseño de Google con personalización absoluta." 
            />
            <FeatureCard 
              icon="settings_input_component" 
              title="Acceso Core" 
              desc="Integración total con GPS, sensores, cámara y almacenamiento nativo de Android." 
            />
          </section>

          <section className="mt-24 p-8 md:p-16 bg-[#151b2d] rounded-sm border border-white/5 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1">
                <h2 className="text-3xl font-headline font-bold mb-6">La ventaja técnica de Sneyder Studio</h2>
                <div className="space-y-6">
                  <TechDetail 
                    num="01" 
                    title="Renderizado a 120 FPS" 
                    text="Nuestras apps aprovechan las pantallas de alta tasa de refresco para una fluidez incomparable." 
                  />
                  <TechDetail 
                    num="02" 
                    title="Seguridad de Nivel Kernel" 
                    text="Implementamos las mejores prácticas de seguridad de Android para proteger los datos de su negocio." 
                  />
                  <TechDetail 
                    num="03" 
                    title="Integración Flutter" 
                    text="Desarrollo ágil que permite actualizaciones en tiempo récord sin sacrificar calidad nativa." 
                  />
                </div>
              </div>
              <div className="w-full md:w-1/3 flex justify-center">
                <div className="w-48 h-48 relative animate-pulse">
                   <Image src="/images/flutter_logo.png" alt="Flutter" fill className="object-contain grayscale opacity-50" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="py-12 border-t border-white/5 px-6 text-center">
        <p className="text-xs text-[#c6c6cd] uppercase tracking-[0.2em] font-medium opacity-50">
          &copy; 2026 Sneyder Studio • Excelencia en Ingeniería Multiplataforma
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-[#151b2d]/50 p-8 rounded-sm border border-white/5 hover:border-[#2fd9f4]/30 transition-all group">
      <span className="material-symbols-outlined text-[#2fd9f4] text-4xl mb-6 group-hover:scale-110 transition-transform">{icon}</span>
      <h3 className="text-xl font-headline font-bold mb-4">{title}</h3>
      <p className="text-[#c6c6cd] text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function TechDetail({ num, title, text }: { num: string; title: string; text: string }) {
  return (
    <div className="flex gap-4">
      <span className="text-[#2fd9f4] font-headline font-black text-xl opacity-30">{num}</span>
      <div>
        <h4 className="font-bold mb-1">{title}</h4>
        <p className="text-sm text-[#c6c6cd]">{text}</p>
      </div>
    </div>
  );
}
