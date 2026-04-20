"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCMSData, saveCMSData, deleteFileFromStorage } from "@/lib/cms";

const ADMIN_EMAIL = "sneyder23081994@gmail.com";

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const section = searchParams.get("section");
  const index = searchParams.get("index");

  const [data, setData] = useState<any>(null);
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Sub-card editor state
  const [editingSubCard, setEditingSubCard] = useState<number | null>(null);
  const [subCardDragActive, setSubCardDragActive] = useState<number | null>(null);
  const [subCardUploading, setSubCardUploading] = useState<number | null>(null);
  const subCardFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || session.user.email !== ADMIN_EMAIL) {
        router.replace('/');
        return;
      }
    };
    checkAdmin();
  }, [router]);

  useEffect(() => {
    const loadData = async () => {
      const currentData = await getCMSData();
      setData(currentData);

      if (section) {
        let target: any = null;
        const dataKey = section === 'ai' ? 'aiModels' : (section === 'cyber' ? 'cybersecurity' : section);
        
        if (index !== null) {
          const idx = parseInt(index);
          if (section === 'services') target = currentData.services?.[idx];
          if (section === 'ai') target = currentData.aiModels?.models?.[idx];
          if (section === 'cyber') target = currentData.cybersecurity?.items?.[idx];
        } else {
          target = (currentData as any)[dataKey];
        }

        if (target) {
          const normalized = {
            ...target,
            title: target.title || target.name || "",
            description: target.description || target.sub || target.text || "",
            buttons: target.buttons || [],
            media: target.media || { type: 'image', url: '/video/frames/ezgif-frame-001.jpg' },
            icon: target.icon || "category",
            subCards: target.subCards || [],
          };
          setItem(normalized);
        }
      }
      setLoading(false);
    };
    loadData();
  }, [section, index]);


  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    const allAllowed = [...allowedImageTypes, ...allowedVideoTypes];

    if (!allAllowed.includes(file.type)) {
      alert("Tipo de archivo no soportado. Usa imágenes (JPG, PNG, GIF, WebP, SVG) o videos (MP4, WebM, OGG, MOV).");
      return null;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      alert("El archivo es demasiado grande. Máximo 50MB.");
      return null;
    }

    const isVideo = file.type.startsWith('video/');
    const bucket = isVideo ? 'videos' : 'images';
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    setUploading(true);
    setUploadProgress("Subiendo archivo...");

    const { data: uploadData, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      alert("Error al subir el archivo: " + error.message);
      setUploading(false);
      setUploadProgress("");
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(uploadData.path);

    setUploading(false);
    setUploadProgress("");
    return urlData.publicUrl;
  }, []);

  // --- Main media handlers ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const isVideo = file.type.startsWith('video/');
    const url = await uploadFile(file);
    if (url) {
      updateItem("media", { ...item.media, url, type: isVideo ? 'video' : 'image' });
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const url = await uploadFile(file);
    if (url) {
      updateItem("media", { ...item.media, url, type: isVideo ? 'video' : 'image' });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // --- Sub-card media upload ---
  const handleSubCardFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, cardIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubCardUploading(cardIndex);
    const isVideo = file.type.startsWith('video/');
    const url = await uploadFile(file);
    setSubCardUploading(null);
    if (url) {
      const newSubCards = [...(item.subCards || [])];
      newSubCards[cardIndex] = {
        ...newSubCards[cardIndex],
        media: { type: isVideo ? 'video' : 'image', url },
      };
      updateItem("subCards", newSubCards);
    }
    if (subCardFileRef.current) subCardFileRef.current.value = "";
  };

  const handleSubCardDrop = async (e: React.DragEvent, cardIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSubCardDragActive(null);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setSubCardUploading(cardIndex);
    const isVideo = file.type.startsWith('video/');
    const url = await uploadFile(file);
    setSubCardUploading(null);
    if (url) {
      const newSubCards = [...(item.subCards || [])];
      newSubCards[cardIndex] = {
        ...newSubCards[cardIndex],
        media: { type: isVideo ? 'video' : 'image', url },
      };
      updateItem("subCards", newSubCards);
    }
  };

  const handleSave = async () => {
    setUploading(true); // Reuse uploading state to show loading on button
    try {
      const newData = { ...data };
      const dataKey = section === 'ai' ? 'aiModels' : (section === 'cyber' ? 'cybersecurity' : section);
      
      const processedItem = { ...item };
      if (section === 'ai' && index !== null) {
        processedItem.name = item.title;
        processedItem.sub = item.description;
      }
      if (section === 'cyber' && index !== null) {
        processedItem.text = item.description;
      }

      if (section && index !== null) {
        const idx = parseInt(index);
        if (section === 'services') newData.services[idx] = processedItem;
        if (section === 'ai') newData.aiModels.models[idx] = processedItem;
        if (section === 'cyber') newData.cybersecurity.items[idx] = processedItem;
      } else if (section) {
        (newData as any)[dataKey!] = processedItem;
      }

      await saveCMSData(newData);
      alert("Cambios guardados con éxito en la base de datos.");
      router.push("/admin/products");
    } catch (err: any) {
      alert("Error al guardar: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const updateItem = (key: string, value: any) => {
    setItem((prev: any) => ({ ...prev, [key]: value }));
  };

  const addButton = () => {
    const newButtons = [...item.buttons, { label: "Nuevo Botón", url: "#", style: "primary" }];
    updateItem("buttons", newButtons);
  };

  const removeButton = (idx: number) => {
    if (!window.confirm("¿Eliminar este botón?")) return;
    
    setItem((prev: any) => {
      const newButtons = prev.buttons.filter((_: any, i: number) => i !== idx);
      return { ...prev, buttons: newButtons };
    });
  };

  const updateButton = (idx: number, key: string, value: string) => {
    const newButtons = [...item.buttons];
    newButtons[idx] = { ...newButtons[idx], [key]: value };
    updateItem("buttons", newButtons);
  };

  // --- Sub-card management ---
  const addSubCard = () => {
    const newSubCards = [
      ...(item.subCards || []),
      {
        title: "Nueva Sub-Tarjeta",
        description: "",
        icon: "widgets",
        media: { type: 'image', url: '' },
      },
    ];
    updateItem("subCards", newSubCards);
    setEditingSubCard(newSubCards.length - 1);
  };

  const removeSubCard = async (idx: number) => {
    if (!window.confirm("¿Eliminar esta sub-tarjeta? Se borrará permanentemente junto con su contenido multimedia.")) return;
    
    const subCardToDelete = item.subCards?.[idx];
    const mediaUrl = subCardToDelete?.media?.url;
    
    // Immediate state update
    setItem((prev: any) => {
      const newSubCards = (prev.subCards || []).filter((_: any, i: number) => i !== idx);
      return { ...prev, subCards: newSubCards };
    });
    
    if (editingSubCard === idx) setEditingSubCard(null);

    // Background storage cleanup
    if (mediaUrl) {
      await deleteFileFromStorage(mediaUrl);
    }
  };

  const updateSubCard = (idx: number, key: string, value: any) => {
    const newSubCards = [...(item.subCards || [])];
    newSubCards[idx] = { ...newSubCards[idx], [key]: value };
    updateItem("subCards", newSubCards);
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-tertiary border-t-transparent rounded-full animate-spin"></div>
      <span className="text-tertiary font-bold tracking-widest text-xs uppercase">Iniciando Editor de Sneyder Studio...</span>
    </div>
  );

  if (!item) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-6 text-center">
      <span className="material-symbols-outlined text-red-500 text-6xl">error</span>
      <h1 className="text-2xl font-bold font-headline">Elemento no encontrado</h1>
      <p className="text-on-surface-variant max-w-md">No hemos podido localizar el componente que deseas editar. Asegúrate de que el enlace sea correcto.</p>
      <Link href="/admin/products">
        <button className="bg-tertiary text-on-tertiary px-8 py-3 rounded-sm font-bold uppercase tracking-widest text-xs">Volver al Panel</button>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-on-background">
      <style>{`
        .glass-panel {
          background: rgba(22, 31, 51, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(47, 217, 244, 0.1);
        }
        .glow-button {
          box-shadow: 0 0 20px rgba(47, 217, 244, 0.2);
        }
        .glow-button:hover {
          box-shadow: 0 0 30px rgba(47, 217, 244, 0.4);
        }
        .drop-zone-active {
          border-color: rgba(47, 217, 244, 0.8) !important;
          background: rgba(47, 217, 244, 0.05) !important;
          box-shadow: inset 0 0 30px rgba(47, 217, 244, 0.1);
        }
        .upload-shimmer {
          background: linear-gradient(90deg, transparent, rgba(47, 217, 244, 0.1), transparent);
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass-panel h-20 flex items-center justify-between px-8 border-b border-white/5">
        <div className="flex items-center gap-6">
          <Link href="/admin/products">
            <button className="text-tertiary hover:scale-110 transition-transform flex items-center gap-2 group">
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] hidden md:block group-hover:translate-x-1 transition-transform">Regresar</span>
            </button>
          </Link>
          <div className="h-8 w-[1px] bg-white/10 hidden md:block"></div>
          <div>
            <h1 className="text-xl font-bold font-headline text-white tracking-tight uppercase">Editor de Tarjeta</h1>
            <p className="text-[9px] text-tertiary font-bold tracking-[0.3em] uppercase opacity-70">Sneyder Studio CMS v2.0</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleSave}
            className="glow-button bg-tertiary text-on-tertiary px-8 py-3 rounded-sm font-bold tracking-[0.1em] text-xs uppercase hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Guardar y Publicar
          </button>
        </div>
      </header>

      <main className="pt-32 pb-20 px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-[1700px] mx-auto">
        
        {/* Left: Controls */}
        <div className="space-y-10">
          
          {/* Basic Info */}
          <section className="glass-panel p-8 rounded-sm space-y-6">
            <h2 className="text-xs font-bold text-tertiary uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-tertiary rounded-full animate-pulse"></span>
              Información Básica
            </h2>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Título del Componente</label>
              <input 
                type="text" 
                value={item.title}
                onChange={(e) => updateItem("title", e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 p-4 rounded-sm focus:border-tertiary outline-none transition-all font-headline text-lg"
                placeholder="Escribe el título aquí..."
              />
            </div>

            <div className="space-y-2 pt-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Descripción / Cuerpo de Texto</label>
              <textarea 
                rows={4}
                value={item.description}
                onChange={(e) => updateItem("description", e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 p-4 rounded-sm focus:border-tertiary outline-none transition-all text-sm leading-relaxed"
                placeholder="Describe el contenido..."
              />
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Icono (Material Symbol)</label>
                <div className="flex gap-2">
                   <div className="w-12 h-12 bg-slate-800 rounded-sm flex items-center justify-center border border-white/10">
                      <span className="material-symbols-outlined text-tertiary">{item.icon}</span>
                   </div>
                   <input 
                    type="text" 
                    value={item.icon}
                    onChange={(e) => updateItem("icon", e.target.value)}
                    className="flex-1 bg-slate-900/50 border border-white/10 px-4 rounded-sm focus:border-tertiary outline-none transition-all text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Badge/Tag (Opcional)</label>
                <input 
                  type="text" 
                  value={item.tag || ""}
                  onChange={(e) => updateItem("tag", e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 p-4 h-12 rounded-sm focus:border-tertiary outline-none transition-all text-sm"
                  placeholder="Ej: NUEVO"
                />
              </div>
            </div>
          </section>

          {/* Buttons Editor */}
          <section className="glass-panel p-8 rounded-sm">
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-xs font-bold text-tertiary uppercase tracking-[0.4em] flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-tertiary rounded-full animate-pulse"></span>
                  Botones y Enlaces
                </h2>
                <button 
                  onClick={addButton}
                  className="text-[9px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 px-3 py-1.5 rounded-full hover:bg-tertiary hover:text-on-tertiary transition-all"
                >+ Añadir Botón</button>
             </div>

             <div className="space-y-4">
                {item.buttons.length === 0 && (
                  <div className="py-8 text-center border border-dashed border-white/10 rounded-sm">
                    <p className="text-xs text-slate-500 uppercase tracking-widest">No hay botones configurados</p>
                  </div>
                )}
                {item.buttons.map((btn: any, idx: number) => (
                  <div key={idx} className="bg-white/5 p-4 rounded-sm border border-white/5 space-y-4 relative group">
                    <button 
                      onClick={() => removeButton(idx)}
                      className="absolute top-4 right-4 text-slate-500 hover:text-red-500 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Texto del Botón</label>
                        <input 
                          type="text" 
                          value={btn.label}
                          onChange={(e) => updateButton(idx, "label", e.target.value)}
                          className="w-full bg-black/30 border border-white/10 p-2 text-xs rounded-sm outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Enlace (URL)</label>
                        <input 
                          type="text" 
                          value={btn.url}
                          onChange={(e) => updateButton(idx, "url", e.target.value)}
                          className="w-full bg-black/30 border border-white/10 p-2 text-xs rounded-sm outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </section>

          {/* Media Upload Section */}
          <section className="glass-panel p-8 rounded-sm space-y-6">
            <h2 className="text-xs font-bold text-tertiary uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-tertiary rounded-full animate-pulse"></span>
              Multimedia
            </h2>

            <div className="flex gap-4 p-1 bg-black/40 rounded-sm mb-6 max-w-xs">
              <button 
                onClick={() => updateItem("media", { ...item.media, type: 'image' })}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all ${item.media.type === 'image' ? "bg-tertiary text-on-tertiary" : "text-white/40 hover:text-white"}`}
              >Imagen</button>
              <button 
                onClick={() => updateItem("media", { ...item.media, type: 'video' })}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all ${item.media.type === 'video' ? "bg-tertiary text-on-tertiary" : "text-white/40 hover:text-white"}`}
              >Video</button>
            </div>

            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-all duration-300 ${
                dragActive
                  ? "drop-zone-active border-tertiary"
                  : "border-white/15 hover:border-tertiary/50 hover:bg-white/[0.02]"
              } ${uploading ? "pointer-events-none opacity-70" : ""}`}
            >
              {uploading && (
                <div className="absolute inset-0 overflow-hidden rounded-sm">
                  <div className="upload-shimmer absolute inset-0"></div>
                </div>
              )}

              <div className="relative z-10 flex flex-col items-center gap-4">
                {uploading ? (
                  <>
                    <div className="w-10 h-10 border-3 border-tertiary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-tertiary font-bold uppercase tracking-widest">{uploadProgress}</p>
                  </>
                ) : item.media.url ? (
                  <>
                    {item.media.type === 'image' ? (
                      <div className="w-full max-h-48 rounded-sm overflow-hidden mb-2">
                        <img src={item.media.url} alt="Preview" className="w-full h-full object-cover max-h-48" />
                      </div>
                    ) : (
                      <div className="w-full max-h-48 rounded-sm overflow-hidden mb-2">
                        <video src={item.media.url} className="w-full h-full object-cover max-h-48" muted />
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-tertiary text-lg">swap_horiz</span>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                        Click o arrastra para cambiar el archivo
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-tertiary/10 flex items-center justify-center border border-tertiary/20">
                      <span className="material-symbols-outlined text-tertiary text-3xl">
                        {item.media.type === 'video' ? 'videocam' : 'add_photo_alternate'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white mb-1">
                        {dragActive ? "Suelta el archivo aquí" : "Arrastra tu archivo aquí"}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                        o haz click para seleccionar • JPG, PNG, GIF, WebP, MP4, WebM • Max 50MB
                      </p>
                    </div>
                  </>
                )}
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,video/mp4,video/webm,video/ogg,video/quicktime"
                onChange={handleFileSelect}
              />
            </div>

            {/* Remove media button */}
            {item.media.url && (
              <button
                onClick={async () => {
                  if (window.confirm("¿Eliminar este archivo multimedia de la base de datos?")) {
                    const urlToDelete = item.media.url;
                    // Update state immediately
                    setItem((prev: any) => ({ ...prev, media: { ...prev.media, url: '' } }));
                    // Background cleanup
                    if (urlToDelete) await deleteFileFromStorage(urlToDelete);
                  }
                }}
                className="text-[9px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors flex items-center gap-2 mt-2"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Eliminar multimedia
              </button>
            )}
          </section>

          {/* Sub-Cards Editor */}
          <section className="glass-panel p-8 rounded-sm">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xs font-bold text-tertiary uppercase tracking-[0.4em] flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-tertiary rounded-full animate-pulse"></span>
                Sub-Tarjetas Internas
              </h2>
              <button 
                onClick={addSubCard}
                className="text-[9px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 px-3 py-1.5 rounded-full hover:bg-tertiary hover:text-on-tertiary transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-xs">add</span>
                Añadir Sub-Tarjeta
              </button>
            </div>

            <div className="space-y-4">
              {(!item.subCards || item.subCards.length === 0) && (
                <div className="py-10 text-center border border-dashed border-white/10 rounded-sm">
                  <span className="material-symbols-outlined text-3xl text-slate-600 mb-2 block">dashboard_customize</span>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">No hay sub-tarjetas</p>
                  <p className="text-[10px] text-slate-600 mt-1">Añade tarjetas internas para enriquecer tu contenido</p>
                </div>
              )}

              {(item.subCards || []).map((sub: any, idx: number) => (
                <div 
                  key={idx} 
                  className={`bg-white/5 rounded-sm border transition-all duration-300 overflow-hidden ${
                    editingSubCard === idx ? "border-tertiary/40" : "border-white/5 hover:border-white/15"
                  }`}
                >
                  {/* Sub-card header (always visible) */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-tertiary/10 rounded-sm flex items-center justify-center border border-tertiary/20">
                        <span className="material-symbols-outlined text-tertiary text-sm">{sub.icon || 'widgets'}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{sub.title || "Sin título"}</p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest">Sub-tarjeta #{idx + 1}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setEditingSubCard(editingSubCard === idx ? null : idx)}
                        className={`p-1.5 rounded transition-all ${editingSubCard === idx ? "bg-tertiary text-on-tertiary" : "text-slate-500 hover:text-tertiary hover:bg-white/5"}`}
                      >
                        <span className="material-symbols-outlined text-sm">{editingSubCard === idx ? "expand_less" : "edit"}</span>
                      </button>
                      <button 
                        onClick={() => removeSubCard(idx)}
                        className="p-1.5 rounded text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded edit form */}
                  {editingSubCard === idx && (
                    <div className="px-4 pb-5 space-y-4 border-t border-white/5 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Título</label>
                          <input 
                            type="text" 
                            value={sub.title}
                            onChange={(e) => updateSubCard(idx, "title", e.target.value)}
                            className="w-full bg-black/30 border border-white/10 p-2.5 text-xs rounded-sm outline-none focus:border-tertiary transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Icono</label>
                          <div className="flex gap-2">
                            <div className="w-10 h-10 bg-slate-800 rounded-sm flex items-center justify-center border border-white/10 shrink-0">
                              <span className="material-symbols-outlined text-tertiary text-sm">{sub.icon || 'widgets'}</span>
                            </div>
                            <input 
                              type="text" 
                              value={sub.icon || ''}
                              onChange={(e) => updateSubCard(idx, "icon", e.target.value)}
                              className="flex-1 bg-black/30 border border-white/10 p-2.5 text-xs rounded-sm outline-none focus:border-tertiary transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Descripción</label>
                        <textarea 
                          rows={2}
                          value={sub.description || ''}
                          onChange={(e) => updateSubCard(idx, "description", e.target.value)}
                          className="w-full bg-black/30 border border-white/10 p-2.5 text-xs rounded-sm outline-none focus:border-tertiary transition-all leading-relaxed"
                          placeholder="Descripción de la sub-tarjeta..."
                        />
                      </div>

                      {/* Sub-card media upload */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Multimedia de Sub-Tarjeta</label>
                        <div
                          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setSubCardDragActive(idx); }}
                          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setSubCardDragActive(null); }}
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onDrop={(e) => handleSubCardDrop(e, idx)}
                          onClick={() => {
                            if (subCardUploading !== idx && subCardFileRef.current) {
                              subCardFileRef.current.dataset.index = String(idx);
                              subCardFileRef.current.click();
                            }
                          }}
                          className={`border border-dashed rounded-sm p-4 text-center cursor-pointer transition-all duration-300 ${
                            subCardDragActive === idx
                              ? "drop-zone-active border-tertiary"
                              : "border-white/15 hover:border-tertiary/40"
                          } ${subCardUploading === idx ? "pointer-events-none opacity-70" : ""}`}
                        >
                          {subCardUploading === idx ? (
                            <div className="flex items-center justify-center gap-2 py-2">
                              <div className="w-5 h-5 border-2 border-tertiary border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-[10px] text-tertiary uppercase tracking-widest font-bold">Subiendo...</span>
                            </div>
                          ) : sub.media?.url ? (
                            <div className="flex items-center gap-3">
                              {sub.media.type === 'image' ? (
                                <img src={sub.media.url} alt="" className="w-16 h-12 object-cover rounded-sm" />
                              ) : (
                                <div className="w-16 h-12 bg-black/40 rounded-sm flex items-center justify-center">
                                  <span className="material-symbols-outlined text-tertiary text-sm">play_circle</span>
                                </div>
                              )}
                              <span className="text-[9px] text-slate-500 uppercase tracking-widest flex-1 text-left">Click o arrastra para cambiar</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2 py-1">
                              <span className="material-symbols-outlined text-slate-500 text-lg">add_photo_alternate</span>
                              <span className="text-[10px] text-slate-500 uppercase tracking-widest">Arrastra o click para subir</span>
                            </div>
                          )}
                        </div>

                        {sub.media?.url && (
                          <button
                            onClick={async () => {
                              if (window.confirm("¿Eliminar multimedia de esta sub-tarjeta? Se borrará de la base de datos.")) {
                                const urlToDelete = sub.media.url;
                                const newSubCards = [...(item.subCards || [])];
                                newSubCards[idx] = { ...newSubCards[idx], media: { type: 'image', url: '' } };
                                updateItem("subCards", newSubCards);
                                await deleteFileFromStorage(urlToDelete);
                              }
                            }}
                            className="text-[8px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 mt-1"
                          >
                            <span className="material-symbols-outlined text-xs">close</span>
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Hidden file input for sub-cards */}
            <input 
              type="file" 
              ref={subCardFileRef} 
              className="hidden" 
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,video/mp4,video/webm,video/ogg,video/quicktime"
              onChange={(e) => {
                const idx = parseInt(subCardFileRef.current?.dataset.index || "0");
                handleSubCardFileSelect(e, idx);
              }}
            />
          </section>

        </div>

        {/* Right: Live Preview */}
        <div className="lg:sticky lg:top-32 h-fit space-y-6 shrink-0">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.4em] mb-6 px-4">Previsualización en tiempo real</h2>
          
          <div className="bg-[#0c1324] p-12 rounded-sm border border-white/5 relative overflow-hidden group/card shadow-2xl">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-tertiary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-10">
                <span className="material-symbols-outlined text-tertiary text-5xl">{item.icon}</span>
                {item.tag && (
                  <span className="bg-tertiary/10 text-tertiary border border-tertiary/30 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] animate-pulse">
                    {item.tag}
                  </span>
                )}
              </div>
              
              <h3 className="font-headline text-4xl font-bold mb-6 tracking-tight text-white leading-tight">{item.title}</h3>
              <p className="text-on-surface-variant text-lg leading-relaxed mb-10 opacity-70">{item.description}</p>
              
              <div className="flex flex-wrap gap-4 mt-8">
                {item.buttons.map((btn: any, i: number) => (
                  <button key={i} className="bg-tertiary text-on-tertiary px-6 py-3 rounded-sm font-bold uppercase tracking-widest text-[10px] shadow-[0_5px_15px_rgba(47,217,244,0.2)]">
                    {btn.label}
                  </button>
                ))}
                {item.buttons.length === 0 && (
                   <div className="h-10 w-32 border border-dashed border-white/10 rounded-sm flex items-center justify-center text-[9px] text-slate-600 uppercase tracking-widest">Botón Opcional</div>
                )}
              </div>
            </div>

            {/* Media Preview Section */}
            <div className="mt-12 rounded-sm overflow-hidden border border-white/10 aspect-video relative bg-black/40 group/media">
               {item.media.url ? (
                 item.media.type === 'image' ? (
                   <img src={item.media.url} alt="Preview" className="w-full h-full object-cover opacity-60 group-hover/media:scale-105 transition-transform duration-700" />
                 ) : (
                   <video 
                     src={item.media.url} 
                     className="w-full h-full object-cover opacity-60" 
                     muted 
                     loop 
                     autoPlay
                     playsInline
                   />
                 )
               ) : (
                 <div className="w-full h-full flex items-center justify-center">
                   <div className="flex flex-col items-center gap-2">
                     <span className="material-symbols-outlined text-4xl text-tertiary/30">image</span>
                     <p className="text-[9px] text-tertiary/30 font-bold uppercase tracking-widest">Sin multimedia</p>
                   </div>
                 </div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-[#0c1324] to-transparent opacity-60"></div>
            </div>

            {/* Sub-Cards Preview */}
            {item.subCards && item.subCards.length > 0 && (
              <div className="mt-8 space-y-3">
                <p className="text-[9px] text-tertiary/50 font-bold uppercase tracking-[0.3em] mb-4">Sub-Tarjetas</p>
                <div className="grid grid-cols-1 gap-3">
                  {item.subCards.map((sub: any, i: number) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-sm p-4 flex items-start gap-4 hover:border-tertiary/20 transition-all">
                      {sub.media?.url ? (
                        sub.media.type === 'image' ? (
                          <img src={sub.media.url} alt="" className="w-14 h-14 object-cover rounded-sm shrink-0" />
                        ) : (
                          <div className="w-14 h-14 bg-black/40 rounded-sm flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-tertiary text-sm">play_circle</span>
                          </div>
                        )
                      ) : (
                        <div className="w-14 h-14 bg-tertiary/5 border border-tertiary/10 rounded-sm flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-tertiary/40">{sub.icon || 'widgets'}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{sub.title}</p>
                        {sub.description && (
                          <p className="text-[10px] text-slate-400 leading-relaxed mt-1 line-clamp-2">{sub.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-tertiary/5 border border-tertiary/20 rounded-sm">
            <div className="flex items-center gap-3 text-tertiary mb-3">
              <span className="material-symbols-outlined text-sm">visibility</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Consistencia Visual</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed italic">
              "Esta previsualización aproxima cómo se verá tu tarjeta en el sitio en vivo. Asegúrate de que el título no sea demasiado largo para evitar desplazamientos horizontales no deseados."
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CardEditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center text-tertiary">
        <span className="animate-pulse tracking-widest uppercase text-xs">Desplegando Interfaz de Edición...</span>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
