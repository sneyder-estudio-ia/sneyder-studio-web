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

// Configuración de la Cuenta de Servicio
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Reemplazar los saltos de línea literales \n por caracteres reales
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
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

  // Si ya existe una app, retornarla; de lo contrario, crear una nueva
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
    // Opcional: databaseURL: `https://${serviceAccount.projectId}.firebaseio.com`
  });
}

export const adminMessaging = () => getFirebaseAdmin().messaging();
export const adminFirestore = () => getFirebaseAdmin().firestore();
export const adminAuth = () => getFirebaseAdmin().auth();
