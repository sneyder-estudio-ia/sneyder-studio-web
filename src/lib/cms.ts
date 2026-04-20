import { supabase } from "./supabase";
import { siteData } from "@/data/siteData";

export const getCMSData = async () => {
  console.log("CMS: Iniciando obtención de datos...");

  try {
    // Timeout de 5 segundos para la petición
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout")), 5000)
    );

    const fetchTask = supabase
      .from("cms_config")
      .select("data")
      .maybeSingle();

    const result = await Promise.race([fetchTask, timeout]) as any;
    
    if (result.error) {
      console.warn("CMS: Error al obtener datos de Supabase:", result.error.message);
      return siteData;
    }

    if (!result.data) {
      console.log("CMS: No se encontraron datos, inicializando...");
      const { data: newData, error: insertError } = await supabase
         .from("cms_config")
         .insert([{ data: siteData }])
         .select("data")
         .maybeSingle();
      
      if (insertError) {
        console.error("CMS: Error al inicializar:", insertError.message);
        return siteData;
      }
      return newData?.data || siteData;
    }

    console.log("CMS: Datos cargados correctamente.");
    return result.data.data;
  } catch (error) {
    console.error("CMS: Fallo en carga, usando fallback local:", error);
    return siteData;
  }
};

export const saveCMSData = async (newData: any) => {
  try {
    // First, check if row exists
    const { data: existing } = await supabase
      .from("cms_config")
      .select("id")
      .single();

    if (existing) {
      const { error } = await supabase
        .from("cms_config")
        .update({ data: newData, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("cms_config")
        .insert([{ data: newData }]);
      if (error) throw error;
    }
    return true;
  } catch (error) {
    console.error("Error saving CMS data:", error);
    throw error;
  }
};

export const deleteFileFromStorage = async (url: string) => {
  if (!url || typeof url !== 'string' || url.includes('/video/frames/')) return;
  
  if (!url.includes('ignkkavplpqoyxxflbzh.supabase.co/storage/v1/object/public/')) return;
  
  try {
    const urlParts = url.split('/storage/v1/object/public/');
    const rest = urlParts[1];
    const bucket = rest.split('/')[0];
    const path = rest.substring(bucket.length + 1);

    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) console.error("Error deleting from storage:", error);
    else console.log(`Deleted file: ${bucket}/${path}`);
  } catch (err) {
    console.error("Error parsing storage URL:", err);
  }
};

