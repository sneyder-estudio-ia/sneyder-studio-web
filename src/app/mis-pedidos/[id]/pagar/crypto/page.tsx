"use client";

import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";

type CryptoOption = 'USDT' | 'TRX';

export default function PaymentSelectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const monthStr = searchParams.get('month');
  const month = monthStr ? parseInt(monthStr) : null;
  
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [cryptoPrices, setCryptoPrices] = useState<{USDT: number, TRX: number} | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoOption | null>(null);

  const MERCHANT_ID = process.env.NEXT_PUBLIC_FAUCETPAY_MERCHANT_ID || 'axel1994';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isLoading) router.replace('/');
        return;
      }

      try {
        const docRef = doc(db, 'orders', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error("Error loading order for crypto payment:", err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [id, router, isLoading]);

  useEffect(() => {
    if (showCryptoModal && !cryptoPrices) {
      // Fetch prices from public API (CoinGecko)
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether,tron&vs_currencies=usd')
        .then(res => res.json())
        .then(data => {
          setCryptoPrices({
            USDT: data.tether?.usd || 1.0,
            TRX: data.tron?.usd || 0.12 // Fallback if API fails
          });
        })
        .catch(err => {
          console.error("Error fetching crypto prices", err);
          setCryptoPrices({ USDT: 1.0, TRX: 0.12 });
        });
    }
  }, [showCryptoModal, cryptoPrices]);

  if (isLoading) {
    return (
      <div className="bg-[#0a0e1a] text-white flex items-center justify-center min-h-screen">
        <span className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></span>
      </div>
    );
  }

  const amountUSD = order ? (order.total / 6).toFixed(2) : "0.00";
  const numAmountUSD = parseFloat(amountUSD);

  const equivalentUSDT = cryptoPrices ? (numAmountUSD / cryptoPrices.USDT).toFixed(2) : "...";
  const equivalentTRX = cryptoPrices ? (numAmountUSD / cryptoPrices.TRX).toFixed(2) : "...";

  return (
    <div className="bg-[#0a0e1a] text-white min-h-screen pb-20 selection:bg-cyan-400/20">
      {/* Premium Header */}
      <header className="fixed top-0 w-full z-50 bg-[#0c1324]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-6 h-20 justify-between">
        <div className="flex items-center gap-0">
          <Link href={`/mis-pedidos/${id}/pagar`}>
            <button className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold font-headline uppercase tracking-tight text-white leading-none">Pago</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Opciones de Pago</p>
          </div>
        </div>
        <div className="hidden sm:block">
           <Image 
             src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png"
             alt="Sneyder Studio"
             width={100}
             height={25}
             className="opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all"
           />
        </div>
      </header>

      <main className="pt-32 px-6 max-w-2xl mx-auto space-y-10">
        {/* Order Info Card */}
        <div className="bg-gradient-to-br from-[#111827] to-[#0a0e1a] border border-white/5 rounded-3xl p-8 relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/5 blur-[100px] -mr-32 -mt-32"></div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Resumen de Factura</p>
              <h2 className="text-2xl font-bold font-headline italic uppercase tracking-tighter text-white">
                Cuota {month} - {order.items?.[0]?.name || "Servicio Digital"}
              </h2>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-4xl font-black font-mono text-cyan-400 tracking-tighter">${amountUSD}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Dólares Americanos (USD)</p>
            </div>
          </div>
        </div>

        {/* Payment Selection */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-cyan-400 min-w-fit">Selecciona tu modelo de pago</h3>
            <div className="h-px w-full bg-gradient-to-r from-cyan-400/20 to-transparent"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* PayPal Card */}
            <button 
              onClick={() => router.push(`/mis-pedidos/${id}/pagar/paypal?month=${month}`)}
              className="p-8 rounded-[2rem] border bg-white/5 border-white/10 hover:border-[#0070ba] hover:bg-[#0070ba]/5 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center gap-4 group relative overflow-hidden text-center"
            >
              <div className="h-20 flex items-center justify-center group-hover:scale-110 transition-transform drop-shadow-[0_0_15px_rgba(0,112,186,0.5)]">
                <Image 
                  src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" 
                  alt="PayPal Logo Oficial" 
                  width={120} 
                  height={50} 
                  className="object-contain"
                />
              </div>
              <div>
                <h4 className="text-xl font-black text-white mb-1">PayPal</h4>
                <p className="text-[11px] font-bold text-[#0070ba] uppercase tracking-widest">Tarjeta y Saldo</p>
              </div>
              <p className="text-xs text-slate-400 mt-2 px-2 leading-relaxed">
                Pago directo a PayPal con <strong className="text-white">Tarjeta de Crédito o Débito</strong> rápido y seguro.
              </p>
            </button>

            {/* Crypto Card */}
            <button 
              onClick={() => setShowCryptoModal(true)}
              className="p-8 rounded-[2rem] border bg-white/5 border-white/10 hover:border-cyan-400 hover:bg-cyan-400/5 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center gap-4 group relative overflow-hidden text-center"
            >
              <div className="flex items-center justify-center -space-x-4">
                <div className="w-16 h-16 bg-[#26a17b]/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-[#26a17b]/20 z-10 group-hover:-translate-x-2 group-hover:scale-110 transition-all shadow-xl">
                  <Image src="https://cryptologos.cc/logos/tether-usdt-logo.png" alt="USDT" width={32} height={32} />
                </div>
                <div className="w-16 h-16 bg-[#ef4444]/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-[#ef4444]/20 z-0 group-hover:translate-x-2 group-hover:scale-110 transition-all shadow-xl">
                  <Image src="https://cryptologos.cc/logos/tron-trx-logo.png" alt="TRX" width={32} height={32} />
                </div>
              </div>
              <div>
                <h4 className="text-xl font-black text-white mb-1">Criptomonedas</h4>
                <p className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest">USDT & TRX</p>
              </div>
              <p className="text-xs text-slate-500 mt-2 px-4 leading-relaxed">
                Paga vía FaucetPay usando stablecoins o altcoins con confirmación rápida.
              </p>
            </button>
          </div>
        </div>

        {/* Security / Partner Band */}
        <div className="flex flex-col items-center gap-6 pt-10">
           <div className="flex items-center gap-2">
             <span className="material-symbols-outlined text-slate-600 text-xs text-cyan-400">lock</span>
             <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Transacciones Seguras</p>
           </div>
        </div>
      </main>

      {/* Crypto Modal */}
      {showCryptoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowCryptoModal(false)}></div>
          
          <div className="bg-[#111827] border border-white/10 rounded-[2rem] p-8 max-w-md w-full relative z-10 shadow-[0_0_50px_rgba(34,211,238,0.1)] scale-in-center">
            
            <button 
              onClick={() => setShowCryptoModal(false)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>

            <div className="text-center mb-8">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter font-headline text-white mb-2">Pago Cripto</h3>
              <p className="text-xs text-slate-400">
                Selecciona la criptomoneda que deseas utilizar para pagar tu cuota de <strong className="text-cyan-400">${amountUSD} USD</strong>.
              </p>
            </div>

            {!cryptoPrices ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <span className="w-10 h-10 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mb-4"></span>
                <p className="text-xs text-cyan-400 font-bold uppercase tracking-widest animate-pulse">Consultando el mercado en tiempo real...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {/* USDT Selection */}
                <div 
                  onClick={() => setSelectedCrypto('USDT')}
                  className={`cursor-pointer flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                    selectedCrypto === 'USDT' ? 'bg-[#26a17b]/10 border-[#26a17b] shadow-[0_0_20px_rgba(38,161,123,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Image src="https://cryptologos.cc/logos/tether-usdt-logo.png" alt="USDT" width={36} height={36} />
                    <div>
                      <p className="font-bold text-white">Tether (USDT)</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Red Polygon</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-[#26a17b]">{equivalentUSDT}</p>
                    <p className="text-[10px] text-slate-500">Valor exacto</p>
                  </div>
                </div>

                {/* TRX Selection */}
                <div 
                  onClick={() => setSelectedCrypto('TRX')}
                  className={`cursor-pointer flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                    selectedCrypto === 'TRX' ? 'bg-[#ef4444]/10 border-[#ef4444] shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Image src="https://cryptologos.cc/logos/tron-trx-logo.png" alt="TRX" width={36} height={36} />
                    <div>
                      <p className="font-bold text-white">Tron (TRX)</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Red Tron (TRC20)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-[#ef4444]">{equivalentTRX}</p>
                    <p className="text-[10px] text-slate-500">Total a enviar</p>
                  </div>
                </div>
              </div>
            )}

            {selectedCrypto && cryptoPrices && (
              <div className="mt-8 animate-in fade-in slide-in-from-bottom-4">
                <form action="https://faucetpay.io/merchant/webscr" method="POST">
                  <input type="hidden" name="merchant_username" value={MERCHANT_ID} />
                  <input type="hidden" name="item_description" value={`Pago Cuota ${month} - Proj ${id.slice(0, 5)}`} />
                  <input type="hidden" name="amount1" value={selectedCrypto === 'USDT' ? equivalentUSDT : equivalentTRX} />
                  <input type="hidden" name="currency1" value={selectedCrypto} />
                  <input type="hidden" name="custom" value={`${id}_${month}`} />
                  <input type="hidden" name="callback_url" value="https://sneyderstudio.com/api/webhooks/faucetpay" />
                  <input type="hidden" name="success_url" value={`https://sneyderstudio.com/mis-pedidos/${id}/pagar/crypto/success`} />
                  <input type="hidden" name="cancel_url" value={`https://sneyderstudio.com/mis-pedidos/${id}/pagar`} />
                  
                  <button 
                    type="submit"
                    className="w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:opacity-90"
                  >
                    <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
                    Generar Dirección y QR de Pago
                  </button>
                </form>
                <p className="text-center text-[10px] text-slate-500 mt-4 leading-relaxed px-4">
                  FaucetPay generará de forma segura el código QR y la billetera para depositar el monto exacto.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
