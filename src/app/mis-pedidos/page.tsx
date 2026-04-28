"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

interface Order {
  id: string;
  status: string;
  created_at: string;
  total: number;
  items: any[];
}

export default function MyOrdersPage() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        if (!isLoading) router.replace('/');
        return;
      }
      setUser(currentUser);

      try {
        const ordersRef = collection(db, 'orders');
        const q = query(
          ordersRef,
          where('user_id', '==', currentUser.uid),
          orderBy('created_at', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const fetchedOrders: Order[] = [];
        querySnapshot.forEach((doc) => {
          fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
        });
        setOrders(fetchedOrders);
      } catch (err) {
        console.error("Error loading orders:", err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, isLoading]);

  if (isLoading) {
    return (
      <div className="bg-[#0a0e1a] text-white flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <span className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></span>
          <p className="text-xs text-slate-500 uppercase tracking-widest">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0e1a] text-white min-h-screen selection:bg-cyan-400/30">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#0c1324]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-5 h-16 shadow-lg">
        <div className="flex items-center gap-4">
          <Link href="/">
            <button className="text-cyan-400 hover:scale-110 transition-transform p-1 rounded-full hover:bg-white/5">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          </Link>
          <h1 className="text-lg font-bold tracking-tight uppercase font-headline text-white border-l border-white/10 pl-4">Mis Pedidos</h1>
        </div>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-4xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold font-headline mb-2">Historial de Proyectos</h2>
          <p className="text-slate-400 text-sm">Gestiona y visualiza el estado de tus solicitudes y servicios activos.</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-[#111827]/40 border border-white/5 rounded-3xl p-16 text-center flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-slate-900/50 rounded-full flex items-center justify-center border border-white/5">
              <span className="material-symbols-outlined text-4xl text-slate-600">inventory_2</span>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Tu próximo éxito comienza aquí</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                Envía tu propuesta sin compromiso ni cargos adicionales. Nuestro equipo de expertos la analizará detalladamente y te contactaremos con una solución personalizada para potenciar tu negocio.
              </p>
            </div>
            <Link href="/contacto">
              <button className="bg-cyan-400 text-black px-10 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-cyan-300 transition-all hover:scale-105 shadow-[0_10px_30px_rgba(47,217,244,0.2)]">
                Crear Pedido
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-[#111827]/60 border border-white/5 rounded-2xl p-6 hover:border-cyan-400/20 transition-all group">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-white/5 px-2 py-1 rounded">
                        ID: {order.id.slice(0, 8)}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${order.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                          order.status === 'processing' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-yellow-500/10 text-yellow-400'
                        }`}>
                        {order.status === 'completed' ? 'Completado' :
                          order.status === 'processing' ? 'En Proceso' : 'Pendiente'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold font-headline group-hover:text-cyan-400 transition-colors">
                      {order.items?.[0]?.name || "Pedido de Servicio"}
                    </h3>
                  </div>

                  <div className="flex flex-col items-end gap-2 text-right">
                    <p className="text-2xl font-bold text-white">${order.total}</p>
                    <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/5 flex justify-end">
                  <Link href={`/mis-pedidos/${order.id}`}>
                    <button className="text-xs font-bold uppercase tracking-widest text-cyan-400 border border-cyan-400/30 px-5 py-2 rounded-lg hover:bg-cyan-400/10 transition-all flex items-center gap-2">
                      Detalles del Proyecto
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
