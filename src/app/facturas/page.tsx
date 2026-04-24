"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

interface Order {
  id: string;
  status: string;
  created_at: string;
  total: number;
  items: any[];
  months_paid?: number;
}

interface Invoice {
  id: string;
  orderId: string;
  projectName: string;
  month: number;
  date: string;
  amount: number;
  status: string;
}

function FacturasContent() {
  const searchParams = useSearchParams();
  const orderIdFilter = searchParams.get("orderId");
  const [user, setUser] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setIsLoading(false);
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
        const allInvoices: Invoice[] = [];

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const order = { id: docSnap.id, ...data } as Order;
          
          if (orderIdFilter && order.id !== orderIdFilter) return;

          const monthlyAmount = order.total / 6;
          const monthsPaid = order.months_paid || 0;

          // Generate invoices for each paid month
          for (let m = 1; m <= monthsPaid; m++) {
            // Mock a date based on order creation + m months
            const date = new Date(order.created_at);
            date.setMonth(date.getMonth() + m - 1);
            
            allInvoices.push({
              id: `INV-${order.id.toUpperCase().slice(0, 6)}-M${m}`,
              orderId: order.id,
              projectName: order.items?.[0]?.name || "Servicio Digital",
              month: m,
              date: date.toISOString(),
              amount: monthlyAmount,
              status: "Pagado"
            });
          }
        });

        // Sort all invoices by date descending
        allInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setInvoices(allInvoices);
      } catch (err) {
        console.error("Error loading invoices:", err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [orderIdFilter]);

  // Group invoices by month/year
  const groupedInvoices: { [key: string]: Invoice[] } = {};
  invoices.forEach(inv => {
    const date = new Date(inv.date);
    const monthYear = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const capitalizedMonthYear = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
    
    if (!groupedInvoices[capitalizedMonthYear]) {
      groupedInvoices[capitalizedMonthYear] = [];
    }
    groupedInvoices[capitalizedMonthYear].push(inv);
  });

  if (isLoading) {
    return (
      <div className="bg-[#0a0e1a] text-white flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 relative">
            <div className="absolute inset-0 border-2 border-cyan-400/20 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400 animate-pulse">Sincronizando Facturas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0e1a] text-white min-h-screen selection:bg-cyan-400/30">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-400/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/5 rounded-full blur-[120px]"></div>
      </div>

      <header className="fixed top-0 w-full z-50 bg-[#0c1324]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 h-20">
        <div className="flex items-center gap-4">
          <Link href={orderIdFilter ? `/mis-pedidos/${orderIdFilter}` : "/mis-pedidos"}>
            <button className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <Link href="/" className="h-9 w-auto relative cursor-pointer hover:scale-105 transition-all bg-white/5 rounded-xl border border-white/10 overflow-hidden p-1.5 shadow-lg group">
                <Image 
                  src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png"
                  alt="Sneyder Studio"
                  width={140}
                  height={28}
                  className="h-full w-auto object-contain group-hover:brightness-110"
                />
              </Link>
              <div>
                <h1 className="text-xl font-bold font-headline uppercase tracking-tight text-white leading-none">Facturación</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                  {orderIdFilter ? "Historial del Proyecto" : "Centro de Comprobantes"}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="hidden md:block">
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Sneyder Studio Control</span>
        </div>
      </header>

      <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto relative z-10">
        {/* Empty State */}
        {Object.keys(groupedInvoices).length === 0 && (
          <div className="text-center py-20 flex flex-col items-center gap-6">
            <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center border border-white/5">
              <span className="material-symbols-outlined text-5xl text-slate-700">receipt_long</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-headline italic uppercase tracking-tighter">Sin facturas emitidas</h2>
              <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">No se han generado comprobantes para este periodo o proyecto todavía.</p>
            </div>
          </div>
        )}

        {/* Grouped Invoices */}
        <div className="space-y-12">
          {Object.entries(groupedInvoices).map(([monthYear, monthInvoices]) => (
            <div key={monthYear} className="space-y-6">
              <div className="flex items-center gap-4">
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-cyan-400 min-w-fit">{monthYear}</h3>
                <div className="h-px w-full bg-gradient-to-r from-cyan-400/20 to-transparent"></div>
              </div>

              <div className="grid gap-4">
                {monthInvoices.map((inv) => (
                  <div 
                    key={inv.id} 
                    className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/[0.08] hover:border-white/10 transition-all group flex flex-col sm:flex-row items-center justify-between gap-6"
                  >
                    <div className="flex items-center gap-5 w-full sm:w-auto">
                      <div className="w-14 h-14 bg-slate-900 rounded-2xl border border-white/5 flex items-center justify-center group-hover:border-cyan-400/30 transition-all shrink-0">
                        <span className="material-symbols-outlined text-3xl text-cyan-400">description</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base font-bold text-white truncate">{inv.projectName}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{inv.id}</p>
                          <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">Cuota {inv.month} de 6</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                      <div className="text-right mr-5">
                        <p className="text-xl font-bold text-white font-mono">${inv.amount.toFixed(2)}</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-green-400 mt-1">✓ {inv.status}</p>
                      </div>
                      <Link href={`/facturas/${inv.id}?orderId=${inv.orderId}&month=${inv.month}`}>
                        <button className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-cyan-400 text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 hover:text-black hover:border-cyan-400 transition-all">
                          Ver
                        </button>
                      </Link>
                      <button className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-slate-400 flex items-center justify-center hover:bg-slate-800 transition-all">
                        <span className="material-symbols-outlined text-xl">download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Info Card */}
        <div className="mt-16 p-8 bg-white/5 border border-white/5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
             <span className="material-symbols-outlined text-slate-500 mt-0.5">info</span>
             <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
               Las facturas se generan automáticamente tras la confirmación de cada pago mensual. Si necesita una factura fiscal personalizada con datos específicos de empresa, por favor contáctenos.
             </p>
          </div>
          <Link href="/contacto">
            <button className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 hover:underline">Solicitar Factura Fiscal</button>
          </Link>
        </div>
      </main>

      <footer className="py-12 border-t border-white/5 text-center bg-black/40 backdrop-blur-xl">
        <p className="text-[10px] text-slate-600 uppercase tracking-[0.4em] font-bold">
          Sneyder Studio • Billing System v2.0
        </p>
      </footer>
    </div>
  );
}

export default function FacturasPage() {
  return (
    <Suspense fallback={
      <div className="bg-[#0a0e1a] text-white flex items-center justify-center min-h-screen">
        <span className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></span>
      </div>
    }>
      <FacturasContent />
    </Suspense>
  );
}
