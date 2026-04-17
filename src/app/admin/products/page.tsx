"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { siteData as initialSiteData } from "@/data/siteData";
import AdminSidebar from "@/components/AdminSidebar";

export default function ProductsCmsPage() {
  const [data, setData] = useState(initialSiteData);
  const [sectionsOrder, setSectionsOrder] = useState(initialSiteData.sectionsOrder);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load from localeStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("sneyder_cms_data");
    const savedOrder = localStorage.getItem("sneyder_cms_order");
    if (savedData) setData(JSON.parse(savedData));
    if (savedOrder) setSectionsOrder(JSON.parse(savedOrder));
  }, []);

  const saveToLocal = () => {
    setIsSaving(true);
    localStorage.setItem("sneyder_cms_data", JSON.stringify(data));
    localStorage.setItem("sneyder_cms_order", JSON.stringify(sectionsOrder));
    
    // Simulate server delay
    setTimeout(() => {
      setIsSaving(false);
      alert("Cambios guardados localmente. Los verás reflejados en esta sesión.");
    }, 800);
  };

  const deleteService = (index: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este servicio?")) {
      const newServices = [...data.services];
      newServices.splice(index, 1);
      setData({ ...data, services: newServices });
    }
  };

  const deleteModel = (index: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este modelo?")) {
      const newModels = [...data.aiModels.models];
      newModels.splice(index, 1);
      setData({ ...data, aiModels: { ...data.aiModels, models: newModels } });
    }
  };

  const deleteCyberItem = (index: number) => {
    if (window.confirm("¿Eliminar este ítem de seguridad?")) {
      const newItems = [...data.cybersecurity.items];
      newItems.splice(index, 1);
      setData({ ...data, cybersecurity: { ...data.cybersecurity, items: newItems } });
    }
  };

  const deleteSection = (index: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta sección completa?")) {
      const newOrder = [...sectionsOrder];
      newOrder.splice(index, 1);
      setSectionsOrder(newOrder);
    }
  };


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
            onClick={saveToLocal}
            disabled={isSaving}
            className={`flex items-center gap-2 px-6 py-2 rounded-sm font-bold uppercase tracking-widest text-xs transition-all ${
              isSaving ? "bg-slate-700 text-slate-400 cursor-not-allowed" : "bg-tertiary text-on-tertiary hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(47,217,244,0.3)]"
            }`}
          >
            <span className="material-symbols-outlined text-sm">{isSaving ? "sync" : "save"}</span>
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </button>

          <div className="h-8 w-8 rounded-full overflow-hidden bg-surface-container border border-outline-variant/15 relative">
            <Image 
              alt="Perfil" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzwkrverNl3WcBRKDtxiU35dKPAxR7_0cX_VUuKgthuJAmHjwu9XDtujDXdNpFheT-w-LGZiclzpDizH9EFrP2gH0p1bbHPEI8DJYLsVXjQ9XOaEobrIZXFZpPRQNscKFJG6KVJyZSkoy1idSgpQ0I3f1fpqd6OuDBX_M97O2Ky7mhPQUvwAKjwTmhnpRBUML054mTTXvShio2ewZojfVoMk_VlYuCwCPwGqaFr58EPenWn1yNDqV_MygtAlEUaB8aa1gq6DjxzpY"
              fill
              className="object-cover"
            />
          </div>
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
                <div className="absolute top-4 right-4 flex gap-2 z-20 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <button className="p-2 bg-black/60 rounded border border-white/20 text-white hover:bg-tertiary transition-all shadow-lg"><span className="material-symbols-outlined text-sm">edit</span></button>
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
                   <div className="aspect-square bg-surface-container-high rounded-sm inner-glow-top flex items-center justify-center relative overflow-hidden">
                    <Image alt="Visual" className="w-full h-full object-cover opacity-60 mix-blend-luminosity" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDA-S-aZf_IbZ1Hk9hAJRdiCbIt4XTW_i4QxL05LmpxKYtez3E25D2raTQ_2PgqNh-mveC10uaUpgGBmqP-JhWfqSD_tO6jlQriNbwz42qreNaRPGRNt4KXEAfXIv6pTPTAKpVoZ-kv5WEerD9dWzkXPgznx9xhNwwJW9nV5uoBhKIFDrc42rqcmXZyPs2iZwOBUlH6aW1N9N2Q6nY0_5kxx-FBCrxSLz9qfec91jdu1cR2l3wx9ynQzj9gpBVBcSz8Iwico0f90A0" fill />
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
                <div className="absolute top-4 right-4 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 bg-black/60 rounded border border-white/20 text-white hover:bg-tertiary transition-all"><span className="material-symbols-outlined text-sm">edit</span></button>
                  <button onClick={() => deleteSection(sIdx)} className="p-2 bg-black/60 rounded border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"><span className="material-symbols-outlined text-sm">delete</span></button>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
                  {data.services.map((service, i) => (
                    <div 
                      key={i}
                      className={`${i === 0 ? "md:col-span-2" : "md:col-span-1"} bg-surface-container-low p-10 rounded-sm inner-glow-top relative border border-dashed transition-all duration-300 border-tertiary/10 group/card`}
                    >

                      <div className="absolute top-4 right-4 flex gap-2 z-20 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 bg-black/60 rounded border border-white/20 text-white hover:bg-tertiary transition-all"><span className="material-symbols-outlined text-xs">edit</span></button>
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
                <div className="absolute top-4 right-4 flex gap-2 z-20 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                   <button className="p-2 bg-black/60 rounded border border-white/20 text-white hover:bg-tertiary transition-all"><span className="material-symbols-outlined text-sm">edit</span></button>
                   <button onClick={() => deleteSection(sIdx)} className="p-2 bg-black/60 rounded border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"><span className="material-symbols-outlined text-sm">delete</span></button>
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-10">
                  <div className="bg-surface-container p-10 rounded-sm inner-glow-top border border-dashed border-tertiary/10 relative group/inner">
                    <span className="material-symbols-outlined text-tertiary mb-6 text-4xl">auto_awesome</span>
                    <h3 className="font-headline text-3xl font-bold mb-4">{data.aiModels.title}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                      {data.aiModels.models.map((model, i) => (
                        <div 
                          key={i}
                          className="bg-surface-container-lowest p-4 rounded-sm border transition-all duration-300 text-center relative group/item border-outline-variant/10"
                        >

                          <div className="absolute -top-2 -right-2 flex items-center gap-1 z-20 opacity-100 lg:opacity-0 lg:group-hover/item:opacity-100 transition-opacity">
                            <button className="p-1 bg-black/60 rounded-full border border-white/20 text-white hover:bg-tertiary transition-all"><span className="material-symbols-outlined text-[10px]">edit</span></button>
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
                <div className="absolute top-4 right-4 flex gap-2 z-20 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <button className="p-2 bg-black/60 rounded border border-white/20 text-white hover:bg-tertiary transition-all"><span className="material-symbols-outlined text-sm">edit</span></button>
                  <button onClick={() => deleteSection(sIdx)} className="p-2 bg-black/60 rounded border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"><span className="material-symbols-outlined text-sm">delete</span></button>
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-10 items-center">
                  <div>
                    <h2 className="font-headline text-4xl font-bold mb-6">{data.cybersecurity.title}</h2>
                    <p className="text-on-surface-variant mb-8">{data.cybersecurity.description}</p>
                    <div className="space-y-4">
                      {data.cybersecurity.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between gap-4 p-4 bg-surface-container rounded border border-tertiary/10 group/cyber-item">
                          <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-tertiary">{item.icon}</span>
                            <span className="font-bold text-xs uppercase tracking-widest">{item.text}</span>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover/cyber-item:opacity-100 transition-opacity">
                             <button className="text-tertiary/40 hover:text-tertiary"><span className="material-symbols-outlined text-sm">edit</span></button>
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
                <div className="absolute top-4 right-4 flex gap-2 z-20 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                   <button className="p-2 bg-black/60 rounded border border-white/20 text-white hover:bg-tertiary transition-all"><span className="material-symbols-outlined text-sm">edit</span></button>
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

        <button className="w-full mt-32 py-10 border-2 border-dashed border-tertiary/10 rounded-sm hover:border-tertiary/30 hover:bg-tertiary/5 transition-all text-tertiary/50 hover:text-tertiary group flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">add_box</span>
          <span className="font-bold text-xs uppercase tracking-widest">Añadir Nueva Sección</span>
        </button>
      </main>
    </div>
  );
}
