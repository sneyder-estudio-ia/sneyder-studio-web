"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import JSZip from "jszip";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { useRef } from "react";

const ADMIN_EMAIL = "sneyder23081994@gmail.com";

export default function AsignarRecursoPage() {
  const [user, setUser] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [order, setOrder] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    project_email: "",
    project_pass: "",
    email_pass: "",
    source_code_link: "",
  });

  const [customResources, setCustomResources] = useState<{ id: string, title: string, value: string, isPrivate: boolean }[]>([]);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);
  const [newResource, setNewResource] = useState({ title: "", value: "", isPrivate: true });

  const [compressProgress, setCompressProgress] = useState<{status: string, percentage: number} | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

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
    const fetchOrder = async () => {
      if (!orderId) return;
      try {
        const orderDoc = await getDoc(doc(db, "orders", orderId));
        if (orderDoc.exists()) {
          const data = orderDoc.data();
          setOrder({ id: orderDoc.id, ...data });
          setFormData({
            project_email: data.project_email || "",
            project_pass: data.project_pass || "",
            email_pass: data.email_pass || "",
            source_code_link: data.source_code_link || "",
          });
          setCustomResources(data.custom_resources || []);
        }
      } catch (err) {
        console.error("Error fetching order:", err);
      }
    };
    if (user) fetchOrder();
  }, [user, orderId]);

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setCompressProgress({ status: "Comprimiendo carpeta...", percentage: 0 });
      const zip = new JSZip();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = file.webkitRelativePath || file.name;
        zip.file(path, file);
      }

      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      }, (metadata) => {
        setCompressProgress({ status: "Comprimiendo carpeta...", percentage: Math.round(metadata.percent) });
      });

      setCompressProgress({ status: "Subiendo al servidor...", percentage: 0 });
      const storageRef = ref(storage, `orders/${orderId}/resources/project_files_${Date.now()}.zip`);
      const uploadTask = uploadBytesResumable(storageRef, zipBlob);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setCompressProgress({ status: "Subiendo al servidor...", percentage: Math.round(progress) });
        },
        (error) => {
          console.error("Upload error:", error);
          alert("Error al subir archivo.");
          setCompressProgress(null);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setFormData(prev => ({ ...prev, source_code_link: downloadURL }));
          setCompressProgress({ status: "¡Subida exitosa!", percentage: 100 });
          setTimeout(() => setCompressProgress(null), 3000);
        }
      );

    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al procesar la carpeta.");
      setCompressProgress(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "orders", orderId), {
        project_email: formData.project_email,
        project_pass: formData.project_pass,
        email_pass: formData.email_pass,
        source_code_link: formData.source_code_link,
        custom_resources: customResources,
      });
      alert("Recursos guardados exitosamente. El cliente podrá verlos cuando el proyecto pase a estado Completado.");
      router.push(`/admin/pedidos/${orderId}`);
    } catch (err) {
      console.error("Error saving resources:", err);
      alert("Error al guardar los recursos.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (isChecking || !order) {
    return (
      <div className="bg-background text-white flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen selection:bg-tertiary selection:text-on-tertiary px-4 py-8 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href={`/admin/pedidos/${orderId}`}>
            <button className="text-cyan-400 hover:bg-white/5 p-2 rounded-full transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white font-headline">Subir / Asignar Recursos</h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Pedido #{orderId.slice(0, 8)}</p>
          </div>
        </div>

        {/* Warning Card */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 flex items-start gap-4">
          <span className="material-symbols-outlined text-blue-400 mt-0.5">info</span>
          <div>
            <h3 className="text-sm font-bold text-blue-400 mb-1">Sobre la visibilidad</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Los datos que ingreses aquí se guardarán en el perfil del proyecto. Sin embargo, por seguridad, el sistema lado-cliente <strong>solo desbloqueará y mostrará las contraseñas cuando la orden marque estado "Completado"</strong>.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="bg-surface-container-low border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
          
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white mb-4">Credenciales Comunes</h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 pl-1">Correo Electrónico (Web/Admin)</label>
              <input
                type="email"
                name="project_email"
                value={formData.project_email}
                onChange={handleChange}
                placeholder="ej: admin@proyecto.com"
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 pl-1">Contraseña Panel Admin</label>
                <input
                  type="text"
                  name="project_pass"
                  value={formData.project_pass}
                  onChange={handleChange}
                  placeholder="ej: SecurePass123"
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 pl-1">Contraseña Correo</label>
                <input
                  type="text"
                  name="email_pass"
                  value={formData.email_pass}
                  onChange={handleChange}
                  placeholder="ej: EmailPass123"
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-4">
            <h3 className="text-lg font-bold text-white mb-2">Entregables (Archivos)</h3>
            
            <div className="space-y-4">
              {/* Opción Automática */}
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-6">
                <label className="text-[10px] uppercase tracking-widest font-bold text-cyan-400 mb-2 block">
                  Subir Carpeta del Proyecto (Autocompresor ZIP)
                </label>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Selecciona la carpeta raíz de tu proyecto. El sistema la comprimirá automáticamente en un archivo <strong>.zip</strong> en tu navegador y la enviará a nuestro servidor seguro, generando el enlace de descarga directamente.
                </p>
                
                <input 
                  type="file"
                  ref={folderInputRef}
                  onChange={handleFolderUpload}
                  className="hidden"
                  // @ts-ignore
                  webkitdirectory="true"
                  directory="true"
                  multiple
                />

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    disabled={compressProgress !== null}
                    className="w-full sm:w-auto px-6 py-4 bg-cyan-400 text-black font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(34,211,238,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">folder_zip</span>
                    Seleccionar Carpeta
                  </button>
                  
                  {compressProgress && (
                    <div className="flex-1 w-full bg-slate-900 rounded-xl p-3 border border-white/10 flex items-center gap-4">
                       <div className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin shrink-0"></div>
                       <div className="flex-1 w-full flex flex-col">
                         <div className="flex justify-between items-center mb-1">
                           <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">{compressProgress.status}</span>
                           <span className="text-xs font-mono text-white">{compressProgress.percentage}%</span>
                         </div>
                         <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                           <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${compressProgress.percentage}%` }}></div>
                         </div>
                       </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-white/10"></div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">O ingresar enlace manualmente</p>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 pl-1">Enlace a Código Fuente / ZIP Externo</label>
                <input
                  type="url"
                  name="source_code_link"
                  value={formData.source_code_link}
                  onChange={handleChange}
                  placeholder="ej: https://github.com/... o Google Drive link"
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all placeholder:text-slate-600"
                />
                <p className="text-[10px] text-slate-500 pl-1 mt-1">Si usaste la herramienta autocompresora de arriba, este campo se llenará automáticamente.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Recursos Adicionales</h3>
              <button
                type="button"
                onClick={() => setShowResourceModal(true)}
                className="w-8 h-8 rounded-full bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400 hover:text-black flex items-center justify-center transition-all"
              >
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>
            
            {customResources.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No hay recursos adicionales registrados.</p>
            ) : (
              <div className="space-y-3">
                {customResources.map(res => (
                  <div key={res.id} className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{res.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[200px] md:max-w-md">{res.value}</p>
                      {res.isPrivate && (
                        <span className="inline-block mt-2 text-[9px] uppercase tracking-widest px-2 py-0.5 rounded border border-red-500/20 text-red-400 bg-red-500/10">Protegido (Privado)</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setResourceToDelete(res.id)}
                      className="text-red-400 hover:text-red-300 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-400/10 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <Link href={`/admin/pedidos/${orderId}`}>
              <button type="button" className="px-6 py-3 rounded-xl border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-all">
                Cancelar
              </button>
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-3 rounded-xl bg-cyan-400 text-black font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 shadow-[0_10px_20px_rgba(34,211,238,0.2)]"
            >
              {isSaving ? "Guardando..." : "Guardar Activos"}
              <span className="material-symbols-outlined text-sm">save</span>
            </button>
          </div>
        </form>

      </div>

      {showResourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowResourceModal(false)}></div>
          <div className="bg-surface-container-high border border-white/10 w-full max-w-sm rounded-[2rem] p-6 relative z-10 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 font-headline text-white">Nuevo Recurso</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 pl-1">Título del Recurso</label>
                <input
                  type="text"
                  value={newResource.title}
                  onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                  placeholder="ej: Acceso a CPanel"
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 pl-1">Valor / Enlace</label>
                <input
                  type="text"
                  value={newResource.value}
                  onChange={(e) => setNewResource({ ...newResource, value: e.target.value })}
                  placeholder="Pega la URL o escribe el texto..."
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400/50"
                />
              </div>
              <label className="flex items-center gap-3 bg-white/5 p-3 rounded-xl cursor-pointer hover:bg-white/10 transition-all border border-white/5">
                <input
                  type="checkbox"
                  checked={newResource.isPrivate}
                  onChange={(e) => setNewResource({ ...newResource, isPrivate: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-900 border-white/20 text-cyan-400 cursor-pointer"
                />
                <span className="text-xs text-slate-300 font-bold">Es Privado (Ocultar hasta que pague)</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowResourceModal(false)}
                className="px-4 py-2 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-300 hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!newResource.title || !newResource.value}
                onClick={() => {
                  setCustomResources(prev => [...prev, { ...newResource, id: Date.now().toString() }]);
                  setShowResourceModal(false);
                  setNewResource({ title: "", value: "", isPrivate: true });
                }}
                className="px-4 py-2 bg-cyan-400 text-black rounded-lg text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {resourceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setResourceToDelete(null)}></div>
          <div className="bg-[#151b2d] border border-red-500/20 w-full max-w-sm rounded-[2rem] p-6 relative z-10 shadow-[0_0_40px_rgba(239,68,68,0.15)] text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full mx-auto flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl text-red-500">warning</span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">¿Borrar este recurso?</h3>
            <p className="text-xs text-slate-400 mb-8 leading-relaxed">
              Esta acción eliminará el recurso añadido de la lista. Recuerda guardar los cambios abajo para que se reflejen en el cliente.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setResourceToDelete(null)}
                className="flex-1 py-3 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-300 hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomResources(prev => prev.filter(r => r.id !== resourceToDelete));
                  setResourceToDelete(null);
                }}
                className="flex-1 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/20"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
