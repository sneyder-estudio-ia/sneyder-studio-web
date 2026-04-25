"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import AdminSidebar from "@/components/AdminSidebar";

const ADMIN_EMAIL = "sneyder23081994@gmail.com";

export default function ContrapropuestaPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  // Form state
  const [formData, setFormData] = useState({
    final_price: "",
    development_time_value: "",
    development_time_unit: "semanas",
    payment_method: "contado",
    credit_months: 6,
    interest_rate: 5,
    notes: "",
  });

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
          setOrder({ id: orderDoc.id, ...data });

          // If counter proposal exists, pre-fill with its data
          if (data.counter_proposal) {
            const cp = data.counter_proposal;
            setFormData(prev => ({
              ...prev,
              final_price: (cp.final_price || data.total || "").toString(),
              development_time_value: (cp.development_time_value || "").toString(),
              development_time_unit: cp.development_time_unit || "semanas",
              payment_method: cp.payment_method || data.payment_method || "contado",
              credit_months: cp.credit_terms?.months || data.credit_info?.months || 6,
              interest_rate: cp.credit_terms?.interest_rate || data.credit_info?.interest_rate || 5,
              notes: cp.notes || "",
            }));

            if (cp.status === "sent" || cp.status === "accepted") {
              setSent(true);
            }
          } else {
            // Pre-fill form with original order data
            setFormData(prev => ({
              ...prev,
              final_price: (data.total || "").toString(),
              payment_method: data.payment_method || "contado",
              credit_months: data.credit_info?.months || 6,
              interest_rate: data.credit_info?.interest_rate || 5,
            }));
          }

          // Fetch user profile
          if (data.user_id) {
            try {
              const profileDoc = await getDoc(doc(db, "profiles", data.user_id));
              if (profileDoc.exists()) {
                setProfile(profileDoc.data());
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

  const calculateMonthly = () => {
    const price = parseFloat(formData.final_price) || 0;
    if (price === 0) return "0";
    const rate = formData.interest_rate / 100;
    const total = price * (1 + rate);
    return (total / formData.credit_months).toFixed(2);
  };

  const calculateTotalWithInterest = () => {
    const price = parseFloat(formData.final_price) || 0;
    const rate = formData.interest_rate / 100;
    return (price * (1 + rate)).toFixed(2);
  };

  const handleSendClick = () => {
    if (!order) return;
    const price = parseFloat(formData.final_price);
    if (!price || price <= 0) {
      alert("Ingrese un precio válido.");
      return;
    }
    if (!formData.development_time_value) {
      alert("Ingrese el tiempo de desarrollo.");
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSend = async () => {
    setShowConfirm(false);
    if (!order) return;
    const price = parseFloat(formData.final_price);

    setIsSending(true);
    try {
      const counterProposal: any = {
        final_price: price,
        development_time: `${formData.development_time_value} ${formData.development_time_unit}`,
        development_time_value: parseInt(formData.development_time_value),
        development_time_unit: formData.development_time_unit,
        payment_method: formData.payment_method,
        notes: formData.notes,
        sent_at: new Date().toISOString(),
        status: "sent",
      };

      if (formData.payment_method === "credito") {
        counterProposal.credit_terms = {
          months: formData.credit_months,
          interest_rate: formData.interest_rate,
          monthly_payment: parseFloat(calculateMonthly()),
          total_with_interest: parseFloat(calculateTotalWithInterest()),
        };
      }

      await updateDoc(doc(db, "orders", order.id), {
        counter_proposal: counterProposal,
        total: price,
      });

      setSent(true);
    } catch (err) {
      console.error("Error sending counter proposal:", err);
      alert("Error al enviar la contrapropuesta.");
    } finally {
      setIsSending(false);
    }
  };

  if (isChecking || isLoading) {
    return (
      <div className="bg-background text-on-background flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <span className="w-8 h-8 border-2 border-tertiary/30 border-t-tertiary rounded-full animate-spin"></span>
          <p className="text-xs text-slate-500 uppercase tracking-widest">
            {isChecking ? "Verificando acceso..." : "Cargando datos del pedido..."}
          </p>
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
            ← Volver a Nuevos Pedidos
          </Link>
        </div>
      </div>
    );
  }

  const clientName = order.proposal?.full_name || profile?.manager_name || "Cliente";
  const clientEmail = order.proposal?.email || profile?.email || "";
  const projectName = order.proposal?.project_subject || order.items?.[0]?.name || "Servicio";

  return (
    <div className="bg-background text-on-background selection:bg-tertiary selection:text-on-tertiary flex flex-col min-h-screen">
      {/* TopAppBar */}
      <header className={`fixed top-0 w-full z-50 bg-[#0c1324]/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-6 h-16 shadow-[0_20px_50px_rgba(12,19,36,0.4)] transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-72" : ""}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-[#2fd9f4] hover:bg-slate-800/50 transition-all duration-300 p-2 rounded shrink-0">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <h1 className="font-['Space_Grotesk'] tracking-tight text-lg md:text-xl font-bold text-orange-400 whitespace-nowrap uppercase">
              Contrapropuesta
            </h1>
            <div className="h-6 w-px bg-white/10 mx-2 hidden sm:block"></div>
            <Link href="/" className="h-10 w-auto relative cursor-pointer hover:scale-105 transition-all bg-white/5 rounded-xl border border-white/10 overflow-hidden p-1.5 shadow-lg group">
              <Image src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png" alt="Sneyder Studio" width={150} height={32} className="h-full w-auto object-contain group-hover:brightness-110" />
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/admin/pedidos/${orderId}`} className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-tertiary hover:underline">
            ← Detalle del Pedido
          </Link>
        </div>
      </header>

      <main className={`pt-20 pb-28 px-4 md:px-6 max-w-4xl mx-auto space-y-6 w-full flex-grow transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-72" : ""}`}>

        {/* Success Banner */}
        {sent && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-green-400 text-2xl">check_circle</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-green-400">Contrapropuesta Enviada</h3>
              <p className="text-sm text-slate-400 mt-1">La contrapropuesta ha sido enviada al cliente. Podrá verla en su panel de pedidos y decidir si aceptarla.</p>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <Link href={`/admin/pedidos/${orderId}`} className="text-xs font-bold uppercase tracking-widest text-tertiary hover:underline">
                  ← Volver al Detalle del Pedido
                </Link>
                {order?.counter_proposal?.status !== "accepted" && (
                  <button
                    onClick={() => setSent(false)}
                    className="text-xs font-bold uppercase tracking-widest text-orange-400 hover:underline flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Modificar Contrapropuesta
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Context Header */}
        <section className="bg-surface-container-low border border-white/5 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent"></div>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Contrapropuesta para</p>
              <h2 className="text-xl md:text-2xl font-bold font-headline text-white">{projectName}</h2>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">person</span>{clientName}
                </span>
                {clientEmail && (
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">mail</span>{clientEmail}
                  </span>
                )}
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-white/5 px-2 py-1 rounded font-mono">#{orderId.slice(0, 8)}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Presupuesto del Cliente</p>
              <p className="text-2xl font-bold text-slate-400 font-headline line-through">${order.total?.toLocaleString() || "0"}</p>
            </div>
          </div>
        </section>

        {/* Original Request Summary */}
        {order.proposal?.project_description && (
          <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-xs">format_quote</span>
              Lo que el cliente solicitó
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">{order.proposal.project_description}</p>
          </section>
        )}

        {!sent && (
          <>
            {/* Price Section */}
            <section className="bg-surface-container-low border border-white/5 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-400/10 flex items-center justify-center border border-orange-400/20">
                  <span className="material-symbols-outlined text-orange-400">attach_money</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight">Precio Final</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">El precio que usted establece para este proyecto</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Precio del Proyecto (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-orange-400">$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={formData.final_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, final_price: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 focus:border-orange-400/50 outline-none rounded-2xl pl-12 pr-6 py-5 text-3xl font-bold font-headline text-white transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Development Time */}
            <section className="bg-surface-container-low border border-white/5 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-400/10 flex items-center justify-center border border-violet-400/20">
                  <span className="material-symbols-outlined text-violet-400">schedule</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight">Tiempo de Desarrollo</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Estimación del tiempo de entrega</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Cantidad</label>
                  <input
                    type="number"
                    placeholder="Ej. 4"
                    value={formData.development_time_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, development_time_value: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 focus:border-violet-400/50 outline-none rounded-xl px-4 py-4 text-lg font-bold text-white transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Unidad</label>
                  <select
                    value={formData.development_time_unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, development_time_unit: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 focus:border-violet-400/50 outline-none rounded-xl px-4 py-4 text-lg font-bold text-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="días" className="bg-[#0c1324]">Días</option>
                    <option value="semanas" className="bg-[#0c1324]">Semanas</option>
                    <option value="meses" className="bg-[#0c1324]">Meses</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Payment Method */}
            <section className="bg-surface-container-low border border-white/5 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center border border-emerald-400/20">
                  <span className="material-symbols-outlined text-emerald-400">payments</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight">Condiciones de Pago</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Defina cómo pagará el cliente</p>
                </div>
              </div>

              {/* Payment Method Toggle */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, payment_method: "contado" }))}
                  className={`p-4 rounded-xl border text-center transition-all ${formData.payment_method === "contado" ? "bg-emerald-400/10 border-emerald-400/30 text-emerald-400" : "bg-white/5 border-white/10 text-slate-500 hover:border-white/20"}`}
                >
                  <span className="material-symbols-outlined text-2xl block mb-1">account_balance_wallet</span>
                  <p className="text-xs font-bold uppercase tracking-widest">Contado</p>
                  <p className="text-[9px] text-slate-500 mt-1">Pago único total</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, payment_method: "credito" }))}
                  className={`p-4 rounded-xl border text-center transition-all ${formData.payment_method === "credito" ? "bg-emerald-400/10 border-emerald-400/30 text-emerald-400" : "bg-white/5 border-white/10 text-slate-500 hover:border-white/20"}`}
                >
                  <span className="material-symbols-outlined text-2xl block mb-1">credit_score</span>
                  <p className="text-xs font-bold uppercase tracking-widest">Crédito</p>
                  <p className="text-[9px] text-slate-500 mt-1">Pagos mensuales</p>
                </button>
              </div>

              {/* Credit Details */}
              {formData.payment_method === "credito" && (
                <div className="space-y-4 bg-emerald-400/5 border border-emerald-400/10 rounded-xl p-5 transition-all">
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs">info</span>
                    Configuración del Crédito
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-1">Plazo (Meses)</label>
                      <select
                        value={formData.credit_months}
                        onChange={(e) => setFormData(prev => ({ ...prev, credit_months: parseInt(e.target.value) }))}
                        className="w-full bg-black/20 border border-white/5 rounded-xl py-3 px-4 text-white focus:border-emerald-400 outline-none text-sm appearance-none"
                      >
                        {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map(m => (
                          <option key={m} value={m} className="bg-[#0c1324]">{m} Meses</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-1">Interés (%)</label>
                      <input
                        type="number"
                        value={formData.interest_rate}
                        onChange={(e) => setFormData(prev => ({ ...prev, interest_rate: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-black/20 border border-white/5 rounded-xl py-3 px-4 text-white focus:border-emerald-400 outline-none text-sm"
                      />
                    </div>
                  </div>

                  {parseFloat(formData.final_price) > 0 && (
                    <div className="bg-white/5 rounded-xl p-4 grid grid-cols-2 gap-4 border border-white/5">
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Cuota Mensual</p>
                        <p className="text-xl font-bold text-emerald-400 font-headline">${calculateMonthly()} USD</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Total + Interés</p>
                        <p className="text-xl font-bold text-white font-headline">${calculateTotalWithInterest()} USD</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Notes */}
            <section className="bg-surface-container-low border border-white/5 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center border border-cyan-400/20">
                  <span className="material-symbols-outlined text-cyan-400">edit_note</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight">Notas Adicionales</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Mensaje para el cliente (opcional)</p>
                </div>
              </div>
              <textarea
                rows={4}
                placeholder="Ej: Incluye hosting por 1 año, mantenimiento mensual, y soporte técnico ilimitado..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 focus:border-cyan-400/50 outline-none rounded-xl px-5 py-4 text-sm text-white transition-all resize-none placeholder:text-slate-600"
              />
            </section>

            {/* Preview */}
            {parseFloat(formData.final_price) > 0 && formData.development_time_value && (
              <section className="bg-gradient-to-br from-orange-500/5 to-cyan-500/5 border border-orange-400/20 rounded-2xl p-6 space-y-4">
                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-xs">preview</span>
                  Vista Previa — Lo que verá el cliente
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Precio</p>
                    <p className="text-lg font-bold text-orange-400 font-headline">${parseFloat(formData.final_price).toLocaleString()}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Desarrollo</p>
                    <p className="text-lg font-bold text-white font-headline">{formData.development_time_value} {formData.development_time_unit}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Método</p>
                    <p className="text-lg font-bold text-white font-headline capitalize">{formData.payment_method}</p>
                  </div>
                  {formData.payment_method === "credito" && (
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Cuota</p>
                      <p className="text-lg font-bold text-emerald-400 font-headline">${calculateMonthly()}/mes</p>
                    </div>
                  )}
                </div>
                {formData.notes && (
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Nota</p>
                    <p className="text-xs text-slate-400">{formData.notes}</p>
                  </div>
                )}
              </section>
            )}

            {/* Send Button */}
            <button
              onClick={handleSendClick}
              disabled={isSending || !formData.final_price || !formData.development_time_value}
              className="w-full bg-orange-500 text-white py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs hover:bg-orange-400 transition-all shadow-[0_15px_30px_rgba(249,115,22,0.2)] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Enviando contrapropuesta...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">send</span>
                  Enviar Contrapropuesta al Cliente
                </>
              )}
            </button>
          </>
        )}

      </main>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowConfirm(false)}>
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <span className="material-symbols-outlined text-orange-400 text-2xl">send</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Confirmar Envío</h3>
                <p className="text-xs text-slate-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-2">
              ¿Enviar esta contrapropuesta al cliente?
            </p>
            <p className="text-xs text-slate-500 mb-6">
              El cliente podrá ver esta propuesta en su panel de pedidos y decidir si aceptarla.
            </p>
            <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Precio:</span>
                <span className="font-bold text-orange-400">${parseFloat(formData.final_price).toLocaleString()} USD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Desarrollo:</span>
                <span className="font-bold text-white">{formData.development_time_value} {formData.development_time_unit}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Pago:</span>
                <span className="font-bold text-white capitalize">{formData.payment_method}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSend}
                className="flex-1 py-3 rounded-xl bg-orange-500 text-white text-xs font-bold uppercase tracking-widest hover:bg-orange-400 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminSidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
    </div>
  );
}
