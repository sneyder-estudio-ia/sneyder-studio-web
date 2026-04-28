import { NextRequest, NextResponse } from "next/server";
import { adminMessaging, adminFirestore } from "@/lib/firebase-admin";

/**
 * API Endpoint: /api/notify
 * Dispara una notificación push a un usuario específico.
 * 
 * Payload esperado (JSON):
 * {
 *   "userId": "ID_DEL_USUARIO",
 *   "title": "Título opcional",
 *   "message": "Cuerpo del mensaje",
 *   "data": { "key": "value" }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, title, message, data = {} } = await req.json();

    if (!userId || !message) {
      return NextResponse.json(
        { error: "CMS: userId y message son obligatorios." },
        { status: 400 }
      );
    }

    // 1. Obtener el token FCM del usuario desde Firestore
    const db = adminFirestore();
    const tokenDoc = await db.collection("fcm_tokens").doc(userId).get();

    if (!tokenDoc.exists) {
      return NextResponse.json(
        { error: "CMS: No se encontró un token FCM para este usuario." },
        { status: 404 }
      );
    }

    const { token, platform } = tokenDoc.data()!;

    if (!token) {
      return NextResponse.json(
        { error: "CMS: El documento del usuario no contiene un token válido." },
        { status: 404 }
      );
    }

    // 2. Construir el mensaje optimizado para Android y Web
    const notificationTitle = title || "Sneyder Studio";
    
    const fcmMessage = {
      token: token,
      notification: {
        title: notificationTitle,
        body: message,
      },
      data: {
        ...data,
        url: data.url || "/notifications", // URL por defecto al hacer clic
        click_action: "FLUTTER_NOTIFICATION_CLICK", // Para compatibilidad Android/Flutter si aplica
      },
      // Configuración específica de Android (Protocolo Estricto)
      android: {
        priority: "high" as const,
        notification: {
          icon: "stock_ticker_update",
          color: "#00E5FF", // Cyan corporativo
          clickAction: "OPEN_NOTIFICATIONS", // Acción configurada en el Service Worker
          sound: "default",
        },
      },
      // Configuración Web (Vercel/PWA)
      webpush: {
        headers: {
          Urgency: "high",
        },
        notification: {
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: "sneyder-studio-notif",
        },
        fcm_options: {
          link: data.url || "/notifications",
        },
      },
    };

    // 3. Enviar la notificación vía Firebase Admin SDK
    await adminMessaging().send(fcmMessage);

    console.log(`CMS: Notificación enviada exitosamente a ${userId}`);

    return NextResponse.json({
      success: true,
      message: "Notificación enviada correctamente.",
      target: userId,
      platform: platform || "unknown"
    });

  } catch (error: any) {
    console.error("CMS: Error en API /api/notify:", error);
    return NextResponse.json(
        { error: "Error interno al enviar notificación", details: error.message },
        { status: 500 }
    );
  }
}
