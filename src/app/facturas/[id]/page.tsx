"use client";

import React, { useState, useEffect, use, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";

function InvoiceDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const monthStr = searchParams.get("month");
  const month = parseInt(monthStr || "1");
  
  const [order, setOrder] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const invoiceRef = React.useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/");
        return;
      }
      setUser(currentUser);

      if (orderId) {
        try {
          const docRef = doc(db, 'orders', orderId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setOrder({ id: docSnap.id, ...docSnap.data() });
          }
        } catch (err) {
          console.error("Error fetching order:", err);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [orderId, router]);

  if (isLoading) {
    return (
      <div className="bg-[#0a0e1a] text-white flex items-center justify-center min-h-screen">
        <span className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-[#0a0e1a] text-white flex flex-col items-center justify-center min-h-screen gap-4">
        <h2 className="text-xl font-bold">Documento no encontrado</h2>
        <Link href="/facturas" className="text-cyan-400 font-bold uppercase text-xs">Volver</Link>
      </div>
    );
  }

  const total = order.total || 0;
  const monthlyBase = total / 6;
  const interestRate = 0.035; // 3.5% interest mockup
  const interestAmount = monthlyBase * interestRate;
  const totalPaidThisMonth = monthlyBase + interestAmount;
  const totalDebtPaid = monthlyBase * month;
  const remainingBalance = Math.max(0, total - totalDebtPaid);
  
  const invoiceDate = new Date(order.created_at);
  invoiceDate.setMonth(invoiceDate.getMonth() + month - 1);

  const formattedDate = invoiceDate.toLocaleDateString('es-ES', { 
    day: '2-digit', month: 'long', year: 'numeric' 
  });



  const handleExport = async (action: 'download' | 'share') => {
    if (!invoiceRef.current) return;
    setIsExporting(true);
    
    try {
      const html2canvas = (await import('html2canvas')).default;

      // Robust capture with style sanitization
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 3, 
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          // 1. Force light scheme and basic colors to avoid oklab/oklch resolution
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            * { 
              color-scheme: light !important; 
            }
            :root {
              --color-white: #ffffff !important;
              --color-black: #000000 !important;
              --color-cyan-400: #22d3ee !important;
            }
          `;
          clonedDoc.head.appendChild(style);

          // 2. Clean up any inline oklab styles
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            if (el.getAttribute('style')?.includes('okl')) {
              el.setAttribute('style', el.getAttribute('style')!.replace(/okl[ab|ch]\([^)]+\)/g, '#000000'));
            }
            // Remove filters that might cause issues
            if (el.style.filter) el.style.filter = 'none';
          }
        }
      });

      const fileName = `Comprobante-SneyderStudio-${id.slice(-8)}.png`;

      if (action === 'share') {
        const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
        if (blob) {
          const file = new File([blob], fileName, { type: 'image/png' });
          const shareData = {
            files: [file],
            title: `Comprobante Sneyder Studio`,
            text: `Recibo de pago digital.`
          };
          
          if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            await navigator.share(shareData);
            setIsExporting(false);
            return;
          }
        }
      }

      // Robust Download Method (compatible with all browsers and Android/iOS)
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Small delay to ensure browser triggers the download
      setTimeout(() => {
        document.body.removeChild(link);
      }, 200);
      
    } catch (error) {
      console.error("Error exporting image:", error);
      alert("Error al generar la imagen. Por favor, intenta de nuevo.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-[#0a0e1a] text-[#ffffff] min-h-screen pb-10 selection:bg-[#22d3ee4d]">
      {/* Back Button */}
      <div className="fixed top-6 left-6 z-[100] no-print">
        <Link href={`/facturas?orderId=${orderId}`}>
          <button className="w-10 h-10 rounded-full bg-[#0f172a] border border-[#ffffff1a] flex items-center justify-center text-[#22d3ee] hover:bg-[#22d3ee] hover:text-[#000000] transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
          </button>
        </Link>
      </div>

      <main className="pt-16 px-0 sm:px-4 md:px-8 w-full max-w-4xl mx-auto relative z-10">
        {/* Invoice Paper (Compact Version) */}
        <div 
          ref={invoiceRef}
          style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
          className="bg-[#ffffff] text-[#0f172a] rounded-none sm:rounded-[2rem] overflow-hidden flex flex-col relative w-full border-x sm:border-none border-[#f1f5f9]"
        >
          
          {/* Header Section */}
          <div className="bg-[#0f172a] p-4 sm:p-6 w-full">
            {/* Top row: Logo + Status (Compact) */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between mb-4 pb-4 border-b border-[#ffffff1a] gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="relative w-28 sm:w-36 flex-shrink-0">
                  <Image 
                    src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png"
                    alt="Logo"
                    width={150}
                    height={40}
                    className="w-full h-auto object-contain"
                    priority
                  />
                </div>
                <div className="flex flex-col border-l border-[#ffffff1a] pl-4 py-0.5">
                  <p className="text-[#ffffff] text-lg font-black tracking-tighter leading-none mb-0.5">Sneyder Studio</p>
                  <p className="text-[7px] font-black uppercase tracking-[0.4em] text-[#22d3ee] opacity-80">Control Digital Studio</p>
                </div>
              </div>

              <div className="flex flex-col items-center sm:items-end text-center sm:text-right gap-1.5 w-full sm:w-auto">
                <div className="bg-[#22d3ee] text-[#000000] px-3 py-1 rounded-full inline-block">
                  <span className="text-[7px] font-black uppercase tracking-widest leading-none">Pago Verificado</span>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[7px] text-[#94a3b8] uppercase font-black tracking-widest leading-none opacity-60">ID Referencia (Short)</p>
                  <p className="text-xs font-mono text-[#ffffff] font-bold tracking-wider">{id.slice(-12)}</p>
                </div>
              </div>
            </div>

            {/* Bottom Header row: Address + Date (Ultra-Compact) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div className="order-2 sm:order-1">
                <p className="text-[#94a3b8] text-[9px] font-medium leading-tight">
                  Calle 404, Tech District • Medellín<br/>
                  NIT: 901.442.115-3 • contacto@sneyderstudio.link
                </p>
              </div>

              <div className="text-center sm:text-right order-3">
                 <p className="text-[#94a3b8] text-[7px] uppercase font-black tracking-widest opacity-40 mb-0.5">Fecha Emisión</p>
                 <p className="text-[#ffffff] text-xs font-bold leading-none tracking-tight">{formattedDate}</p>
              </div>
            </div>
          </div>

          {/* User & Order Context */}
          <div className="px-6 py-8 sm:px-10 grid grid-cols-1 md:grid-cols-2 gap-10 border-b border-[#f1f5f9]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-[#22d3ee] rounded-full"></div>
                <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#94a3b8]">Beneficiario</h3>
              </div>
              <div className="pl-4">
                <p className="text-xl font-black text-[#0f172a] capitalize leading-none">{user?.displayName || "Cliente"}</p>
                <p className="text-xs font-bold text-[#64748b] mt-1">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-[#e2e8f0] rounded-full"></div>
                <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#94a3b8]">Servicio</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 pl-4">
                <div className="space-y-1">
                  <p className="text-[8px] font-bold text-[#94a3b8] uppercase tracking-widest">Mantenimiento</p>
                  <p className="text-xs font-black text-[#0f172a] truncate">{order.items?.[0]?.name}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[8px] font-bold text-[#94a3b8] uppercase tracking-widest">Cuota</p>
                  <p className="text-xs font-black text-[#0891b2]">{month} de 6</p>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Table */}
          <div className="p-6 sm:p-10 w-full">
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-[#94a3b8]">
                    <th className="text-left py-2 px-3">Concepto</th>
                    <th className="text-center py-2 px-3">Subtotal</th>
                    <th className="text-right py-2 px-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y-4 divide-transparent">
                  <tr className="bg-[#f8fafc]">
                    <td className="py-4 px-4 rounded-l-2xl">
                      <p className="font-black text-[#0f172a] text-xs">Abono Capital M{month}</p>
                    </td>
                    <td className="text-center text-xs font-bold text-[#475569]">${monthlyBase.toFixed(2)}</td>
                    <td className="text-right px-4 rounded-r-2xl text-xs font-black text-[#0f172a]">${monthlyBase.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-[#f8fafc]">
                    <td className="py-4 px-4 rounded-l-2xl">
                      <p className="font-black text-[#0f172a] text-xs">Fee Administrativo</p>
                    </td>
                    <td className="text-center text-xs font-bold text-[#475569]">${interestAmount.toFixed(2)}</td>
                    <td className="text-right px-4 rounded-r-2xl text-xs font-black text-[#0f172a]">${interestAmount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Settlement Section */}
          <div className="p-6 sm:p-10 bg-[#f8fafc] border-t border-[#f1f5f9] flex flex-col sm:flex-row gap-8 justify-between">
            <div className="flex-1">
               <div 
                 style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                 className="bg-[#ffffff] p-6 rounded-[1.5rem] border border-[#e2e8f0] space-y-4"
               >
                  <h4 className="text-[8px] font-black uppercase tracking-[0.4em] text-[#06b6d4]">Estado Contable</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                       <span className="font-bold text-[#94a3b8] uppercase">Pagado</span>
                       <span className="font-black text-[#16a34a]">${totalDebtPaid.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-[#f1f5f9] w-full"></div>
                    <div className="flex justify-between items-end">
                       <span className="text-[9px] font-black uppercase text-[#0f172a]">Saldo</span>
                       <span className="text-xl font-black text-[#0f172a] font-mono tracking-tighter">${remainingBalance.toFixed(2)}</span>
                    </div>
                  </div>
               </div>
            </div>

            <div className="w-full sm:w-[280px] space-y-4 text-center sm:text-right">
              <div 
                style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                className="bg-[#0f172a] text-[#ffffff] p-6 rounded-[1.5rem] relative overflow-hidden"
              >
                <div className="space-y-2 relative z-10">
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#22d3ee]">Total Liquidado</p>
                  <p className="text-3xl font-black italic tracking-tighter uppercase font-mono">${totalPaidThisMonth.toFixed(2)}</p>
                </div>
              </div>
              <div className="pt-2">
                <p className="font-signature text-3xl text-[#0891b2] opacity-90 -rotate-2 select-none">Sneyder Studio</p>
                <div className="inline-flex items-center gap-2 mt-2">
                  <span className="material-symbols-outlined text-[#22d3ee] text-sm">verified</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#06b6d4]">Verificado</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons (No print) */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 no-print pb-20">
          <button 
            disabled={isExporting}
            onClick={() => handleExport('download')}
            className="px-8 py-3.5 bg-[#ffffff0d] border border-[#ffffff1a] text-[#ffffff] rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#ffffff1a] transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-wait"
          >
            {isExporting ? (
              <span className="w-3 h-3 border-2 border-[#22d3ee4d] border-t-[#22d3ee] rounded-full animate-spin"></span>
            ) : (
              <span className="material-symbols-outlined text-sm text-[#22d3ee]">image</span>
            )}
            {isExporting ? "Generando..." : "Descargar PNG"}
          </button>
          <button 
            disabled={isExporting}
            onClick={() => handleExport('share')}
            className="px-8 py-3.5 bg-[#22d3ee] text-[#000000] rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-[0_10px_20px_rgba(34,211,238,0.2)] flex items-center gap-3 disabled:opacity-50 disabled:cursor-wait"
          >
            {isExporting ? (
              <span className="w-3 h-3 border-2 border-[#0000004d] border-t-[#000000] rounded-full animate-spin"></span>
            ) : (
              <span className="material-symbols-outlined text-sm">share</span>
            )}
            {isExporting ? "Generando..." : "Compartir PNG"}
          </button>
        </div>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
        
        .font-signature {
          font-family: 'Dancing Script', cursive;
        }

        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
          }
          .rounded-[2.5rem] {
            border-radius: 0 !important;
          }
          .shadow-[0_40px_80px_rgba(0,0,0,0.5)] {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <div className="bg-[#0a0e1a] text-white flex items-center justify-center min-h-screen">
        <span className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></span>
      </div>
    }>
      <InvoiceDetailContent params={params} />
    </Suspense>
  );
}
