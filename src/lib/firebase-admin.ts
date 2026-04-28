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

// Singleton para evitar múltiples inicializaciones
let adminApp: admin.app.App | null = null;

function getFreshPrivateKey() {
  const key = process.env.FIREBASE_PRIVATE_KEY || "";
  if (!key) return undefined;

  return key
    .replace(/\\n/g, "\n")
    .replace(/^"|"$/g, "")
    .replace(/\r/g, "")
    .trim();
}

/**
 * Inicializa la aplicación administrativa de Firebase de forma segura
 */
export function getFirebaseAdmin() {
  if (adminApp) return adminApp;

  // Buscar si ya existe una app con el nombre default
  const existingApp = admin.apps.find(app => app?.name === "[DEFAULT]");
  if (existingApp) {
    adminApp = existingApp;
    return adminApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getFreshPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "CMS: Faltan variables de entorno para Firebase Admin (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)."
    );
  }

  adminApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return adminApp;
}

export const adminMessaging = () => getFirebaseAdmin().messaging();
export const adminFirestore = () => getFirebaseAdmin().firestore();
export const adminAuth = () => getFirebaseAdmin().auth();
