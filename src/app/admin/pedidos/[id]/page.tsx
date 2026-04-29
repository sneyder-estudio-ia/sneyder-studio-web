"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, collection, addDoc } from "firebase/firestore";
import AdminSidebar from "@/components/AdminSidebar";

const ADMIN_EMAIL = "sneyder23081994@gmail.com";

interface OrderDetail {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  total: number;
  items: any[];
  current_step?: number;
  payment_method?: string;
  proposal?: {
    full_name?: string;
    email?: string;
    phone?: string;
    project_subject?: string;
    project_description?: string;
    business_description?: string;
    submitted_at?: string;
  };
  credit_info?: {
    wants_credit?: boolean;
    budget?: number;
    months?: number;
    monthly_payment?: number;
    total_with_interest?: number;
    interest_rate?: number;
  } | null;
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
  };
}

interface UserProfile {
  manager_name?: string;
  company_name?: string;
  email?: string;
  whatsapp?: string;
}

export default function AdminOrderDetailPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
        router.replace('/');
        return;
      }
      setUser(currentUser);
      setIsChecking(false);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      setIsLoading(true);
      try {
        const orderDoc = await getDoc(doc(db, "orders", orderId));
        if (orderDoc.exists()) {
          const data = orderDoc.data();
          setOrder({ id: orderDoc.id, ...data } as OrderDetail);

          if (data.user_id) {
            try {
              const profileDoc = await getDoc(doc(db, "profiles", data.user_id));
              if (profileDoc.exists()) {
                setProfile(profileDoc.data() as UserProfile);
              }
            } catch { /* silent */ }
          }
        }
      } catch (err) {
        console.error("Error fetching order:", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (user) fetchOrder();
  }, [user, orderId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;
    setActionLoading(newStatus);
    try {
      await updateDoc(doc(db, "orders", order.id), { status: newStatus });
      
      // Notificación de estado
      let title = "Actualización de Pedido";
      let message = `Tu pedido #${order.id.slice(0, 8)} ha cambiado su estado a ${newStatus}.`;
      
      if (newStatus === "pending") {
        title = "¡Proyecto en Producción!";
        message = `¡Buenas noticias! Tu proyecto #${order.id.slice(0, 8)} ha sido aprobado y ha entrado en fase de producción.`;
      } else if (newStatus === "completed") {
        title = "¡Proyecto Finalizado!";
        message = `Tu proyecto #${order.id.slice(0, 8)} ha sido completado con éxito. Ya puedes acceder a los entregables en la sección de recursos.`;
      }

      await addDoc(collection(db, "notifications"), {
        userId: order.user_id,
        title,
        message,
        type: "status",
        isRead: false,
        createdAt: new Date()
      });

      // Si pasa a producción, enviar recordatorio de factura (ejemplo)
      if (newStatus === "pending") {
        await addDoc(collection(db, "notifications"), {
          userId: order.user_id,
          title: "Recordatorio de Pago",
          message: `Tu proyecto #${order.id.slice(0, 8)} está listo para la facturación. Puedes revisar los detalles en tu panel de pedidos.`,
          type: "billing",
          isRead: false,
          createdAt: new Date()
        });
      }

      setOrder(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err) {
      console.error("Error updating order:", err);
      alert("Error al actualizar el pedido.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStepChange = async (newStep: number) => {
    if (!order) return;
    try {
      await updateDoc(doc(db, "orders", order.id), { current_step: newStep });
      
      await addDoc(collection(db, "notifications"), {
        userId: order.user_id,
        title: "Avance de Fase",
        message: `Tu proyecto #${order.id.slice(0, 8)} ha avanzado a la Fase ${newStep}. Estamos trabajando para completar el desarrollo.`,
        type: "status",
        isRead: false,
        createdAt: new Date()
      });

      setOrder(prev => prev ? { ...prev, current_step: newStep } : null);
    } catch (err) {
      console.error("Error updating step:", err);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "processing":
        return { label: "Nuevo", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20", dot: "bg-cyan-400" };
      case "completed":
        return { label: "Aprobado", color: "bg-green-500/10 text-green-400 border-green-500/20", dot: "bg-green-400" };
      case "pending":
        return { label: "Producción", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400" };
      default:
        return { label: status, color: "bg-slate-500/10 text-slate-400 border-slate-500/20", dot: "bg-slate-400" };
    }
  };

  if (isChecking) {
    return (
      <div className="bg-background text-on-background flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <span className="w-8 h-8 border-2 border-tertiary/30 border-t-tertiary rounded-full animate-spin"></span>
          <p className="text-xs text-slate-500 uppercase tracking-widest">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-background text-on-background flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <span className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin"></span>
          <p className="text-xs text-slate-500 uppercase tracking-widest">Cargando detalles del pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-background text-on-background flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-slate-600">error_outline</span>
          </div>
          <h2 className="text-xl font-bold">Pedido no encontrado</h2>
          <Link href="/admin/pedidos/nuevos" className="text-xs font-bold uppercase tracking-widest text-tertiary hover:underline">
            Volver a Nuevos Pedidos →
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const proposal = order.proposal;
  const credit = order.credit_info;
  const cp = order.counter_proposal;

  return (
    <div className="bg-background text-on-background selection:bg-tertiary selection:text-on-tertiary flex flex-col min-h-screen">
      {/* TopAppBar */}
      <header className={`fixed top-0 w-full z-50 bg-[#0c1324]/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-6 h-16 shadow-[0_20px_50px_rgba(12,19,36,0.4)] transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-72" : "pl-10 md:pl-14"}`}>
        <div className="flex items-center gap-3">
          <Link href="/admin/pedidos" className="text-[#2fd9f4] hover:bg-slate-800/50 transition-all duration-300 p-2 rounded shrink-0 flex items-center justify-center">
            <span className="material-symbols-outlined transform rotate-180">arrow_forward</span>
          </Link>
          <h1 className="font-['Space_Grotesk'] tracking-tight text-lg md:text-xl font-bold text-cyan-400 whitespace-nowrap uppercase">
            Detalle del Pedido
          </h1>
        </div>
        <div className="flex items-center">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-[#2fd9f4] hover:bg-slate-800/50 transition-all duration-300 p-2 rounded shrink-0 flex items-center justify-center"
          >
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>
      </header>

      <main className={`pt-20 pb-28 px-4 md:px-6 max-w-7xl mx-auto space-y-8 w-full flex-grow transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-72" : "pl-0"}`}>

        {/* Order Summary Header */}
        <section className="bg-surface-container-low border border-white/5 rounded-2xl p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-white/5 px-2 py-1 rounded font-mono">#{order.id.slice(0, 8)}</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded flex items-center gap-1.5 border ${statusConfig.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} animate-pulse`}></span>
                  {statusConfig.label}
                </span>
                {order.payment_method && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-white/5 px-2 py-1 rounded flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs">payments</span>
                    {order.payment_method === "credito" ? "Crédito" : "Contado"}
                  </span>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold font-headline text-white tracking-tight">
                {order.items?.[0]?.name || "Pedido de Servicio"}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  {new Date(order.created_at).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
                {order.current_step && (
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">flag</span>
                    Fase {order.current_step} de 3
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end justify-center gap-3 shrink-0">
              <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 shrink-0">
                {[1, 2, 3].map((step) => (
                  <button
                    key={step}
                    onClick={() => handleStepChange(step)}
                    className={`w-8 h-8 rounded text-[10px] font-bold transition-all ${order.current_step === step ? "bg-cyan-400 text-black shadow-lg shadow-cyan-400/20" : "text-slate-500 hover:text-white"}`}
                  >
                    {step}
                  </button>
                ))}
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Capital Asignado</p>
                <p className="text-3xl md:text-4xl font-bold text-white font-headline">${order.total?.toLocaleString() || "0"}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">USD</p>
              </div>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        {order.status === "processing" && (
          <section className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleStatusChange("pending")}
              disabled={actionLoading !== null}
              className="flex-1 flex items-center justify-center gap-3 bg-green-500/10 text-green-400 border border-green-500/20 px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-green-500/20 transition-all disabled:opacity-50"
            >
              {actionLoading === "completed" ? (
                <span className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin"></span>
              ) : (
                <span className="material-symbols-outlined text-lg">check_circle</span>
              )}
              Aprobar Pedido
            </button>
            <Link
              href={`/admin/pedidos/${orderId}/contrapropuesta`}
              className="flex-1 flex items-center justify-center gap-3 bg-orange-500/10 text-orange-400 border border-orange-500/20 px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-orange-500/20 transition-all"
            >
              <span className="material-symbols-outlined text-lg">handshake</span>
              Contrapropuesta
            </Link>
            <button
              onClick={() => handleStatusChange("rejected")}
              disabled={actionLoading !== null}
              className="flex-1 flex items-center justify-center gap-3 bg-red-500/10 text-red-400 border border-red-500/20 px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all disabled:opacity-50"
            >
              {actionLoading === "pending" ? (
                <span className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></span>
              ) : (
                <span className="material-symbols-outlined text-lg">cancel</span>
              )}
              Rechazar Pedido
            </button>
          </section>
        )}

        {/* Complete Order Action */}
        {order.status === "pending" && (
          <section className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleStatusChange("completed")}
              disabled={actionLoading !== null}
              className="flex-1 flex items-center justify-center gap-3 bg-green-500/10 text-green-400 border border-green-500/20 px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-green-500/20 transition-all disabled:opacity-50 shadow-[0_10px_20px_rgba(34,197,94,0.1)] active:scale-[0.98]"
            >
              {actionLoading === "completed" ? (
                <span className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin"></span>
              ) : (
                <span className="material-symbols-outlined text-lg">verified</span>
              )}
              Marcar como Completado
            </button>
            <Link
              href={`/admin/pedidos/${orderId}/recurso`}
              className="flex-1 flex items-center justify-center gap-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-cyan-500/20 transition-all shadow-[0_10px_20px_rgba(34,211,238,0.1)] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-lg">cloud_upload</span>
              Subir Recurso
            </Link>
          </section>
        )}

        {/* Manage Resources for Completed */}
        {order.status === "completed" && (
          <section className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/admin/pedidos/${orderId}/recurso`}
              className="flex-1 flex items-center justify-center gap-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-cyan-500/20 transition-all shadow-[0_10px_20px_rgba(34,211,238,0.1)] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-lg">cloud_upload</span>
              Gestionar Recursos
            </Link>
          </section>
        )}

        {/* Counter Proposal Status */}
        {cp && (
          <section className={`border rounded-2xl p-6 space-y-4 ${cp.status === "accepted" ? "bg-green-500/5 border-green-500/20" : cp.status === "rejected" ? "bg-red-500/5 border-red-500/20" : "bg-orange-500/5 border-orange-500/20"}`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${cp.status === "accepted" ? "bg-green-500/20" : cp.status === "rejected" ? "bg-red-500/20" : "bg-orange-500/20"}`}>
                <span className={`material-symbols-outlined text-2xl ${cp.status === "accepted" ? "text-green-400" : cp.status === "rejected" ? "text-red-400" : "text-orange-400"}`}>
                  {cp.status === "accepted" ? "task_alt" : cp.status === "rejected" ? "cancel" : "pending_actions"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-lg font-bold ${cp.status === "accepted" ? "text-green-400" : cp.status === "rejected" ? "text-red-400" : "text-orange-400"}`}>
                  Contrapropuesta {cp.status === "accepted" ? "Aceptada ✓" : cp.status === "rejected" ? "Rechazada ✗" : "Enviada — Esperando Respuesta"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enviada el {cp.sent_at ? new Date(cp.sent_at).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A"}
                  {cp.accepted_at && ` · Aceptada el ${new Date(cp.accepted_at).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Precio</p>
                <p className="text-lg font-bold text-orange-400 font-headline">${cp.final_price?.toLocaleString()}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Desarrollo</p>
                <p className="text-lg font-bold text-white font-headline">{cp.development_time ? cp.development_time.replace(/semanas?/gi, (m) => m.toLowerCase().endsWith('s') ? 'meses' : 'mes') : ''}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Método</p>
                <p className="text-lg font-bold text-white font-headline capitalize">{cp.payment_method}</p>
              </div>
              {cp.credit_terms && (
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Cuota</p>
                  <p className="text-lg font-bold text-emerald-400 font-headline">${cp.credit_terms.monthly_payment?.toFixed(2)}/mes</p>
                </div>
              )}
            </div>
            {cp.notes && (
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Nota incluida</p>
                <p className="text-xs text-slate-400">{cp.notes}</p>
              </div>
            )}
            {cp.status === "sent" && (
              <Link href={`/admin/pedidos/${orderId}/contrapropuesta`} className="text-xs font-bold uppercase tracking-widest text-orange-400 hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">edit</span>
                Modificar Contrapropuesta
              </Link>
            )}
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Client Information */}
          <section className="bg-surface-container-low border border-white/5 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center border border-cyan-400/20">
                <span className="material-symbols-outlined text-cyan-400">person</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">Información del Cliente</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Datos de contacto</p>
              </div>
            </div>
            <div className="space-y-4">
              <DetailField label="Nombre Completo" value={proposal?.full_name || profile?.manager_name || "No disponible"} icon="badge" />
              <DetailField label="Correo Electrónico" value={proposal?.email || profile?.email || "No disponible"} icon="mail" isLink={`mailto:${proposal?.email || profile?.email || ""}`} />
              <DetailField label="Teléfono / WhatsApp" value={proposal?.phone || profile?.whatsapp || "No registrado"} icon="phone" isLink={proposal?.phone || profile?.whatsapp ? `https://wa.me/${(proposal?.phone || profile?.whatsapp || "").replace(/[^0-9]/g, "")}` : undefined} />
              <DetailField label="Empresa" value={profile?.company_name || "No registrada"} icon="business" />
              <DetailField label="ID de Usuario" value={order.user_id} icon="fingerprint" mono />
            </div>
          </section>

          {/* Payment Information */}
          <section className="bg-surface-container-low border border-white/5 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center border border-emerald-400/20">
                <span className="material-symbols-outlined text-emerald-400">payments</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">Información de Pago</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Método y condiciones</p>
              </div>
            </div>
            <div className="space-y-4">
              <DetailField
                label="Método de Pago"
                value={order.payment_method === "credito" ? "Crédito (Financiamiento)" : order.payment_method === "contado" ? "Pago de Contado" : order.payment_method || "No especificado"}
                icon="credit_card"
              />
              <DetailField label="Monto Total" value={`$${order.total?.toLocaleString() || "0"} USD`} icon="attach_money" highlight />

              {credit && credit.wants_credit && (
                <>
                  <div className="border-t border-white/5 pt-4">
                    <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-xs">info</span>
                      Detalles del Crédito
                    </p>
                    <div className="bg-cyan-400/5 border border-cyan-400/10 rounded-xl p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Plazo</p>
                          <p className="text-sm font-bold text-white">{credit.months} Meses</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Interés</p>
                          <p className="text-sm font-bold text-white">{credit.interest_rate}% Fijo</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Cuota Mensual</p>
                          <p className="text-lg font-bold text-cyan-400 font-headline">${credit.monthly_payment?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Total + Interés</p>
                          <p className="text-lg font-bold text-white font-headline">${credit.total_with_interest?.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Project Description */}
          <section className="bg-surface-container-low border border-white/5 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-400/10 flex items-center justify-center border border-violet-400/20">
                <span className="material-symbols-outlined text-violet-400">description</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">Descripción del Proyecto</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Lo que desea construir</p>
              </div>
            </div>
            <div className="space-y-4">
              <DetailField label="Asunto / Categoría" value={proposal?.project_subject || order.items?.[0]?.name || "No especificado"} icon="category" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2 ml-1">Descripción del Proyecto</p>
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {proposal?.project_description || order.items?.[0]?.description || "Sin descripción proporcionada."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Business Description */}
          <section className="bg-surface-container-low border border-white/5 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center border border-amber-400/20">
                <span className="material-symbols-outlined text-amber-400">storefront</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">Sobre el Negocio</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Información de la empresa</p>
              </div>
            </div>
            <div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {proposal?.business_description || "Sin descripción del negocio proporcionada."}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Items Detail */}
        {order.items && order.items.length > 0 && (
          <section className="bg-surface-container-low border border-white/5 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-400/10 flex items-center justify-center border border-rose-400/20">
                <span className="material-symbols-outlined text-rose-400">shopping_bag</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">Servicios Solicitados</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">{order.items.length} servicio{order.items.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <div className="space-y-3">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{item.name || "Servicio"}</p>
                    {item.description && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.description}</p>}
                  </div>
                  <p className="text-lg font-bold text-white ml-4 shrink-0">${item.price?.toLocaleString()}</p>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 border-t border-white/5">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Total</p>
                <p className="text-xl font-bold text-white">${order.total?.toLocaleString()} USD</p>
              </div>
            </div>
          </section>
        )}

        {/* Order Timeline */}
        <section className="bg-surface-container-low border border-white/5 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-400/10 flex items-center justify-center border border-slate-400/20">
              <span className="material-symbols-outlined text-slate-400">timeline</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">Línea de Tiempo</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Historial del pedido</p>
            </div>
          </div>
          <div className="space-y-4 pl-4 border-l-2 border-white/5">
            <TimelineItem
              icon="send"
              title="Propuesta Enviada"
              date={proposal?.submitted_at || order.created_at}
              description={`${proposal?.full_name || "Cliente"} envió la propuesta desde el formulario de contacto.`}
              active
            />
            {cp && (
              <TimelineItem
                icon="handshake"
                title="Contrapropuesta Enviada"
                date={cp.sent_at}
                description={`Se envió contrapropuesta por $${cp.final_price?.toLocaleString()} con desarrollo en ${cp.development_time ? cp.development_time.replace(/semanas?/gi, (m) => m.toLowerCase().endsWith('s') ? 'meses' : 'mes') : ''}.`}
                active
              />
            )}
            {cp?.status === "accepted" && (
              <TimelineItem
                icon="task_alt"
                title="Contrapropuesta Aceptada"
                date={cp.accepted_at}
                description="El cliente aceptó la contrapropuesta. Pedido pasó a Producción."
                active
                success
              />
            )}
            <TimelineItem
              icon="visibility"
              title="Revisión Administrativa"
              date={order.status !== "processing" ? new Date().toISOString() : undefined}
              description={order.status === "processing" ? "Pendiente de revisión por el administrador." : `Estado actualizado a: ${getStatusConfig(order.status).label}`}
              active={order.status !== "processing"}
            />
            {order.status === "completed" && (
              <TimelineItem
                icon="check_circle"
                title="Pedido Aprobado"
                description="El pedido ha sido aprobado y se procederá con el desarrollo."
                active
                success
              />
            )}
          </div>
        </section>

        {/* Full Order ID */}
        <section className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">ID Completo del Pedido</p>
            <p className="text-xs font-mono text-slate-400 mt-1 break-all">{order.id}</p>
          </div>
          <Link href="/admin/pedidos" className="text-[10px] font-bold uppercase tracking-widest text-tertiary hover:underline shrink-0">
            Volver a Gestión de Pedidos →
          </Link>
        </section>

      </main>

      <AdminSidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
    </div>
  );
}

function DetailField({ label, value, icon, mono, highlight, isLink }: { label: string; value: string; icon: string; mono?: boolean; highlight?: boolean; isLink?: string }) {
  const content = (
    <div className="flex items-start gap-3 group">
      <span className="material-symbols-outlined text-slate-600 text-lg mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{label}</p>
        <p className={`text-sm mt-0.5 break-all ${mono ? "font-mono text-xs text-slate-400" : ""} ${highlight ? "text-lg font-bold text-cyan-400 font-headline" : "text-white font-medium"} ${isLink ? "group-hover:text-cyan-400 transition-colors" : ""}`}>
          {value}
        </p>
      </div>
      {isLink && <span className="material-symbols-outlined text-slate-600 text-sm mt-1 shrink-0 group-hover:text-cyan-400 transition-colors">open_in_new</span>}
    </div>
  );

  if (isLink) {
    return <a href={isLink} target="_blank" rel="noopener noreferrer">{content}</a>;
  }
  return content;
}

function TimelineItem({ icon, title, date, description, active, success }: { icon: string; title: string; date?: string; description: string; active?: boolean; success?: boolean }) {
  return (
    <div className="relative pl-6">
      <div className={`absolute -left-[13px] w-6 h-6 rounded-full flex items-center justify-center ${success ? "bg-green-500/20 border border-green-500/30" : active ? "bg-cyan-400/20 border border-cyan-400/30" : "bg-white/5 border border-white/10"}`}>
        <span className={`material-symbols-outlined text-xs ${success ? "text-green-400" : active ? "text-cyan-400" : "text-slate-600"}`}>{icon}</span>
      </div>
      <div>
        <p className={`text-sm font-bold ${active ? "text-white" : "text-slate-500"}`}>{title}</p>
        {date && (
          <p className="text-[10px] text-slate-500 mt-0.5">
            {new Date(date).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
        <p className={`text-xs mt-1 ${active ? "text-slate-400" : "text-slate-600"}`}>{description}</p>
      </div>
    </div>
  );
}
