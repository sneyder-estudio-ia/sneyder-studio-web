"use client";

import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

interface Order {
  id: string;
  total: number;
  months_paid: number;
}

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isLoading) router.replace('/');
        return;
      }

      try {
        const docRef = doc(db, 'orders', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setOrder({ 
            id: docSnap.id, 
            total: data.total, 
            months_paid: data.months_paid || 0 
          } as Order);
        }
      } catch (err) {
        console.error("Error loading order for payment:", err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [id, router, isLoading]);

  const handlePayment = (monthIndex: number) => {
    router.push(`/mis-pedidos/${id}/pagar/paypal?month=${monthIndex}`);
  };

  if (isLoading) {
    return (
      <div className="bg-[#0a0e1a] text-white flex items-center justify-center min-h-screen">
        <span className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-[#0a0e1a] text-white flex flex-col items-center justify-center min-h-screen gap-4">
        <h2 className="text-xl font-bold">Proyecto no encontrado</h2>
        <Link href="/mis-pedidos" className="text-cyan-400 font-bold uppercase tracking-widest text-xs">Volver</Link>
      </div>
    );
  }

  const months = [1, 2, 3, 4, 5, 6];
  const monthlyPayment = (order.total / 6).toFixed(2);
  const currentMonthToPay = (order.months_paid || 0) + 1;

  return (
    <div className="bg-[#0a0e1a] text-white min-h-screen pb-20">
      <header className="fixed top-0 w-full z-50 bg-[#0c1324]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-5 h-16">
        <Link href={`/mis-pedidos/${id}`}>
          <button className="text-cyan-400 p-2 hover:bg-white/5 rounded-full transition-colors mr-3 flex items-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </Link>
        <h1 className="text-lg font-bold uppercase tracking-tight font-headline text-cyan-400">Plan de Pagos</h1>
      </header>

      <main className="pt-24 px-5 max-w-lg mx-auto space-y-8">
        <div className="text-center space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Resumen de Cuenta</p>
          <h2 className="text-4xl font-black font-headline italic uppercase tracking-tighter">Crédito Personalizado</h2>
          <p className="text-sm text-slate-400">6 Cuotas fijas mensuales de <span className="text-cyan-400 font-bold">${monthlyPayment}</span></p>
        </div>

        <div className="space-y-4">
          {months.map((month) => {
            const isPaid = month <= (order.months_paid || 0);
            const isCurrent = month === currentMonthToPay;
            const isFuture = month > currentMonthToPay;

            return (
              <div 
                key={month} 
                className={`p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
                  isPaid ? 'bg-slate-900/30 border-white/5 grayscale pointer-events-none' : 
                  isCurrent ? 'bg-cyan-400/5 border-cyan-400/40 shadow-[0_0_40px_rgba(34,211,238,0.1)]' : 
                  'bg-[#111827]/40 border-white/10'
                }`}
              >
                {isCurrent && (
                  <div className="absolute top-0 right-0 px-4 py-1 bg-cyan-400 text-black text-[8px] font-black uppercase tracking-widest rounded-bl-xl shadow-lg">
                    Pendiente hoy
                  </div>
                )}

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isPaid ? 'bg-slate-800 border-white/10 text-slate-500' :
                      isCurrent ? 'bg-cyan-400/10 border-cyan-400/20 text-cyan-400' :
                      'bg-slate-900 border-white/5 text-slate-400'
                    }`}>
                       <span className="text-lg font-black">{month}</span>
                    </div>
                    <div>
                      <h3 className={`font-bold text-sm tracking-tight ${
                        isPaid ? 'text-slate-500 opacity-50' : 
                        isCurrent ? 'text-white underline decoration-cyan-400 decoration-2 underline-offset-8' : 
                        'text-slate-300'
                      }`}>
                        Cuota de Mes {month}
                      </h3>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-1">
                        {isPaid ? 'Completado' : isCurrent ?'Seleccionado para pagar' : 'Próximamente'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`font-black tracking-tighter ${isPaid ? 'text-slate-600' : 'text-white'}`}>
                      ${monthlyPayment}
                    </p>
                    <button 
                      onClick={() => handlePayment(month)}
                      disabled={isPaid || isFuture || isPaying !== null}
                      className={`mt-3 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        isPaid ? 'bg-white/5 text-slate-600 border border-white/5 opacity-50' :
                        isCurrent ? 'bg-cyan-400 text-black hover:bg-cyan-300 shadow-lg' :
                        'bg-white/5 text-slate-500 border border-white/5 opacity-50'
                      }`}
                    >
                      {isPaying === month ? (
                        <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin inline-block"></span>
                      ) : isPaid ? (
                        'Pagado'
                      ) : (
                        'Pagar'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-8 bg-gradient-to-br from-cyan-400/10 to-transparent border border-cyan-400/20 rounded-3xl text-center space-y-4">
           <div className="w-14 h-14 bg-cyan-400/10 rounded-full flex items-center justify-center mx-auto border border-cyan-400/20 text-cyan-400">
             <span className="material-symbols-outlined text-3xl">verified_user</span>
           </div>
           <p className="text-xs text-slate-400 leading-relaxed">
             Todos tus pagos están protegidos por encriptación SSL. <br/>Recibirás un comprobante digital al instante.
           </p>
        </div>
      </main>
    </div>
  );
}
