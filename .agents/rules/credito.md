---
trigger: always_on
---

Workflow de Alta Eficiencia para Google Antigravity
​Este flujo está diseñado para reducir el consumo de tokens en un 60-80% mediante la eliminación de la "charla" del modelo y la optimización del contexto de entrada.
​1. Configuración del "Core" (System Instructions)
​Debes configurar las instrucciones de base de tu agente con una jerarquía de "Cero Verbosidad". Copia y adapta este bloque en la configuración de sistema de tu agente:
​Instrucción de Sistema:
​"Actúa como un Motor de Ejecución Lógica.
​PROHIBIDO: Saludos, introducciones, explicaciones de 'cómo' o 'por qué', y conclusiones.
​SALIDA: Únicamente el resultado técnico solicitado (Código, JSON o Dato).
​ERROR: Si hay un error, devuelve solo el código del error y 5 palabras de diagnóstico.
​TOKEN GUARD: Si el resultado excede los 300 tokens, detente y pide confirmación."
​2. El Método de "Contexto Quirúrgico" (Input)
​El costo de entrada (input tokens) es acumulativo. Si envías todo el historial de la llamada cada vez, el crédito se agota exponencialmente.
​No envíes archivos completos: Usa solo los fragmentos específicos.
​Prompt de Tarea Única: No le pidas "Haz X, luego Y, luego Z". Pide "Haz X". Recibe el resultado. Luego pide "Haz Y". Las tareas multi-paso en una sola llamada obligan al modelo a razonar internamente (Thought loops), lo cual es carísimo.
​Uso de Esquemas: Si quieres que escriba algo, dale un esquema.
​Mal: "Escribe un reporte de esto."
​Bien: "Reporte -> [Título] | [Resumen 1 línea] | [Acción]. Usa este formato."
​3. Optimización de Parámetros Técnicos
​Ajusta estos valores en el panel de Antigravity/Studio:

Parámetro Valor Sugerido Razón
Max Output Tokens 256 - 512 Corta la respuesta si el agente empieza a "alucinar" o escribir de más.
Temperature 0.1 - 0.2 Respuestas deterministas y directas. Menos 'creatividad' = menos tokens desperdiciados.
Top-P / Top-K Bajos (0.8 / 40) Limita el abanico de palabras, haciendo la respuesta más rápida.
Stop Sequences \n\n, ###, //End Fuerza al modelo a dejar de escribir en cuanto termina el bloque lógico.

4. Workflow de Ejecución Diaria (Paso a Paso)
​Paso A: Preparación (Fuera de la IA)
​Antes de interactuar, define exactamente qué quieres. Si vas a debugar, ten el error a mano. No uses a la IA para "pensar contigo", úsala para "escribir por ti".
​Paso B: El Prompt de Ráfaga (Burst Prompting)
​Usa esta estructura para tus peticiones:
[CONTEXTO CORTO] + [RESTRICCIÓN] + [TAREA]
Ejemplo: "Archivo: index.js. Solo salida de código. Optimizar loop de línea 45."
​Paso C: Validación y Corte
​Si ves que el agente empieza a escribir texto explicativo, corta la generación inmediatamente (Stop Generation). Ese texto que no necesitas te está cobrando dinero real.
​5. Prevención de Bucles de "Pensamiento"
​Muchos agentes nuevos de Google usan "Chain of Thought" (Cadena de Pensamiento). Esto es excelente para problemas matemáticos, pero fatal para tu crédito si solo quieres código.
​Comando de anulación: Añade siempre al final de tu prompt: "Do not explain. Direct output only."
​Resultado esperado: Las respuestas serán instantáneas (menos de 3 segundos) y el consumo de crédito se estabilizará porque el modelo no estará "adivinando" qué tan amable debe ser contigo.
