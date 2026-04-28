"use client";

import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, arrayUnion, setDoc, addDoc, collection } from "firebase/firestore";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

type PaymentView = 'selection' | 'processing' | 'success' | 'error';

export default function PayPalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const monthStr = searchParams.get('month');
  const month = monthStr ? parseInt(monthStr) : null;
  
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<PaymentView>('selection');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

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

  const handleUpdateDatabase = async (details: any) => {
    if (!order || !month) return;
    
    try {
      const docRef = doc(db, 'orders', id);
      
      // Update months_paid if it's the next sequential month
      if (month > (order.months_paid || 0)) {
        await updateDoc(docRef, {
          months_paid: month
        });
      }

      // Record the transaction in a separate collection or log it
      const transactionId = details.id;
      const paymentRef = doc(db, 'payments', transactionId);
      await setDoc(paymentRef, {
        order_id: id,
        user_id: auth.currentUser?.uid,
        amount: details.purchase_units[0].amount.value,
        currency: details.purchase_units[0].amount.currency_code,
        status: details.status,
        month_paid: month,
        paypal_details: details,
        created_at: new Date().toISOString()
      });

      // Notificación de Pago Realizado
      await addDoc(collection(db, "notifications"), {
        userId: auth.currentUser?.uid,
        title: "¡Pago Confirmado!",
        message: `Tu pago de $${details.purchase_units[0].amount.value} USD para el proyecto #${id.slice(0, 8)} ha sido procesado con éxito. Gracias por tu confianza.`,
        type: "payment",
        isRead: false,
        createdAt: new Date()
      });

      setView('success');
      setTimeout(() => {
        router.push(`/mis-pedidos/${id}/pagar`);
      }, 3000);
    } catch (err) {
      console.error("Error updating payment state:", err);
      setErrorMsg("Error al registrar el pago en nuestra base de datos. Por favor contacta a soporte.");
      setView('error');
    }
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
    <PayPalScriptProvider options={{ 
      "clientId": PAYPAL_CLIENT_ID,
      currency: "USD",
      intent: "capture"
    }}>
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

          {/* Right Side: PayPal Buttons */}
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
                      <p className="text-xs text-slate-400 leading-relaxed">No cierres esta ventana mientras confirmamos tu pago...</p>
                   </div>
                </div>
              )}

              {view === 'success' && (
                <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center gap-6 p-10 text-center animate-in fade-in">
                   <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
                      <span className="material-symbols-outlined text-green-500 text-4xl">check_circle</span>
                   </div>
                   <div className="space-y-2">
                      <p className="text-xl font-black text-[#003087]">¡Pago Exitoso!</p>
                      <p className="text-sm text-slate-500">Tu cuota ha sido procesada correctamente.</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">Redirigiendo...</p>
                   </div>
                </div>
              )}

              {view === 'error' && (
                <div className="space-y-6 text-center py-10 animate-in fade-in">
                   <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-100">
                      <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
                   </div>
                   <div className="space-y-2">
                      <p className="text-lg font-black text-[#003087]">Algo salió mal</p>
                      <p className="text-xs text-red-600 px-4">{errorMsg || "Hubo un problema al procesar el pago."}</p>
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
                    <h3 className="text-lg font-black text-[#003087]">Finalizar Pago</h3>
                    <p className="text-xs text-slate-400">Selecciona tu método de pago preferido para completar la transacción de forma segura.</p>
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
                            description: `Cuota ${month} - Proyecto ${order.items?.[0]?.name || id}`
                          }],
                        });
                      }}
                      onApprove={async (data, actions) => {
                        if (actions.order) {
                          const details = await actions.order.capture();
                          await handleUpdateDatabase(details);
                        }
                      }}
                      onError={(err) => {
                        console.error("PayPal Error:", err);
                        setErrorMsg("Error en la plataforma de PayPal. Intente más tarde.");
                        setView('error');
                      }}
                      onCancel={() => {
                        // User cancelled
                      }}
                    />
                  </div>

                  <div className="pt-8 flex flex-col items-center gap-6 border-t border-slate-50">
                    <Link href={`/mis-pedidos/${id}/pagar`}>
                      <button className="text-sm font-bold text-[#0070ba] hover:underline flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Cancelar y volver
                      </button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Security Notice */}
              <div className="mt-auto pt-8 border-t border-slate-50 flex items-center justify-center gap-3 text-slate-300">
                 <span className="material-symbols-outlined text-lg">verified_user</span>
                 <p className="text-[9px] font-bold uppercase tracking-widest">Pago Seguro y Encriptado</p>
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
    </PayPalScriptProvider>
  );
}
