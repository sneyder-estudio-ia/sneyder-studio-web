"use client";

import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, addDoc, collection } from "firebase/firestore";
import { getCMSData } from "@/lib/cms";
import { getAdminSettings } from "@/lib/settings";

const ADMIN_EMAIL = "sneyder23081994@gmail.com";

const platformOptions = [
  { id: 'web', name: 'Web', icon: 'language', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'android', name: 'APK Android', icon: 'android', color: 'text-green-400', bg: 'bg-green-400/10' },
  { id: 'ios', name: 'APK iPhone', icon: 'phone_iphone', color: 'text-slate-200', bg: 'bg-slate-200/10' },
  { id: 'linux', name: 'Linux', icon: 'terminal', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { id: 'windows', name: 'Windows', icon: 'window', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'mac', name: 'Mac', icon: 'laptop_mac', color: 'text-slate-200', bg: 'bg-slate-200/10' },
  { id: 'multi', name: 'Multiplataforma', icon: 'devices', color: 'text-purple-400', bg: 'bg-purple-400/10' },
];

const databaseOptions = [
  { id: 'firebase', name: 'Firebase', icon: 'local_fire_department', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { id: 'supabase', name: 'Supabase', icon: 'water_drop', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: 'inforger', name: 'Inforger', icon: 'database', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
];

const techOptionsByPlatform: Record<string, {id: string, name: string, icon: string, color: string, bg: string}[]> = {
  web: [
    { id: 'developer_choice', name: 'A elección del desarrollador', icon: 'psychology', color: 'text-tertiary', bg: 'bg-tertiary/10' },
    { id: 'nextjs', name: 'Next.js', icon: 'code', color: 'text-slate-200', bg: 'bg-slate-200/10' },
    { id: 'react', name: 'React', icon: 'integration_instructions', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { id: 'vue', name: 'Vue.js', icon: 'view_in_ar', color: 'text-green-400', bg: 'bg-green-400/10' },
  ],
  android: [
    { id: 'developer_choice', name: 'A elección del desarrollador', icon: 'psychology', color: 'text-tertiary', bg: 'bg-tertiary/10' },
    { id: 'kotlin', name: 'Kotlin', icon: 'android', color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { id: 'java', name: 'Java', icon: 'coffee', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  ],
  ios: [
    { id: 'developer_choice', name: 'A elección del desarrollador', icon: 'psychology', color: 'text-tertiary', bg: 'bg-tertiary/10' },
    { id: 'swift', name: 'Swift', icon: 'phone_iphone', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ],
  linux: [
    { id: 'developer_choice', name: 'A elección del desarrollador', icon: 'psychology', color: 'text-tertiary', bg: 'bg-tertiary/10' },
    { id: 'python', name: 'Python', icon: 'terminal', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { id: 'cplusplus', name: 'C++', icon: 'data_object', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ],
  windows: [
    { id: 'developer_choice', name: 'A elección del desarrollador', icon: 'psychology', color: 'text-tertiary', bg: 'bg-tertiary/10' },
    { id: 'csharp', name: 'C# / .NET', icon: 'window', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'cplusplus-win', name: 'C++', icon: 'data_object', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ],
  mac: [
    { id: 'developer_choice', name: 'A elección del desarrollador', icon: 'psychology', color: 'text-tertiary', bg: 'bg-tertiary/10' },
    { id: 'swift-mac', name: 'Swift', icon: 'laptop_mac', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ],
  multi: [
    { id: 'flutter', name: 'Flutter', icon: 'flutter_dash', color: 'text-cyan-400', bg: 'bg-cyan-400/10' }
  ]
};

export default function ContactoPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [showModal, setShowModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [wantsCredit, setWantsCredit] = useState(false);
  const [creditMonths, setCreditMonths] = useState(6);
  const [estimatedBudget, setEstimatedBudget] = useState("");
  const [paymentDay, setPaymentDay] = useState(1);
  const [adminSettings, setAdminSettings] = useState<any>(null);
  const [activeFaqId, setActiveFaqId] = useState<string | null>(null);
  const faqSectionRef = useRef<HTMLDivElement>(null);
  const [activeEditor, setActiveEditor] = useState<'projectDescription' | 'businessDescription' | null>(null);

  const [formFields, setFormFields] = useState({
    fullName: "",
    email: "",
    phone: "",
    projectSubject: "Desarrollo Web / App",
    projectDescription: "",
    businessDescription: "",
    platforms: [] as string[],
    technologies: {} as Record<string, string[]>,
    multiDeployments: [] as string[],
    databases: [] as string[],
  });

  const getInterestRate = () => adminSettings?.credit_monthly_interest ? (Number(adminSettings.credit_monthly_interest) / 100) : 0.15;
  const getInterestRateDisplay = () => adminSettings?.credit_monthly_interest || "15";
  const getDownPaymentRate = () => adminSettings?.credit_min_down_payment ? (Number(adminSettings.credit_min_down_payment) / 100) : 0.20;
  const getDownPaymentDisplay = () => adminSettings?.credit_min_down_payment || "20";

  const getTotalBudget = () => {
    let budgetValue = parseFloat(estimatedBudget) || 0;
    let extraCost = 0;
    if (adminSettings && formFields.platforms.length > 0) {
      const prices = {
        android: parseFloat(adminSettings.platform_price_android) || 0,
        ios: parseFloat(adminSettings.platform_price_iphone) || 0,
        windows: parseFloat(adminSettings.platform_price_windows) || 0,
        linux: parseFloat(adminSettings.platform_price_linux) || 0,
        mac: parseFloat(adminSettings.platform_price_mac) || 0,
        web: parseFloat(adminSettings.platform_price_web) || 0,
      };
      
      let selectedPrices: number[] = [];
      
      if (formFields.platforms.includes('multi')) {
        if (formFields.multiDeployments.includes('android')) selectedPrices.push(prices.android);
        if (formFields.multiDeployments.includes('ios')) selectedPrices.push(prices.ios);
        if (formFields.multiDeployments.includes('windows')) selectedPrices.push(prices.windows);
        if (formFields.multiDeployments.includes('linux')) selectedPrices.push(prices.linux);
        if (formFields.multiDeployments.includes('mac')) selectedPrices.push(prices.mac);
        if (formFields.multiDeployments.includes('web')) selectedPrices.push(prices.web);
        if (formFields.platforms.includes('web') && !formFields.multiDeployments.includes('web')) selectedPrices.push(prices.web);
      } else {
        if (formFields.platforms.includes('android')) selectedPrices.push(prices.android);
        if (formFields.platforms.includes('ios')) selectedPrices.push(prices.ios);
        if (formFields.platforms.includes('windows')) selectedPrices.push(prices.windows);
        if (formFields.platforms.includes('linux')) selectedPrices.push(prices.linux);
        if (formFields.platforms.includes('mac')) selectedPrices.push(prices.mac);
        if (formFields.platforms.includes('web')) selectedPrices.push(prices.web);
      }
      
      selectedPrices.sort((a, b) => b - a);
      if (selectedPrices.length > 0) {
        selectedPrices.shift();
      }
      extraCost = selectedPrices.reduce((a, b) => a + b, 0);
    }
    return budgetValue + extraCost;
  };

  const calculateMonthlyPayment = () => {
    const budgetValue = getTotalBudget();
    if (budgetValue === 0) return 0;
    const initialPayment = budgetValue * getDownPaymentRate();
    const remainingAmount = budgetValue - initialPayment;
    const resourceFee = budgetValue * 0.01;
    const interestAmount = remainingAmount * getInterestRate();
    const totalToFinance = remainingAmount + resourceFee + interestAmount;
    return (totalToFinance / creditMonths).toFixed(2);
  };

  useEffect(() => {
    const loadContent = async () => {
      const dbData = await getCMSData();
      setData(dbData);
      const settings = await getAdminSettings();
      setAdminSettings(settings);
    };
    loadContent();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profileDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
          if (profileDoc.exists()) {
            setUserProfile(profileDoc.data());
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (activeFaqId && faqSectionRef.current) {
        const rect = faqSectionRef.current.getBoundingClientRect();
        // Close if the section is mostly out of the viewport
        if (rect.bottom < 50 || rect.top > window.innerHeight - 50) {
          setActiveFaqId(null);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeFaqId]);


  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
    setIsMenuOpen(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFields.projectDescription.trim() || !formFields.businessDescription.trim()) {
      alert("Por favor complete la descripción del proyecto y de su negocio utilizando los botones correspondientes.");
      return;
    }
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    setFormStatus('sending');
    try {
      const budgetValue = getTotalBudget();
      const orderData: any = {
        user_id: user.uid,
        status: "processing",
        created_at: new Date().toISOString(),
        total: budgetValue,
        items: [{ name: formFields.projectSubject, price: budgetValue, description: formFields.projectDescription }],
        current_step: 1,
        // Proposal details
        proposal: {
          full_name: formFields.fullName || userProfile?.manager_name || user.displayName || "",
          email: formFields.email || user.email || "",
          phone: formFields.phone || userProfile?.whatsapp || "",
          project_subject: formFields.projectSubject,
          project_description: formFields.projectDescription,
          business_description: formFields.businessDescription,
          platforms: formFields.platforms,
          technologies: formFields.technologies,
          multiDeployments: formFields.multiDeployments,
          databases: formFields.databases,
          submitted_at: new Date().toISOString(),
        },
        // Payment info
        payment_method: wantsCredit ? "credito" : "contado",
        credit_info: wantsCredit ? {
          wants_credit: true,
          budget: budgetValue,
          initial_payment: budgetValue * getDownPaymentRate(),
          resource_fee: budgetValue * 0.01,
          interest_rate: parseFloat(getInterestRateDisplay()),
          months: creditMonths,
          monthly_payment: parseFloat(calculateMonthlyPayment() as string) || 0,
          total_with_interest: (budgetValue * (1 - getDownPaymentRate())) * (1 + getInterestRate()) + budgetValue * 0.01 + budgetValue * getDownPaymentRate(),
          payments_start: "after_completion",
        } : null,
      };
      await addDoc(collection(db, 'orders'), orderData);
      
      // Crear notificación para el usuario
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        title: "Propuesta recibida",
        message: `Hemos recibido tu solicitud para "${formFields.projectSubject}". Un especialista la revisará pronto.`,
        type: "success",
        unread: true,
        createdAt: new Date(),
      });

      setFormStatus('success');
      setShowModal(true);
      // Reset form
      setFormFields({ fullName: "", email: "", phone: "", projectSubject: "Desarrollo Web / App", projectDescription: "", businessDescription: "", platforms: [], technologies: {}, multiDeployments: [], databases: [] });
      setEstimatedBudget("");
      setWantsCredit(false);
      setCreditMonths(6);
      setTimeout(() => { setFormStatus('idle'); }, 5000);
    } catch (err) {
      console.error("Error submitting proposal:", err);
      setFormStatus('error');
      alert("Error al enviar la propuesta. Intente de nuevo.");
      setTimeout(() => { setFormStatus('idle'); }, 3000);
    }
  };

  if (!data) return (
    <div className="bg-background min-h-screen flex items-center justify-center text-center px-6">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-32 h-32 mb-4">
          <Image src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png" alt="Sneyder Studio Logo" fill className="object-contain animate-pulse" />
        </div>
        <div className="w-16 h-1 bg-tertiary/20 rounded-full overflow-hidden relative">
          <div className="absolute inset-0 bg-tertiary animate-loading-bar"></div>
        </div>
        <span className="text-tertiary font-bold tracking-[0.5em] uppercase text-[10px]">Preparando canales de comunicación...</span>
      </div>
    </div>
  );

  return (
    <div className="text-on-background selection:bg-tertiary/30 selection:text-tertiary min-h-screen bg-background relative overflow-x-hidden">
      {/* Header */}
      <header className={`fixed top-0 w-full z-60 bg-[#0c1324] border-b border-slate-800 flex justify-between items-center px-4 h-16 shadow-[0px_2px_10px_rgba(0,0,0,0.5)] transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-80" : "pl-0"}`}>
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="text-cyan-400 hover:bg-slate-800 p-2 rounded-full transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="text-white font-headline font-bold text-sm uppercase tracking-[0.2em]">Crea Pedido</span>
        </div>
        <div className="flex items-center gap-2">
          {!user && (
            <Link href="/" className="bg-tertiary/10 border border-tertiary/50 text-tertiary px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-tertiary hover:text-on-tertiary transition-all">Acceder</Link>
          )}
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
          <NavItem icon="home" label="Inicio" href="/" onClick={() => setIsMenuOpen(false)} />
          <NavItem icon="account_circle" label="Perfil de usuario" href="/profile" onClick={() => setIsMenuOpen(false)} />
          {user?.email === ADMIN_EMAIL && <NavItem icon="settings" label="Administración" href="/admin" onClick={() => setIsMenuOpen(false)} />}
          <NavItem icon="shopping_bag" label="Mis pedidos" href="/mis-pedidos" onClick={() => setIsMenuOpen(false)} />
          <NavItem icon="bolt" label="Servicios" href="/servicios" onClick={() => setIsMenuOpen(false)} />
          <NavItem icon="psychology" label="Modelo de IA" href="/ia-models" onClick={() => setIsMenuOpen(false)} />
          <NavItem icon="mail" label="Crea pedido" href="/contacto" active onClick={() => setIsMenuOpen(false)} />
          
          <div className="pt-6 pb-2 px-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Legal</div>
          <NavItem icon="policy" label="Política y condiciones" href="/politicas" small onClick={() => setIsMenuOpen(false)} />
          <NavItem icon="gavel" label="Términos de servicio" href="/terminos" small onClick={() => setIsMenuOpen(false)} />
          <NavItem icon="description" label="Contrato de servicios" href="/contrato" small onClick={() => setIsMenuOpen(false)} />

          <div className="pt-6 pb-2 px-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Empresa</div>
          <NavItem icon="info" label="Acerca de nosotros" href="/nosotros" small onClick={() => setIsMenuOpen(false)} />
          <NavItem icon="support_agent" label="Soporte Técnico" href="https://wa.me/50688888888" small onClick={() => setIsMenuOpen(false)} />

          {user && (
            <button 
              onClick={() => {
                handleSignOut();
                setIsMenuOpen(false);
              }} 
              className="flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors w-full text-left"
            >
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <header className="mb-20 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(47,217,244,0.8)]"></span>
              <span className="font-label text-xs font-bold tracking-[0.3em] uppercase text-cyan-400">Canal Directo</span>
            </div>
            <h1 className="font-headline text-5xl md:text-8xl font-black text-white mb-6">Hablemos de su <span className="text-tertiary">Próximo Nivel</span></h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl leading-relaxed">Nuestro equipo de arquitectura digital está listo para transformar sus ideas en experiencias de alta fidelidad. <span className="text-tertiary font-bold block mt-4 animate-fade-in sm:inline sm:mt-0">Puede enviar su solicitud sin compromiso; no hay cargos por el envío de su propuesta.</span></p>
          </header>

          <div className="grid grid-cols-1 gap-16 items-start">
            {/* Contact Form */}
            <div className="bg-surface-container-low p-5 sm:p-8 md:p-12 rounded-3xl sm:rounded-[2.5rem] border border-white/5 relative overflow-hidden animate-fade-in delay-100 w-full max-w-full">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-tertiary/10 rounded-full blur-[80px]"></div>
              <h3 className="font-headline text-3xl font-bold text-white mb-8">Enviar un mensaje</h3>
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2 sm:ml-4">Nombre Completo</label>
                    <input required type="text" placeholder="Ej. Juan Pérez" value={formFields.fullName} onChange={(e) => setFormFields(prev => ({...prev, fullName: e.target.value}))} className="w-full bg-white/5 border border-white/10 focus:border-tertiary/50 outline-none rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-white transition-all backdrop-blur-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2 sm:ml-4">Correo Electrónico</label>
                    <input required type="email" placeholder="correo@empresa.com" value={formFields.email} onChange={(e) => setFormFields(prev => ({...prev, email: e.target.value}))} className="w-full bg-white/5 border border-white/10 focus:border-tertiary/50 outline-none rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-white transition-all backdrop-blur-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2 sm:ml-4">Teléfono / WhatsApp</label>
                    <input type="tel" placeholder="+506 0000 0000" value={formFields.phone} onChange={(e) => setFormFields(prev => ({...prev, phone: e.target.value}))} className="w-full bg-white/5 border border-white/10 focus:border-tertiary/50 outline-none rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-white transition-all backdrop-blur-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2 sm:ml-4">Asunto del Proyecto</label>
                    <select value={formFields.projectSubject} onChange={(e) => setFormFields(prev => ({...prev, projectSubject: e.target.value}))} className="w-full bg-white/5 border border-white/10 focus:border-tertiary/50 outline-none rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-white transition-all backdrop-blur-xl appearance-none">
                      <option className="bg-[#0c1324]">Desarrollo Web / App</option>
                      <option className="bg-[#0c1324]">Implementación de IA</option>
                      <option className="bg-[#0c1324]">Consultoría Estratégica</option>
                      <option className="bg-[#0c1324]">Otro</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2 sm:ml-4">¿Qué desea que construyamos?</label>
                    <button type="button" onClick={() => setActiveEditor('projectDescription')} className="w-full bg-white/5 border border-white/10 hover:border-tertiary/50 outline-none rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-white transition-all backdrop-blur-xl flex justify-between items-center text-left min-h-[100px] sm:min-h-[120px]">
                      <span className={formFields.projectDescription ? "text-white text-sm line-clamp-3" : "text-slate-500 text-sm"}>
                        {formFields.projectDescription || "Describa el software, app o sistema que tiene en mente..."}
                      </span>
                      <span className="material-symbols-outlined text-cyan-400 shrink-0 ml-4">edit_note</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2 sm:ml-4">Sobre su Empresa o Negocio</label>
                    <button type="button" onClick={() => setActiveEditor('businessDescription')} className="w-full bg-white/5 border border-white/10 hover:border-tertiary/50 outline-none rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-white transition-all backdrop-blur-xl flex justify-between items-center text-left min-h-[100px] sm:min-h-[120px]">
                      <span className={formFields.businessDescription ? "text-white text-sm line-clamp-3" : "text-slate-500 text-sm"}>
                        {formFields.businessDescription || "Cuéntenos qué hace su empresa y cuáles son sus objetivos..."}
                      </span>
                      <span className="material-symbols-outlined text-cyan-400 shrink-0 ml-4">edit_note</span>
                    </button>
                  </div>
                </div>

                {/* Plataformas */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2">Plataformas Objetivo</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    {platformOptions.map((opt) => (
                      <div key={opt.id} className="space-y-3">
                        <label className={`flex items-center gap-3 p-3 sm:p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] ${formFields.platforms.includes(opt.id) ? 'bg-white/10 border-tertiary/50 shadow-[0_0_15px_rgba(47,217,244,0.1)]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
                          <div className="relative flex-shrink-0">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={formFields.platforms.includes(opt.id)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setFormFields(prev => {
                                  const newPlatforms = checked ? [...prev.platforms, opt.id] : prev.platforms.filter(p => p !== opt.id);
                                  const newTechs = { ...prev.technologies };
                                  if (!checked) {
                                    delete newTechs[opt.id];
                                  } else if (opt.id === 'multi') {
                                    newTechs[opt.id] = ['flutter'];
                                  } else {
                                    newTechs[opt.id] = ['developer_choice']; // Default a elección del dev
                                  }
                                  return { ...prev, platforms: newPlatforms, technologies: newTechs };
                                });
                              }}
                            />
                            <div className="w-5 h-5 rounded border border-white/20 bg-black/20 peer-checked:bg-tertiary peer-checked:border-tertiary flex items-center justify-center transition-all">
                              {formFields.platforms.includes(opt.id) && <span className="material-symbols-outlined text-[14px] text-[#0c1324] font-bold">check</span>}
                            </div>
                          </div>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${opt.bg} shrink-0`}>
                            <span className={`material-symbols-outlined text-lg ${opt.color}`}>{opt.icon}</span>
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-slate-200 line-clamp-1">{opt.name}</span>
                        </label>

                        {formFields.platforms.includes(opt.id) && (
                          <div className="pl-6 sm:pl-8 mt-2 space-y-2 animate-fade-in">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2">Tecnologías para {opt.name}</p>
                            <div className="grid grid-cols-1 gap-2">
                              {techOptionsByPlatform[opt.id]?.map(tech => (
                                <label key={tech.id} className={`flex items-center gap-3 p-2.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] ${formFields.technologies[opt.id]?.includes(tech.id) ? 'bg-white/10 border-tertiary/30' : 'bg-black/20 border-white/5 hover:border-white/10'}`}>
                                  <div className="relative flex-shrink-0">
                                    <input
                                      type="checkbox"
                                      className="sr-only peer"
                                      checked={formFields.technologies[opt.id]?.includes(tech.id) || false}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        if (opt.id === 'multi') return; // En multi no se puede cambiar, siempre es flutter

                                        setFormFields(prev => {
                                          let platformTechs = prev.technologies[opt.id] || [];
                                          
                                          if (checked) {
                                            if (tech.id === 'developer_choice') {
                                              platformTechs = ['developer_choice'];
                                            } else {
                                              platformTechs = platformTechs.filter(t => t !== 'developer_choice');
                                              platformTechs.push(tech.id);
                                            }
                                          } else {
                                            platformTechs = platformTechs.filter(t => t !== tech.id);
                                            if (platformTechs.length === 0) platformTechs = ['developer_choice'];
                                          }

                                          return {
                                            ...prev,
                                            technologies: {
                                              ...prev.technologies,
                                              [opt.id]: platformTechs
                                            }
                                          };
                                        });
                                      }}
                                    />
                                    <div className="w-4 h-4 rounded border border-white/20 bg-black/40 peer-checked:bg-tertiary peer-checked:border-tertiary flex items-center justify-center transition-all">
                                      {formFields.technologies[opt.id]?.includes(tech.id) && <span className="material-symbols-outlined text-[10px] text-[#0c1324] font-bold">check</span>}
                                    </div>
                                  </div>
                                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${tech.bg} shrink-0`}>
                                    <span className={`material-symbols-outlined text-sm ${tech.color}`}>{tech.icon}</span>
                                  </div>
                                  <span className="text-[11px] sm:text-xs font-bold text-slate-300">{tech.name}</span>
                                </label>
                              ))}
                            </div>
                            
                            {opt.id === 'multi' && (
                              <div className="mt-4 space-y-2 animate-fade-in">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-tertiary ml-2">Despliegues Multiplataforma</p>
                                <div className="grid grid-cols-1 gap-2">
                                  {[
                                    { id: 'web', name: 'Web', price: adminSettings?.platform_price_web, icon: 'language', color: 'text-blue-400' },
                                    { id: 'android', name: 'Android', price: adminSettings?.platform_price_android, icon: 'android', color: 'text-green-400' },
                                    { id: 'ios', name: 'iPhone', price: adminSettings?.platform_price_iphone, icon: 'phone_iphone', color: 'text-slate-200' },
                                    { id: 'windows', name: 'Windows', price: adminSettings?.platform_price_windows, icon: 'window', color: 'text-blue-500' },
                                    { id: 'linux', name: 'Linux', price: adminSettings?.platform_price_linux, icon: 'terminal', color: 'text-yellow-400' },
                                    { id: 'mac', name: 'Mac', price: adminSettings?.platform_price_mac, icon: 'laptop_mac', color: 'text-slate-200' },
                                  ].map(deploy => (
                                    <label key={deploy.id} className={`flex items-center justify-between p-2.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] ${formFields.multiDeployments.includes(deploy.id) ? 'bg-tertiary/10 border-tertiary/50' : 'bg-black/20 border-white/5 hover:border-white/10'}`}>
                                      <div className="flex items-center gap-3">
                                        <div className="relative flex-shrink-0">
                                          <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formFields.multiDeployments.includes(deploy.id)}
                                            onChange={(e) => {
                                              const checked = e.target.checked;
                                              setFormFields(prev => ({
                                                ...prev,
                                                multiDeployments: checked ? [...prev.multiDeployments, deploy.id] : prev.multiDeployments.filter(d => d !== deploy.id)
                                              }));
                                            }}
                                          />
                                          <div className="w-4 h-4 rounded border border-white/20 bg-black/40 peer-checked:bg-tertiary peer-checked:border-tertiary flex items-center justify-center transition-all">
                                            {formFields.multiDeployments.includes(deploy.id) && <span className="material-symbols-outlined text-[10px] text-[#0c1324] font-bold">check</span>}
                                          </div>
                                        </div>
                                        <span className={`material-symbols-outlined text-sm ${deploy.color}`}>{deploy.icon}</span>
                                        <span className="text-[11px] sm:text-xs font-bold text-slate-300">{deploy.name}</span>
                                      </div>
                                      <span className="text-[10px] text-tertiary font-bold">+${deploy.price || 0}</span>
                                    </label>
                                  ))}
                                </div>
                                <div className="mt-4 p-3 sm:p-4 bg-tertiary/5 border border-tertiary/10 rounded-2xl animate-fade-in">
                                  <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">info</span> ¿Por qué cobramos despliegues adicionales?
                                  </p>
                                  <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                                    El primer despliegue <strong className="text-white">es gratuito</strong>. Los adicionales suman un costo por razones técnicas:
                                  </p>
                                  <ul className="text-[10px] text-slate-400 space-y-2 list-disc pl-4 leading-relaxed">
                                    <li><strong className="text-white">Ajustes de UI/UX:</strong> La interfaz de Android no se ve igual en un iPhone o en una pantalla de 24 pulgadas de Windows. Debo adaptar los menús, las fuentes y los espacios para que se vea profesional en cada sistema.</li>
                                    <li><strong className="text-white">Compatibilidad de Librerías:</strong> Muchos de los plugins que usamos para Android no funcionan igual en iOS o Windows. Debo programar las alternativas o configurar las dependencias específicas para cada uno.</li>
                                    <li><strong className="text-white">Ciclo de Testing:</strong> Debo probar la aplicación de principio a fin en un dispositivo real (o simulador) de cada plataforma para garantizar que no haya errores de memoria o cierres inesperados.</li>
                                    <li><strong className="text-white">Hardware:</strong> El despliegue en iOS requiere infraestructura de Apple (Mac y certificados), lo cual es un costo de equipo y tiempo técnico especializado.</li>
                                  </ul>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bases de Datos */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2">Tecnología de Base de Datos</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {databaseOptions.map((opt) => (
                      <label key={opt.id} className={`flex items-center gap-3 p-3 sm:p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] ${formFields.databases.includes(opt.id) ? 'bg-white/10 border-tertiary/50 shadow-[0_0_15px_rgba(47,217,244,0.1)]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
                        <div className="relative flex-shrink-0">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={formFields.databases.includes(opt.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormFields(prev => ({
                                ...prev,
                                databases: checked ? [...prev.databases, opt.id] : prev.databases.filter(p => p !== opt.id)
                              }));
                            }}
                          />
                          <div className="w-5 h-5 rounded border border-white/20 bg-black/20 peer-checked:bg-tertiary peer-checked:border-tertiary flex items-center justify-center transition-all">
                            {formFields.databases.includes(opt.id) && <span className="material-symbols-outlined text-[14px] text-[#0c1324] font-bold">check</span>}
                          </div>
                        </div>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${opt.bg} shrink-0`}>
                          <span className={`material-symbols-outlined text-lg ${opt.color}`}>{opt.icon}</span>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-slate-200">{opt.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2 sm:ml-4">Presupuesto Estimado ($ USD)</label>
                    <input required type="number" value={estimatedBudget} onChange={(e) => setEstimatedBudget(e.target.value)} placeholder="Ej. 1500" className="w-full bg-white/5 border border-white/10 focus:border-tertiary/50 outline-none rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-white transition-all backdrop-blur-xl" />
                  </div>
                  {getTotalBudget() > parseFloat(estimatedBudget || "0") && (
                    <div className="p-3 bg-tertiary/10 border border-tertiary/20 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-tertiary">Despliegues Adicionales</p>
                        <p className="text-xs text-slate-400">Las plataformas extra suman un costo</p>
                      </div>
                      <p className="text-sm font-bold text-tertiary">+${(getTotalBudget() - parseFloat(estimatedBudget || "0")).toFixed(2)}</p>
                    </div>
                  )}
                </div>
                {/* Checkbox Quiero Crédito */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-6">
                  <label className="flex items-center gap-4 cursor-pointer select-none">
                    <div className="relative shrink-0">
                      <input type="checkbox" checked={wantsCredit} onChange={() => setWantsCredit(!wantsCredit)} className="sr-only peer" />
                      <div className="w-6 h-6 rounded-lg border-2 border-white/20 bg-white/5 peer-checked:bg-cyan-400 peer-checked:border-cyan-400 transition-all flex items-center justify-center">
                        {wantsCredit && <span className="material-symbols-outlined text-[16px] text-[#0c1324] font-bold">check</span>}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm sm:text-base">Quiero Crédito</h4>
                      <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-widest font-bold">Activar opciones de financiamiento</p>
                    </div>
                  </label>
                </div>
                {/* Pago de contado (sin crédito) */}
                {!wantsCredit && getTotalBudget() > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4 animate-fade-in">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-green-400 text-xl">account_balance_wallet</span>
                      </div>
                      <div>
                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500">Método de Pago</p>
                        <h4 className="text-white font-bold text-sm sm:text-base">Pago de Contado</h4>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/5 text-center">
                        <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">Inicial ({getDownPaymentDisplay()}%)</p>
                        <p className="text-lg sm:text-xl font-headline font-black text-cyan-400">${(getTotalBudget() * getDownPaymentRate()).toFixed(2)}</p>
                        <p className="text-[8px] sm:text-[9px] text-slate-500 mt-1">Para iniciar</p>
                      </div>
                      <div className="bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/5 text-center">
                        <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">Final ({100 - Number(getDownPaymentDisplay())}%)</p>
                        <p className="text-lg sm:text-xl font-headline font-black text-green-400">${(getTotalBudget() * (1 - getDownPaymentRate())).toFixed(2)}</p>
                        <p className="text-[8px] sm:text-[9px] text-slate-500 mt-1">Al entregar</p>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/5 flex items-center justify-between">
                      <div><p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-500">Cargo por recurso (1%)</p><p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Para costos operativos</p></div>
                      <p className="text-xs sm:text-sm font-bold text-white">${(getTotalBudget() * 0.01).toFixed(2)} USD</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/5 flex items-center justify-between">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Total a Pagar</p>
                      <p className="text-lg sm:text-xl font-headline font-black text-tertiary">${(getTotalBudget() * 1.01).toFixed(2)} USD</p>
                    </div>
                  </div>
                )}
                {/* Tarjeta de crédito / financiamiento */}
                {wantsCredit && (
                  <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden transition-all duration-500 animate-fade-in w-full max-w-full">
                    <div className="px-5 py-4 sm:px-6 sm:py-5 flex items-center gap-3 sm:gap-4 border-b border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-cyan-400/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-cyan-400 text-xl">payments</span>
                      </div>
                      <div>
                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500">Opciones de Financiamiento</p>
                        <h4 className="text-white font-bold text-sm sm:text-base">Crédito</h4>
                      </div>
                    </div>
                    <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-4 space-y-5 sm:space-y-6">
                      <div className="p-3 sm:p-4 bg-tertiary/5 border border-tertiary/10 rounded-2xl">
                        <p className="text-[9px] sm:text-[10px] text-tertiary font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-sm">info</span> Info. de Crédito</p>
                        <p className="text-slate-400 text-[10px] sm:text-xs leading-relaxed">Sneyder Studio le permite financiar su contrato con un <span className="text-white font-bold">{getInterestRateDisplay()}% de interés</span> sobre el monto restante + <span className="text-white font-bold">1% de recurso</span>. Se realiza un pago inicial del {getDownPaymentDisplay()}% para comenzar, y el saldo se paga mes a mes tras la entrega del proyecto.</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-500 mx-1">Plazo de Pago</label>
                        <select value={creditMonths} onChange={(e) => setCreditMonths(parseInt(e.target.value))} className="w-full bg-black/20 border border-white/5 rounded-xl py-2 sm:py-3 px-3 sm:px-4 text-white focus:border-tertiary outline-none text-xs sm:text-sm appearance-none">
                          {[6, 7, 8, 9, 10, 11, 12].map(m => (<option key={m} value={m} className="bg-[#0c1324]">{m} Meses</option>))}
                        </select>
                      </div>
                      {getTotalBudget() > 0 && (
                        <div className="space-y-3 sm:space-y-4">
                          <div className="bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/5 flex items-center justify-between">
                            <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-500">Inicial ({getDownPaymentDisplay()}%)</p>
                            <p className="text-base sm:text-lg font-headline font-black text-cyan-400">${(getTotalBudget() * getDownPaymentRate()).toFixed(2)} USD</p>
                          </div>
                          <div className="bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/5 flex items-center justify-between">
                            <div><p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-500">Cargo recurso (1%)</p></div>
                            <p className="text-xs sm:text-sm font-bold text-white">${(getTotalBudget() * 0.01).toFixed(2)} USD</p>
                          </div>
                          <div className="bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/5 flex items-center justify-between">
                            <div><p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-500">Interés ({getInterestRateDisplay()}%)</p></div>
                            <p className="text-xs sm:text-sm font-bold text-white">${(getTotalBudget() * (1 - getDownPaymentRate()) * getInterestRate()).toFixed(2)} USD</p>
                          </div>
                          <div className="bg-white/5 rounded-2xl p-3 sm:p-4 flex items-center justify-between border border-white/5">
                            <div><p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-500">Cuota Mensual</p><p className="text-[8px] text-slate-500 mt-0.5">Al completarse</p></div>
                            <p className="text-lg sm:text-xl font-headline font-black text-tertiary">${calculateMonthlyPayment()} USD</p>
                          </div>
                          <div className="bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/5 flex items-center justify-between">
                            <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-500">Total Final</p>
                            <p className="text-base sm:text-lg font-headline font-black text-tertiary">${((getTotalBudget() * (1 - getDownPaymentRate())) * (1 + getInterestRate()) + getTotalBudget() * 0.01 + getTotalBudget() * getDownPaymentRate()).toFixed(2)} USD</p>
                          </div>
                          <div className="p-2 sm:p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-2">
                            <span className="material-symbols-outlined text-amber-400 text-sm mt-0.5 shrink-0">schedule</span>
                            <p className="text-[9px] sm:text-[10px] text-amber-400 font-bold leading-snug">El pago inicial se cobra primero para dar inicio al proyecto. Posteriormente, las cuotas se cobrarán mes a mes una vez completado.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <button disabled={formStatus === 'sending'} className={`w-full py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 ${formStatus === 'success' ? 'bg-green-500 text-white' : 'bg-tertiary text-on-tertiary hover:brightness-110 shadow-[0_15px_40px_rgba(47,217,244,0.2)]'}`}>
                  {formStatus === 'idle' && <>Enviar pedido <span className="material-symbols-outlined text-sm">send</span></>}
                  {formStatus === 'sending' && <><span className="w-4 h-4 border-2 border-on-tertiary border-t-transparent animate-spin rounded-full"></span>Enviando...</>}
                  {formStatus === 'success' && <>¡Pedido Enviado! <span className="material-symbols-outlined text-sm">check_circle</span></>}
                </button>
              </form>
            </div>

            {/* Info */}
            <div className="space-y-12 animate-fade-in delay-200">
              {/* FAQ Section */}
              <div className="space-y-8">
                <h3 className="font-headline text-3xl font-bold text-white tracking-tight">Preguntas Frecuentes</h3>
                <div className="space-y-4" ref={faqSectionRef}>
                  <FAQItem 
                    id="faq-1"
                    question="¿Cómo funciona el proceso de creación de pedidos?" 
                    answer="Es un proceso ágil y totalmente transparente. Usted completa el formulario con los detalles de su idea y el presupuesto estimado. Nosotros recibimos su solicitud y realizamos un análisis técnico sin costo previo. En menos de 48 horas, un especialista le contactará para alinear la visión del proyecto, presentarle un plan de trabajo detallado y definir los hitos de entrega. No existe ningún compromiso ni cobro solo por el envío de su propuesta inicial."
                    isOpen={activeFaqId === "faq-1"}
                    onToggle={() => setActiveFaqId(activeFaqId === "faq-1" ? null : "faq-1")}
                  />
                  <FAQItem 
                    id="faq-2"
                    question="¿Cómo funciona el beneficio del financiamiento (crédito)?" 
                    answer="Entendemos que el software de alto nivel es una inversión estratégica. Por ello, ofrecemos financiamiento directo: usted abona el 20% inicial para activar el desarrollo y el saldo restante se difiere en cuotas de 6 a 12 meses. La ventaja principal es que las cuotas mensuales comienzan a cobrarse únicamente después de que el proyecto ha sido completado y entregado, permitiéndole rentabilizar su aplicación desde el primer día."
                    isOpen={activeFaqId === "faq-2"}
                    onToggle={() => setActiveFaqId(activeFaqId === "faq-2" ? null : "faq-2")}
                  />
                  <FAQItem 
                    id="faq-3"
                    question="¿Qué nivel de acompañamiento recibo durante el desarrollo?" 
                    answer="En Sneyder Studio actuamos como sus socios tecnológicos. Durante todo el ciclo de vida del proyecto, usted tendrá acceso a un entorno de visualización en tiempo real para supervisar los avances diarios. Además, recibirá consultoría constante sobre mejores prácticas, seguridad y escalabilidad, asegurando que su producto final no solo sea funcional, sino una herramienta de vanguardia capaz de crecer junto a su negocio."
                    isOpen={activeFaqId === "faq-3"}
                    onToggle={() => setActiveFaqId(activeFaqId === "faq-3" ? null : "faq-3")}
                  />
                </div>
              </div>

              <div className="space-y-8">
                <h3 className="font-headline text-3xl font-bold text-white tracking-tight">Atención Premium</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <ContactCard icon="mail" title="Correo Electrónico" value={adminSettings?.contact_email || "sneyderestudio@gmail.com"} href={`mailto:${adminSettings?.contact_email || "sneyderestudio@gmail.com"}`} />
                  <ContactCard icon="chat" title="WhatsApp Business" value="Chat en Vivo" href={adminSettings?.whatsapp || "https://wa.me/50672065581"} />
                  <ContactCard icon="person_search" title="LinkedIn Oficial" value="Sneyder Studio" href={adminSettings?.linkedin_url || "https://www.linkedin.com/in/sneyder-studio-2b84793b7"} />
                  <ContactCard icon="location_on" title="Sede Central" value={adminSettings?.address || "San José, Costa Rica"} />
                </div>
              </div>
              <div className="pt-12 border-t border-white/5 space-y-6">
                <Link href="/entrega" className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-tertiary/10 border border-tertiary/20 rounded-[1.5rem] text-tertiary font-bold uppercase tracking-widest text-[10px] hover:bg-tertiary/20 transition-all shadow-lg group">
                  <span className="material-symbols-outlined text-lg group-hover:scale-110">inventory_2</span>
                  Protocolo de Entrega del Producto
                </Link>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-32 py-12 border-t border-white/5 bg-black/20 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[10px] text-slate-600 uppercase tracking-[0.3em] font-bold">© 2024 Sneyder Studio • Premium Digital Solutions</p>
            <div className="flex gap-8">
              <Link href="/" className="text-[10px] text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-widest">LinkedIn</Link>
              <Link href="/" className="text-[10px] text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-widest">GitHub</Link>
              <Link href="/contacto" className="text-[10px] text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-widest">Contáctenos</Link>
            </div>
          </div>
        </footer>
      </main>

      {/* Modals */}
      {showModal && <SuccessModal onClose={() => setShowModal(false)} />}
      {showLoginPrompt && <LoginPromptModal onCancel={() => setShowLoginPrompt(false)} onAccept={() => { setShowLoginPrompt(false); setShowAuthModal(true); }} />}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialView={authView} setView={setAuthView} />

      {/* Code Editor Modal */}
      {activeEditor && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setActiveEditor(null)} />
          <div className="relative w-full max-w-5xl h-[85vh] flex flex-col bg-surface-container-low border border-[#45464d]/20 rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
            <div className="bg-[#0c1324]/80 px-6 py-3 border-b border-[#45464d]/15 flex items-center justify-between backdrop-blur-sm shrink-0">
               <div className="flex items-center gap-4">
                 <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#2fd9f4]">Workspace</span>
                 <div className="h-4 w-px bg-[#45464d]/30"></div>
                 <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                   {activeEditor === 'projectDescription' ? 'proyecto.md' : 'negocio.md'}
                 </span>
               </div>
               <div className="flex items-center gap-4">
                 <button type="button" onClick={() => setActiveEditor(null)} className="px-6 py-2 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] bg-tertiary text-on-tertiary hover:brightness-110 active:scale-95 transition-all shadow-tertiary/20 flex items-center gap-2">
                   <span className="material-symbols-outlined text-sm">check</span>
                   Listo
                 </button>
                 <div className="hidden md:flex gap-1.5 ml-4">
                   <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40"></div>
                   <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40"></div>
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40"></div>
                 </div>
               </div>
            </div>
            <textarea
              autoFocus
              value={formFields[activeEditor]}
              onChange={(e) => setFormFields(prev => ({...prev, [activeEditor]: e.target.value}))}
              placeholder={activeEditor === 'projectDescription' ? "Describa el software, app o sistema que tiene en mente..." : "Cuéntenos qué hace su empresa y cuáles son sus objetivos..."}
              className="flex-1 w-full bg-[#0c1324] text-slate-300 p-6 md:p-10 outline-none resize-none font-mono text-xs md:text-sm leading-8 custom-scrollbar border-none focus:ring-0"
              spellCheck={false}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0c1324;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </div>
  );
}

function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface/90 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-md text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8"><span className="material-symbols-outlined text-green-500 text-4xl">check_circle</span></div>
        <h3 className="font-headline text-2xl font-bold text-white mb-6">Propuesta Enviada</h3>
        <button onClick={onClose} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold uppercase tracking-widest text-[10px]">Entendido</button>
      </div>
    </div>
  );
}

function LoginPromptModal({ onCancel, onAccept }: { onCancel: () => void; onAccept: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-surface/90 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-md text-center">
        <h3 className="font-headline text-2xl font-bold text-white mb-6">Inicio de Sesión Requerido</h3>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={onCancel} className="py-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 font-bold uppercase tracking-widest text-[10px]">Cancelar</button>
          <button onClick={onAccept} className="py-4 bg-tertiary text-on-tertiary rounded-2xl font-bold uppercase tracking-widest text-[10px]">Acceder</button>
        </div>
      </div>
    </div>
  );
}

function AuthModal({ isOpen, onClose, initialView, setView }: any) {
  const [formData, setFormData] = useState({ email: '', password: '', managerName: '', companyName: '', whatsapp: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (initialView === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCredential.user, { displayName: formData.managerName });
        await setDoc(doc(db, "profiles", userCredential.user.uid), { id: userCredential.user.uid, email: formData.email, manager_name: formData.managerName });
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      }
      onClose();
    } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface/90 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
          <input type="password" placeholder="Contraseña" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
          <button type="submit" className="w-full bg-tertiary py-4 rounded-xl font-bold uppercase tracking-widest text-xs">{initialView === 'login' ? 'Entrar' : 'Registrar'}</button>
        </form>
      </div>
    </div>
  );
}

function ContactCard({ icon, title, value, href }: any) {
  const content = (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-6 hover:bg-white/10 transition-all flex-1 min-w-0">
      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-cyan-400/10 rounded-2xl flex items-center justify-center shrink-0 border border-cyan-400/20">
        <span className="material-symbols-outlined text-cyan-400 text-2xl sm:text-3xl">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">{title}</h4>
        <p className="text-white font-bold truncate text-sm sm:text-base" title={value}>{value}</p>
      </div>
    </div>
  );
  return href ? <a href={href} target="_blank" rel="noopener noreferrer" className="flex min-w-0 w-full">{content}</a> : content;
}

function FAQItem({ id, question, answer, isOpen, onToggle }: { id: string; question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-3xl overflow-hidden transition-all duration-300 ${isOpen ? 'ring-1 ring-cyan-400/30 bg-white/10' : ''}`}>
      <button 
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/10 transition-colors"
      >
        <span className={`font-bold text-sm sm:text-base pr-4 transition-colors ${isOpen ? 'text-cyan-400' : 'text-white'}`}>{question}</span>
        <span className={`material-symbols-outlined text-cyan-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-6 pt-2 text-slate-400 text-sm leading-relaxed border-t border-white/5 bg-black/10">
          {answer}
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, href, active = false, small = false, onClick }: { icon: string; label: string; href: string; active?: boolean; small?: boolean; onClick?: () => void }) {
  const isExternal = href.startsWith('http');
  
  const content = (
    <>
      <span className={`material-symbols-outlined ${small ? "text-base" : ""}`}>{icon}</span>
      <span>{label}</span>
    </>
  );

  const baseStyles = `flex items-center gap-4 px-4 py-3 transition-colors ${active ? "text-cyan-400 font-bold bg-slate-800/50" : "text-slate-400 hover:bg-slate-800 hover:text-white"} ${small ? "text-sm" : ""}`;

  if (isExternal) {
    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={baseStyles}
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={baseStyles} onClick={onClick}>
      {content}
    </Link>
  );
}
