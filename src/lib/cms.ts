import { db, storage } from "./firebase";
import { siteData } from "@/data/siteData";
import { doc, getDoc, setDoc, getDocFromCache, getDocFromServer } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";

const CONFIG_DOC_ID = "main_config";
const COLLECTION_NAME = "cms_config";

export const getCMSData = async () => {
  console.log("CMS: Iniciando obtención de datos (Estrategia Cache-First)...");

  const docRef = doc(db, COLLECTION_NAME, CONFIG_DOC_ID);

  try {
    // 1. Intentar desde Cache (Rápido, Offline)
    try {
      const cacheSnap = await getDocFromCache(docRef);
      if (cacheSnap.exists()) {
        console.log("CMS: Datos recuperados desde CACHÉ local.");
        // Opcional: Revalidar en segundo plano si es necesario
        return cacheSnap.data().data || siteData;
      }
    } catch (cacheError) {
      console.log("CMS: Cache no disponible, consultando servidor...");
    }

    // 2. Fallback al Servidor con Timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout de conexión a Firestore (10s)")), 10000)
    );

    const docSnap: any = await Promise.race([
      getDocFromServer(docRef),
      timeoutPromise
    ]);

    if (docSnap.exists()) {
      console.log("CMS: Datos cargados desde SERVIDOR.");
      const content = docSnap.data();
      return content.data || siteData;
    } else {
      console.log("CMS: No se encontraron datos en servidor, inicializando...");
      await setDoc(docRef, { 
        data: siteData, 
        updated_at: new Date().toISOString() 
      });
      return siteData;
    }
  } catch (error) {
    console.error("CMS: Error crítico en carga de datos, usando fallback local:", error);
    return siteData;
  }
};

export const saveCMSData = async (newData: any) => {
  try {
    console.log("CMS: Guardando datos en Firestore...");
    const docRef = doc(db, COLLECTION_NAME, CONFIG_DOC_ID);
    await setDoc(docRef, { 
      data: newData, 
      updated_at: new Date().toISOString() 
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving CMS data to Firestore:", error);
    throw error;
  }
};

/**
 * Elimina un archivo de Firebase Storage dada su URL.
 */
export const deleteFileFromStorage = async (url: string) => {
  if (!url || !url.includes("firebasestorage.googleapis.com")) {
    console.log("CMS: URL no válida o no es de Firebase Storage, omitiendo eliminación:", url);
    return;
  }
  
  try {
    // Extraer el path del archivo desde la URL de Firebase Storage
    // Las URLs tienen el formato: /v0/b/{bucket}/o/{path}?alt=media...
    const decodedUrl = decodeURIComponent(url);
    const pathStart = decodedUrl.indexOf("/o/") + 3;
    const pathEnd = decodedUrl.indexOf("?");
    const filePath = decodedUrl.substring(pathStart, pathEnd);
    
    console.log("CMS: Intentando eliminar archivo de Storage:", filePath);
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
    console.log("CMS: Archivo eliminado con éxito de Storage.");
  } catch (error) {
    console.error("CMS: Error al eliminar archivo de Storage:", error);
  }
};
