"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, orderBy, doc, updateDoc, getDoc, deleteDoc, where, addDoc } from "firebase/firestore";
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

type FilterStatus = "all" | "pending" | "processing" | "completed" | "rejected";

export default function AdminPedidosPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
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
        const fetchedOrders: Order[] = [];

        for (const docSnap of snap.docs) {
          const data = docSnap.data();
          let userName = "Usuario desconocido";
          let userEmail = "";

          // Fetch user profile for each order
          if (data.user_id) {
            try {
              const profileDoc = await getDoc(doc(db, "profiles", data.user_id));
              if (profileDoc.exists()) {
                const profile = profileDoc.data();
                userName = profile.manager_name || profile.displayName || profile.name || "Sin nombre";
                userEmail = profile.email || "";
              }
            } catch {
              // Silently fail, keep defaults
            }
          }

          fetchedOrders.push({
            id: docSnap.id,
            ...data,
            userName,
            userEmail,
          } as Order);
        }

        setOrders(fetchedOrders);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const cleanupRejected = async () => {
      try {
        const now = new Date();
        const q72 = query(collection(db, "orders"), where("status", "==", "rejected"));
        const snap72 = await getDocs(q72);
        for (const docSnap of snap72.docs) {
          const data = docSnap.data();
          const rejectedAt = data.rejected_at ? new Date(data.rejected_at) : null;
          if (rejectedAt) {
            const hoursDiff = (now.getTime() - rejectedAt.getTime()) / (1000 * 60 * 60);
            if (hoursDiff >= 72) {
              await deleteDoc(doc(db, "orders", docSnap.id));
            }
          }
        }
      } catch (err) {
        console.error("Error cleaning up rejected orders:", err);
      }
    };

    if (user) {
      cleanupRejected().then(() => fetchOrders());
    }
  }, [user]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === "rejected") {
        updateData.rejected_at = new Date().toISOString();
      }
      await updateDoc(doc(db, "orders", orderId), updateData);
      
      // Obtener el pedido para saber a quién notificar
      const orderToNotify = orders.find(o => o.id === orderId);
      if (orderToNotify?.user_id) {
        let statusText = "";
        let type: "info" | "success" | "update" | "warning" = "info";
        
        switch (newStatus) {
          case "completed": statusText = "¡Completado!"; type = "success"; break;
          case "rejected": statusText = "Rechazado"; type = "info"; break;
          case "pending": statusText = "en Producción"; type = "update"; break;
          case "processing": statusText = "Nuevo / En revisión"; type = "info"; break;
        }

        await addDoc(collection(db, "notifications"), {
          userId: orderToNotify.user_id,
          title: "Actualización de Pedido",
          message: `Tu pedido #${orderId.slice(0, 8)} ha cambiado a estado: ${statusText}.`,
          type,
          unread: true,
          createdAt: new Date(),
        });
      }

      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
      );
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Error al actualizar el estado del pedido.");
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

  // Filter and search
  const filteredOrders = orders.filter(o => {
    const matchesStatus = filterStatus === "all" || o.status === filterStatus;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      o.id.toLowerCase().includes(term) ||
      (o.userName || "").toLowerCase().includes(term) ||
      (o.userEmail || "").toLowerCase().includes(term) ||
      (o.items?.[0]?.name || "").toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  // Stats
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const newOrders = orders.filter(o => o.status === "processing").length;
  const completedOrders = orders.filter(o => o.status === "completed").length;
  const rejectedOrders = orders.filter(o => o.status === "rejected").length;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return { label: "Completado", bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20", dot: "bg-green-400" };
      case "processing":
        return { label: "Nuevo", bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", dot: "bg-cyan-400 animate-pulse" };
      case "rejected":
        return { label: "Rechazado", bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", dot: "bg-red-400" };
      default:
        return { label: "Producción", bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20", dot: "bg-yellow-400" };
    }
  };

  return (
    <div className="bg-background text-on-background selection:bg-tertiary selection:text-on-tertiary flex flex-col min-h-screen">
      {/* TopAppBar */}
      <header className={`fixed top-0 w-full z-50 bg-[#0c1324]/80 backdrop-blur-xl h-16 shadow-[0_20px_50px_rgba(12,19,36,0.4)] transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-72" : "pl-0"}`}>
        <div className="max-w-7xl mx-auto h-full px-4 md:px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-[#2fd9f4] hover:bg-slate-800/50 transition-all duration-300 p-2 rounded shrink-0 flex items-center justify-center">
              <span className="material-symbols-outlined transform rotate-180">arrow_forward</span>
            </Link>
            <h1 className="font-['Space_Grotesk'] tracking-tight text-lg md:text-xl font-bold text-[#89ceff] whitespace-nowrap uppercase">
              Pedidos
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

      {/* Main Content */}
      <main className={`flex-grow transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-72" : "pl-0"}`}>
        <div className="pt-24 pb-28 px-4 md:px-6 max-w-7xl mx-auto space-y-8 w-full">

        {/* Header Section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/10 pb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-headline font-bold text-white tracking-tight">Gestión de Pedidos</h2>
            <p className="text-sm text-on-surface-variant mt-1">Administra todos los pedidos y proyectos de los clientes.</p>
          </div>
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
            {([
              { label: "Todos", value: "all" as FilterStatus },
              { label: "Producción", value: "pending" as FilterStatus },
              { label: "Nuevos", value: "processing" as FilterStatus },
              { label: "Completados", value: "completed" as FilterStatus },
              { label: "Rechazados", value: "rejected" as FilterStatus },
            ]).map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value)}
                className={`px-3 md:px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${filterStatus === f.value
                  ? "bg-tertiary text-on-tertiary shadow-lg"
                  : "text-on-surface-variant hover:bg-white/5"
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </section>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/pedidos/nuevos" className="block">
            <StatMiniCard icon="fiber_new" label="Nuevos Pedidos" value={newOrders.toString()} color="cyan" />
          </Link>
          <Link href="/admin/pedidos/pendientes" className="block">
            <StatMiniCard icon="schedule" label="Producción" value={pendingOrders.toString()} color="yellow" />
          </Link>
          <Link href="/admin/pedidos/completados" className="block">
            <StatMiniCard icon="check_circle" label="Completados" value={completedOrders.toString()} color="green" />
          </Link>
          <Link href="/admin/pedidos/rechazados" className="block">
            <StatMiniCard icon="block" label="Rechazados" value={rejectedOrders.toString()} color="red" />
          </Link>
        </div>

        {/* Search Bar */}
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
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>

        {/* Orders List */}
        <section className="space-y-4">
          {isLoading ? (
            <div className="bg-surface-container-low rounded-2xl p-16 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <span className="w-8 h-8 border-2 border-tertiary/20 border-t-tertiary rounded-full animate-spin"></span>
                <p className="text-xs text-slate-500 uppercase tracking-widest">Cargando pedidos...</p>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-surface-container-low rounded-2xl p-16 text-center flex flex-col items-center gap-6">
              <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-slate-600">inventory_2</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">No se encontraron pedidos</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">
                  {searchTerm ? "Intenta con otro término de búsqueda." : "Aún no hay pedidos registrados en el sistema."}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Results count */}
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                  {filteredOrders.length} pedido{filteredOrders.length !== 1 ? "s" : ""} encontrado{filteredOrders.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Order Cards */}
              {filteredOrders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
                return (
                  <div
                    key={order.id}
                    className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-5 md:p-6 hover:border-tertiary/20 transition-all group"
                  >
                    <div className="flex flex-col lg:flex-row justify-between gap-5">
                      {/* Left: Info */}
                      <div className="flex flex-col gap-3 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-white/5 px-2 py-1 rounded font-mono">
                            #{order.id.slice(0, 8)}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded flex items-center gap-1.5 border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
                            {statusConfig.label}
                          </span>
                          {order.current_step && (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-white/5 px-2 py-1 rounded">
                              Fase {order.current_step}/3
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-bold font-headline group-hover:text-tertiary transition-colors truncate">
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
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">calendar_today</span>
                            {new Date(order.created_at).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Right: Price + Actions */}
                      <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 lg:gap-4 shrink-0">
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total</p>
                          <p className="text-2xl font-bold text-white">${order.total?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-5 pt-5 border-t border-outline-variant/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      {/* Status Changer */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold whitespace-nowrap">Cambiar estado:</span>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="bg-surface-container-high text-white text-xs px-3 py-2 rounded-lg border border-outline-variant/10 focus:outline-none focus:border-tertiary/30 cursor-pointer"
                        >
                          <option value="pending">Producción</option>
                          <option value="processing">Nuevo</option>
                          <option value="completed">Completado</option>
                          <option value="rejected">Rechazado</option>
                        </select>
                      </div>

                      {/* View Details */}
                      <Link href={`/admin/pedidos/${order.id}`}>
                        <button className="text-xs font-bold uppercase tracking-widest text-tertiary border border-tertiary/30 px-5 py-2 rounded-lg hover:bg-tertiary/10 transition-all flex items-center gap-2 w-full sm:w-auto justify-center">
                          Ver Detalles
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                        </button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </section>
        </div>
      </main>

      {/* Sidebar Component */}
      <AdminSidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
    </div>
  );
}

function StatMiniCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  const colorMap: Record<string, { text: string; bg: string }> = {
    tertiary: { text: "text-tertiary", bg: "bg-tertiary/10" },
    primary: { text: "text-primary", bg: "bg-primary/10" },
    cyan: { text: "text-cyan-400", bg: "bg-cyan-400/10" },
    green: { text: "text-green-400", bg: "bg-green-400/10" },
    yellow: { text: "text-yellow-400", bg: "bg-yellow-400/10" },
    red: { text: "text-red-400", bg: "bg-red-400/10" },
  };
  const c = colorMap[color] || colorMap.tertiary;

  return (
    <div className="bg-surface-container-low p-5 rounded-2xl border-t border-outline-variant/10 shadow-sm flex flex-col justify-between h-32 transition-all hover:bg-surface-container-high border-l border-l-transparent hover:border-l-tertiary/50">
      <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
        <span className={`material-symbols-outlined ${c.text}`}>{icon}</span>
      </div>
      <div>
        <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-[0.1em]">{label}</p>
        <p className="text-xl font-headline font-bold text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}
