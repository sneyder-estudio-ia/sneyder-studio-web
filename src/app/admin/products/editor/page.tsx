"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { siteData as initialSiteData } from "@/data/siteData";

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const section = searchParams.get("section");
  const index = searchParams.get("index");

  const [data, setData] = useState(initialSiteData);
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedData = localStorage.getItem("sneyder_cms_data");
    const currentData = savedData ? JSON.parse(savedData) : initialSiteData;
    setData(currentData);

    if (section) {
      let target: any = null;
      // Map section parameter to correct data key
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
        // Ensure standard fields for the dedicated editor
        const normalized = {
          ...target,
          title: target.title || target.name || "",
          description: target.description || target.sub || target.text || "",
          buttons: target.buttons || [],
          media: target.media || { type: 'image', url: '/video/frames/ezgif-frame-001.jpg' },
          icon: target.icon || "category"
        };
        setItem(normalized);
      }
    }
    setLoading(false);
  }, [section, index]);

  const handleSave = () => {
    const newData = { ...data };
    const dataKey = section === 'ai' ? 'aiModels' : (section === 'cyber' ? 'cybersecurity' : section);
    
    // Sync back to specific fields if necessary
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

    localStorage.setItem("sneyder_cms_data", JSON.stringify(newData));
    
    alert("Cambios guardados con éxito.");
    router.push("/admin/products");
  };

  const updateItem = (key: string, value: any) => {
    setItem((prev: any) => ({ ...prev, [key]: value }));
  };

  const addButton = () => {
    const newButtons = [...item.buttons, { label: "Nuevo Botón", url: "#", style: "primary" }];
    updateItem("buttons", newButtons);
  };

  const removeButton = (idx: number) => {
    const newButtons = item.buttons.filter((_: any, i: number) => i !== idx);
    updateItem("buttons", newButtons);
  };

  const updateButton = (idx: number, key: string, value: string) => {
    const newButtons = [...item.buttons];
    newButtons[idx] = { ...newButtons[idx], [key]: value };
    updateItem("buttons", newButtons);
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

          {/* Media Editor */}
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

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">URL del Recurso</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={item.media.url}
                  onChange={(e) => updateItem("media", { ...item.media, url: e.target.value })}
                  className="flex-1 bg-slate-900/50 border border-white/10 p-4 rounded-sm focus:border-tertiary outline-none transition-all text-sm"
                  placeholder="https://..."
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white/5 border border-white/10 px-4 rounded-sm hover:bg-white/10 transition-all text-tertiary"
                >
                  <span className="material-symbols-outlined">upload_file</span>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" />
              </div>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-2 italic">Tip: Puedes usar enlaces de Unsplash para imágenes o MP4 directos para videos.</p>
            </div>
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
               {item.media.type === 'image' ? (
                 <img src={item.media.url || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop"} alt="Preview" className="w-full h-full object-cover opacity-60 group-hover/media:scale-105 transition-transform duration-700" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center relative">
                    <span className="material-symbols-outlined text-4xl text-tertiary/40">play_circle</span>
                    <p className="absolute bottom-4 text-[9px] text-tertiary/40 font-bold uppercase tracking-widest">Vista previa de Video</p>
                 </div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-[#0c1324] to-transparent opacity-60"></div>
            </div>
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
