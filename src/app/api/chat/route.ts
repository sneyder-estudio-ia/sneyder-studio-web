import { NextRequest, NextResponse } from "next/server";
import { siteData } from "@/data/siteData";
import { legalData } from "@/data/legalData";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export const runtime = "edge";

/**
 * Obtiene el contexto completo de la plataforma desde Firestore vía REST y datos locales.
 * Optimizado para Vercel Edge Runtime.
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
  });

  // ── 2. Información Legal ──
  contextParts.push(`\n=== INFORMACIÓN LEGAL ===`);
  contextParts.push(`Políticas: ${legalData.politicas.content.trim().substring(0, 300)}`);
  contextParts.push(`Términos: ${legalData.terminos.content.trim().substring(0, 300)}`);

  // ── 3. Datos de Firestore (Vía REST API para Edge compatibility) ──
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || "sneyder-studio";
    const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

    // Función auxiliar para fetch REST (sin auth para simplificar, o con API Key)
    const fetchDoc = async (path: string) => {
      const resp = await fetch(`${baseUrl}/${path}?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`);
      if (!resp.ok) return null;
      const data = await resp.json();
      // Mapeo simple de campos Firestore REST a objeto plano
      const fields = data.fields || {};
      const obj: any = {};
      for (const [k, v] of Object.entries(fields)) {
         const val: any = v;
         obj[k] = val.stringValue || val.integerValue || val.booleanValue || val.doubleValue || val.mapValue || null;
      }
      return obj;
    };

    // Configuración admin
    try {
      const settings = await fetchDoc("settings/admin");
      if (settings) {
        contextParts.push(`\n=== CONFIGURACIÓN ACTUALIZADA ===`);
        if (settings.contact_email) contextParts.push(`Email: ${settings.contact_email}`);
      }
    } catch (e) {}

    // Si hay userId, intentamos perfil (Si las reglas lo permiten o vía Proxy)
    if (userId) {
       contextParts.push(`\nID de Usuario Actual: ${userId}`);
    }

  } catch (firestoreError) {
    contextParts.push(`\n[Nota: Datos en tiempo real limitados por entorno Edge.]`);
  }

  contextParts.push(`\n=== SISTEMA DE FINANCIAMIENTO ===`);
  contextParts.push(`Pago inicial: 20%. Interés: 15%. Plazos: 6-12 meses.`);

  return contextParts.join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const { messages, userId } = await req.json();
    const platformContext = await getFullPlatformContext(userId);

    const systemMessage = {
      role: "system",
      content: `Tu nombre es Eva. Eres la IA oficial de Sneyder Studio.
      Contexto de la plataforma:
      ${platformContext}
      
      REGLAS CRÍTICAS:
      1. Responde siempre de forma profesional y concisa.
      2. No uses NUNCA el símbolo numeral (#) ni asteriscos (*) en tus respuestas.
      3. No uses formato Markdown para títulos o listas (usa texto plano elegante).
      4. Asegúrate de que tus frases estén completas y bien estructuradas.`
    };

    // Llamada a Groq con streaming habilitado
    const groqResponse = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [systemMessage, ...messages],
        temperature: 0.5, // Bajamos la temperatura para mayor estabilidad
        max_tokens: 1024,
        stream: true,
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error("Groq API error:", errorText);

      // Manejo específico de Rate Limit
      if (groqResponse.status === 429) {
        return NextResponse.json({
          error: "rate_limit",
          message: "Lo siento, he recibido un gran volumen de consultas en poco tiempo. Por favor, inténtalo de nuevo en unos minutos; estaré lista para asistirte entonces."
        }, { status: 429 });
      }

      return NextResponse.json({ error: "Error de IA" }, { status: 500 });
    }

    // Transformamos el stream de Groq (OpenAI format) a un stream legible por el cliente
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = groqResponse.body?.getReader();
        if (!reader) return;

        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Guardar la línea incompleta

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine) continue;

              if (trimmedLine.startsWith("data: ")) {
                const dataStr = trimmedLine.slice(6);
                if (dataStr === "[DONE]") {
                  controller.close();
                  return;
                }
                try {
                  const data = JSON.parse(dataStr);
                  const content = data.choices?.[0]?.delta?.content || "";
                  if (content) {
                    controller.enqueue(encoder.encode(content));
                  }
                } catch (e) {
                  // Error parseando JSON parcial, lo ignoramos o manejamos
                }
              }
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
