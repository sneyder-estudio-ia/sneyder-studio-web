"use client";

import Link from "next/link";
import { useState, useEffect, use } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

interface Order {
  id: string;
  status: string;
  created_at: string;
  total: number;
  items: any[];
  payment_method?: string;
  terms?: string;
  current_step?: number;
  months_paid?: number;
  counter_proposal?: {
    final_price?: number;
    development_time?: string;
    payment_method?: string;
    credit_terms?: {
      months?: number;
      interest_rate?: number;
      monthly_payment?: number;
      total_with_interest?: number;
    };
    notes?: string;
    sent_at?: string;
    status?: string;
    accepted_at?: string;
    rejected_at?: string;
  };
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
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
          setOrder({ id: docSnap.id, ...docSnap.data() } as Order);
        } else {
          console.error("Order not found");
        }
      } catch (err) {
        console.error("Error loading order details:", err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [id, router, isLoading]);

  const handleAcceptProposal = async () => {
    if (!order) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: "pending",
        "counter_proposal.status": "accepted",
        "counter_proposal.accepted_at": new Date().toISOString(),
      });
      setOrder(prev => prev ? {
        ...prev,
        status: "pending",
        counter_proposal: prev.counter_proposal ? {
          ...prev.counter_proposal,
          status: "accepted",
          accepted_at: new Date().toISOString(),
        } : undefined,
      } : null);
    } catch (err) {
      console.error("Error accepting proposal:", err);
      alert("Error al aceptar la contrapropuesta.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectProposal = async () => {
    if (!order) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: "rejected",
        "counter_proposal.status": "rejected",
        "counter_proposal.rejected_at": new Date().toISOString(),
      });
      setOrder(prev => prev ? {
        ...prev,
        status: "rejected",
        counter_proposal: prev.counter_proposal ? {
          ...prev.counter_proposal,
          status: "rejected",
          rejected_at: new Date().toISOString(),
        } : undefined,
      } : null);
    } catch (err) {
      console.error("Error rejecting proposal:", err);
      alert("Error al rechazar la contrapropuesta.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#0a0e1a] text-white flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <span className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></span>
          <p className="text-xs text-slate-500 uppercase tracking-widest">Cargando detalles...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-[#0a0e1a] text-white flex flex-col items-center justify-center min-h-screen gap-6">
        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center border border-white/5">
          <span className="material-symbols-outlined text-4xl text-slate-600">search_off</span>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold font-headline italic uppercase mb-2">Proyecto no encontrado</h2>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">No pudimos localizar la información de este pedido en nuestra base de datos.</p>
        </div>
        <Link href="/mis-pedidos">
          <button className="bg-cyan-400 text-black px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-cyan-300 transition-all">
            Volver a Mis Pedidos
          </button>
        </Link>
      </div>
    );
  }

  const cp = order.counter_proposal;

  return (
    <div className="bg-[#0a0e1a] text-white min-h-screen pb-32">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#0c1324]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-5 h-16 justify-between">
        <div className="flex items-center gap-0">
          <Link href="/mis-pedidos">
            <button className="text-cyan-400 p-2 hover:bg-white/5 rounded-full transition-colors flex items-center">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          </Link>
          <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block"></div>
          <Link href="/" className="-ml-4 h-10 w-auto relative cursor-pointer hover:scale-105 transition-all bg-white/5 rounded-xl border border-white/10 overflow-hidden p-1.5 shadow-lg group">
            <Image 
              src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png"
              alt="Sneyder Studio"
              width={140}
              height={28}
              className="h-full w-auto object-contain group-hover:brightness-110"
            />
          </Link>
          <h1 className="text-sm font-bold uppercase tracking-tight font-headline text-cyan-400 ml-2 hidden xs:block">Detalles</h1>
        </div>
      </header>

      <main className="pt-24 px-5 max-w-2xl mx-auto space-y-8">
        {/* Project ID & Date Info */}
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
           <div className="space-y-1">
             <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">ID del Proyecto</p>
             <p className="text-sm font-mono text-cyan-400">#{order.id.toUpperCase().slice(0, 12)}</p>
           </div>
           <div className="text-right space-y-1">
             <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Fecha del Pedido</p>
             <p className="text-sm font-medium">{new Date(order.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
           </div>
        </div>

        {/* Counter Proposal Section */}
        {cp && cp.status === "sent" && (
          <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-2 border-orange-500/30 rounded-3xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500"></div>
            <div className="absolute top-3 right-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-400"></span>
              </span>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-orange-400">handshake</span>
              </div>
              <div>
                <h3 className="text-lg font-bold font-headline text-orange-400 uppercase">Contrapropuesta Recibida</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                  Enviada el {cp.sent_at ? new Date(cp.sent_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : "N/A"}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-400 mb-5">Sneyder Studio te ha enviado los términos definitivos para tu proyecto. Revisa los detalles y decide si aceptas.</p>

            {/* Proposal Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Precio Final</p>
                <p className="text-2xl font-bold text-orange-400 font-headline">${cp.final_price?.toLocaleString()}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">USD</p>
              </div>
              <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Tiempo de Desarrollo</p>
                <p className="text-2xl font-bold text-white font-headline">{cp.development_time ? cp.development_time.replace(/semanas?/gi, (m) => m.toLowerCase().endsWith('s') ? 'meses' : 'mes') : ''}</p>
              </div>
              <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Método de Pago</p>
                <p className="text-lg font-bold text-white font-headline capitalize">{cp.payment_method}</p>
              </div>
              {cp.credit_terms && (
                <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Cuota Mensual</p>
                  <p className="text-lg font-bold text-emerald-400 font-headline">${cp.credit_terms.monthly_payment?.toFixed(2)}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{cp.credit_terms.months} meses · {cp.credit_terms.interest_rate}% interés</p>
                </div>
              )}
            </div>

            {cp.credit_terms && (
              <div className="bg-black/20 rounded-xl p-4 border border-white/5 mb-5">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Resumen del Crédito</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Total con Interés:</span>
                  <span className="text-sm font-bold text-white">${cp.credit_terms.total_with_interest?.toFixed(2)} USD</span>
                </div>
              </div>
            )}

            {cp.notes && (
              <div className="bg-black/20 rounded-xl p-4 border border-white/5 mb-5">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px]">edit_note</span>
                  Nota del Estudio
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">{cp.notes}</p>
              </div>
            )}

            {/* Accept / Reject Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAcceptProposal}
                disabled={isProcessing}
                className="flex-1 bg-orange-500 text-white py-4 sm:py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] sm:text-xs hover:bg-orange-400 transition-all shadow-[0_15px_30px_rgba(249,115,22,0.25)] active:scale-[0.98] flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50"
              >
                {isProcessing && order.status !== "rejected" ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span className="hidden sm:inline">Procesando</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base sm:text-lg">verified</span>
                    Aceptar
                  </>
                )}
              </button>

              <button
                onClick={handleRejectProposal}
                disabled={isProcessing}
                className="flex-1 bg-white/5 border border-white/10 text-white py-4 sm:py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] sm:text-xs hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50"
              >
                {isProcessing && order.status === "rejected" ? (
                  <>
                    <span className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></span>
                    <span className="hidden sm:inline">Rechazando</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base sm:text-lg">cancel</span>
                    Rechazar
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Counter Proposal Accepted/Rejected Banner */}
        {cp && (cp.status === "accepted" || cp.status === "rejected") && (
          <div className={`${cp.status === 'accepted' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'} border rounded-2xl p-5 flex items-start gap-4`}>
            <div className={`w-10 h-10 ${cp.status === 'accepted' ? 'bg-green-500/20' : 'bg-red-500/20'} rounded-full flex items-center justify-center shrink-0`}>
              <span className={`material-symbols-outlined ${cp.status === 'accepted' ? 'text-green-400' : 'text-red-400'} text-xl`}>
                {cp.status === 'accepted' ? 'task_alt' : 'cancel'}
              </span>
            </div>
            <div>
              <h3 className={`text-sm font-bold ${cp.status === 'accepted' ? 'text-green-400' : 'text-red-400'} uppercase tracking-tight`}>
                Contrapropuesta {cp.status === 'accepted' ? 'Aceptada' : 'Rechazada'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {cp.status === 'accepted' ? (
                  <>
                    Aceptaste la contrapropuesta el {cp.accepted_at ? new Date(cp.accepted_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : "N/A"}.
                    Tu proyecto se encuentra ahora en <span className="text-amber-400 font-bold">Producción</span>.
                  </>
                ) : (
                  <>
                    Rechazaste la contrapropuesta el {cp.rejected_at ? new Date(cp.rejected_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : "N/A"}.
                    El pedido ha sido <span className="text-red-400 font-bold">Cancelado</span>.
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Status Card */}
        <div className="bg-[#111827]/60 border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-400/5 blur-[80px] -mr-16 -mt-16 group-hover:bg-cyan-400/10 transition-colors"></div>
          
          <div className="flex flex-col gap-8">
            <div className="space-y-3 text-center sm:text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Estado Actual</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <span className={`w-fit mx-auto sm:mx-0 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 border ${
                  order.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                  order.status === 'processing' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 
                  order.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'completed' ? 'bg-green-400' : order.status === 'processing' ? 'bg-cyan-400 animate-pulse' : order.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400 animate-pulse'}`}></span>
                  {order.status === 'completed' ? 'Completado' : 
                   order.status === 'processing' ? 'En Proceso' : 
                   order.status === 'rejected' ? 'Rechazado' : 'Producción'}
                </span>
                <h2 className="text-3xl font-bold font-headline uppercase italic">
                  {order.items?.[0]?.name || "Servicio Digital"}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-y border-white/5">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-white/5">
                    <span className="material-symbols-outlined text-cyan-400 text-lg">payments</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Inversión Total</p>
                    <p className="text-2xl font-bold text-white">${order.total}</p>
                  </div>
                </div>
              </div>

              {/* Credit Information */}
              {(order.status === "pending" || order.status === "completed") && (
                <div className="bg-cyan-400/5 border border-cyan-400/20 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-cyan-400/10 rounded-xl flex items-center justify-center shrink-0 border border-cyan-400/20">
                    <span className="material-symbols-outlined text-cyan-400 text-lg">calendar_month</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Modalidad de Pago</p>
                    <p className="text-sm font-bold tracking-tight">
                      {cp?.payment_method === "credito" && cp.credit_terms
                        ? `Crédito a ${cp.credit_terms.months} meses`
                        : order.payment_method === "credito"
                        ? "Crédito a 6 meses"
                        : "Pago de Contado"
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contract Execution Elements */}
        {(order.status === "pending" || order.status === "completed") && (
          <>
            {/* Payment & Documents Grid */}
            <div className="space-y-4">
              <Link href={`/mis-pedidos/${order.id}/pagar`} className="block w-full">
                <button className="w-full bg-cyan-400 text-black py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs hover:bg-cyan-300 transition-all shadow-[0_15px_30px_rgba(34,211,238,0.15)] active:scale-[0.98] flex items-center justify-center gap-3">
                  <span className="material-symbols-outlined font-bold">account_balance_wallet</span>
                  Pagar Cuota Mensual
                </button>
              </Link>

              <Link href={`/recurso-adquirido?orderId=${order.id}`} className="block w-full">
                <button className="w-full bg-white/5 border border-white/10 text-white py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                  <span className="material-symbols-outlined text-cyan-400">inventory_2</span>
                  Recurso Adquirido
                </button>
              </Link>
              
              <div className="flex flex-col gap-4">
                <Link href={`/facturas?orderId=${order.id}`} className="w-full">
                  <button className="w-full flex items-center justify-center gap-3 p-5 bg-[#111827]/40 border border-white/5 rounded-2xl hover:bg-slate-800/40 transition-all group">
                    <span className="material-symbols-outlined text-slate-500 group-hover:text-cyan-400 transition-colors">description</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 group-hover:text-white transition-colors">Ver Comprobantes</span>
                  </button>
                </Link>
              </div>
            </div>

            {/* Progress Tracker */}
            <div className="bg-[#111827]/40 border border-white/5 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Línea de Tiempo del Proyecto</h3>
                <span className="text-xs font-bold text-cyan-400">
                  Fase {order.current_step || 1} de 3
                </span>
              </div>
              
              <div className="space-y-12 relative before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
                {/* Step 1: Planificación */}
                <div className={`flex gap-6 relative z-10 transition-all duration-500 ${(order.current_step || 1) >= 1 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-4 border-[#0a0e1a] transition-all ${(order.current_step || 1) > 1 ? 'bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : (order.current_step || 1) === 1 ? 'bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 'bg-slate-800'}`}>
                    {(order.current_step || 1) > 1 ? (
                      <span className="material-symbols-outlined text-[12px] text-black font-bold">check</span>
                    ) : (
                      <span className="w-2 h-2 bg-black rounded-full animate-pulse"></span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className={`text-sm font-bold tracking-tight ${(order.current_step || 1) === 1 ? 'text-cyan-400 underline decoration-cyan-400/30 underline-offset-4' : 'text-white'}`}>Planificación y Estrategia</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">
                      {(order.current_step || 1) > 1 ? 'Completado' : 'En ejecución'}
                    </p>
                  </div>
                </div>

                {/* Step 2: Desarrollo */}
                <div className={`flex gap-6 relative z-10 transition-all duration-500 ${(order.current_step || 1) >= 2 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-4 border-[#0a0e1a] transition-all ${(order.current_step || 1) > 2 ? 'bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : (order.current_step || 1) === 2 ? 'bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 'bg-slate-800'}`}>
                    {(order.current_step || 1) > 2 ? (
                      <span className="material-symbols-outlined text-[12px] text-black font-bold">check</span>
                    ) : (order.current_step || 1) === 2 ? (
                      <span className="w-2.5 h-2.5 bg-black rounded-full animate-pulse"></span>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <p className={`text-sm font-bold tracking-tight ${(order.current_step || 1) === 2 ? 'text-cyan-400 underline decoration-cyan-400/30 underline-offset-4' : 'text-white'}`}>Ejecución del Desarrollo</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">
                      {(order.current_step || 1) > 2 ? 'Completado' : (order.current_step || 1) === 2 ? 'En curso' : 'Pendiente'}
                    </p>
                  </div>
                </div>

                {/* Step 3: Entrega */}
                <div className={`flex gap-6 relative z-10 transition-all duration-500 ${(order.current_step || 1) >= 3 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-4 border-[#0a0e1a] transition-all ${(order.current_step || 1) === 3 ? 'bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 'bg-slate-800'}`}>
                    {(order.current_step || 1) === 3 ? (
                      <span className="w-2.5 h-2.5 bg-black rounded-full animate-pulse"></span>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <p className={`text-sm font-bold tracking-tight ${(order.current_step || 1) === 3 ? 'text-cyan-400 underline decoration-cyan-400/30 underline-offset-4' : 'text-white'}`}>Control de Calidad y Entrega</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">
                      {(order.current_step || 1) === 3 ? 'Finalizando' : 'Pendiente'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Technical Support CTA */}
        <div className="bg-gradient-to-r from-[#0c1324] to-[#111827] border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center gap-6 shadow-2xl">
          <div className="w-16 h-16 bg-slate-900/80 rounded-full flex items-center justify-center border border-white/10 relative">
            <span className="material-symbols-outlined text-3xl text-cyan-400">headset_mic</span>
            <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-4 border-[#0c1324] rounded-full"></span>
          </div>
          <div>
            <h4 className="text-lg font-bold font-headline italic uppercase tracking-tight mb-2">¿Necesitas asistencia?</h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">Nuestro equipo técnico está listo para resolver cualquier duda sobre tu proyecto o plan de pagos de forma inmediata.</p>
          </div>
          <a 
            href="https://wa.me/50672065581" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full bg-cyan-400 text-black px-10 py-3.5 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-cyan-300 transition-all active:scale-95 shadow-[0_15px_30px_rgba(34,211,238,0.15)] flex items-center justify-center"
          >
            Hablar con un Agente
          </a>
        </div>
      </main>
    </div>
  );
}
