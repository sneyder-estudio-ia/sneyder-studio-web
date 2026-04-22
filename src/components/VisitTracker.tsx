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
      } catch (err) {
        console.error("Error tracking visit:", err);
      }
    };

    // Usar sessionStorage para no contar refrecos en la misma sesión como visitas nuevas (opcional)
    const hasVisited = sessionStorage.getItem("v_tracked");
    if (!hasVisited) {
      trackVisit();
      sessionStorage.setItem("v_tracked", "true");
    }
  }, []);

  return null;
}
