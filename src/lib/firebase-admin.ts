import * as admin from "firebase-admin";

/**
 * Firebase Admin SDK - Servidor (Vercel)
 * Sneyder Studio
 * 
 * Esta instancia permite realizar operaciones administrativas seguras:
 * - Enviar notificaciones push a dispositivos (FCM)
 * - Gestionar usuarios
 * - Acceso total a Firestore
 */

import fs from "fs";
import path from "path";

function getFreshPrivateKey() {
  let key = process.env.FIREBASE_PRIVATE_KEY || "";
  
  // Forzar lectura del archivo .env.local físico para saltar la memoria caché del servidor sin necesidad de reiniciar
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      // Buscar la variable ignorando saltos de línea y obtener contenido exacto
      const match = envContent.match(/FIREBASE_PRIVATE_KEY="([\s\S]*?)"/);
      if (match && match[1]) {
        key = match[1];
      }
    }
  } catch (e) {
    console.error("No se pudo leer .env.local directamente", e);
  }

  if (!key) return undefined;

  return key
    .replace(/\\n/g, "\n")
    .replace(/^"|"$/g, "")
    .replace(/\r/g, "")
    .split('\n')
    .map(line => line.includes('PRIVATE KEY') ? line : line.replace(/\s+/g, ''))
    .join('\n')
    .trim();
}

// Configuración de la Cuenta de Servicio
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: getFreshPrivateKey(),
};

/**
 * Inicializa la aplicación administrativa de Firebase de forma segura
 * Evita la inicialización duplicada en entornos de Hot Reload / Serverless
 */
export function getFirebaseAdmin() {
  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error(
      "CMS: Faltan variables de entorno para Firebase Admin (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)."
    );
  }

  // Eliminar cualquier instancia previa en memoria caché para forzar que cargue la contraseña fresca reparada
  if (admin.apps.length > 0) {
    admin.apps.forEach((app) => {
      if (app) admin.app(app.name).delete();
    });
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
  });
}

export const adminMessaging = () => getFirebaseAdmin().messaging();
export const adminFirestore = () => getFirebaseAdmin().firestore();
export const adminAuth = () => getFirebaseAdmin().auth();
