import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { legalData } from "../data/legalData";

export interface AdminSettings {
  contact_email: string;
  contact_phone: string;
  whatsapp: string;
  address: string;
  business_hours: string;
  facebook_url: string;
  instagram_url: string;
  linkedin_url: string;
  github_url: string;
  policies_content: string;
  terms_content: string;
  contract_content: string;
  about_us_content: string;
}

export const DEFAULT_SETTINGS: AdminSettings = {
  contact_email: "sneyderestudio@gmail.com",
  contact_phone: "+506 7206-5581",
  whatsapp: "https://wa.me/50672065581",
  address: "San José, Costa Rica",
  business_hours: "Lun-Vie 9:00 AM - 6:00 PM",
  facebook_url: "#",
  instagram_url: "#",
  linkedin_url: "https://www.linkedin.com/in/sneyder-studio-2b84793b7?utm_source=share_via&utm_content=profile&utm_medium=member_android",
  github_url: "#",
  policies_content: legalData.politicas.content.trim(),
  terms_content: legalData.terminos.content.trim(),
  contract_content: legalData.contrato.content.trim(),
  about_us_content: legalData.nosotros.content.trim(),
};

export const getAdminSettings = async (): Promise<AdminSettings> => {
  try {
    const docRef = doc(db, "settings", "admin");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...DEFAULT_SETTINGS, ...docSnap.data() };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error("Error fetching admin settings:", error);
    return DEFAULT_SETTINGS;
  }
};
