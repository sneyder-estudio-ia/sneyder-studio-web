"use client";

import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

type PaymentView = 'selection' | 'paypal_login' | 'card_form' | 'processing';

export default function PayPalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const month = searchParams.get('month');
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<PaymentView>('selection');
  const [email, setEmail] = useState('');
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
          setOrder({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error("Error loading order for paypal:", err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [id, router, isLoading]);

  const completePayment = async () => {
    if (!order || !month) return;
    setView('processing');
    
    // Simulate payment processing
    setTimeout(async () => {
      try {
        const docRef = doc(db, 'orders', id);
        await updateDoc(docRef, {
          months_paid: parseInt(month)
        });
        alert("¡Pago procesado con éxito! Recibirás un correo de confirmación de PayPal.");
        router.push(`/mis-pedidos/${id}/pagar`);
      } catch (err) {
        console.error("Error updating payment state:", err);
        alert("Hubo un error al confirmar tu pago.");
        setView('selection');
      }
    }, 3000);
  };

  if (isLoading) {
    return (
      <div className="bg-white flex items-center justify-center min-h-screen">
        <span className="w-10 h-10 border-4 border-[#0070ba]/20 border-t-[#0070ba] rounded-full animate-spin"></span>
      </div>
    );
  }

  const amount = order ? (order.total / 6).toFixed(2) : "0.00";

  return (
    <div className="bg-[#f5f7fa] min-h-screen font-sans text-[#2c2e2f]">
      {/* PayPal Style Navbar */}
      <nav className="bg-white border-b border-slate-200 py-4 flex justify-center relative">
        <img 
          src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg" 
          alt="PayPal" 
          className="h-10"
        />
      </nav>

      <main className="max-w-4xl mx-auto p-6 md:p-12 flex flex-col md:flex-row gap-8">
        
        {/* Left Side: Order Summary */}
        <div className="flex-1">
          <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-10">
               <div>
                  <h2 className="text-xl font-bold text-[#003087]">Pagar con PayPal</h2>
                  <p className="text-xs text-slate-500 font-bold mt-1">Sneyder Studio - Factura #{id.slice(0,8).toUpperCase()}</p>
               </div>
               <div className="text-right">
                  <p className="text-2xl font-black text-[#003087]">${amount}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">USD</p>
               </div>
            </div>

            <div className="space-y-4 py-6 border-y border-slate-50">
               <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Cuota Mensual {month}/6</span>
                  <span className="font-bold text-[#003087]">${amount}</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Impuestos</span>
                  <span className="font-bold text-[#003087]">$0.00</span>
               </div>
            </div>

            <div className="flex justify-between items-center pt-6">
               <span className="text-lg font-black text-[#003087]">Total</span>
               <span className="text-lg font-black text-[#003087]">${amount} USD</span>
            </div>
          </div>
        </div>

        {/* Right Side: Dynamic Payment Forms */}
        <div className="w-full md:w-[420px]">
          <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/60 border border-slate-200 p-8 min-h-[460px] flex flex-col relative overflow-hidden">
            
            {view === 'processing' && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-6 p-10 text-center">
                 <div className="relative">
                    <span className="w-16 h-16 border-4 border-[#0070ba]/10 border-t-[#0070ba] rounded-full animate-spin inline-block"></span>
                    <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#0070ba] animate-pulse">lock</span>
                 </div>
                 <div className="space-y-2">
                    <p className="text-lg font-black text-[#003087]">Procesando Transacción</p>
                    <p className="text-xs text-slate-400 leading-relaxed">No cierres esta ventana mientras confirmamos tu pago con PayPal...</p>
                 </div>
              </div>
            )}

            {view === 'selection' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-lg font-black text-[#003087]">Elige cómo pagar</h3>
                <div className="space-y-4">
                  <button 
                    onClick={() => setView('paypal_login')}
                    className="w-full bg-[#ffc439] hover:bg-[#f2ba36] py-4 rounded-full transition-all flex flex-col items-center shadow-lg active:scale-[0.98] border border-[#ffc439]"
                  >
                    <img src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/pp-acceptance-small.png" alt="PayPal" className="h-6" />
                  </button>

                  <div className="relative py-4 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                    <span className="relative bg-white px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">O paga con</span>
                  </div>

                  <button 
                    onClick={() => setView('card_form')}
                    className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-black py-4 rounded-full transition-all shadow-lg text-sm active:scale-[0.98]"
                  >
                    Tarjeta de Débito o Crédito
                  </button>
                </div>

                <div className="pt-10 flex flex-col items-center gap-6 border-t border-slate-50">
                  <img src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/cc-badges-ppmcvdam.png" alt="Cards" className="h-8 opacity-60 grayscale hover:grayscale-0 transition-all" />
                  <Link href={`/mis-pedidos/${id}/pagar`}>
                    <button className="text-sm font-bold text-[#0070ba] hover:underline flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">arrow_back</span>
                      Cancelar y volver
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {view === 'paypal_login' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center justify-between mb-4">
                   <button onClick={() => setView('selection')} className="text-slate-400 hover:text-[#0070ba] transition-colors">
                      <span className="material-symbols-outlined">arrow_back</span>
                   </button>
                   <img src="https://www.paypalobjects.com/webstatic/i/logo/rebrand/ppcom.svg" alt="PayPal" className="h-6" />
                </div>
                
                <h3 className="text-2xl font-black text-[#003087]">Pagar con PayPal</h3>
                <p className="text-sm text-slate-500">Ingresa tu correo electrónico para comenzar.</p>

                <div className="space-y-4 mt-6">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Correo Electrónico</label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ejemplo@correo.com"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0070ba] focus:border-transparent outline-none transition-all placeholder:text-slate-300"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Contraseña</label>
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0070ba] focus:border-transparent outline-none transition-all placeholder:text-slate-300"
                      />
                   </div>
                   
                   <button 
                     onClick={completePayment}
                     className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-black py-4 rounded-full transition-all shadow-lg mt-4"
                   >
                      Siguiente
                   </button>
                   
                   <button className="text-sm font-bold text-[#0070ba] w-full text-center hover:underline mt-2">¿Olvidaste tu contraseña?</button>
                </div>
              </div>
            )}

            {view === 'card_form' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center justify-between mb-4">
                   <button onClick={() => setView('selection')} className="text-slate-400 hover:text-[#0070ba] transition-colors">
                      <span className="material-symbols-outlined">arrow_back</span>
                   </button>
                   <h3 className="text-lg font-black text-[#003087]">Pago con Tarjeta</h3>
                </div>

                <div className="space-y-5">
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Número de Tarjeta</label>
                      <div className="relative">
                         <input 
                           type="text" 
                           placeholder="0000 0000 0000 0000"
                           className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0070ba] outline-none transition-all"
                         />
                         <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300">credit_card</span>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Vencimiento</label>
                        <input 
                          type="text" 
                          placeholder="MM/YY"
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0070ba] outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">CVV</label>
                        <input 
                          type="text" 
                          placeholder="000"
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0070ba] outline-none transition-all"
                        />
                      </div>
                   </div>

                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Nombre en la Tarjeta</label>
                      <input 
                        type="text" 
                        placeholder="TITULAR DE LA TARJETA"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0070ba] outline-none transition-all"
                      />
                   </div>

                   <button 
                     onClick={completePayment}
                     className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-black py-4 rounded-full transition-all shadow-lg mt-4 flex items-center justify-center gap-2"
                   >
                      <span className="material-symbols-outlined text-sm">lock</span>
                      Pagar ${amount}
                   </button>
                </div>
              </div>
            )}

            {/* Security Notice */}
            <div className="mt-auto pt-8 border-t border-slate-50 flex items-center justify-center gap-3 text-slate-300">
               <span className="material-symbols-outlined text-lg">verified_user</span>
               <p className="text-[9px] font-bold uppercase tracking-widest">Pago Protegido por PayPal</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-slate-50 py-12 mt-20 border-t border-slate-200">
         <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
            <div className="flex justify-center gap-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
               <a href="#" className="hover:text-[#0070ba] transition-colors">Legal</a>
               <a href="#" className="hover:text-[#0070ba] transition-colors">Privacidad</a>
               <a href="#" className="hover:text-[#0070ba] transition-colors">Seguridad</a>
            </div>
            <p className="text-[9px] text-slate-400 font-bold opacity-80 uppercase tracking-tighter">© 1999-2026 PayPal S.A. Todos los derechos reservados.</p>
         </div>
      </footer>
    </div>
  );
}
