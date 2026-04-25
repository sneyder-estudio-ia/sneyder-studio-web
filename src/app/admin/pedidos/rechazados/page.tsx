"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where, doc, getDoc, deleteDoc, orderBy } from "firebase/firestore";
import AdminSidebar from "@/components/AdminSidebar";

const ADMIN_EMAIL = "sneyder23081994@gmail.com";

interface Order {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  rejected_at?: string;
  total: number;
  items: any[];
  userName?: string;
  userEmail?: string;
}

export default function RechazadosPage() {
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
        router.replace("/");
        return;
      }
      setUser(currentUser);
      setIsChecking(false);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchRejected = async () => {
      setIsLoading(true);
      try {
        const now = new Date();

        // First cleanup expired (72h+) rejected orders
        const qAll = query(collection(db, "orders"), where("status", "==", "rejected"));
        const snapAll = await getDocs(qAll);
        const validOrders: Order[] = [];

        for (const docSnap of snapAll.docs) {
          const data = docSnap.data();
          const rejectedAt = data.rejected_at ? new Date(data.rejected_at) : null;

          if (rejectedAt) {
            const hoursDiff = (now.getTime() - rejectedAt.getTime()) / (1000 * 60 * 60);
            if (hoursDiff >= 72) {
              // Auto-delete expired
              await deleteDoc(doc(db, "orders", docSnap.id));
              continue;
            }
          }

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

          validOrders.push({
            id: docSnap.id,
            ...data,
            userName,
            userEmail,
          } as Order);
        }

        // Sort by rejected_at descending
        validOrders.sort((a, b) => {
          const dateA = a.rejected_at ? new Date(a.rejected_at).getTime() : 0;
          const dateB = b.rejected_at ? new Date(b.rejected_at).getTime() : 0;
          return dateB - dateA;
        });

        setOrders(validOrders);
      } catch (err) {
        console.error("Error fetching rejected orders:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchRejected();
  }, [user]);

  const handleDeleteNow = async (orderId: string) => {
    if (!confirm("¿Estás seguro de eliminar este pedido permanentemente?")) return;
    try {
      await deleteDoc(doc(db, "orders", orderId));
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      console.error("Error deleting order:", err);
      alert("Error al eliminar el pedido.");
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

  const getTimeRemaining = (rejectedAt: string) => {
    const now = new Date();
    const rejected = new Date(rejectedAt);
    const expiresAt = new Date(rejected.getTime() + 72 * 60 * 60 * 1000);
    const remaining = expiresAt.getTime() - now.getTime();

    if (remaining <= 0) return "Expirando...";

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m restantes`;
    return `${minutes}m restantes`;
  };

  const filtered = orders.filter(o => {
    const term = searchTerm.toLowerCase();
    return !term ||
      o.id.toLowerCase().includes(term) ||
      (o.userName || "").toLowerCase().includes(term) ||
      (o.userEmail || "").toLowerCase().includes(term) ||
      (o.items?.[0]?.name || "").toLowerCase().includes(term);
  });

  return (
    <div className="bg-background text-on-background selection:bg-tertiary selection:text-on-tertiary flex flex-col min-h-screen">
      {/* TopAppBar */}
      <header className={`fixed top-0 w-full z-50 bg-[#0c1324]/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-6 h-16 shadow-[0_20px_50px_rgba(12,19,36,0.4)] transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-72" : ""}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-[#2fd9f4] hover:bg-slate-800/50 transition-all duration-300 p-2 rounded shrink-0">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <h1 className="font-['Space_Grotesk'] tracking-tight text-lg md:text-xl font-bold text-red-400 whitespace-nowrap uppercase">
              Rechazados
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
              <span className="w-1.5 h-8 bg-red-500 rounded-full"></span>
              Pedidos Rechazados
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">Los pedidos rechazados se eliminan automáticamente después de <strong className="text-red-400">72 horas</strong>.</p>
          </div>
          <div className="flex items-center gap-6 bg-red-500/5 px-6 py-4 rounded-2xl border border-red-500/10">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Rechazados</span>
              <span className="text-xl font-headline font-bold text-red-400">{orders.length}</span>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <span className="material-symbols-outlined text-red-400 text-sm">timer</span>
              Auto-eliminación: 72h
            </div>
          </div>
        </section>

        {/* Warning Banner */}
        <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-red-400">warning</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-red-400">Eliminación Automática Activa</h4>
            <p className="text-xs text-slate-400 mt-1">Los pedidos en esta sección serán eliminados permanentemente de la base de datos al cumplir 72 horas desde su rechazo. Esta acción es irreversible.</p>
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
            className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20 transition-all"
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
                <span className="w-8 h-8 border-2 border-red-400/20 border-t-red-400 rounded-full animate-spin"></span>
                <p className="text-xs text-slate-500 uppercase tracking-widest">Cargando rechazados...</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-surface-container-low rounded-2xl p-16 text-center flex flex-col items-center gap-6">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-green-400">check_circle</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Sin Pedidos Rechazados</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">
                  {searchTerm ? "No se encontraron rechazados con este término." : "No hay pedidos rechazados. ¡Todo está en orden!"}
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                {filtered.length} pedido{filtered.length !== 1 ? "s" : ""} rechazado{filtered.length !== 1 ? "s" : ""}
              </p>
              {filtered.map((order) => (
                <div key={order.id} className="bg-surface-container-low border border-red-500/10 rounded-2xl p-5 md:p-6 hover:border-red-500/25 transition-all group relative overflow-hidden">
                  {/* Red accent line */}
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500/50 via-red-400/30 to-transparent"></div>

                  <div className="flex flex-col lg:flex-row justify-between gap-5">
                    {/* Left: Info */}
                    <div className="flex flex-col gap-3 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-white/5 px-2 py-1 rounded font-mono">
                          #{order.id.slice(0, 8)}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded flex items-center gap-1.5 border bg-red-500/10 text-red-400 border-red-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                          Rechazado
                        </span>
                        {/* Countdown */}
                        {order.rejected_at && (
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded flex items-center gap-1.5 bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            <span className="material-symbols-outlined text-xs">timer</span>
                            {getTimeRemaining(order.rejected_at)}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold font-headline group-hover:text-red-400 transition-colors truncate">
                        {order.items?.[0]?.name || "Pedido de Servicio"}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">person</span>
                          {order.userName}
                        </span>
                        {order.userEmail && (
                          <span className="flex items-center gap-1.5 truncate">
                            <span className="material-symbols-outlined text-sm">mail</span>
                            {order.userEmail}
                          </span>
                        )}
                        {order.rejected_at && (
                          <span className="flex items-center gap-1.5 text-red-400/70">
                            <span className="material-symbols-outlined text-sm">event_busy</span>
                            Rechazado: {new Date(order.rejected_at).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Price */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 lg:gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total</p>
                        <p className="text-2xl font-bold text-white/50 line-through">${order.total?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="mt-5 pt-5 border-t border-outline-variant/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <Link href={`/admin/pedidos/${order.id}`}>
                      <button className="text-xs font-bold uppercase tracking-widest text-slate-400 border border-white/10 px-5 py-2 rounded-lg hover:bg-white/5 transition-all flex items-center gap-2 w-full sm:w-auto justify-center">
                        Ver Detalles
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDeleteNow(order.id)}
                      className="text-xs font-bold uppercase tracking-widest text-red-400 border border-red-500/20 px-5 py-2 rounded-lg hover:bg-red-500/10 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                      <span className="material-symbols-outlined text-sm">delete_forever</span>
                      Eliminar Ahora
                    </button>
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
