/**
 * Firebase Cloud Messaging (FCM) - Módulo de Notificaciones Push
 * Sneyder Studio
 *
 * Funcionalidades:
 * - Solicitar permiso de notificaciones al usuario
 * - Obtener token FCM único del dispositivo
 * - Escuchar mensajes en primer plano (foreground)
 * - Persistir token en Firestore vinculado al usuario
 */

import { getMessaging, getToken, onMessage, isSupported, type Messaging } from "firebase/messaging";
import { app, db } from "./firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";

let messagingInstance: Messaging | null = null;

/**
 * Obtiene la instancia de Firebase Messaging (solo en cliente)
 */
async function getMessagingInstance(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;

  if (messagingInstance) return messagingInstance;

  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn("FCM: Este navegador no soporta Firebase Messaging.");
      return null;
    }
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (error) {
    console.error("FCM: Error al inicializar Messaging:", error);
    return null;
  }
}

/**
 * Solicita permiso de notificaciones y obtiene el token FCM del dispositivo
 * @returns {Promise<string | null>} Token FCM o null si falla/deniega
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    // Solicitar permiso de notificaciones al navegador
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("FCM: Permiso de notificaciones denegado por el usuario.");
      return null;
    }

    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    // Registrar el service worker de Firebase Messaging
    const swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    console.log("FCM: Service Worker registrado correctamente.", swRegistration);

    // Obtener token FCM usando VAPID key y el service worker registrado
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (token) {
      console.log("FCM: Token obtenido exitosamente:", token.substring(0, 20) + "...");
      return token;
    } else {
      console.warn("FCM: No se pudo obtener el token. Verifica la configuración VAPID.");
      return null;
    }
  } catch (error) {
    console.error("FCM: Error al solicitar permiso/token:", error);
    return null;
  }
}

/**
 * Guarda el token FCM en Firestore vinculado al perfil del usuario
 * Colección: fcm_tokens/{userId}
 * @param userId - UID del usuario autenticado
 * @param token - Token FCM del dispositivo
 */
export async function saveTokenToFirestore(userId: string, token: string): Promise<void> {
  try {
    const userAgent = navigator.userAgent;
    const platform = /android/i.test(userAgent)
      ? "android"
      : /iphone|ipad|ipod/i.test(userAgent)
      ? "ios"
      : "web";

    await setDoc(
      doc(db, "fcm_tokens", userId),
      {
        token,
        userId,
        platform,
        userAgent: userAgent.substring(0, 200),
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        active: true,
      },
      { merge: true } // merge para no sobreescribir createdAt si ya existe
    );

    console.log("FCM: Token guardado en Firestore para el usuario:", userId);
  } catch (error) {
    console.error("FCM: Error al guardar token en Firestore:", error);
  }
}

/**
 * Flujo completo: Solicitar permiso → Obtener token → Guardar en Firestore
 * @param userId - UID del usuario autenticado
 * @returns {Promise<string | null>} Token FCM o null
 */
export async function initializePushNotifications(userId: string): Promise<string | null> {
  const token = await requestNotificationPermission();
  if (token && userId) {
    await saveTokenToFirestore(userId, token);
  }
  return token;
}

/**
 * Escucha mensajes en primer plano (foreground) y ejecuta callback
 * @param callback - Función que recibe el payload del mensaje
 * @returns {() => void} Función para cancelar la suscripción
 */
export async function listenToForegroundMessages(
  callback: (payload: any) => void
): Promise<(() => void) | null> {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log("FCM: Mensaje recibido en primer plano:", payload);
    callback(payload);
  });

  return unsubscribe;
}
