import { NextRequest, NextResponse } from "next/server";
import { siteData } from "@/data/siteData";
import { legalData } from "@/data/legalData";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { adminFirestore } from "@/lib/firebase-admin";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Cambiamos a nodejs para permitir el uso de firebase-admin y persistencia centralizada
export const runtime = "nodejs";

/**
 * Obtiene el contexto completo de la plataforma.
 */
async function getFullPlatformContext(userId?: string): Promise<string> {
  let contextParts: string[] = [];

  contextParts.push(`=== CONTENIDO DEL SITIO WEB ===`);
  contextParts.push(`Hero: ${siteData.hero.title} - ${siteData.hero.description}`);

  contextParts.push(`\n--- SERVICIOS QUE OFRECE SNEYDER STUDIO ---`);
  siteData.services.forEach((s: any) => {
    contextParts.push(`Servicio: ${s.title}`);
    contextParts.push(`Descripción: ${s.description}`);
  });

  contextParts.push(`\n=== INFORMACIÓN LEGAL ===`);
  contextParts.push(`Políticas: ${legalData.politicas.content.trim().substring(0, 300)}`);
  contextParts.push(`Términos: ${legalData.terminos.content.trim().substring(0, 300)}`);

  contextParts.push(`\n=== SISTEMA DE FINANCIAMIENTO ===`);
  contextParts.push(`Pago inicial: 20%. Interés: 15%. Plazos: 6-12 meses.`);

  if (userId) {
    contextParts.push(`\nID de Usuario Actual: ${userId}`);
  }

  return contextParts.join('\n');
}

/**
 * Guarda el historial en Firestore de forma centralizada.
 * Optimizado para no exceder 512MB de almacenamiento acumulado (Estrategia de ahorro de costos).
 */
async function saveChatHistory(userId: string | null, messages: any[]) {
  if (!userId) return;
  try {
    const db = adminFirestore();
    
    // Limitamos a los últimos 10 mensajes para mayor ahorro de espacio (512MB limit strategy)
    const optimizedHistory = messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content.substring(0, 2000) // Truncamos mensajes extremadamente largos
    }));

    // Añadimos TTL de 30 días para limpieza automática en Firestore
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);

    const chatData = {
      userId,
      messages: optimizedHistory,
      updatedAt: new Date().toISOString(),
      expiresAt: expirationDate // TTL Field para Firestore
    };

    // Guardamos en el perfil del usuario
    const profileChatRef = db.collection("profiles").doc(userId).collection("eva_history").doc("latest");
    await profileChatRef.set(chatData, { merge: true });
    
    // Registro global simplificado para ahorrar espacio
    await db.collection("eva_chats").add({
      userId,
      preview: optimizedHistory[optimizedHistory.length - 1]?.content.substring(0, 100),
      timestamp: new Date().toISOString(),
      expiresAt: expirationDate
    });
    
  } catch (error) {
    console.error("Error persistiendo historial (Storage Save):", error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, userId } = await req.json();
    
    if (!GROQ_API_KEY) {
      console.error("Missing GROQ_API_KEY");
    }
    if (!GEMINI_API_KEY) {
      console.error("Missing GEMINI_API_KEY");
    }

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

    // 1. Intento con Groq (Llama-3)
    try {
      const groqResponse = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [systemMessage, ...messages],
          temperature: 0.5,
          max_tokens: 1024,
          stream: true,
        }),
      });

      if (!groqResponse.ok) {
        if (groqResponse.status === 429) throw new Error("RATE_LIMIT");
        throw new Error(`Groq Error: ${groqResponse.status}`);
      }

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const stream = new ReadableStream({
        async start(controller) {
          const reader = groqResponse.body?.getReader();
          if (!reader) return;
          
          let fullAssistantResponse = "";
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value);
              const lines = chunk.split("\n");
              for (const line of lines) {
                if (line.trim().startsWith("data: ") && line.trim() !== "data: [DONE]") {
                  try {
                    const data = JSON.parse(line.trim().substring(6));
                    const content = data.choices[0]?.delta?.content || "";
                    fullAssistantResponse += content;
                    controller.enqueue(encoder.encode(content));
                  } catch (e) {}
                }
              }
            }
          } finally {
            // Guardar historial al terminar el stream
            saveChatHistory(userId, [...messages, { role: "assistant", content: fullAssistantResponse }]);
            controller.close();
          }
        },
      });

      return new Response(stream);

    } catch (groqError: any) {
      if (groqError.message === "RATE_LIMIT" || groqError.message.includes("Error")) {
        console.log("Falla en Groq, activando fallback a Gemini 2.5 Flash");
        return await handleGeminiFallback(systemMessage, messages, userId);
      }
      throw groqError;
    }

  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Error en el servicio de IA" }, { status: 500 });
  }
}

async function handleGeminiFallback(systemMessage: any, userMessages: any[], userId: string | null) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "No Gemini API Key" }, { status: 500 });
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: systemMessage.content 
    });

    const history = userMessages.slice(0, -1).map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const lastMessage = userMessages[userMessages.length - 1].content;
    const result = await model.startChat({ history }).sendMessageStream(lastMessage);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullAssistantResponse = "";
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            fullAssistantResponse += text;
            controller.enqueue(encoder.encode(text));
          }
        } finally {
          saveChatHistory(userId, [...userMessages, { role: "assistant", content: fullAssistantResponse }]);
          controller.close();
        }
      },
    });

    return new Response(stream);
  } catch (error) {
    console.error("Gemini Fallback Error:", error);
    return NextResponse.json({ error: "Servicio de IA no disponible" }, { status: 500 });
  }
}
