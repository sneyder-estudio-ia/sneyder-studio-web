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
  userName?: string;
  userEmail?: string;
}

export default function PendientesPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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
          if (data.status !== "pending") continue;
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
        console.error("Error fetching pending orders:", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (user) fetchOrders();
  }, [user]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Error al actualizar el estado.");
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

  const totalPendingRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);

  return (
    <div className="bg-background text-on-background selection:bg-tertiary selection:text-on-tertiary flex flex-col min-h-screen">
      <header className={`fixed top-0 w-full z-50 bg-[#0c1324]/80 backdrop-blur-xl h-16 shadow-[0_20px_50px_rgba(12,19,36,0.4)] transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-72" : "pl-0"}`}>
        <div className="max-w-7xl mx-auto h-full px-4 md:px-6 flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <Link href="/admin/pedidos" className="text-[#2fd9f4] hover:bg-slate-800/50 transition-all duration-300 p-2 rounded shrink-0 flex items-center justify-center">
              <span className="material-symbols-outlined transform rotate-180">arrow_forward</span>
            </Link>
            <h1 className="font-['Space_Grotesk'] tracking-tight text-lg md:text-xl font-bold text-[#89ceff] whitespace-nowrap uppercase">
              Producción
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
        </div>
      </header>

      <main className={`flex-grow transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-72" : "pl-0"}`}>
        <div className="pt-24 pb-28 px-4 md:px-6 max-w-7xl mx-auto space-y-8 w-full">

        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/10 pb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-headline font-bold text-white tracking-tight flex items-center gap-3">
              <span className="w-1.5 h-8 bg-yellow-400 rounded-full"></span>
              Pedidos en Producción
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">Pedidos aprobados que se encuentran en fase de desarrollo.</p>
          </div>
          <div className="flex items-center gap-6 bg-white/5 px-6 py-4 rounded-2xl border border-white/5">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">En Producción</span>
              <span className="text-xl font-headline font-bold text-yellow-400">{orders.length}</span>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Valor</span>
              <span className="text-xl font-headline font-bold text-white">${totalPendingRevenue.toLocaleString()}</span>
            </div>
          </div>
        </section>

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
                <span className="w-8 h-8 border-2 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin"></span>
                <p className="text-xs text-slate-500 uppercase tracking-widest">Cargando pendientes...</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-surface-container-low rounded-2xl p-16 text-center flex flex-col items-center gap-6">
              <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-slate-600">check_circle</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">No hay pedidos pendientes</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">
                  {searchTerm ? "Intenta con otro término de búsqueda." : "Todos los pedidos han sido procesados. ¡Excelente trabajo!"}
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                {filtered.length} pedido{filtered.length !== 1 ? "s" : ""} pendiente{filtered.length !== 1 ? "s" : ""}
              </p>
              {filtered.map((order) => (
                <div key={order.id} className="bg-surface-container-low border border-yellow-500/10 rounded-2xl p-5 md:p-6 hover:border-yellow-400/30 transition-all group">
                  <div className="flex flex-col lg:flex-row justify-between gap-5">
                    <div className="flex flex-col gap-3 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-white/5 px-2 py-1 rounded font-mono">#{order.id.slice(0, 8)}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded flex items-center gap-1.5 border bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                          Pendiente
                        </span>
                      </div>
                      <h3 className="text-lg font-bold font-headline group-hover:text-yellow-400 transition-colors truncate">
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
                  <div className="mt-5 pt-5 border-t border-outline-variant/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold whitespace-nowrap">Cambiar estado:</span>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="bg-surface-container-high text-white text-xs px-3 py-2 rounded-lg border border-outline-variant/10 focus:outline-none focus:border-tertiary/30 cursor-pointer"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="processing">Nuevo</option>
                        <option value="completed">Completado</option>
                      </select>
                    </div>
                    <Link href={`/admin/pedidos/${order.id}`}>
                      <button className="text-xs font-bold uppercase tracking-widest text-tertiary border border-tertiary/30 px-5 py-2 rounded-lg hover:bg-tertiary/10 transition-all flex items-center gap-2 w-full sm:w-auto justify-center">
                        Ver Detalles
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </>
          )}
        </section>
        </div>
      </main>

      <AdminSidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
    </div>
  );
}
