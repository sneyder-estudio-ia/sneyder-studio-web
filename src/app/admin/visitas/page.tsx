"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import AdminSidebar from "@/components/AdminSidebar";

const ADMIN_EMAIL = "sneyder23081994@gmail.com";

export default function VisitasPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [visits, setVisits] = useState<any[]>([]);
  const [range, setRange] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
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

  const cleanupOldData = async () => {
    try {
      const { writeBatch, query, where, getDocs, collection } = await import("firebase/firestore");
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const thresholdDate = oneYearAgo.toISOString().split('T')[0];

      const q = query(
        collection(db, "stats", "visits", "daily"),
        where("date", "<", thresholdDate)
      );
      
      const snap = await getDocs(q);
      if (snap.empty) return;

      const batch = writeBatch(db);
      snap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`Deleted ${snap.size} old visit records.`);
    } catch (err) {
      console.error("Error during cleanup:", err);
    }
  };

  useEffect(() => {
    const fetchVisits = async () => {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, "stats", "visits", "daily"),
          orderBy("date", "desc"),
          limit(range)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })).reverse();
        setVisits(data);
        
        // Trigger cleanup once when data is loaded
        if (range === 30) cleanupOldData();
      } catch (err) {
        console.error("Error fetching visits:", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (user) fetchVisits();
  }, [user, range]);

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

  // Calculate stats
  // Calculate stats for current range
  const totalVisitsInRange = visits.reduce((acc, v) => acc + (v.count || 0), 0);
  const avgVisitsInRange = Math.round(totalVisitsInRange / (visits.length || 1));
  const maxVisits = Math.max(...visits.map(v => v.count || 0), 10);
  
  // Overall stats (keeping original simplified logic for consistency)
  const todayCount = visits.length > 0 ? visits[visits.length - 1].count : 0;
  const weeklyTotal = visits.slice(-7).reduce((acc, v) => acc + (v.count || 0), 0);
  const totalVisits = totalVisitsInRange; // Simplified for the view

  const generateMockData = async () => {
    const months = prompt("¿Cuántos meses de datos quieres generar? (máx 12)", "1");
    if (!months) return;
    const daysToGen = Math.min(parseInt(months) * 30, 365);
    
    if (!confirm(`¿Generar datos de prueba para los últimos ${daysToGen} días?`)) return;
    setIsLoading(true);
    try {
      const { setDoc, doc, writeBatch } = await import("firebase/firestore");
      let batch = writeBatch(db);
      let count = 0;
      
      for (let i = daysToGen - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const countVal = Math.floor(Math.random() * 500) + 100;
        const ref = doc(db, "stats", "visits", "daily", dateStr);
        batch.set(ref, {
          count: countVal,
          date: dateStr,
          timestamp: d
        });
        
        count++;
        if (count >= 400) { // Firestore batch limit protection
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      await batch.commit();
      alert("Datos generados. Recargando...");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Error generating data");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background selection:bg-tertiary selection:text-on-tertiary flex flex-col min-h-screen">
      {/* TopAppBar */}
      <header className={`fixed top-0 w-full z-50 bg-[#0c1324]/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-6 h-16 shadow-[0_20px_50px_rgba(12,19,36,0.4)] transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-72" : ""}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-[#2fd9f4] hover:bg-slate-800/50 transition-all duration-300 p-2 rounded shrink-0"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <h1 className="font-['Space_Grotesk'] tracking-tight text-lg md:text-xl font-bold text-[#89ceff] whitespace-nowrap">
              Analítica
            </h1>
            <div className="h-6 w-px bg-white/10 mx-2 hidden sm:block"></div>
            <div className="h-6 w-auto relative">
              <Image 
                src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png"
                alt="Sneyder Studio"
                width={120}
                height={24}
                className="h-full w-auto object-contain"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={generateMockData}
            className="hidden md:flex items-center gap-2 text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded border border-white/10 transition-all"
          >
            <span className="material-symbols-outlined text-sm">precision_manufacturing</span>
            Generar Demo
          </button>
          <Link href="/admin" className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-tertiary hover:underline">
            Panel Central
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className={`pt-20 pb-28 px-4 md:px-6 max-w-7xl mx-auto space-y-8 w-full flex-grow transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-72" : ""}`}>
        
        {/* Header Section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/10 pb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-headline font-bold text-white tracking-tight">Estadísticas de Tráfico</h2>
            <p className="text-sm text-on-surface-variant mt-1">Monitorea el crecimiento y alcance de tu plataforma digital.</p>
          </div>
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
            {[
              { label: '30D', value: 30 },
              { label: '90D', value: 90 },
              { label: '6M', value: 180 },
              { label: '12M', value: 365 }
            ].map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                  range === r.value 
                    ? "bg-tertiary text-on-tertiary shadow-lg" 
                    : "text-on-surface-variant hover:bg-white/5"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </section>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatMiniCard icon="today" label="Hoy" value={todayCount.toLocaleString()} trend="+5%" color="tertiary" />
          <StatMiniCard icon="calendar_view_week" label="Esta Semana" value={weeklyTotal.toLocaleString()} trend="+12%" color="primary" />
          <StatMiniCard icon="query_stats" label="Promedio Diario" value={Math.round(totalVisits / (visits.length || 1)).toLocaleString()} trend="Estable" color="secondary" />
          <StatMiniCard icon="all_inbox" label="Total Acumulado" value={totalVisits.toLocaleString()} trend="+24%" color="on-surface" />
        </div>

        {/* Clean Premium Chart Section */}
        <section className="bg-surface-container-low rounded-[2rem] p-6 md:p-10 border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 relative z-10">
            <div>
              <h3 className="font-headline font-bold text-2xl text-white flex items-center gap-3">
                <span className="w-1.5 h-8 bg-tertiary rounded-full"></span>
                Estadísticas de Tráfico
              </h3>
              <p className="text-sm text-slate-400 mt-2 font-medium">
                Análisis de {range} días • <span className="text-tertiary">Total: {totalVisitsInRange.toLocaleString()}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-8 bg-white/5 px-6 py-4 rounded-2xl border border-white/5">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Promedio Diario</span>
                <span className="text-xl font-headline font-bold text-white">{avgVisitsInRange}</span>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Rango Activo</span>
                <span className="text-xl font-headline font-bold text-tertiary">{range}D</span>
              </div>
            </div>
          </div>

          {/* Corrected Chart Area */}
          <div className="relative h-80 w-full mt-4 mb-10 overflow-hidden group/chart-area">
            {/* Y-Axis Labels */}
            <div className="absolute left-0 inset-y-0 w-12 flex flex-col justify-between pointer-events-none py-2 z-20">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-[10px] text-slate-500 font-mono">
                  {Math.round(maxVisits * (1 - i/4))}
                </span>
              ))}
            </div>

            {/* Scrollable Graph Area */}
            <div className="ml-12 h-full overflow-x-auto no-scrollbar scroll-smooth">
              <div 
                className="h-full relative min-w-full"
                style={{ width: range > 30 ? `${(range / 30) * 100}%` : '100%' }}
              >
                {/* Horizontal Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-full border-t border-white/5 h-0"></div>
                  ))}
                </div>

                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="w-8 h-8 border-2 border-tertiary/20 border-t-tertiary rounded-full animate-spin"></span>
                  </div>
                ) : visits.length > 0 ? (
                  <div className="relative w-full h-full">
                    {/* SVG Curve - Fixed with proper viewBox */}
                    <svg 
                      className="absolute inset-0 w-full h-full" 
                      viewBox={`0 0 1000 100`} 
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(47,217,244,0.15)" />
                          <stop offset="100%" stopColor="rgba(47,217,244,0)" />
                        </linearGradient>
                      </defs>
                      
                      {(() => {
                        if (visits.length < 2) return null;
                        const coords = visits.map((v, i) => ({
                          x: (i / (visits.length - 1)) * 1000,
                          y: 100 - ((v.count / maxVisits) * 80 + 10)
                        }));
                        
                        let d = `M ${coords[0].x} ${coords[0].y}`;
                        for (let i = 0; i < coords.length - 1; i++) {
                          const curr = coords[i];
                          const next = coords[i+1];
                          const cx = (curr.x + next.x) / 2;
                          d += ` C ${cx} ${curr.y}, ${cx} ${next.y}, ${next.x} ${next.y}`;
                        }
                        
                        return (
                          <>
                            <path d={`${d} L 1000 100 L 0 100 Z`} fill="url(#areaGrad)" />
                            <path d={d} fill="none" stroke="#2fd9f4" strokeWidth="2" strokeLinecap="round" />
                          </>
                        );
                      })()}
                    </svg>

                    {/* Interaction Points & Bars */}
                    <div className="absolute inset-0 flex">
                      {visits.map((day, i) => (
                        <div key={i} className="flex-1 group/item relative h-full flex flex-col justify-end items-center">
                          {/* Invisible bar for hover */}
                          <div className="absolute inset-0 z-10 cursor-pointer"></div>
                          
                          {/* Dot on the curve */}
                          <div 
                            className="absolute w-2 h-2 rounded-full bg-white border-2 border-tertiary shadow-[0_0_10px_rgba(47,217,244,0.5)] z-20 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 pointer-events-none"
                            style={{ 
                              bottom: `${(day.count / maxVisits) * 80 + 10}%`,
                              transform: 'translateY(50%)'
                            }}
                          ></div>

                          {/* Tooltip - Improved placement to avoid being covered */}
                          <div className="opacity-0 group-hover/item:opacity-100 absolute bottom-full mb-6 left-1/2 -translate-x-1/2 bg-[#1a2333] border border-white/10 p-3 rounded-xl shadow-2xl z-40 pointer-events-none transition-all duration-300 min-w-[100px] text-center">
                            <p className="text-[10px] text-slate-500 font-bold mb-1">{day.date}</p>
                            <p className="text-xl font-headline font-bold text-white">{day.count}</p>
                            <p className="text-[8px] text-tertiary font-bold tracking-widest mt-1 uppercase">Visitas</p>
                            {/* Arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#1a2333]"></div>
                          </div>

                          {/* Bars (Subtle context) */}
                          <div 
                            className="w-[20%] max-w-[8px] bg-white/5 rounded-t-full transition-all group-hover/item:bg-tertiary/20"
                            style={{ height: `${(day.count / maxVisits) * 80 + 10}%` }}
                          ></div>

                          {/* X-Axis Label */}
                          {(range <= 30 || i % Math.max(1, Math.floor(range/10)) === 0 || i === visits.length - 1) && (
                            <span className="absolute -bottom-8 text-[10px] text-slate-500 font-medium whitespace-nowrap">
                              {day.date.split('-')[2]}/{day.date.split('-')[1]}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 italic">
                    Sin datos disponibles
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-12 flex justify-between items-center text-[10px] text-slate-600 font-bold uppercase tracking-widest border-t border-white/5 pt-6">
             <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-800"></span>
                Reporte de Actividad
             </span>
             <span>Refresco Automático Activado</span>
          </div>
        </section>

      </main>

      {/* Sidebar Component */}
      <AdminSidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      {/* Floating Action (Example) */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-tertiary text-on-tertiary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 z-40 group">
        <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">download</span>
      </button>
    </div>
  );
}

function StatMiniCard({ icon, label, value, trend, color }: { icon: string; label: string; value: string; trend: string; color: string }) {
  const colorClass = color === "tertiary" ? "text-tertiary" : color === "primary" ? "text-primary" : "text-on-surface";
  const bgClass = color === "tertiary" ? "bg-tertiary/10" : color === "primary" ? "bg-primary/10" : "bg-white/5";

  return (
    <div className="bg-surface-container-low p-5 rounded-2xl border-t border-outline-variant/10 shadow-sm flex flex-col justify-between h-36 transition-all hover:bg-surface-container-high border-l border-l-transparent hover:border-l-tertiary/50">
      <div className="flex justify-between items-start">
        <div className={`w-10 h-10 rounded-xl ${bgClass} flex items-center justify-center`}>
          <span className={`material-symbols-outlined ${colorClass}`}>{icon}</span>
        </div>
        <span className="text-tertiary text-[10px] font-bold uppercase tracking-widest bg-[#0c1324] px-2 py-0.5 rounded border border-tertiary/20">{trend}</span>
      </div>
      <div className="mt-4">
        <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-[0.1em]">{label}</p>
        <p className="text-2xl font-headline font-bold text-white mt-1">{value}</p>
      </div>
    </div>
  );
}


