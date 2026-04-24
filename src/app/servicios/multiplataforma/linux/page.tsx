"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function LinuxPlatformPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="bg-[#050810] min-h-screen text-[#dce1fb] font-mono overflow-x-hidden">
      {/* Matrix-like background effect */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0 flex flex-wrap gap-4 p-8 text-[10px]">
          {Array.from({ length: 500 }).map((_, i) => (
            <span key={i}>0101-SN-STUDIO-FLUTTER</span>
          ))}
        </div>
      </div>

      <header className="fixed top-0 w-full z-50 px-6 py-4 backdrop-blur-md bg-[#050810]/50 border-b border-[#2fd9f4]/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="material-symbols-outlined text-[#2fd9f4] group-hover:-translate-x-1 transition-transform">terminal</span>
            <span className="font-bold uppercase tracking-widest text-xs">cd /home</span>
          </Link>
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-[#2fd9f4] rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#2fd9f4]">LINUX_SUPPORT_ENABLED</span>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto relative z-10">
        <div className={`transition-all duration-1000 transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-24">
            <div>
              <div className="mb-6 p-2 bg-[#2fd9f4]/5 border-l-2 border-[#2fd9f4] inline-block">
                <span className="text-[10px] font-bold text-[#2fd9f4] uppercase tracking-widest">System Architecture</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
                Flutter <br/> en <span className="text-[#2fd9f4]">Linux</span>
              </h1>
              <p className="text-lg text-[#c6c6cd] leading-relaxed mb-10">
                Llevamos el desarrollo de vanguardia al kernel. Diseñamos aplicaciones para sistemas Linux que demandan eficiencia extrema, seguridad de grado militar y una estabilidad inquebrantable.
              </p>
              <div className="p-6 bg-white/5 border border-white/10 rounded-sm font-mono text-sm mb-8">
                 <p className="text-[#2fd9f4]">$ sudo snap install sneyder-studio-app</p>
                 <p className="text-xs text-slate-500 mt-2"># Construyendo el futuro del open source con Flutter</p>
              </div>
              <div className="flex flex-wrap gap-4 mb-12">
                <Link href="/contacto">
                  <div className="px-6 py-3 bg-[#2fd9f4] text-[#00363e] font-bold rounded-sm hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer font-sans">
                    <span className="material-symbols-outlined">terminal</span>
                    Solicitar Deploy
                  </div>
                </Link>
                <Link href="/recurso-adquirido">
                  <div className="px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-sm hover:bg-white/10 transition-all flex items-center gap-2 cursor-pointer font-sans">
                    <span className="material-symbols-outlined text-[#2fd9f4] text-lg">inventory_2</span>
                    Recurso Adquirido
                  </div>
                </Link>
              </div>
            </div>
            <div className="relative aspect-video rounded-sm overflow-hidden border border-[#2fd9f4]/20 shadow-[0_0_50px_rgba(47,217,244,0.1)]">
              <Image 
                src="/images/services/linux.png" 
                alt="Linux Development" 
                fill 
                className="object-cover"
              />
            </div>
          </div>

          <section className="mb-24">
            <h2 className="text-2xl font-bold mb-12 flex items-center gap-4">
               <span className="h-px flex-1 bg-[#2fd9f4]/20"></span>
               Características del Sistema
               <span className="h-px flex-1 bg-[#2fd9f4]/20"></span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <LinuxCard icon="developer_board" title="Embedded Systems" text="Optimizado para hardware limitado y sistemas embebidos." />
              <LinuxCard icon="security" title="Isolation" text="Soporte completo para Snap y Flatpak con sandboxing de seguridad." />
              <LinuxCard icon="hub" title="GTK Native" text="Integración con bibliotecas GTK para un Look & Feel natural." />
              <LinuxCard icon="database" title="Server Integrated" text="Comunicación directa con bases de datos y kernels Linux." />
            </div>
          </section>

          <section className="p-12 md:p-20 bg-[#0c1324] border border-[#2fd9f4]/10 relative overflow-hidden">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
               <div className="md:col-span-2">
                  <h3 className="text-3xl font-bold mb-6">Por qué Sneyder Studio elige Linux</h3>
                  <p className="text-[#c6c6cd] mb-8">
                    La construcción multiplataforma requiere una base sólida. Linux nos permite depurar al nivel más profundo, garantizando que el código de Flutter sea tan eficiente como un script de shell pero con la belleza de una interfaz moderna.
                  </p>
                  <div className="flex gap-4">
                     <span className="px-4 py-2 bg-[#2fd9f4]/10 text-[#2fd9f4] text-xs font-bold rounded-full">Ubuntu Certified</span>
                     <span className="px-4 py-2 bg-[#2fd9f4]/10 text-[#2fd9f4] text-xs font-bold rounded-full">ARM64 Support</span>
                  </div>
               </div>
               <div className="flex items-center justify-center">
                  <div className="w-32 h-32 relative">
                    <Image src="/images/flutter_logo.png" alt="Flutter" fill className="object-contain animate-spin-slow" />
                  </div>
               </div>
             </div>
          </section>
        </div>
      </main>

      <footer className="py-12 border-t border-white/5 px-6 text-center">
        <p className="text-xs text-[#c6c6cd] uppercase tracking-[0.2em] font-medium opacity-50">
          root@sneyder-studio:~# exit _
        </p>
      </footer>
    </div>
  );
}

function LinuxCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="p-6 bg-white/5 border border-white/5 hover:border-[#2fd9f4]/30 hover:bg-[#2fd9f4]/5 transition-all">
      <span className="material-symbols-outlined text-[#2fd9f4] mb-4">{icon}</span>
      <h4 className="font-bold mb-2 text-[#2fd9f4]">{title}</h4>
      <p className="text-xs text-[#c6c6cd] leading-relaxed">{text}</p>
    </div>
  );
}
