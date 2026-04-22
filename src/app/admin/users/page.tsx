"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import AdminSidebar from "@/components/AdminSidebar";
import { deleteFileFromStorage } from "@/lib/cms";

const ADMIN_EMAIL = "sneyder23081994@gmail.com";

export default function UsersAdminPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
        router.replace('/');
        return;
      }
      setIsAdmin(true);
      fetchUsers();
    });
    
    return () => unsubscribe();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, "profiles"), orderBy("created_at", "desc"));
      
      // 1. Intentar desde Cache
      try {
        const { getDocsFromCache } = await import("firebase/firestore");
        const cacheSnapshot = await getDocsFromCache(q);
        if (!cacheSnapshot.empty) {
          console.log("Users: Cargando desde caché...");
          setUsers(cacheSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setIsLoading(false);
          // Opcional: Revalidar en segundo plano
        }
      } catch (e) {
        console.log("Users: Cache vacío o no disponible.");
      }

      // 2. Consultar Servidor
      const querySnapshot = await getDocs(q);
      const fetchedUsers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Ordenar para que el admin aparezca de primero
      const sortedUsers = [...fetchedUsers].sort((a: any, b: any) => {
        if (a.email === ADMIN_EMAIL) return -1;
        if (b.email === ADMIN_EMAIL) return 1;
        return 0;
      });

      setUsers(sortedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      // 1. Eliminar avatar de storage si existe
      if (userToDelete.avatar_url) {
        await deleteFileFromStorage(userToDelete.avatar_url);
      }
      
      // 2. Eliminar perfil de Firestore
      await deleteDoc(doc(db, "profiles", userToDelete.id));
      
      // 3. Actualizar lista local
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
      
      // Feedback visual (opcional: podrías añadir un toast aquí)
      console.log(`Usuario ${userToDelete.email} eliminado.`);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error al eliminar el usuario. Inténtalo de nuevo.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.manager_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-[#2fd9f4] hover:bg-slate-800/50 transition-all duration-300 p-2 rounded shrink-0"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <h1 className="font-['Space_Grotesk'] tracking-tight text-lg md:text-xl font-bold text-[#89ceff] whitespace-nowrap">
              Usuarios
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
      </header>

      {/* Main Canvas */}
      <main className={`pt-24 pb-28 px-4 md:px-6 max-w-7xl mx-auto space-y-6 md:space-y-8 w-full flex-grow transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-72" : ""}`}>
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold text-white font-headline tracking-tight">Gestionar Usuarios</h2>
            <p className="text-slate-400 text-sm">Visualiza y administra todos los usuarios registrados en la plataforma.</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl pointer-events-none">search</span>
            <input 
              type="text" 
              placeholder="Buscar por nombre, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-tertiary/30 focus:border-tertiary transition-all"
            />
          </div>
        </div>

        {/* Users Count Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="bg-surface-container-low p-6 rounded-lg border-t border-primary/20 shadow-sm col-span-1 md:col-span-1">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border border-tertiary/20 flex items-center justify-center bg-tertiary/5">
                <span className="material-symbols-outlined text-tertiary text-2xl">group</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Base de Datos</p>
                <p className="text-2xl font-bold text-white font-headline">{users.length} Usuarios</p>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-lg border-t border-tertiary/20 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center bg-primary/5">
                <span className="material-symbols-outlined text-primary text-2xl">verified_user</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Activos</p>
                <p className="text-2xl font-bold text-white font-headline">{users.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-lg border-t border-error/20 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border border-error/20 flex items-center justify-center bg-error/5">
                <span className="material-symbols-outlined text-error text-2xl">block</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inactivos</p>
                <p className="text-2xl font-bold text-white font-headline">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table/List */}
        <div className="bg-surface-container-low rounded-lg overflow-hidden border border-white/5 shadow-2xl animate-fade-in" style={{ animationDelay: '200ms' }}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
               <span className="w-8 h-8 border-2 border-tertiary/30 border-t-tertiary rounded-full animate-spin"></span>
               <p className="text-xs text-slate-500 uppercase tracking-widest">Cargando usuarios...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-800/50 border-b border-white/5">
                    <th className="px-6 py-4 text-[10px] font-bold text-tertiary uppercase tracking-widest">Usuario y Perfil</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-tertiary uppercase tracking-widest">Empresa</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-tertiary uppercase tracking-widest">Contacto Directo</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-tertiary uppercase tracking-widest">Fecha Registro</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-tertiary uppercase tracking-widest text-right">Opciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3 group/info">
                          <div className="w-10 h-10 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 relative transition-all group-hover/info:border-tertiary/50 shadow-lg shadow-black/20">
                            {user.avatar_url ? (
                              <Image src={user.avatar_url} alt={user.manager_name} width={40} height={40} className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 group-hover/info:from-tertiary/10 group-hover/info:to-slate-800 transition-all">
                                {user.email === ADMIN_EMAIL ? (
                                  <span className="material-symbols-outlined text-tertiary text-xl">shield</span>
                                ) : (
                                  <span className="text-tertiary font-bold text-lg">{user.manager_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-white truncate group-hover/info:text-tertiary transition-colors">{user.manager_name || "Sin nombre"}</p>
                              {user.email === ADMIN_EMAIL && (
                                <span className="bg-tertiary/10 text-tertiary text-[8px] px-1.5 py-0.5 rounded border border-tertiary/20 uppercase font-bold tracking-tighter">Admin</span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate group-hover/info:text-slate-400 transition-colors">{user.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/5 px-2 py-1 rounded border border-cyan-400/10 uppercase tracking-tight">
                          {user.company_name || 'Individual'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {user.whatsapp ? (
                            <a 
                              href={`https://wa.me/${user.whatsapp.replace(/\D/g,'')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-slate-300 flex items-center gap-1.5 hover:text-tertiary transition-colors"
                            >
                              <span className="material-symbols-outlined text-emerald-400 text-[14px]">call</span>
                              {user.whatsapp}
                            </a>
                          ) : (
                            <p className="text-[10px] text-slate-600 italic">No disponible</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-400">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 text-right">
                           <Link href={`/admin/users/${user.id}`} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-tertiary hover:bg-tertiary/10 rounded-md transition-all border border-transparent hover:border-tertiary/20" title="Ver Detalles">
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </Link>
                           <Link 
                            href={`/admin/users/${user.id}/edit`}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-tertiary hover:bg-tertiary/10 rounded-md transition-all border border-transparent hover:border-tertiary/20"
                            title="Editar Usuario"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </Link>
                          <button 
                            onClick={() => {
                              setUserToDelete(user);
                              setShowDeleteModal(true);
                            }}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-error hover:bg-error/10 rounded-md transition-all border border-transparent hover:border-error/20"
                            title="Eliminar Usuario"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center px-10">
              <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6 border border-white/5">
                <span className="material-symbols-outlined text-4xl text-slate-600">person_search</span>
              </div>
              <h3 className="text-xl font-bold text-white font-headline">No se encontraron usuarios</h3>
              <p className="text-slate-500 text-sm max-w-xs mt-2">Intenta ajustar los términos de búsqueda o verifica que haya usuarios registrados.</p>
              <button 
                onClick={() => setSearchTerm("")}
                className="mt-8 px-6 py-2 bg-tertiary/10 text-tertiary text-xs font-bold uppercase tracking-widest rounded border border-tertiary/20 hover:bg-tertiary hover:text-on-tertiary transition-all"
              >
                Limpiar búsqueda
              </button>
            </div>
          )}
        </div>
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
              ¿Estás seguro de que deseas eliminar permanentemente a <span className="text-white font-bold">{userToDelete?.manager_name || userToDelete?.email}</span>? Esta acción no se puede deshacer y se borrarán todos sus datos relacionados.
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

      {/* BottomNavBar (Visible on Mobile) */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 bg-[#0c1324]/90 backdrop-blur-2xl border-t border-[#45464d]/15 flex justify-around items-center py-2 px-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <BottomNavItem icon="home" label="Home" href="/" />
        <BottomNavItem icon="query_stats" label="Insights" href="/admin" />
        <BottomNavItem icon="group" label="Users" href="/admin/users" active />
        <BottomNavItem icon="account_circle" label="Profile" href="/admin/profile" />
      </nav>
    </div>
  );
}

function BottomNavItem({ icon, label, href, active = false }: { icon: string; label: string; href: string; active?: boolean }) {
  return (
    <Link 
      href={href}
      className={`flex flex-col items-center p-2 transition-all duration-200 ${
        active ? "text-[#2fd9f4]" : "text-slate-500 hover:text-[#89ceff]"
      }`}
    >
      <span className={`material-symbols-outlined text-[20px] ${active ? "drop-shadow-[0_0_8px_rgba(47,217,244,0.5)]" : ""}`}>
        {icon}
      </span>
      <span className="font-['Inter'] text-[8px] uppercase tracking-wider mt-0.5">{label}</span>
    </Link>
  );
}
