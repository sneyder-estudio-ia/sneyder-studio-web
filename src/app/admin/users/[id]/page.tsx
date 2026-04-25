"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import AdminSidebar from "@/components/AdminSidebar";
import { deleteFileFromStorage } from "@/lib/cms";

const ADMIN_EMAIL = "sneyder23081994@gmail.com";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function UserDetailsPage({ params }: PageProps) {
  const { id } = use(params);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
        router.replace('/');
        return;
      }
      setIsAdmin(true);
      fetchUserProfile();
    });
    
    return () => unsubscribe();
  }, [router, id]);

  const fetchUserProfile = async () => {
    try {
      const docRef = doc(db, "profiles", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserProfile({ id: docSnap.id, ...docSnap.data() });
      } else {
        console.error("No such document!");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    setIsDeleting(true);
    try {
      if (userProfile.avatar_url) {
        await deleteFileFromStorage(userProfile.avatar_url);
      }
      await deleteDoc(doc(db, "profiles", id));
      router.push("/admin/users");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error al eliminar el usuario.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isAdmin) {
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
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-[#2fd9f4] hover:bg-slate-800/50 transition-all duration-300 p-2 rounded shrink-0"
          >
            <span className="material-symbols-outlined">more_vert</span>
          </button>
          <h1 className="font-['Space_Grotesk'] tracking-tight text-lg md:text-xl font-bold text-[#89ceff] truncate">
            Detalles de Usuario - Sneyder Studio
          </h1>
        </div>
      </header>

      {/* Main Canvas */}
      <main className={`pt-24 pb-28 px-4 md:px-6 max-w-5xl mx-auto w-full flex-grow transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-72" : ""}`}>
        
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <Link 
            href="/admin/users" 
            className="flex items-center gap-2 text-slate-400 hover:text-tertiary transition-colors group"
          >
            <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
            <span className="text-sm font-bold uppercase tracking-widest">Volver al listado</span>
          </Link>

          <div className="flex gap-3">
             <Link 
              href={`/admin/users/${id}/edit`}
              className="px-4 py-2 bg-slate-800/50 hover:bg-tertiary hover:text-on-tertiary text-slate-300 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-white/5 transition-all flex items-center gap-2"
            >
                <span className="material-symbols-outlined text-sm">edit</span>
                Editar Perfil
             </Link>
             <button 
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-error/10 hover:bg-error text-error hover:text-white text-[10px] font-bold uppercase tracking-widest rounded-lg border border-error/20 transition-all flex items-center gap-2"
            >
                <span className="material-symbols-outlined text-sm">delete</span>
                Eliminar
             </button>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-surface-container-low rounded-2xl border border-white/5 p-20 flex flex-col items-center justify-center gap-4">
             <span className="w-10 h-10 border-2 border-tertiary/30 border-t-tertiary rounded-full animate-spin"></span>
             <p className="text-xs text-slate-500 uppercase tracking-widest">Cargando información del usuario...</p>
          </div>
        ) : userProfile ? (
          <div className="space-y-6">
            
            {/* User Header Profile Card */}
            <section className="bg-surface-container-low rounded-2xl border border-white/5 overflow-hidden shadow-2xl animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="h-32 bg-gradient-to-r from-[#0c1324] via-[#1a2336] to-[#0c1324] relative overflow-hidden">
                 {/* Decorative elements */}
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <span className="material-symbols-outlined text-9xl">group</span>
                 </div>
              </div>
              <div className="px-8 pb-8 relative">
                <div className="flex flex-col md:flex-row items-end gap-6 -mt-12 mb-6">
                  <div className="w-24 h-24 rounded-2xl bg-slate-900 border-4 border-[#151b2d] flex items-center justify-center overflow-hidden shadow-2xl relative group">
                    {userProfile.avatar_url ? (
                      <Image src={userProfile.avatar_url} alt={userProfile.manager_name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-[#151b2d]">
                        {userProfile.email === ADMIN_EMAIL ? (
                          <span className="material-symbols-outlined text-tertiary text-5xl">shield</span>
                        ) : (
                          <span className="text-tertiary text-4xl font-bold font-headline">{userProfile.manager_name?.charAt(0) || userProfile.email?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 pb-2 text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-2 md:gap-3">
                      <h2 className="text-3xl font-bold text-white font-headline tracking-tighter">{userProfile.manager_name || "Sin nombre"}</h2>
                      {userProfile.email === ADMIN_EMAIL && (
                        <span className="bg-tertiary/10 text-tertiary text-[10px] px-2 py-0.5 rounded border border-tertiary/20 uppercase font-bold tracking-widest mb-1">Administrador</span>
                      )}
                    </div>
                    <p className="text-tertiary font-medium">{userProfile.email}</p>
                  </div>
                  <div className="flex gap-2 pb-2">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-500/20">Estado: Activo</span>
                    <span className="px-3 py-1 bg-tertiary/10 text-tertiary text-[10px] font-bold uppercase tracking-widest rounded-full border border-tertiary/20">Cliente Premium</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/5">
                   <InfoTile label="Empresa" value={userProfile.company_name || "No especificada"} icon="business" />
                   <InfoTile label="WhatsApp" value={userProfile.whatsapp || "No registrado"} icon="call" isLink={!!userProfile.whatsapp} href={userProfile.whatsapp ? `https://wa.me/${userProfile.whatsapp.replace(/\D/g,'')}` : undefined} />
                   <InfoTile label="Miembro desde" value={userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : "Desconocido"} icon="calendar_today" />
                   <InfoTile label="Última Actividad" value="Reciente" icon="history" />
                </div>
              </div>
            </section>

            {/* Detailed Info Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
              
              {/* Profile Details */}
              <section className="lg:col-span-2 space-y-6">
                <div className="bg-surface-container-low rounded-2xl border border-white/5 p-8 space-y-8">
                  <div>
                    <h3 className="text-lg font-bold text-white font-headline mb-6 flex items-center gap-3">
                      <span className="w-1.5 h-6 bg-tertiary rounded-full"></span>
                      Información Detallada
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                      <DetailItem label="Nombre Completo" value={userProfile.manager_name || "—"} />
                      <DetailItem label="Correo Electrónico" value={userProfile.email || "—"} />
                      <DetailItem label="Nombre de Empresa" value={userProfile.company_name || "—"} />
                      <DetailItem label="Teléfono / WhatsApp" value={userProfile.whatsapp || "—"} />
                      <DetailItem label="ID de Usuario" value={userProfile.id || "—"} isCode />
                      <DetailItem label="Rol del Sistema" value="Usuario del Cliente" />
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/5">
                    <h3 className="text-lg font-bold text-white font-headline mb-6 flex items-center gap-3">
                      <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                      Configuración de Cuenta
                    </h3>
                    <div className="space-y-4">
                      <ToggleItem label="Notificaciones por Email" checked={true} />
                      <ToggleItem label="Acceso Programador" checked={false} />
                      <ToggleItem label="Recibir Actualizaciones de IA" checked={true} />
                    </div>
                  </div>
                </div>

                {/* PRUEBA DE PAGO SECTION (Only for specific user) */}
                {userProfile.email === "meneses23081994@gmail.com" && (
                  <div className="bg-gradient-to-br from-[#0c1324] to-[#151b2d] rounded-2xl border border-tertiary/30 p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                      <span className="material-symbols-outlined text-8xl">payments</span>
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center border border-tertiary/20">
                          <span className="material-symbols-outlined text-tertiary">science</span>
                        </div>
                        <h3 className="text-xl font-bold text-white font-headline uppercase tracking-tight">Prueba de Pago</h3>
                      </div>
                      
                      <p className="text-sm text-slate-400 mb-8 leading-relaxed max-w-lg">
                        Activa una transacción de prueba de <span className="text-white font-bold">$1.00 USD</span> para este usuario. Esto permitirá verificar la integración real de PayPal en su cuenta.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <button 
                          onClick={async () => {
                            try {
                              const docRef = doc(db, "profiles", id);
                              await updateDoc(docRef, {
                                test_payment_active: true,
                                test_payment_amount: "1.00"
                              });
                              alert("¡Prueba de pago enviada con éxito!");
                              fetchUserProfile();
                            } catch (error) {
                              console.error("Error activating test payment:", error);
                              alert("Error al activar la prueba de pago.");
                            }
                          }}
                          className={`flex-1 w-full sm:w-auto py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-lg ${
                            userProfile.test_payment_active 
                            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 cursor-default" 
                            : "bg-tertiary text-on-tertiary hover:scale-[1.02] active:scale-95 shadow-tertiary/20"
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">
                            {userProfile.test_payment_active ? "check_circle" : "send"}
                          </span>
                          {userProfile.test_payment_active ? "Prueba Enviada" : "Enviar Prueba de Pago"}
                        </button>
                        
                        {userProfile.test_payment_active && (
                          <button 
                            onClick={async () => {
                              try {
                                const docRef = doc(db, "profiles", id);
                                await updateDoc(docRef, {
                                  test_payment_active: false
                                });
                                fetchUserProfile();
                              } catch (error) {
                                console.error("Error cancelling test payment:", error);
                              }
                            }}
                            className="w-full sm:w-auto px-6 py-4 bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all border border-white/5"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Sidebar / Stats */}
              <aside className="space-y-6">
                <div className="bg-surface-container-low rounded-2xl border border-white/5 p-6 shadow-xl">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Resumen de Uso</h3>
                  <div className="space-y-4">
                    <StatBox label="Contratos" value="03" color="text-tertiary" />
                    <StatBox label="Tickets" value="12" color="text-primary" />
                    <StatBox label="Modelos IA" value="01" color="text-emerald-400" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-tertiary/10 to-transparent rounded-2xl border border-tertiary/20 p-6">
                   <div className="flex items-center gap-3 mb-4">
                      <span className="material-symbols-outlined text-tertiary">support_agent</span>
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest">Atención Prioritaria</h3>
                   </div>
                   <p className="text-xs text-slate-400 leading-relaxed mb-4">Este usuario tiene activado el soporte prioritario 24/7 de Sneyder Studio.</p>
                   <button className="w-full py-2 bg-tertiary text-on-tertiary text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-tertiary/20">
                      Entrar en contacto
                   </button>
                </div>
              </aside>
            </div>

          </div>
        ) : (
          <div className="bg-surface-container-low rounded-2xl border border-white/5 p-20 flex flex-col items-center justify-center text-center">
             <span className="material-symbols-outlined text-6xl text-slate-700 mb-4">person_off</span>
             <h3 className="text-xl font-bold text-white">Usuario no encontrado</h3>
             <p className="text-slate-500 text-sm mt-2">El usuario con ID "{id}" no existe o ha sido eliminado.</p>
             <Link href="/admin/users" className="mt-8 px-6 py-2 bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-widest rounded border border-white/5">Volver al listado</Link>
          </div>
        )}
      </main>

      <AdminSidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          />
          <div className="bg-[#151b2d] border border-white/10 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative z-10 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6 border border-error/20">
              <span className="material-symbols-outlined text-error text-3xl">warning</span>
            </div>
            
            <h3 className="text-xl font-bold text-white text-center font-headline mb-2">Eliminar Usuario</h3>
            <p className="text-slate-400 text-center text-sm mb-8 leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente a <span className="text-white font-bold">{userProfile?.manager_name || userProfile?.email}</span>? Esta acción no se puede deshacer y se borrarán todos sus datos relacionados.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="flex-1 py-3 bg-error hover:bg-red-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-error/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  "Eliminar Ahora"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoTile({ label, value, icon, isLink = false, href }: { label: string; value: string; icon: string; isLink?: boolean; href?: string }) {
  const content = (
    <div className={`bg-slate-800/30 p-4 rounded-xl border border-white/5 flex flex-col gap-2 transition-all ${isLink ? 'hover:bg-tertiary/5 hover:border-tertiary/20 hover:-translate-y-1' : ''}`}>
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-slate-500 text-sm">{icon}</span>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-sm font-bold truncate ${isLink ? 'text-tertiary' : 'text-white'}`}>{value}</p>
    </div>
  );

  if (isLink && href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return content;
}

function DetailItem({ label, value, isCode = false }: { label: string; value: string; isCode?: boolean }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
      <p className={`text-sm font-medium ${isCode ? 'font-mono text-xs bg-slate-900/50 px-2 py-1 rounded inline-block text-slate-400' : 'text-slate-200'}`}>
        {value}
      </p>
    </div>
  );
}

function ToggleItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg border border-white/5">
      <span className="text-xs text-slate-300">{label}</span>
      <div className={`w-8 h-4 rounded-full relative transition-colors ${checked ? 'bg-tertiary' : 'bg-slate-700'}`}>
        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${checked ? 'left-4.5' : 'left-0.5'}`}></div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-lg font-bold font-headline ${color}`}>{value}</span>
    </div>
  );
}
