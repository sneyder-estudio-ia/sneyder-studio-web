import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req: NextRequest) {
  console.log("[AI Correction] Iniciando proceso...");
  try {
    const { settings } = await req.json();
    console.log("[AI Correction] Recibidos datos de settings");

    const docsToCorrect = [
      { key: "policies_content", label: "Política de Privacidad y Condiciones" },
      { key: "terms_content", label: "Términos de Servicio" },
      { key: "contract_content", label: "Contrato de Servicios" },
      { key: "about_us_content", label: "Acerca de Nosotros" }
    ];

    // Procesar en paralelo para evitar timeouts
    const correctionPromises = docsToCorrect.map(async (doc) => {
      const originalText = settings[doc.key] || "";
      if (!originalText.trim()) return { key: doc.key, text: "" };

      console.log(`[AI Correction] Corrigiendo: ${doc.label}...`);
      
      try {
        const response = await fetch(GROQ_API_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: `Eres Eva, la IA oficial de Sneyder Studio. Tu tarea es corregir la ortografía, gramática y elevar el estilo profesional de los documentos legales de la empresa, asegurando una SINCRONIZACIÓN TOTAL con los datos configurados.
                REGLAS DE ORO:
                1. DEBES ACTUALIZAR EL DOCUMENTO PARA QUE REFLEJE LOS DATOS ACTUALES:
                   - Email de contacto: ${settings.contact_email}
                   - Teléfono/WhatsApp: ${settings.contact_phone}
                   - Dirección: ${settings.address}
                   - Interés Anual: ${settings.credit_annual_interest}%
                   - Interés Mensual: ${settings.credit_monthly_interest}%
                   - Pago Inicial Mínimo: ${settings.credit_min_down_payment}%
                   - Representante Legal: ${settings.contract_representative}
                2. Si el documento menciona alguno de estos campos, asegúrate de que coincidan exactamente con los valores de arriba.
                3. DEBES DEVOLVER TU RESPUESTA EN FORMATO HTML VÁLIDO EXCLUSIVAMENTE (p, h2, ul, li). 
                4. NO agregues notas ni despedidas.
                5. Usa un tono extremadamente profesional, sofisticado y corporativo.`
              },
              {
                role: "user",
                content: `Documento a corregir (${doc.label}):\n\n${originalText}`
              }
            ],
            temperature: 0.2,
            max_tokens: 4096,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[AI Correction] Error en Groq para ${doc.key}:`, errorText);
          return { key: doc.key, text: originalText };
        }

        const data = await response.json();
        let result = data.choices?.[0]?.message?.content || originalText;
        
        // Limpiamos los bloques de código markdown que la IA suele añadir
        result = result.replace(/^```(html)?\s*/gi, '').replace(/\s*```$/g, '');
        
        console.log(`[AI Correction] Completado: ${doc.label}`);
        return { key: doc.key, text: result };
      } catch (err) {
        console.error(`[AI Correction] Excepción en fetch para ${doc.key}:`, err);
        return { key: doc.key, text: originalText };
      }
    });

    const results = await Promise.all(correctionPromises);
    const correctedData: Record<string, string> = {};
    results.forEach(res => {
      correctedData[res.key] = res.text;
    });

    console.log("[AI Correction] Devolviendo datos al cliente para ser guardados...");
    return NextResponse.json({ success: true, data: correctedData });
  } catch (error: any) {
    console.error("[AI Correction] Error crítico en la API:", error);
    return NextResponse.json(
      { error: "Error interno", details: error.message },
      { status: 500 }
    );
  }
}
