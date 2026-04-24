"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

type PaymentView = 'selection' | 'processing' | 'success' | 'error';

const ADMIN_EMAIL = "sneyder23081994@gmail.com";

export default function TestPaymentPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<PaymentView>('selection');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
        router.replace('/');
        return;
      }
      setUser(currentUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <div className="bg-white flex items-center justify-center min-h-screen">
        <span className="w-10 h-10 border-4 border-[#0070ba]/20 border-t-[#0070ba] rounded-full animate-spin"></span>
      </div>
    );
  }

  const amount = "1.00";

  return (
    <PayPalScriptProvider options={{ 
      "clientId": PAYPAL_CLIENT_ID,
      currency: "USD",
      intent: "capture"
    }}>
      <div className="bg-[#f5f7fa] min-h-screen font-sans text-[#2c2e2f]">
        <nav className="bg-white border-b border-slate-200 py-4 flex justify-center relative">
          <img 
            src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg" 
            alt="PayPal" 
            className="h-10"
          />
        </nav>

        <main className="max-w-4xl mx-auto p-6 md:p-12 flex flex-col md:flex-row gap-8">
          
          <div className="flex-1">
            <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-10">
                 <div>
                    <h2 className="text-xl font-bold text-[#003087]">Prueba de Pago Real</h2>
                    <p className="text-xs text-slate-500 font-bold mt-1">Sneyder Studio - Verificación de Integración</p>
                 </div>
                 <div className="text-right">
                    <p className="text-2xl font-black text-[#003087]">${amount}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">USD</p>
                 </div>
              </div>

              <div className="space-y-4 py-6 border-y border-slate-50">
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Monto de Prueba</span>
                    <span className="font-bold text-[#003087]">${amount}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Impuestos</span>
                    <span className="font-bold text-[#003087]">$0.00</span>
                 </div>
              </div>

              <div className="flex justify-between items-center pt-6">
                 <span className="text-lg font-black text-[#003087]">Total a Pagar</span>
                 <span className="text-lg font-black text-[#003087]">${amount} USD</span>
              </div>

              <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  <span className="font-bold uppercase tracking-tight">Nota:</span> Este es un pago real de $1.00 para verificar que la configuración de producción sea correcta. El dinero será acreditado a la cuenta configurada.
                </p>
              </div>
            </div>
          </div>

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
                      <p className="text-xs text-slate-400 leading-relaxed">No cierres esta ventana mientras confirmamos tu pago de prueba...</p>
                   </div>
                </div>
              )}

              {view === 'success' && (
                <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center gap-6 p-10 text-center animate-in fade-in">
                   <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
                      <span className="material-symbols-outlined text-green-500 text-4xl">check_circle</span>
                   </div>
                   <div className="space-y-2">
                      <p className="text-xl font-black text-[#003087]">¡Prueba Exitosa!</p>
                      <p className="text-sm text-slate-500">La integración real de PayPal está funcionando.</p>
                      <button 
                        onClick={() => router.push('/admin')}
                        className="mt-6 px-10 py-3 bg-[#0070ba] text-white rounded-full font-bold hover:bg-[#005ea6] transition-all"
                      >
                        Volver al Panel
                      </button>
                   </div>
                </div>
              )}

              {view === 'error' && (
                <div className="space-y-6 text-center py-10 animate-in fade-in">
                   <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-100">
                      <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
                   </div>
                   <div className="space-y-2">
                      <p className="text-lg font-black text-[#003087]">Fallo en la Prueba</p>
                      <p className="text-xs text-red-600 px-4">{errorMsg || "Hubo un problema al procesar el pago de prueba."}</p>
                   </div>
                   <button 
                     onClick={() => setView('selection')}
                     className="text-sm font-bold text-[#0070ba] hover:underline"
                   >
                     Intentar de nuevo
                   </button>
                </div>
              )}

              {view === 'selection' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 flex-1 flex flex-col">
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-[#003087]">Finalizar Prueba</h3>
                    <p className="text-xs text-slate-400">Selecciona el método de pago para verificar la conexión con PayPal.</p>
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <PayPalButtons 
                      style={{ 
                        layout: "vertical",
                        shape: "pill",
                        label: "pay"
                      }}
                      createOrder={(data, actions) => {
                        return actions.order.create({
                          intent: "CAPTURE",
                          purchase_units: [{
                            amount: {
                              currency_code: "USD",
                              value: amount,
                            },
                            description: "Sneyder Studio - Prueba de Pago Real 1.00 USD"
                          }],
                        });
                      }}
                      onApprove={async (data, actions) => {
                        if (actions.order) {
                          setView('processing');
                          const details = await actions.order.capture();
                          console.log("Test Payment Details:", details);
                          setView('success');
                        }
                      }}
                      onError={(err) => {
                        console.error("PayPal Test Error:", err);
                        setErrorMsg("Error en la plataforma de PayPal. Verifica las credenciales en .env.local");
                        setView('error');
                      }}
                    />
                  </div>

                  <div className="pt-8 flex flex-col items-center gap-6 border-t border-slate-50">
                    <Link href="/admin">
                      <button className="text-sm font-bold text-[#0070ba] hover:underline flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Volver a Administración
                      </button>
                    </Link>
                  </div>
                </div>
              )}

              <div className="mt-auto pt-8 border-t border-slate-50 flex items-center justify-center gap-3 text-slate-300">
                 <span className="material-symbols-outlined text-lg">verified_user</span>
                 <p className="text-[9px] font-bold uppercase tracking-widest">Entorno de Producción Verificado</p>
              </div>
            </div>
          </div>
        </main>

        <footer className="bg-slate-50 py-12 mt-20 border-t border-slate-200">
           <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
              <p className="text-[9px] text-slate-400 font-bold opacity-80 uppercase tracking-tighter">Sneyder Studio Control Panel - Verificación de Seguridad PayPal</p>
           </div>
        </footer>
      </div>
    </PayPalScriptProvider>
  );
}
