"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getCountFromServer, query, orderBy, limit, getDocs, addDoc } from "firebase/firestore";
import AdminSidebar from "@/components/AdminSidebar";

const ADMIN_EMAIL = "sneyder23081994@gmail.com";

export default function AdminPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [userCount, setUserCount] = useState<number | string>("...");
  const [weeklyVisits, setWeeklyVisits] = useState<number | string>("...");
  const [totalRevenue, setTotalRevenue] = useState<number | string>("...");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
        router.replace('/');
        return;
      }

      setUser(currentUser);
      try {
        const profileDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
        if (profileDoc.exists()) {
          setUserProfile(profileDoc.data());
        }
      } catch (err) {
        console.error("Error fetching admin profile:", err);
      }
      setIsChecking(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Fetch users count
        const coll = collection(db, "profiles");
        const snapshot = await getCountFromServer(coll);
        setUserCount(snapshot.data().count.toLocaleString());

        // Fetch weekly visits
        const qVisits = query(
          collection(db, "stats", "visits", "daily"),
          orderBy("date", "desc"),
          limit(7)
        );
        const snapVisits = await getDocs(qVisits);
        const total = snapVisits.docs.reduce((acc: number, doc: any) => acc + (doc.data().count || 0), 0);
        setWeeklyVisits(total.toLocaleString());

        // Fetch revenue
        const snapOrders = await getDocs(collection(db, "orders"));
        const revenue = snapOrders.docs.reduce((acc: number, doc: any) => acc + (doc.data().total || 0), 0);
        setTotalRevenue(revenue.toLocaleString());
      } catch (err) {
        console.error("Error fetching counts:", err);
      }
    };
    if (user) fetchCounts();
  }, [user]);

  const createSampleOrder = async () => {
    if (!user) return;
    try {
      const order = {
        user_id: user.uid,
        status: "processing",
        created_at: new Date().toISOString(),
        total: 1250,
        items: [{ name: "Desarrollo Web Pro", price: 1250 }],
        current_step: 1
      };
      const docRef = await addDoc(collection(db, 'orders'), order);
      alert(`Pedido de muestra creado con éxito.\nID: ${docRef.id}\nPodrás verlo en 'Mis Pedidos'.`);
    } catch (err) {
      console.error("Error creating sample order:", err);
      alert("Error al crear el pedido de muestra.");
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

  return (
    <div className="bg-background text-on-background selection:bg-tertiary selection:text-on-tertiary flex flex-col min-h-screen">
      {/* TopAppBar */}
      <header className={`fixed top-0 w-full z-50 bg-[#0c1324]/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-6 h-16 shadow-[0_20px_50px_rgba(12,19,36,0.4)] transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-72" : "pl-0"}`}>
        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-[#2fd9f4] hover:bg-slate-800/50 transition-all duration-300 p-2 rounded shrink-0"
          >
            <span className="material-symbols-outlined">more_vert</span>
          </button>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <Link href="/" className="-ml-4 h-10 w-auto relative cursor-pointer hover:scale-105 transition-all bg-white/5 rounded-xl border border-white/10 overflow-hidden p-1.5 shadow-lg group">
              <Image
                src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png"
                alt="Sneyder Studio"
                width={150}
                height={32}
                className="h-full w-auto object-contain group-hover:brightness-110"
              />
            </Link>
            <div className="h-6 w-px bg-white/10 mx-2 hidden sm:block"></div>
            <h1 className="font-['Space_Grotesk'] tracking-tight text-lg md:text-xl font-bold text-[#89ceff] whitespace-nowrap">
              Administración
            </h1>
          </div>
        </div>
        <div className="flex items-center shrink-0">
          <Link href="/admin/profile" className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-outline-variant/30 overflow-hidden relative block hover:scale-110 transition-transform active:scale-95 shadow-lg shadow-tertiary/10 bg-slate-800">
            {user ? (
              <Image
                alt="Admin User Profile"
                src={user.user_metadata?.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuA8h2AuDvpetITxyY5bLzL1an2xlyAbFuWWMOxsbnJImJ4nbS_8r1ELxCar1CmNTTRkWo57V8Zt_n9S2SYqspD7Hgx8eBwXdC5dIUbHBbc4IqdwQ9uZ-wNBr2-XE_PpTApsC4Zx46XGX3dsRKHTyhhPpPDfyuqpgRT0Fq1KJAiAY11dJinntBb_cXEPYBSkcjGmkczCikKk6MPmiumE32aJ4Jgt5aHD4aj89RRl1QTlQNonz-zuwHzgSX6CEPqHTqPTC8qAReItRRQ"}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-500 text-base">person</span>
              </div>
            )}
          </Link>
        </div>

      </header>

      {/* Main Canvas */}
      <main className={`pt-20 pb-28 px-4 md:px-6 max-w-7xl mx-auto space-y-6 md:space-y-8 w-full flex-grow transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-72" : ""}`}>
        {/* KPI Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link href="/admin/users" className="block h-32">
            <StatCard icon="group" label="Usuarios Totales" value={userCount.toString()} trend="+12%" />
          </Link>
          <Link href="/admin/settings" className="block h-32">
            <StatCard icon="settings_suggest" label="Ajuste Admin" value="General" trend="Config" isStable />
          </Link>
          <Link href="/admin/visitas" className="block h-32">
            <StatCard icon="visibility" label="Visitas Semanales" value={weeklyVisits.toLocaleString() || "..."} trend="+24%" />
          </Link>
          <Link href="/admin/pedidos" className="block h-32">
            <StatCard icon="shopping_bag" label="Pedidos" value="892" trend="+8%" />
          </Link>
          <div className="block h-32">
            <StatCard icon="payments" label="Ingresos" value={`$${totalRevenue}`} trend="+15%" />
          </div>
        </section>

        {/* Dynamic Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Recent Activity Card */}
          <section className="lg:col-span-2 bg-surface-container-low rounded-lg p-5 md:p-6 flex flex-col min-w-0">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <h2 className="font-headline text-base md:text-lg font-bold tracking-tight flex items-center gap-2 md:gap-3">
                <span className="w-2 h-2 bg-tertiary rounded-full animate-pulse"></span>
                20 Actividades Recientes
              </h2>
              <button className="text-tertiary text-[10px] md:text-xs uppercase tracking-widest font-bold hover:underline whitespace-nowrap">
                Ver Todo
              </button>
            </div>
            <div className="space-y-6 overflow-y-auto max-h-[350px] md:max-h-[400px] pr-2 custom-scrollbar">
              <ActivityItem icon="person_add" color="primary" text="Nuevo usuario registrado:" highlight="Gabriel" time="Hace 5 minutos • Registro Orgánico" />
              <ActivityItem icon="verified" color="tertiary" text="Contrato activado:" highlight="IA Nexo" time="Hace 18 minutos • ID: #SN-9920" />
              <ActivityItem icon="report" color="error" text="Fallo de autenticación:" highlight="IP 192.168.1.1" time="Hace 32 minutos • Firewall Sentinel" />
              <ActivityItem icon="shopping_cart" color="primary" text="Nuevo Pedido:" highlight="Soporte Cloud G5" time="Hace 1 hora • Cliente: Tech Solutions" />
              <ActivityItem icon="psychology" color="tertiary" text="Modelo Actualizado:" highlight="Quantum NLP v2" time="Hace 3 horas • Despliegue automático" />
            </div>
          </section>

          {/* Quick Actions */}
          <section className="bg-surface-container-low rounded-lg p-5 md:p-6 border-l-0 lg:border-l-2 border-tertiary/10">
            <h2 className="font-headline text-base md:text-lg font-bold tracking-tight mb-6 md:mb-8">Acciones Rápidas</h2>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <QuickActionButton icon="person_add" label="Crear Usuario" />
              <QuickActionButton
                icon="add_shopping_cart"
                label="Nuevo Pedido"
                onClick={createSampleOrder}
              />
              <Link href="/admin/settings" className="contents">
                <QuickActionButton icon="settings" label="Ajustes Admin" />
              </Link>
              <QuickActionButton
                icon="mop"
                label="Mantenimiento"
                onClick={async () => {
                  if (confirm("¿Ejecutar mantenimiento? Se limpiará el caché local y se optimizará el espacio.")) {
                    try {
                      // Limpiar caché de Firestore si es posible
                      const { terminate, clearIndexedDbPersistence } = await import("firebase/firestore");
                      await terminate(db).catch(() => { });
                      await clearIndexedDbPersistence(db).catch(() => { });

                      // Limpiar localStorage y sessionStorage
                      localStorage.clear();
                      sessionStorage.clear();

                      alert("Mantenimiento completado: Caché limpiado y archivos temporales optimizados.");
                      window.location.reload();
                    } catch (err) {
                      console.error("Error en mantenimiento:", err);
                      alert("Error al ejecutar mantenimiento.");
                    }
                  }
                }}
              />
              <Link href="/admin/test-payment" className="contents">
                <QuickActionButton icon="payments" label="Prueba de Pago" />
              </Link>
              <QuickActionButton icon="support_agent" label="Soporte Técnico" />
            </div>
            <div className="mt-8 md:mt-10 p-4 bg-surface-container-lowest rounded border border-outline-variant/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-tertiary text-sm">info</span>
                <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">Estado del Sistema</span>
              </div>
              <p className="text-[11px] md:text-xs text-on-surface-variant leading-relaxed">
                Todos los módulos operando al 100%. Latencia de IA estable en 42ms.
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* NavigationDrawer */}
      <AdminSidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

    </div>
  );
}
function StatCard({ icon, label, value, trend, isStable = false }: { icon: string; label: string; value: string; trend: string; isStable?: boolean }) {
  return (
    <div className="bg-surface-container-low p-5 rounded-lg border-t border-primary/20 shadow-sm flex flex-col justify-between h-32 transition-transform hover:scale-[1.02]">
      <div className="flex justify-between items-start">
        <span className="material-symbols-outlined text-tertiary">{icon}</span>
        <span className={`${isStable ? "text-slate-500" : "text-tertiary"} text-[10px] font-bold uppercase tracking-widest`}>{trend}</span>
      </div>
      <div>
        <p className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-headline font-bold text-on-surface">{value}</p>
      </div>
    </div>
  );
}

function ActivityItem({ icon, color, text, highlight, time }: { icon: string; color: string; text: string; highlight: string; time: string }) {
  const colorClass = color === "primary" ? "text-primary" : color === "tertiary" ? "text-tertiary" : "text-error";
  return (
    <div className="flex items-start gap-3 md:gap-4">
      <div className="w-9 h-9 md:w-10 md:h-10 rounded bg-surface-container-high flex items-center justify-center shrink-0">
        <span className={`material-symbols-outlined ${colorClass} text-xl`}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-on-surface text-sm font-medium truncate">
          {text} <span className={colorClass}>{highlight}</span>
        </p>
        <p className="text-on-surface-variant text-xs mt-1">{time}</p>
      </div>
    </div>
  );
}

function QuickActionButton({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-3 md:p-4 bg-surface-container rounded gap-2 md:gap-3 hover:bg-tertiary group transition-all duration-300 w-full"
    >
      <span className="material-symbols-outlined text-tertiary group-hover:text-on-tertiary">{icon}</span>
      <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold group-hover:text-on-tertiary text-center">{label}</span>
    </button>
  );
}

function SidebarItem({ icon, label, href, active = false }: { icon: string; label: string; href: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 p-2 rounded cursor-pointer transition-all font-headline text-xs lg:text-sm uppercase tracking-widest ${active
          ? "text-[#2fd9f4] border-l-2 border-[#2fd9f4] bg-tertiary/5 pl-4"
          : "text-slate-500 hover:text-[#89ceff] hover:bg-[#0c1324]/50"
        }`}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
