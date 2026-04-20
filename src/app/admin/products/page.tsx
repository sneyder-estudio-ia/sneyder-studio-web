"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { siteData as initialSiteData } from "@/data/siteData";
import { supabase } from "@/lib/supabase";
import AdminSidebar from "@/components/AdminSidebar";
import { getCMSData, saveCMSData, deleteFileFromStorage } from "@/lib/cms";

const ADMIN_EMAIL = "sneyder23081994@gmail.com";

export default function ProductsCmsPage() {
  const [data, setData] = useState(initialSiteData);
  const [sectionsOrder, setSectionsOrder] = useState(initialSiteData.sectionsOrder);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || session.user.email !== ADMIN_EMAIL) {
        router.replace('/');
        return;
      }
      setIsChecking(false);
    };
    checkAdmin();
  }, [router]);


  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.classList.add("menu-open");
      document.documentElement.classList.add("menu-open");
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.classList.remove("menu-open");
      document.documentElement.classList.remove("menu-open");
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.classList.remove("menu-open");
      document.documentElement.classList.remove("menu-open");
    };
  }, [isMenuOpen]);

  // Hero Scrubbing Logic
  const [isVideoLocked, setIsVideoLocked] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef(1);
  const touchStartY = useRef(0);
  const totalFrames = 40;

  const updateFrame = (newFrame: number) => {
    const frame = Math.max(1, Math.min(totalFrames, Math.round(newFrame)));
    frameRef.current = frame;
    if (imgRef.current) {
      const frameNum = frame.toString().padStart(3, '0');
      imgRef.current.src = `/video/frames/ezgif-frame-${frameNum}.jpg`;
    }
  };

  // Fetch from Database on mount
  useEffect(() => {
    const loadData = async () => {
      const dbData = await getCMSData();
      setData(dbData);
      if (dbData.sectionsOrder) setSectionsOrder(dbData.sectionsOrder);
    };
    loadData();

    // Preload Frames
    const preloadFrames = async () => {
      const promises = [];
      for (let i = 1; i <= totalFrames; i++) {
        const img = new (window as any).Image();
        const frameNum = i.toString().padStart(3, '0');
        img.src = `/video/frames/ezgif-frame-${frameNum}.jpg`;
        promises.push(new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        }));
      }
      await Promise.all(promises);
      setIsVideoLoaded(true);
    };
    preloadFrames();
  }, []);

  const saveToDB = async (updatedData: any, updatedOrder = sectionsOrder) => {
    setIsSaving(true);
    try {
      const finalData = { ...updatedData, sectionsOrder: updatedOrder };
      await saveCMSData(finalData);
      // Update state with the saved data
      setData(updatedData);
      setSectionsOrder(updatedOrder);
      // Non-blocking toast instead of alert
      setToast("✅ Cambios guardados con éxito.");
      setTimeout(() => setToast(null), 3000);
    } catch (error: any) {
      setToast("❌ Error al guardar: " + error.message);
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const addService = () => {
    const newServices = [
      ...data.services,
      {
        icon: "category",
        title: "Nuevo Servicio",
        description: "Descripción del nuevo servicio...",
        tags: ["Core", "Cloud"]
      }
    ];
    const newData = { ...data, services: newServices };
    setData(newData);
    saveToDB(newData);
  };

  const addModel = () => {
    const newModels = [
      ...data.aiModels.models,
      { name: "Nuevo Modelo", sub: "Integración" }
    ];
    const newData = { ...data, aiModels: { ...data.aiModels, models: newModels } };
    setData(newData);
    saveToDB(newData);
  };

  const addCyberItem = () => {
    const newItems = [
      ...data.cybersecurity.items,
      { icon: "security", text: "Nueva Protección" }
    ];
    const newData = { ...data, cybersecurity: { ...data.cybersecurity, items: newItems } };
    setData(newData);
    saveToDB(newData);
  };

  const deleteService = async (index: number) => {
    console.log(">>> deleteService CALLED with index:", index);
    if (!window.confirm("¿Estás seguro de que deseas eliminar este servicio? Se borrará permanentemente junto con su contenido multimedia.")) return;
    
    // Calculate new state
    const itemToDelete = data.services[index] as any;
    const newServices = data.services.filter((_: any, i: number) => i !== index);
    const newData = { ...data, services: newServices };
    
    // Update local state (Optimistic)
    setData(newData);
    
    // Cleanup storage (async background)
    if (itemToDelete.media?.url) await deleteFileFromStorage(itemToDelete.media.url);
    if (itemToDelete.subCards) {
      for (const sub of (itemToDelete.subCards as any[])) {
        if (sub.media?.url) await deleteFileFromStorage(sub.media.url);
      }
    }

    // Persist to DB using the NEW data, not the stale 'data' state
    await saveToDB(newData);
  };

  const deleteModel = async (index: number) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este modelo?")) return;
    
    const itemToDelete = data.aiModels.models[index] as any;
    const newModels = data.aiModels.models.filter((_: any, i: number) => i !== index);
    const newData = { ...data, aiModels: { ...data.aiModels, models: newModels } };
    
    setData(newData);

    if (itemToDelete.media?.url) await deleteFileFromStorage(itemToDelete.media.url);
    
    await saveToDB(newData);
  };

  const deleteCyberItem = async (index: number) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este elemento de seguridad?")) return;
    
    const itemToDelete = data.cybersecurity.items[index] as any;
    const newItems = data.cybersecurity.items.filter((_: any, i: number) => i !== index);
    const newData = { ...data, cybersecurity: { ...data.cybersecurity, items: newItems } };
    
    setData(newData);
    
    if (itemToDelete.media?.url) await deleteFileFromStorage(itemToDelete.media.url);
    
    await saveToDB(newData);
  };



  const deleteSection = async (index: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta sección de la vista? Los datos se mantendrán pero la sección no será visible.")) {
      const newOrder = sectionsOrder.filter((_, i) => i !== index);
      setSectionsOrder(newOrder);
      await saveToDB(data, newOrder);
    }
  };
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...sectionsOrder];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newOrder.length) {
      const temp = newOrder[index];
      newOrder[index] = newOrder[newIndex];
      newOrder[newIndex] = temp;
      setSectionsOrder(newOrder);
    }
  };


  const getSectionTitle = (id: string) => {
    switch(id) {
      case 'hero': return 'Hero / Portada';
      case 'services': return 'Servicios';
      case 'ai': return 'Modelos IA';
      case 'cyber': return 'Ciberseguridad';
      case 'cta': return 'Newsletter / Acción';
      default: return id;
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
    <div className="text-on-background selection:bg-tertiary/30 selection:text-tertiary min-h-screen bg-background pb-20">
      <style>{`
        @keyframes strong-glow {
          0%, 100% { 
            box-shadow: 0 0 5px rgba(47, 217, 244, 0.2), inset 0 0 5px rgba(47, 217, 244, 0.1);
            border-color: rgba(47, 217, 244, 0.3);
          }
          50% { 
            box-shadow: 0 0 30px rgba(47, 217, 244, 0.8), inset 0 0 20px rgba(47, 217, 244, 0.4);
            border-color: rgba(47, 217, 244, 1);
          }
        }
        .animate-strong-glow {
          animation: strong-glow 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* TopAppBar */}
      <header className={`fixed top-0 w-full z-50 bg-[#0c1324]/60 backdrop-blur-xl shadow-[0px_20px_50px_rgba(12,19,36,0.4)] flex justify-between items-center px-6 h-16 bg-gradient-to-b from-[#89ceff]/5 to-transparent transition-all duration-500 ${isMenuOpen ? "md:pl-64 lg:pl-72" : "pl-0"}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-[#2fd9f4] hover:bg-slate-800/50 transition-all p-2 rounded"
          >
            <span className="material-symbols-outlined">{isMenuOpen ? "close" : "menu"}</span>
          </button>
          <Link href="/admin">
            <button className="text-[#89ceff]">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          </Link>
          <span className="text-xl font-bold tracking-tighter text-[#2fd9f4] font-headline uppercase">editar prinsipal</span>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsOrderDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-sm font-bold uppercase tracking-widest text-[10px] bg-slate-800/50 text-[#89ceff] border border-[#89ceff]/20 hover:bg-[#89ceff]/10 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">reorder</span>
            Organizar Orden
          </button>

          <button 
            onClick={() => saveToDB(data)}
            disabled={isSaving}
            className={`flex items-center gap-2 px-6 py-2 rounded-sm font-bold uppercase tracking-widest text-xs transition-all ${
              isSaving ? "bg-slate-700 text-slate-400 cursor-not-allowed" : "bg-tertiary text-on-tertiary hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(47,217,244,0.3)]"
            }`}
          >
            <span className="material-symbols-outlined text-sm">{isSaving ? "sync" : "cloud_upload"}</span>
            {isSaving ? "Guardando..." : "Guardar en la Nube"}
          </button>

          <Link href="/admin/profile" className="h-8 w-8 rounded-full overflow-hidden bg-surface-container border border-outline-variant/15 relative block hover:scale-110 transition-transform active:scale-95">
            <Image 
              alt="Perfil" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzwkrverNl3WcBRKDtxiU35dKPAxR7_0cX_VUuKgthuJAmHjwu9XDtujDXdNpFheT-w-LGZiclzpDizH9EFrP2gH0p1bbHPEI8DJYLsVXjQ9XOaEobrIZXFZpPRQNscKFJG6KVJyZSkoy1idSgpQ0I3f1fpqd6OuDBX_M97O2Ky7mhPQUvwAKjwTmhnpRBUML054mTTXvShio2ewZojfVoMk_VlYuCwCPwGqaFr58EPenWn1yNDqV_MygtAlEUaB8aa1gq6DjxzpY"
              fill
              className="object-cover"
            />
          </Link>
        </div>
      </header>

      <AdminSidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <main 
        className={`max-w-7xl mx-auto px-6 pt-32 pb-20 transition-all duration-500 ${isMenuOpen ? "md:pl-64 lg:pl-72" : ""}`}
      >

        <div className="mb-12 bg-tertiary/10 border border-tertiary/30 p-4 rounded-sm flex items-center gap-4">
          <span className="material-symbols-outlined text-tertiary">info</span>
          <p className="text-xs font-bold uppercase tracking-widest text-tertiary">Modo Editor: Gestiona tu contenido de forma directa. Usa los iconos para editar o eliminar elementos.</p>
        </div>


        <div className="space-y-32">
          {sectionsOrder.map((sectionId, sIdx) => {
            // HERO
            if (sectionId === 'hero') return (
              <section 
                key={sectionId}
                className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative border border-dashed p-8 rounded-sm group transition-all duration-300 select-none border-tertiary/20"
              >
                {/* Section Number Badge */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-tertiary text-on-tertiary rounded-full flex items-center justify-center font-bold shadow-[0_0_15px_rgba(47,217,244,0.5)] z-30 border border-white/20 select-none">
                  {sIdx + 1}
                </div>

                <div className="absolute top-4 right-4 flex gap-2 z-20 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <Link href="/admin/products/editor?section=hero">
                    <button className="p-2 bg-black/60 rounded border border-white/20 text-white hover:bg-tertiary transition-all shadow-lg"><span className="material-symbols-outlined text-sm">edit</span></button>
                  </Link>
                  <button onClick={() => deleteSection(sIdx)} className="p-2 bg-black/60 rounded border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"><span className="material-symbols-outlined text-sm">delete</span></button>
                </div>


                <div className="lg:col-span-7">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse shadow-[0_0_10px_rgba(47,217,244,0.8)]"></span>
                    <span className="font-label text-[10px] font-bold tracking-[0.2em] uppercase text-tertiary">{data.hero.tagline}</span>
                  </div>
                  <h1 className="font-headline text-5xl lg:text-7xl font-bold leading-tight tracking-tight mb-8">
                    {data.hero.title.split(data.hero.titleHighlight)[0]}
                    <span className="text-tertiary">{data.hero.titleHighlight}</span>
                    {data.hero.title.split(data.hero.titleHighlight)[1]}
                  </h1>
                  <p className="text-body text-lg leading-relaxed text-on-surface-variant max-w-xl mb-10">{data.hero.description}</p>
                </div>
                <div className="lg:col-span-5 relative">
                   <div className="aspect-square bg-surface-container-high rounded-sm inner-glow-top flex items-center justify-center relative overflow-hidden group/viz">
                    {!isVideoLoaded && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
                         <span className="w-6 h-6 rounded-full border-2 border-tertiary border-t-transparent animate-spin"></span>
                      </div>
                    )}
                    <img 
                      ref={imgRef}
                      alt="Hero Sequence" 
                      src="/video/frames/ezgif-frame-001.jpg"
                      className="w-full h-full object-cover opacity-80" 
                    />
                    
                    {/* Scrubbing Overlay (for preview in editor) */}
                    <div 
                      className="absolute inset-0 z-20 cursor-ns-resize flex items-end justify-center pb-4 opacity-0 group-hover/viz:opacity-100 transition-opacity"
                      onWheel={(e) => {
                        e.stopPropagation();
                        updateFrame(frameRef.current + (e.deltaY * 0.05));
                      }}
                    >
                      <span className="bg-black/80 px-3 py-1 text-[10px] font-bold text-tertiary rounded-full border border-tertiary/30">SCROLL DENTRO PARA PREVIEW</span>
                    </div>
                  </div>
                </div>
              </section>
            );

            // SERVICES
            if (sectionId === 'services') return (
              <section 
                key={sectionId}
                className="relative border border-dashed p-8 rounded-sm group transition-all duration-300 select-none border-tertiary/20"
              >
                {/* Section Number Badge */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-tertiary text-on-tertiary rounded-full flex items-center justify-center font-bold shadow-[0_0_15px_rgba(47,217,244,0.5)] z-30 border border-white/20 select-none">
                  {sIdx + 1}
                </div>

                <div className="absolute top-4 right-4 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href="/admin/products/editor?section=services">
                    <button className="p-2 bg-black/60 rounded border border-white/20 text-white hover:bg-tertiary transition-all"><span className="material-symbols-outlined text-sm">edit</span></button>
                  </Link>
                  <button onClick={() => deleteSection(sIdx)} className="p-2 bg-black/60 rounded border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"><span className="material-symbols-outlined text-sm">delete</span></button>
                </div>


                <div className="flex justify-between items-center pt-10">
                   <h2 className="text-xl font-bold font-headline uppercase tracking-tighter text-tertiary">Listado de Servicios</h2>
                   <button 
                    onClick={addService}
                    className="flex items-center gap-2 px-4 py-2 bg-tertiary/10 border border-tertiary/30 text-tertiary rounded-sm font-bold uppercase tracking-widest text-[9px] hover:bg-tertiary hover:text-on-tertiary transition-all"
                   >
                     <span className="material-symbols-outlined text-xs">add</span>
                     Añadir Servicio
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  {data.services.map((service, i) => (
                    <div 
                      key={i}
                      className={`${i === 0 ? "md:col-span-2" : "md:col-span-1"} bg-surface-container-low p-10 rounded-sm inner-glow-top relative border border-dashed transition-all duration-300 border-tertiary/10 group/card`}
                    >
                      {/* Item Number Badge */}
                      <div className="absolute top-4 left-4 w-6 h-6 bg-slate-800 text-tertiary text-[10px] flex items-center justify-center font-bold border border-tertiary/20 rounded-full select-none">
                        {i + 1}
                      </div>

                      <div className="absolute top-4 right-4 flex gap-2 z-20 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <Link href={`/admin/products/editor?section=services&index=${i}`}>
                          <button className="p-1.5 bg-black/60 rounded border border-white/20 text-white hover:bg-tertiary transition-all"><span className="material-symbols-outlined text-xs">edit</span></button>
                        </Link>
                        <button onClick={() => deleteService(i)} className="p-1.5 bg-black/60 rounded border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"><span className="material-symbols-outlined text-xs">delete</span></button>
                      </div>

                      <span className="material-symbols-outlined text-tertiary mb-6 text-4xl">{service.icon}</span>
                      <h3 className="font-headline text-3xl font-bold mb-4">{service.title}</h3>
                      <p className="text-on-surface-variant leading-relaxed mb-8">{service.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            );

            // AI MODELS
            if (sectionId === 'ai') return (
              <section 
                key={sectionId}
                className="relative border border-dashed p-8 rounded-sm group transition-all duration-300 select-none border-tertiary/20"
              >
                {/* Section Number Badge */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-tertiary text-on-tertiary rounded-full flex items-center justify-center font-bold shadow-[0_0_15px_rgba(47,217,244,0.5)] z-30 border border-white/20 select-none">
                  {sIdx + 1}
                </div>

                <div className="absolute top-4 right-4 flex gap-2 z-20 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                   <Link href="/admin/products/editor?section=ai">
                    <button className="p-2 bg-black/60 rounded border border-white/20 text-white hover:bg-tertiary transition-all"><span className="material-symbols-outlined text-sm">edit</span></button>
                   </Link>
                   <button onClick={() => deleteSection(sIdx)} className="p-2 bg-black/60 rounded border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"><span className="material-symbols-outlined text-sm">delete</span></button>
                </div>


                <div className="flex justify-between items-center pt-10 mb-6">
                   <h2 className="text-xl font-bold font-headline uppercase tracking-tighter text-tertiary">Modelos y Tecnologías</h2>
                   <button 
                    onClick={addModel}
                    className="flex items-center gap-2 px-4 py-2 bg-tertiary/10 border border-tertiary/30 text-tertiary rounded-sm font-bold uppercase tracking-widest text-[9px] hover:bg-tertiary hover:text-on-tertiary transition-all"
                   >
                     <span className="material-symbols-outlined text-xs">add</span>
                     Añadir Modelo
                   </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-surface-container p-10 rounded-sm inner-glow-top border border-dashed border-tertiary/10 relative group/inner">
                    <span className="material-symbols-outlined text-tertiary mb-6 text-4xl">auto_awesome</span>
                    <h3 className="font-headline text-3xl font-bold mb-4">{data.aiModels.title}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                      {data.aiModels.models.map((model, i) => (
                        <div 
                          key={i}
                          className="bg-surface-container-lowest p-4 rounded-sm border transition-all duration-300 text-center relative group/item border-outline-variant/10"
                        >
                          {/* Item Number Badge */}
                          <div className="absolute top-1 left-1 w-4 h-4 bg-slate-900 text-tertiary text-[8px] flex items-center justify-center font-bold border border-tertiary/20 rounded-full select-none">
                            {i + 1}
                          </div>

                          <div className="absolute -top-2 -right-2 flex items-center gap-1 z-20 opacity-100 lg:opacity-0 lg:group-hover/item:opacity-100 transition-opacity">
                            <Link href={`/admin/products/editor?section=ai&index=${i}`}>
                              <button className="p-1 bg-black/60 rounded-full border border-white/20 text-white hover:bg-tertiary transition-all"><span className="material-symbols-outlined text-[10px]">edit</span></button>
                            </Link>
                            <button onClick={() => deleteModel(i)} className="p-1 bg-black/60 rounded-full border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"><span className="material-symbols-outlined text-[10px]">delete</span></button>
                          </div>

                          <p className="font-headline text-sm font-bold text-white mb-1">{model.name}</p>
                          <p className="text-[9px] text-cyan-400 uppercase tracking-widest">{model.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="aspect-video bg-black/40 rounded-sm border border-dashed border-tertiary/10 relative overflow-hidden">
                    <Image alt="Server" fill src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8g8ZfR7uXXfys5NEokNbCaHjaLz0CADi1gowHp8gb-7noJlMRljr3-mVbZP_I-FVv3sRqDQK3aUa5Au4M0zWp8e2VanLwjjeZJ5m-UdWR6Y_vkXc6icAl_JAHpeRdfxzoFh_l7NLP2HPGWifyLXpyzvHNdvwNxzqrG0G-7sQ_nqTF04XpUr-WTtef4vCakefTuACtn0qQkrMKl1DppbSiA4lIgomSkxKkOJcfpwpwpLZwLxtvWyURUB43Z_sqTjS9i8T_6t3bll0" className="object-cover opacity-30 grayscale" />
                    <div className="absolute bottom-6 left-6 font-bold text-xl">Infraestructura Crítica</div>
                  </div>
                </div>
              </section>
            );

            // CYBERSECURITY
            if (sectionId === 'cyber') return (
              <section 
                key={sectionId}
                className="relative border border-dashed p-8 rounded-sm group transition-all duration-300 select-none border-tertiary/20"
              >
                {/* Section Number Badge */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-tertiary text-on-tertiary rounded-full flex items-center justify-center font-bold shadow-[0_0_15px_rgba(47,217,244,0.5)] z-30 border border-white/20 select-none">
                  {sIdx + 1}
                </div>

                <div className="absolute top-4 right-4 flex gap-2 z-20 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <Link href="/admin/products/editor?section=cyber">
                    <button className="p-2 bg-black/60 rounded border border-white/20 text-white hover:bg-tertiary transition-all"><span className="material-symbols-outlined text-sm">edit</span></button>
                  </Link>
                  <button onClick={() => deleteSection(sIdx)} className="p-2 bg-black/60 rounded border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"><span className="material-symbols-outlined text-sm">delete</span></button>
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-10 items-center">
                  <div>
                    <div className="flex justify-between items-center mb-6">
                       <h2 className="font-headline text-4xl font-bold">{data.cybersecurity.title}</h2>
                       <button 
                        onClick={addCyberItem}
                        className="flex items-center gap-2 px-4 py-2 bg-tertiary/10 border border-tertiary/30 text-tertiary rounded-sm font-bold uppercase tracking-widest text-[9px] hover:bg-tertiary hover:text-on-tertiary transition-all"
                       >
                         <span className="material-symbols-outlined text-xs">add</span>
                         Añadir Protección
                       </button>
                    </div>
                    <p className="text-on-surface-variant mb-8">{data.cybersecurity.description}</p>
                    <div className="space-y-4">
                      {data.cybersecurity.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between gap-4 p-4 bg-surface-container rounded border border-tertiary/10 group/cyber-item relative">
                          <div className="flex items-center gap-4">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-tertiary text-[9px] flex items-center justify-center font-bold border border-tertiary/20">
                              {i + 1}
                            </span>
                            <span className="material-symbols-outlined text-tertiary">{item.icon}</span>
                            <span className="font-bold text-xs uppercase tracking-widest">{item.text}</span>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover/cyber-item:opacity-100 transition-opacity">
                             <Link href={`/admin/products/editor?section=cyber&index=${i}`}>
                               <button className="text-tertiary/40 hover:text-tertiary"><span className="material-symbols-outlined text-sm">edit</span></button>
                             </Link>
                             <button onClick={() => deleteCyberItem(i)} className="text-red-500/40 hover:text-red-500"><span className="material-symbols-outlined text-sm">delete</span></button>
                          </div>
                        </div>
                      ))}

                    </div>
                  </div>
                  <div className="aspect-video bg-black/20 rounded border border-dashed border-tertiary/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-tertiary/40 text-6xl font-thin">shield_lock</span>
                  </div>
                </div>
              </section>
            );

            // CTA / NEWSLETTER
            if (sectionId === 'cta') return (
              <section 
                key={sectionId}
                className="bg-surface-container-low p-12 rounded-sm text-center border border-dashed transition-all duration-300 select-none relative group border-tertiary/20"
              >
                {/* Section Number Badge */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-tertiary text-on-tertiary rounded-full flex items-center justify-center font-bold shadow-[0_0_15px_rgba(47,217,244,0.5)] z-30 border border-white/20 select-none">
                  {sIdx + 1}
                </div>

                <div className="absolute top-4 right-4 flex gap-2 z-20 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                   <Link href="/admin/products/editor?section=cta">
                    <button className="p-2 bg-black/60 rounded border border-white/20 text-white hover:bg-tertiary transition-all"><span className="material-symbols-outlined text-sm">edit</span></button>
                   </Link>
                   <button onClick={() => deleteSection(sIdx)} className="p-2 bg-black/60 rounded border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"><span className="material-symbols-outlined text-sm">delete</span></button>
                </div>


                <h2 className="font-headline text-4xl font-bold mb-6">{data.cta.title}</h2>
                <p className="text-on-surface-variant max-w-2xl mx-auto mb-10 text-lg">{data.cta.description}</p>
                <button className="bg-tertiary text-on-tertiary px-8 py-4 font-bold uppercase tracking-widest text-sm rounded-sm opacity-50">{data.cta.buttonText}</button>
              </section>
            );

            return null;
          })}
        </div>

        <button 
          onClick={() => {
            const sectionId = window.prompt("Ingresa el ID de la sección (ej: hero, services, ai, cyber, cta):");
            if (sectionId && !sectionsOrder.includes(sectionId)) {
               const newOrder = [...sectionsOrder, sectionId];
               setSectionsOrder(newOrder);
               saveToDB(data, newOrder);
            } else if (sectionId) {
               alert("La sección ya existe en el orden actual.");
            }
          }}
          className="w-full mt-32 py-10 border-2 border-dashed border-tertiary/10 rounded-sm hover:border-tertiary/30 hover:bg-tertiary/5 transition-all text-tertiary/50 hover:text-tertiary group flex flex-col items-center gap-2"
        >
          <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">add_box</span>
          <span className="font-bold text-xs uppercase tracking-widest">Añadir Nueva Sección</span>
        </button>
      </main>

      {/* Reorder Dialog */}
      {isOrderDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-[#0c1324]/80 backdrop-blur-md"
            onClick={() => setIsOrderDialogOpen(false)}
          ></div>
          <div className="relative w-full max-w-md bg-[#161f33] border border-tertiary/30 rounded-sm shadow-[0_0_50px_rgba(47,217,244,0.2)] overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold font-headline text-[#2fd9f4]">Cambiar Orden</h2>
                <p className="text-[10px] text-tertiary uppercase tracking-widest mt-1">Arrastra o usa las flechas</p>
              </div>
              <button 
                onClick={() => setIsOrderDialogOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {sectionsOrder.map((sectionId, index) => (
                <div 
                  key={sectionId}
                  className="flex items-center justify-between p-4 bg-surface-container-high border border-white/5 rounded-sm group hover:border-tertiary/40 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-tertiary text-[10px] flex items-center justify-center font-bold border border-tertiary/20">
                      {index + 1}
                    </span>
                    <span className="font-bold text-sm uppercase tracking-wide">{getSectionTitle(sectionId)}</span>
                  </div>
                  
                  <div className="flex gap-1">
                    <button 
                      onClick={() => moveSection(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded hover:bg-tertiary/20 text-tertiary disabled:text-slate-600 disabled:hover:bg-transparent transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">arrow_upward</span>
                    </button>
                    <button 
                      onClick={() => moveSection(index, 'down')}
                      disabled={index === sectionsOrder.length - 1}
                      className="p-1.5 rounded hover:bg-tertiary/20 text-tertiary disabled:text-slate-600 disabled:hover:bg-transparent transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">arrow_downward</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-slate-900/50 border-t border-white/10 flex gap-4">
              <button 
                onClick={() => setIsOrderDialogOpen(false)}
                className="flex-1 py-3 font-bold uppercase tracking-widest text-xs border border-white/10 hover:bg-white/5 transition-all text-slate-300"
              >
                Cancelar
              </button>
              <button 
                onClick={() => setIsOrderDialogOpen(false)}
                className="flex-1 py-3 font-bold uppercase tracking-widest text-xs bg-tertiary text-on-tertiary shadow-[0_0_20px_rgba(47,217,244,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] bg-surface-container-high border border-tertiary/30 text-white px-6 py-3 rounded-sm shadow-[0_0_30px_rgba(47,217,244,0.2)] animate-slide-up text-sm font-bold tracking-wide">
          {toast}
        </div>
      )}
    </div>
  );
}
