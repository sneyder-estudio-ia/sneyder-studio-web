"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function WindowsPlatformPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="bg-[#0c1324] min-h-screen text-[#dce1fb] font-sans overflow-x-hidden">
      {/* Background Effect: Grid Lines */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#89ceff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
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
            <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Windows Desktop</span>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto relative z-10">
        <div className={`transition-all duration-1000 transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#89ceff]/10 border border-[#89ceff]/20 rounded-sm mb-6">
              <span className="material-symbols-outlined text-[#89ceff] text-sm">window</span>
              <span className="text-[10px] font-bold text-[#89ceff] uppercase tracking-tighter">Enterprise Software</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-headline font-black mb-8 leading-[0.9]">
              Potencia <br/> 
              <span className="text-[#89ceff]">Windows</span> Desktop
            </h1>
            <p className="text-xl text-[#c6c6cd] leading-relaxed max-w-4xl mb-12">
              Llevamos Flutter al escritorio para construir herramientas empresariales de alto rendimiento. Aplicaciones nativas de 64 bits que aprovechan cada núcleo de su procesador y cada píxel de su pantalla profesional.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch mb-24">
            <div className="bg-[#151b2d] p-10 rounded-sm border border-white/5 relative overflow-hidden group">
              <div className="relative z-10">
                 <h2 className="text-3xl font-headline font-black mb-6">Arquitectura Nativa x64</h2>
                 <p className="text-[#c6c6cd] leading-relaxed mb-8">
                   No es una web envuelta. Es una aplicación Windows nativa real que utiliza el subsistema Win32 para una integración profunda con el sistema operativo.
                 </p>
                 <ul className="space-y-4">
                   <li className="flex items-center gap-3 text-sm text-[#89ceff]">
                     <span className="material-symbols-outlined text-sm">check_circle</span>
                     Manejo de archivos a nivel de sistema.
                   </li>
                   <li className="flex items-center gap-3 text-sm text-[#89ceff]">
                     <span className="material-symbols-outlined text-sm">check_circle</span>
                     Soporte multi-ventana profesional.
                   </li>
                   <li className="flex items-center gap-3 text-sm text-[#89ceff]">
                     <span className="material-symbols-outlined text-sm">check_circle</span>
                     Acceso a periféricos corporativos.
                   </li>
                 </ul>
              </div>
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-[15rem]">settings_applications</span>
              </div>
            </div>
            <div className="relative rounded-sm overflow-hidden border border-white/5 shadow-2xl min-h-[400px]">
              <Image 
                src="/images/services/windows.png" 
                alt="Windows Development" 
                fill 
                className="object-cover"
              />
            </div>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 text-center">
            <div className="p-10 border-r border-white/5">
                <h4 className="text-[#89ceff] font-bold mb-2">Fluent UI</h4>
                <p className="text-xs text-[#c6c6cd]">Diseño que se integra perfectamente con la estética de Windows 11.</p>
            </div>
            <div className="p-10 border-r border-white/5">
                <h4 className="text-[#89ceff] font-bold mb-2">Zero Latency</h4>
                <p className="text-xs text-[#c6c6cd]">Optimizado para productividad con tiempos de respuesta de milisegundos.</p>
            </div>
            <div className="p-10">
                <h4 className="text-[#89ceff] font-bold mb-2">Offline Ready</h4>
                <p className="text-xs text-[#c6c6cd]">Bases de datos locales y persistencia para trabajo institucional crítico.</p>
            </div>
          </section>

          <section className="p-12 md:p-24 bg-gradient-to-br from-[#151b2d] to-[#0c1324] rounded-sm border border-[#89ceff]/20 shadow-[0_0_50px_rgba(137,206,255,0.05)] text-center">
            <h3 className="text-3xl md:text-5xl font-headline font-black mb-8">El Estándar de Oro para Desktop</h3>
            <p className="text-lg text-[#c6c6cd] max-w-3xl mx-auto mb-12">
              En Sneyder Studio utilizamos Flutter para redefinir el software institucional de Windows, combinando la velocidad del desarrollo moderno con la robustez del código de bajo nivel.
            </p>
            <div className="w-full flex justify-center gap-8 items-center opacity-40">
               <span className="material-symbols-outlined text-6xl">window</span>
               <span className="material-symbols-outlined text-4xl">add</span>
               <div className="w-16 h-16 relative">
                 <Image src="/images/flutter_logo.png" alt="Flutter" fill className="object-contain" />
               </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="py-12 border-t border-white/5 px-6 text-center">
        <p className="text-xs text-[#c6c6cd] uppercase tracking-[0.2em] font-medium opacity-50">
          &copy; 2026 Sneyder Studio • Ingeniería de Escritorio de Alto Nivel
        </p>
      </footer>
    </div>
  );
}
