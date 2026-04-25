"use client";

import { useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, increment, setDoc, getDoc } from "firebase/firestore";

export default function VisitTracker() {
  useEffect(() => {
    const trackVisit = async () => {
      // Evitar tracking en desarrollo si se desea, pero para que sea funcional lo activamos
      if (typeof window === "undefined") return;

      // Obtener fecha actual en formato YYYY-MM-DD
      const now = new Date();
      // Obtener fecha local en formato YYYY-MM-DD
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const visitRef = doc(db, "stats", "visits", "daily", dateStr);

      try {
        const totalRef = doc(db, "stats", "visits", "summary", "total");
        const snap = await getDoc(visitRef);
        
        if (snap.exists()) {
          await updateDoc(visitRef, {
            count: increment(1)
          });
        } else {
          await setDoc(visitRef, {
            count: 1,
            date: dateStr,
            timestamp: now
          });
        }

        // Also increment global counter
        try {
          const totalSnap = await getDoc(totalRef);
          if (totalSnap.exists()) {
            await updateDoc(totalRef, { count: increment(1) });
          } else {
            await setDoc(totalRef, { count: 1 });
          }
        } catch (totalErr) {
          console.error("Error updating global counter:", totalErr);
        }
      } catch (err) {
        console.error("Error tracking visit:", err);
      }
    };

    // Usar localStorage para identificar usuarios únicos (nuevos) de forma persistente
    const hasVisitedBefore = localStorage.getItem("ss_unique_visitor");
    if (!hasVisitedBefore) {
      trackVisit();
      localStorage.setItem("ss_unique_visitor", "true");
    }
  }, []);

  return null;
}
