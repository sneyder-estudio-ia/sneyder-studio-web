"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, orderBy, doc, updateDoc, getDoc } from "firebase/firestore";
import AdminSidebar from "@/components/AdminSidebar";

const ADMIN_EMAIL = "sneyder23081994@gmail.com";

interface Order {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  total: number;
  items: any[];
  current_step?: number;
  payment_method?: string;
  userName?: string;
  userEmail?: string;
}

export default function NuevosPedidosPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const router = useRouter();

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
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, "orders"),
          orderBy("created_at", "desc")
        );
        const snap = await getDocs(q);
        const fetched: Order[] = [];

        for (const docSnap of snap.docs) {
          const data = docSnap.data();
          if (data.status !== "processing") continue;
          let userName = "Usuario desconocido";
          let userEmail = "";
          if (data.user_id) {
            try {
              const profileDoc = await getDoc(doc(db, "profiles", data.user_id));
              if (profileDoc.exists()) {
                const profile = profileDoc.data();
                userName = profile.manager_name || profile.displayName || profile.name || "Sin nombre";
                userEmail = profile.email || "";
              }
            } catch { /* silent */ }
          }
          fetched.push({ id: docSnap.id, ...data, userName, userEmail } as Order);
        }
        setOrders(fetched);
      } catch (err) {
        console.error("Error fetching new orders:", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (user) fetchOrders();
  }, [user]);

  const handleApprove = async (orderId: string) => {
    if (!confirm("¿Aprobar este pedido? Se moverá al estado 'Producción'.")) return;
    try {
      await updateDoc(doc(db, "orders", orderId), { status: "pending" });
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      console.error("Error approving order:", err);
      alert("Error al aprobar el pedido.");
    }
  };

  const handleReject = async (orderId: string) => {
    if (!confirm("¿Rechazar este pedido? Se moverá al estado 'Rechazado'.")) return;
    try {
      await updateDoc(doc(db, "orders", orderId), { status: "rejected" });
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      console.error("Error rejecting order:", err);
      alert("Error al rechazar el pedido.");
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

  const filtered = orders.filter(o => {
    const term = searchTerm.toLowerCase();
    return !term ||
      o.id.toLowerCase().includes(term) ||
      (o.userName || "").toLowerCase().includes(term) ||
      (o.userEmail || "").toLowerCase().includes(term) ||
      (o.items?.[0]?.name || "").toLowerCase().includes(term);
  });

  const totalNewRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);

  return (
    <div className="bg-background text-on-background selection:bg-tertiary selection:text-on-tertiary flex flex-col min-h-screen">
      {/* TopAppBar */}
      <header className={`fixed top-0 w-full z-50 bg-[#0c1324]/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-6 h-16 shadow-[0_20px_50px_rgba(12,19,36,0.4)] transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-72" : ""}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-[#2fd9f4] hover:bg-slate-800/50 transition-all duration-300 p-2 rounded shrink-0">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <h1 className="font-['Space_Grotesk'] tracking-tight text-lg md:text-xl font-bold text-cyan-400 whitespace-nowrap uppercase">
              Nuevos Pedidos
            </h1>
            <div className="h-6 w-px bg-white/10 mx-2 hidden sm:block"></div>
            <Link href="/" className="h-10 w-auto relative cursor-pointer hover:scale-105 transition-all bg-white/5 rounded-xl border border-white/10 overflow-hidden p-1.5 shadow-lg group">
              <Image src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png" alt="Sneyder Studio" width={150} height={32} className="h-full w-auto object-contain group-hover:brightness-110" />
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/pedidos" className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-tertiary hover:underline">
            ← Gestión de Pedidos
          </Link>
        </div>
      </header>

      <main className={`pt-20 pb-28 px-4 md:px-6 max-w-7xl mx-auto space-y-8 w-full flex-grow transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-72" : ""}`}>

        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/10 pb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-headline font-bold text-white tracking-tight flex items-center gap-3">
              <span className="w-1.5 h-8 bg-cyan-400 rounded-full"></span>
              Nuevos Pedidos
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">Revisa y aprueba los nuevos pedidos ingresados al sistema.</p>
          </div>
          <div className="flex items-center gap-6 bg-white/5 px-6 py-4 rounded-2xl border border-white/5">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Nuevos</span>
              <span className="text-xl font-headline font-bold text-cyan-400">{orders.length}</span>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Valor</span>
              <span className="text-xl font-headline font-bold text-white">${totalNewRevenue.toLocaleString()}</span>
            </div>
          </div>
        </section>

        {/* Info Banner */}
        <div className="bg-cyan-400/5 border border-cyan-400/20 rounded-2xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-cyan-400 mt-0.5">info</span>
          <div>
            <p className="text-sm font-bold text-cyan-400">Zona de Revisión</p>
            <p className="text-xs text-slate-400 mt-1">Aquí aparecen los pedidos nuevos que necesitan tu aprobación. Revisa el contenido y decide si aprobarlo o rechazarlo.</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl">search</span>
          <input
            type="text"
            placeholder="Buscar por ID, cliente, email o servicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-tertiary/30 focus:ring-1 focus:ring-tertiary/20 transition-all"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>

        {/* Orders */}
        <section className="space-y-4">
          {isLoading ? (
            <div className="bg-surface-container-low rounded-2xl p-16 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <span className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin"></span>
                <p className="text-xs text-slate-500 uppercase tracking-widest">Cargando nuevos pedidos...</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-surface-container-low rounded-2xl p-16 text-center flex flex-col items-center gap-6">
              <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-slate-600">inbox</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">No hay nuevos pedidos</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">
                  {searchTerm ? "Intenta con otro término de búsqueda." : "No hay pedidos nuevos pendientes de aprobación en este momento."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                {filtered.length} nuevo{filtered.length !== 1 ? "s" : ""} pedido{filtered.length !== 1 ? "s" : ""} por revisar
              </p>
              {filtered.map((order) => (
                <div key={order.id} className="bg-surface-container-low border border-cyan-500/15 rounded-2xl overflow-hidden hover:border-cyan-400/30 transition-all group">
                  {/* Order Header */}
                  <div className="p-5 md:p-6">
                    <div className="flex flex-col lg:flex-row justify-between gap-5">
                      <div className="flex flex-col gap-3 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-white/5 px-2 py-1 rounded font-mono">#{order.id.slice(0, 8)}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded flex items-center gap-1.5 border bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                            Nuevo
                          </span>
                          {order.current_step && (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-white/5 px-2 py-1 rounded">Fase {order.current_step}/3</span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold font-headline group-hover:text-cyan-400 transition-colors truncate">
                          {order.items?.[0]?.name || "Pedido de Servicio"}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">person</span>{order.userName}
                          </span>
                          {order.userEmail && (
                            <span className="flex items-center gap-1.5 truncate">
                              <span className="material-symbols-outlined text-sm">mail</span>{order.userEmail}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">calendar_today</span>
                            {new Date(order.created_at).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 lg:gap-4 shrink-0">
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total</p>
                          <p className="text-2xl font-bold text-white">${order.total?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Content Toggle */}
                    <button
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      className="mt-4 text-[10px] uppercase tracking-widest font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm transition-transform duration-300" style={{ transform: expandedOrder === order.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        expand_more
                      </span>
                      {expandedOrder === order.id ? "Ocultar contenido" : "Ver contenido del pedido"}
                    </button>
                  </div>

                  {/* Expandable Content */}
                  {expandedOrder === order.id && (
                    <div className="border-t border-outline-variant/10 bg-white/[0.02] p-5 md:p-6 space-y-4">
                      <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-3">Detalle del Pedido</h4>

                      {/* Items */}
                      <div className="space-y-3">
                        {(order.items || []).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center bg-white/5 rounded-xl p-4 border border-white/5">
                            <div>
                              <p className="text-sm font-bold text-white">{item.name || "Artículo"}</p>
                              {item.description && <p className="text-xs text-slate-400 mt-1">{item.description}</p>}
                            </div>
                            <p className="text-lg font-bold text-white">${item.price?.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>

                      {/* Order Details */}
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Método de Pago</p>
                          <p className="text-sm font-bold text-white mt-1 capitalize">{order.payment_method || "No especificado"}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Fase Actual</p>
                          <p className="text-sm font-bold text-white mt-1">Fase {order.current_step || 1} de 3</p>
                        </div>
                      </div>

                      {/* Client Info */}
                      <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Información del Cliente</p>
                        <div className="flex flex-wrap gap-6 text-sm">
                          <div>
                            <span className="text-slate-500 text-xs">Nombre:</span>
                            <p className="text-white font-medium">{order.userName}</p>
                          </div>
                          {order.userEmail && (
                            <div>
                              <span className="text-slate-500 text-xs">Email:</span>
                              <p className="text-white font-medium">{order.userEmail}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-slate-500 text-xs">ID Usuario:</span>
                            <p className="text-white font-mono text-xs">{order.user_id}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="border-t border-outline-variant/10 p-5 md:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleApprove(order.id)}
                        className="flex items-center gap-2 bg-green-500/10 text-green-400 border border-green-500/20 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-green-500/20 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleReject(order.id)}
                        className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">cancel</span>
                        Rechazar
                      </button>
                    </div>
                    <Link href={`/admin/pedidos/${order.id}`}>
                      <button className="text-xs font-bold uppercase tracking-widest text-tertiary border border-tertiary/30 px-5 py-2.5 rounded-lg hover:bg-tertiary/10 transition-all flex items-center gap-2 w-full sm:w-auto justify-center">
                        Ver Detalles Completos
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </>
          )}
        </section>
      </main>

      <AdminSidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
    </div>
  );
}
