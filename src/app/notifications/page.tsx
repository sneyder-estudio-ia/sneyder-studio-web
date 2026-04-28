"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { initializePushNotifications } from "@/lib/fcm";

const ADMIN_EMAIL = "sneyder23081994@gmail.com";

export default function NotificationsPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "loading">("loading");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar estado del permiso de notificaciones
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profileDoc = await getDoc(doc(db, "profiles", currentUser.uid));
          if (profileDoc.exists()) {
            setUserProfile(profileDoc.data());
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
        }

        // Inicializar push notifications si el permiso ya fue concedido
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          const token = await initializePushNotifications(currentUser.uid);
          if (token) setFcmToken(token);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sincronizar notificaciones de Firestore en tiempo real
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: formatTime(doc.data().createdAt)
      }));
      setNotifications(notifs);
      setIsLoading(false);
    }, (error) => {
      console.error("Error listening to notifications:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Función para formatear el tiempo transcurrido (Timeago simplificado)
  const formatTime = (timestamp: any) => {
    if (!timestamp) return "Ahora";
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Ahora";
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`;
    return date.toLocaleDateString();
  };

  // Activar notificaciones push (botón manual)
  const handleEnableNotifications = useCallback(async () => {
    if (!user) return;
    const token = await initializePushNotifications(user.uid);
    if (token) {
      setFcmToken(token);
      setNotifPermission("granted");
    } else {
      // Si el usuario denegó, actualizar estado
      if (typeof window !== "undefined" && "Notification" in window) {
        setNotifPermission(Notification.permission);
      }
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
    setIsMenuOpen(false);
  };

  return (
    <div className="text-on-background selection:bg-tertiary/30 selection:text-tertiary min-h-screen bg-background relative overflow-x-hidden">
      {/* Header */}
      <header className={`fixed top-0 w-full z-60 bg-[#0c1324] border-b border-slate-800 flex justify-between items-center px-4 h-16 shadow-[0px_2px_10px_rgba(0,0,0,0.5)] transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-80" : "pl-0"}`}>
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="text-cyan-400 hover:bg-slate-800 p-2 rounded-full transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="text-white font-headline font-bold text-sm uppercase tracking-[0.2em]">Notificaciones</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-cyan-400 hover:bg-slate-800 p-2 rounded-full transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-[70] h-[100dvh] w-80 bg-[#0c1324] border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out font-headline text-slate-200 overflow-hidden ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-8 flex flex-col gap-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-slate-800">
              {user ? (
                <Image alt="User Profile Avatar" src={user.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuBH_btGfHFWWHfApXWyzqu90p_2NBQZttyesQz6QlhsHASGNW17CG8J-xx8fF8jKJaPPfgtyTfolOPvAFnGM4gcX9ci9UmYI9bOziFWipLW0G_G3gtXXyBt4wq-ItmBSk5uKJraqJBEUPuv_ArRh18s3sVoJsjbr7ok9twnXcNobC6z0JiJlozlUbb6eL6KTjktk58yD7_vE1e63rOTk-xD7njqMy5SJaVxWwWikP2LOrMVuGfMcVTru4Wiih7wq_IOZ1WRsOIvKt0"} width={48} height={48} />
              ) : (
                <span className="material-symbols-outlined text-slate-500 text-3xl">person</span>
              )}
            </div>
            <div>
              <p className="font-bold text-white truncate max-w-[150px]">{userProfile?.manager_name?.split(' ')[0] || user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || "Visitante"}</p>
              <p className="text-xs text-cyan-400 uppercase tracking-widest">{user ? "Premium Account" : "Modo Invitado"}</p>
            </div>
          </div>
          <Link href="/" className="relative w-full h-16 mb-8 cursor-pointer hover:scale-[1.02] transition-all bg-white/5 rounded-2xl border border-white/10 overflow-hidden p-3 shadow-xl group">
            <Image src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png" alt="Sneyder Studio" fill className="object-contain object-left group-hover:brightness-110" />
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 space-y-1">
          <NavItem icon="home" label="Inicio" href="/" />
          <NavItem icon="account_circle" label="Perfil de usuario" href="/profile" />
          {user?.email === ADMIN_EMAIL && <NavItem icon="settings" label="Administración" href="/admin" />}
          <NavItem icon="shopping_bag" label="Mis pedidos" href="/mis-pedidos" />
          <NavItem icon="bolt" label="Servicios" href="/servicios" />
          <NavItem icon="psychology" label="Modelo de IA" href="/ia-models" />
          <NavItem icon="mail" label="Crea pedido" href="/contacto" />
          <div className="pt-6 pb-2 px-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Legal</div>
          <NavItem icon="policy" label="Política y condiciones" href="/contrato" small />
          <NavItem icon="gavel" label="Términos de servicio" href="/contrato" small />
          <NavItem icon="description" label="Contrato de servicios" href="/contrato" small />
          {user && (
            <button onClick={handleSignOut} className="flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors w-full text-left">
              <span className="material-symbols-outlined">logout</span>
              <span>Cerrar Sesión</span>
            </button>
          )}
        </nav>
      </aside>

      {/* Overlay */}
      {isMenuOpen && <div className="fixed inset-0 bg-black/40 z-[65] backdrop-blur-sm transition-opacity duration-300" onClick={() => setIsMenuOpen(false)} />}

      {/* Main Content */}
      <main className={`transition-all duration-300 min-h-screen pb-20 pt-24 ${isMenuOpen ? "pl-0 lg:pl-80" : "pl-0"}`}>
        <div className="max-w-4xl mx-auto px-6">
          <header className="mb-12 animate-fade-in text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(47,217,244,0.8)]"></span>
              <span className="font-label text-xs font-bold tracking-[0.3em] uppercase text-cyan-400">Actualizaciones</span>
            </div>
            <h1 className="font-headline text-4xl md:text-6xl font-black text-white mb-6">Tu Centro de <span className="text-tertiary">Notificaciones</span></h1>
            <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">Mantente al tanto de las últimas noticias, actualizaciones de proyectos y mensajes importantes del equipo de Sneyder Studio.</p>
          </header>

          {/* Banner para activar notificaciones push */}
          {user && notifPermission !== "granted" && notifPermission !== "loading" && (
            <div className="mb-8 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-6 rounded-3xl border border-cyan-500/20 animate-fade-in">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-cyan-400">notifications_active</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-1">Activa las notificaciones push</h3>
                  <p className="text-slate-400 text-sm">Recibe alertas instantáneas sobre tus pedidos, actualizaciones y mensajes importantes.</p>
                </div>
                <button
                  onClick={handleEnableNotifications}
                  className="shrink-0 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm rounded-xl transition-all hover:scale-105 active:scale-95"
                >
                  Activar
                </button>
              </div>
              {notifPermission === "denied" && (
                <p className="mt-3 text-red-400 text-xs">⚠️ Las notificaciones fueron bloqueadas. Habilítalas desde la configuración de tu navegador.</p>
              )}
            </div>
          )}

          {/* Estado del token FCM (solo visible para admin) */}
          {user?.email === ADMIN_EMAIL && fcmToken && (
            <div className="mb-6 bg-green-500/5 p-4 rounded-2xl border border-green-500/20 animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                <p className="text-green-400 text-xs font-mono truncate">FCM Token activo: {fcmToken.substring(0, 30)}...</p>
              </div>
            </div>
          )}

          <div className="space-y-4 animate-fade-in delay-100">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div key={notif.id} className={`bg-surface-container-low p-6 rounded-3xl border border-white/5 relative group overflow-hidden hover:bg-white/5 transition-all shadow-xl backdrop-blur-sm ${notif.unread ? 'ring-1 ring-cyan-400/20' : ''}`}>
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-tertiary/5 rounded-full blur-[40px] group-hover:bg-tertiary/10 transition-all"></div>
                  
                  <div className="flex items-start gap-4 relative z-10">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                      notif.type === 'info' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                      notif.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                      notif.type === 'update' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                      'bg-slate-500/10 border-slate-500/20 text-slate-400'
                    }`}>
                      <span className="material-symbols-outlined">{
                        notif.type === 'info' ? 'info' :
                        notif.type === 'success' ? 'check_circle' :
                        notif.type === 'update' ? 'upgrade' :
                        'notifications'
                      }</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-white font-bold text-lg truncate">{notif.title}</h3>
                        {notif.unread && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(47,217,244,0.8)]"></span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed mb-3">{notif.message}</p>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{notif.time}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-surface-container-low p-12 rounded-[2.5rem] border border-white/5 text-center flex flex-col items-center gap-6">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-500 text-4xl">notifications_off</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl mb-2">No hay notificaciones</h3>
                  <p className="text-slate-400 text-sm">Te avisaremos cuando haya algo nuevo para ti.</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-12 text-center opacity-50">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Fin del historial</p>
          </div>
        </div>

        <footer className="mt-32 py-12 border-t border-white/5 bg-black/20 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[10px] text-slate-600 uppercase tracking-[0.3em] font-bold">© 2024 Sneyder Studio • Premium Digital Solutions</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

function NavItem({ icon, label, href, active, small, className = "" }: any) {
  return (
    <Link href={href} className={`flex items-center gap-4 px-4 py-3 transition-colors ${active ? "text-cyan-400 font-bold bg-slate-800/50" : "text-slate-400 hover:bg-slate-800 hover:text-white"} ${small ? "text-sm" : ""} ${className}`}>
      <span className="material-symbols-outlined">{icon}</span><span>{label}</span>
    </Link>
  );
}
