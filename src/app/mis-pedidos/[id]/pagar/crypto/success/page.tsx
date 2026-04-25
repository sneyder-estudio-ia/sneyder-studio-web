"use client";

import Link from "next/link";
import { useEffect, use } from "react";
import { useRouter } from "next/navigation";

export default function CryptoSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    // Redirect back after a few seconds
    const timer = setTimeout(() => {
      router.push(`/mis-pedidos/${id}/pagar`);
    }, 5000);
    return () => clearTimeout(timer);
  }, [id, router]);

  return (
    <div className="bg-[#0a0e1a] text-white min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-10 text-center space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-400/10 blur-[80px] -z-10"></div>
        
        <div className="w-24 h-24 bg-cyan-400/10 rounded-full flex items-center justify-center mx-auto border border-cyan-400/20 shadow-[0_0_50px_rgba(34,211,238,0.2)]">
          <span className="material-symbols-outlined text-cyan-400 text-6xl animate-bounce">verified</span>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black font-headline uppercase italic italic tracking-tighter">¡Pago Detectado!</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Hemos recibido la notificación de tu transacción. Tu plan de pagos se actualizará automáticamente en unos minutos una vez completadas las confirmaciones de red.
          </p>
        </div>

        <div className="pt-4 space-y-4">
          <div className="flex items-center justify-center gap-3 py-3 px-6 bg-cyan-400/5 border border-cyan-400/20 rounded-2xl">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Verificando en Blockchain</span>
          </div>
          
          <Link href={`/mis-pedidos/${id}/pagar`} className="block">
            <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
              Volver ahora
            </button>
          </Link>
        </div>

        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
          Redirigiendo automáticamente en 5 segundos...
        </p>
      </div>
    </div>
  );
}
