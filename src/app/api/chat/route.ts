import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebase-admin";
import { siteData } from "@/data/siteData";
import { legalData } from "@/data/legalData";
import { DEFAULT_SETTINGS } from "@/lib/settings";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Obtiene el contexto completo de la plataforma desde Firestore y datos locales.
 * Eva usa esta información para responder con precisión.
 */
async function getFullPlatformContext(userId?: string): Promise<string> {
  let contextParts: string[] = [];

  // ── 1. Contenido del sitio (siteData) ──
  contextParts.push(`=== CONTENIDO DEL SITIO WEB ===`);
  contextParts.push(`Hero: ${siteData.hero.title} - ${siteData.hero.description}`);

  // Servicios
  contextParts.push(`\n--- SERVICIOS QUE OFRECE SNEYDER STUDIO ---`);
  siteData.services.forEach((s: any) => {
    contextParts.push(`Servicio: ${s.title}`);
    contextParts.push(`Descripción: ${s.description}`);
    if (s.platforms) {
      s.platforms.forEach((p: any) => contextParts.push(`  Plataforma: ${p.name} - ${p.detail}`));
    }
    if (s.subCards) {
      s.subCards.forEach((sc: any) => contextParts.push(`  Sub-servicio: ${sc.title} - ${sc.desc}`));
    }
    if (s.tags) contextParts.push(`  Tags: ${s.tags.join(', ')}`);
  });

  // Modelos de IA
  contextParts.push(`\n--- MODELOS DE IA DISPONIBLES ---`);
  contextParts.push(`Título: ${siteData.aiModels.title}`);
  contextParts.push(`Descripción: ${siteData.aiModels.description}`);
  siteData.aiModels.models.forEach((m: any) => {
    contextParts.push(`Modelo: ${m.name} (${m.tagline})`);
    contextParts.push(`  Descripción: ${m.description}`);
    contextParts.push(`  Aplicación: ${m.application}`);
    contextParts.push(`  Características: ${m.features.join(', ')}`);
  });

  // Expansión
  contextParts.push(`\n--- EXPANSIÓN DE NEGOCIOS ---`);
  contextParts.push(`${siteData.expansion.title}: ${siteData.expansion.description}`);

  // ── 2. Información Legal ──
  contextParts.push(`\n=== INFORMACIÓN LEGAL ===`);
  contextParts.push(`Políticas: ${legalData.politicas.content.trim().substring(0, 500)}`);
  contextParts.push(`Términos: ${legalData.terminos.content.trim().substring(0, 500)}`);
  contextParts.push(`Contrato: ${legalData.contrato.content.trim().substring(0, 500)}`);
  contextParts.push(`Sobre Nosotros: ${legalData.nosotros.content.trim().substring(0, 500)}`);

  // ── 3. Información de contacto y configuración ──
  contextParts.push(`\n=== CONTACTO Y CONFIGURACIÓN ===`);
  contextParts.push(`Email: ${DEFAULT_SETTINGS.contact_email}`);
  contextParts.push(`Teléfono: ${DEFAULT_SETTINGS.contact_phone}`);
  contextParts.push(`WhatsApp: ${DEFAULT_SETTINGS.whatsapp}`);
  contextParts.push(`Dirección: ${DEFAULT_SETTINGS.address}`);
  contextParts.push(`Horario: ${DEFAULT_SETTINGS.business_hours}`);
  contextParts.push(`LinkedIn: ${DEFAULT_SETTINGS.linkedin_url}`);

  // ── 4. Datos de Firestore ──
  try {
    const db = adminFirestore();

    // Configuración admin (settings actualizadas desde Firestore)
    try {
      const settingsSnap = await db.collection("settings").doc("admin").get();
      if (settingsSnap.exists) {
        const settings = settingsSnap.data();
        contextParts.push(`\n=== CONFIGURACIÓN ACTUALIZADA (Firestore) ===`);
        if (settings?.contact_email) contextParts.push(`Email actualizado: ${settings.contact_email}`);
        if (settings?.contact_phone) contextParts.push(`Teléfono actualizado: ${settings.contact_phone}`);
        if (settings?.whatsapp) contextParts.push(`WhatsApp actualizado: ${settings.whatsapp}`);
        if (settings?.address) contextParts.push(`Dirección actualizada: ${settings.address}`);
        if (settings?.business_hours) contextParts.push(`Horario actualizado: ${settings.business_hours}`);
      }
    } catch (e) { /* Sin configuración personalizada, se usan defaults */ }

    // CMS config (contenido dinámico del sitio)
    try {
      const cmsSnap = await db.collection("cms_config").doc("main_config").get();
      if (cmsSnap.exists) {
        const cmsData = cmsSnap.data()?.data;
        if (cmsData) {
          contextParts.push(`\n=== CONTENIDO CMS DINÁMICO ===`);
          if (cmsData.hero?.title) contextParts.push(`Título principal CMS: ${cmsData.hero.title}`);
          if (cmsData.hero?.description) contextParts.push(`Descripción CMS: ${cmsData.hero.description}`);
        }
      }
    } catch (e) { /* Sin datos CMS */ }

    // Pedidos recientes (los últimos 10 para contexto general)
    try {
      const ordersSnap = await db.collection("orders").orderBy("created_at", "desc").limit(10).get();
      if (!ordersSnap.empty) {
        contextParts.push(`\n=== PEDIDOS RECIENTES (Últimos ${ordersSnap.size}) ===`);
        ordersSnap.docs.forEach((doc) => {
          const order = doc.data();
          contextParts.push(`Pedido ${doc.id}: Estado=${order.status}, Total=$${order.total || 0} USD, Tipo=${order.proposal?.project_subject || order.items?.[0]?.name || 'N/A'}, Fecha=${order.created_at || 'N/A'}`);
        });
      }
    } catch (e) { /* Sin acceso a pedidos */ }

    // Si hay un userId, obtener información específica del usuario
    if (userId) {
      try {
        const profileSnap = await db.collection("profiles").doc(userId).get();
        if (profileSnap.exists) {
          const profile = profileSnap.data();
          contextParts.push(`\n=== PERFIL DEL USUARIO ACTUAL ===`);
          contextParts.push(`Nombre: ${profile?.manager_name || 'No especificado'}`);
          contextParts.push(`Email: ${profile?.email || 'No especificado'}`);
          contextParts.push(`WhatsApp: ${profile?.whatsapp || 'No especificado'}`);
          contextParts.push(`Empresa: ${profile?.company_name || 'No especificado'}`);
        }
      } catch (e) { /* Sin perfil */ }

      // Pedidos del usuario específico
      try {
        const userOrdersSnap = await db.collection("orders").where("user_id", "==", userId).orderBy("created_at", "desc").limit(5).get();
        if (!userOrdersSnap.empty) {
          contextParts.push(`\n=== PEDIDOS DEL USUARIO ACTUAL ===`);
          userOrdersSnap.docs.forEach((doc) => {
            const order = doc.data();
            contextParts.push(`Pedido ${doc.id}: Estado=${order.status}, Total=$${order.total || 0} USD, Tipo=${order.proposal?.project_subject || 'N/A'}, Método de pago=${order.payment_method || 'N/A'}`);
            if (order.credit_info) {
              contextParts.push(`  Crédito: ${order.credit_info.months} meses, Cuota mensual=$${order.credit_info.monthly_payment} USD`);
            }
          });
        }
      } catch (e) { /* Sin pedidos del usuario */ }

      // Notificaciones del usuario
      try {
        const notifSnap = await db.collection("notifications").where("userId", "==", userId).orderBy("createdAt", "desc").limit(5).get();
        if (!notifSnap.empty) {
          contextParts.push(`\n=== NOTIFICACIONES DEL USUARIO ===`);
          notifSnap.docs.forEach((doc) => {
            const notif = doc.data();
            contextParts.push(`- ${notif.title}: ${notif.message} (${notif.unread ? 'No leída' : 'Leída'})`);
          });
        }
      } catch (e) { /* Sin notificaciones */ }
    }

    // Estadísticas generales
    try {
      const statsSnap = await db.collection("stats").doc("visits").collection("daily").orderBy("date", "desc").limit(7).get();
      if (!statsSnap.empty) {
        let totalVisits = 0;
        statsSnap.docs.forEach((doc) => {
          totalVisits += doc.data().count || 0;
        });
        contextParts.push(`\n=== ESTADÍSTICAS ===`);
        contextParts.push(`Visitas de los últimos 7 días: ${totalVisits}`);
      }
    } catch (e) { /* Sin estadísticas */ }

    // Total de usuarios
    try {
      const profilesSnap = await db.collection("profiles").count().get();
      contextParts.push(`Total de usuarios registrados: ${profilesSnap.data().count}`);
    } catch (e) { /* Sin conteo */ }

    // Total de pedidos
    try {
      const totalOrdersSnap = await db.collection("orders").count().get();
      contextParts.push(`Total de pedidos: ${totalOrdersSnap.data().count}`);
    } catch (e) { /* Sin conteo */ }

  } catch (firestoreError) {
    contextParts.push(`\n[Nota: No se pudo acceder a datos en tiempo real de Firestore. Se usarán solo los datos estáticos del sitio.]`);
  }

  // Información sobre financiamiento/crédito
  contextParts.push(`\n=== SISTEMA DE FINANCIAMIENTO ===`);
  contextParts.push(`Pago inicial: 20% del presupuesto total`);
  contextParts.push(`Cargo por recurso: 1% del valor del proyecto`);
  contextParts.push(`Interés sobre crédito: 15% sobre el monto restante (80%)`);
  contextParts.push(`Plazos disponibles: 6, 7, 8, 9, 10, 11 o 12 meses`);
  contextParts.push(`Las cuotas mensuales comienzan cuando el proyecto pasa de producción a completado.`);
  contextParts.push(`Penalización por mora: 2% diario sobre cuota vencida.`);
  contextParts.push(`Incumplimiento de 3 meses = rescisión de contrato y pérdida de inversión.`);

  // Páginas de la plataforma
  contextParts.push(`\n=== PÁGINAS DE LA PLATAFORMA ===`);
  contextParts.push(`/  → Página principal con hero, servicios, modelos IA, expansión de negocios`);
  contextParts.push(`/contacto  → Formulario para crear pedidos (Crea Pedido)`);
  contextParts.push(`/mis-pedidos  → Lista de pedidos del usuario`);
  contextParts.push(`/servicios  → Detalle de todos los servicios`);
  contextParts.push(`/ia-models  → Modelos de IA disponibles para integrar`);
  contextParts.push(`/profile  → Perfil del usuario`);
  contextParts.push(`/notifications  → Centro de notificaciones`);
  contextParts.push(`/facturas  → Facturas de pedidos completados`);
  contextParts.push(`/contrato  → Contrato de servicios`);
  contextParts.push(`/terminos  → Términos de servicio`);
  contextParts.push(`/politicas  → Políticas de privacidad`);
  contextParts.push(`/nosotros  → Acerca de Sneyder Studio`);

  return contextParts.join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const { messages, userId } = await req.json();

    // Obtener contexto completo de la plataforma
    const platformContext = await getFullPlatformContext(userId);

    const systemMessage = {
      role: "system",
      content: `Tu nombre es Eva. Eres la inteligencia artificial oficial de Sneyder Studio, diseñada y construida íntegramente por el equipo de Sneyder Studio.

Tienes acceso TOTAL a toda la información de la plataforma, la base de datos y el contenido del sitio web. Usa esta información para dar respuestas precisas y personalizadas.

${platformContext}

=== TUS INSTRUCCIONES ===
- Preséntate como Eva cuando te pregunten quién eres.
- Menciona con orgullo que fuiste creada por Sneyder Studio.
- Usa los datos reales de la plataforma para responder (pedidos, servicios, precios, estadísticas, etc.).
- Si el usuario pregunta por su pedido, consulta los datos de "PEDIDOS DEL USUARIO ACTUAL".
- Si preguntan por servicios, usa la sección "SERVICIOS QUE OFRECE SNEYDER STUDIO".
- Si preguntan por financiamiento, usa la sección "SISTEMA DE FINANCIAMIENTO".
- Si preguntan por contacto, usa los datos de "CONTACTO Y CONFIGURACIÓN".
- Si preguntan por políticas o contratos, usa "INFORMACIÓN LEGAL".
- Responde siempre en español.
- Sé concisa (máximo 3-4 oraciones por respuesta, excepto si se pide detalle específico).
- Si el usuario necesita un servicio, invítalo a usar la sección "Crea Pedido" (/contacto).
- Si el usuario necesita hablar con una persona, menciónale el WhatsApp de contacto.
- Si el usuario pregunta algo fuera de tu conocimiento, indica amablemente que puedes ayudarlo con temas de la plataforma.`
    };

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Groq API error:", errorData);
      return NextResponse.json(
        { error: "Error al comunicarse con la IA" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || "Lo siento, no pude procesar tu solicitud.";

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
