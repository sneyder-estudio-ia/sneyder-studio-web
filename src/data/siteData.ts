export const siteData = {
  sectionsOrder: ['hero', 'services', 'ai', 'expansion', 'cta'],
  hero: {
    tagline: "Dominio Digital Total",
    title: "Evolucione su Negocio al Infinito Virtual.",
    titleHighlight: "Infinito",
    description: "En Sneyder Studio creamos aplicaciones de alto impacto para Android, iOS, Windows y Linux, diseñadas para que su comercio lidere tanto el mercado físico como el ecosistema virtual más amplio.",
    primaryCta: "Iniciar Proyecto",
    secondaryCta: "Explorar Soluciones",
    aiStatus: "IA activa: Sentinel v2.4"
  },
  services: [
    {
      icon: "devices",
      title: "Desarrollo Multiplataforma",
      description: "Creamos experiencias digitales unificadas utilizando la potencia de **Flutter**. Desde smartphones hasta estaciones de trabajo, su negocio estará presente en cada rincón digital con un solo código de alto rendimiento.",
      techIcon: "/images/flutter_logo.png",
      platforms: [
        {
          name: "Android",
          detail: "Aplicaciones nativas y fluidas optimizadas para el ecosistema móvil más grande del mundo.",
          image: "/images/services/android.png",
          icon: "android"
        },
        {
          name: "iOS",
          detail: "Experiencias premium y elegantes diseñadas específicamente para usuarios de iPhone y iPad.",
          image: "/images/services/ios.png",
          icon: "apple"
        },
        {
          name: "Windows",
          detail: "Software de escritorio robusto y escalable para máxima productividad y gestión empresarial.",
          image: "/images/services/windows.png",
          icon: "window"
        },
        {
          name: "Linux",
          detail: "Sistemas especializados y seguros para infraestructuras tecnológicas de alto rendimiento.",
          image: "/images/services/linux.png",
          icon: "terminal"
        }
      ],
      tags: ["Android", "iOS", "Windows", "Linux"]
    },
    {
      icon: "trending_up",
      title: "Expansión de Negocios",
      description: "Transformamos su visión en una infraestructura global. No solo diseñamos software; construimos los cimientos para que su empresa conquiste nuevos mercados con tecnología de vanguardia.",
      subCards: [
        {
          title: "Escalabilidad Global",
          desc: "Potenciamos su crecimiento sin límites geográficos. Plataformas listas para millones de usuarios con baja latencia universal.",
          image: "/images/services/expansion_global.png",
          icon: "public"
        },
        {
          title: "Infraestructura Resiliente",
          desc: "Sistemas que nunca duermen. Arquitecturas auto-reparables que garantizan su operación crítica 24/7.",
          image: "/images/services/infraestructura.png",
          icon: "mms"
        }
      ]
    }
  ],
  aiModels: {
    title: "El Cerebro de su Automatización",
    description: "Seleccionamos y personalizamos los modelos de IA más potentes del mercado para integrarlos directamente en sus procesos de negocio.",
    models: [
      {
        name: "GPT-4o (OpenAI)",
        tagline: "Razonamiento Avanzado",
        description: "El modelo más versátil y conocido del mundo. Ideal para automatizaciones que requieren un razonamiento lógico complejo, comprensión profunda del lenguaje natural y generación de contenido creativo de alta fidelidad.",
        application: "Perfecto para chatbots de atención al cliente de alto nivel, asistentes de redacción corporativa y análisis de datos empresariales complejos.",
        features: ["Multimodal (Texto y Voz)", "Velocidad Extrema", "Memoria Contextual Amplia"],
        image: "/images/services/gpt4o.png",
        icon: "memory"
      },
      {
        name: "Claude 3.5 Sonnet",
        tagline: "Precisión y Código",
        description: "Desarrollado por Anthropic, Claude se destaca por su tono humano, seguridad intrínseca y una capacidad excepcional para seguir instrucciones técnicas detalladas y escribir código impecable.",
        application: "Ideal para automatizar flujos de trabajo de desarrollo de software, auditoría de documentos legales y comunicación corporativa con un tono natural y seguro.",
        features: ["Seguridad Ética", "Excelente en Programación", "Visión Artificial Avanzada"],
        image: "/images/services/claude.png",
        icon: "code_blocks"
      },
      {
        name: "Gemini 1.5 Pro",
        tagline: "Ecosistema Google",
        description: "La propuesta más potente de Google. Su principal ventaja es el manejo de una ventana de contexto masiva (hasta 2 millones de tokens) y su integración nativa con todas las herramientas de Google Cloud.",
        application: "La mejor opción para analizar libros enteros, colecciones masivas de documentos o videos largos en segundos para extraer insights críticos de negocio.",
        features: ["Ventana de Contexto Gigante", "Integración con Workspace", "Multimodalidad Nativa"],
        image: "/images/services/gemini.png",
        icon: "cloud_sync"
      },
      {
        name: "Llama 3 (Meta)",
        tagline: "Potencia Open Source",
        description: "El modelo de código abierto líder creado por Meta. Ofrece un rendimiento comparable a los modelos propietarios pero con la flexibilidad de poder ser ejecutado en servidores privados para máxima privacidad.",
        application: "Ideal para empresas que requieren procesar datos extremadamente sensibles localmente o que necesitan escalar automatizaciones con costos controlados.",
        features: ["Privacidad de Datos", "Personalización Total", "Eficiencia en Costos"],
        image: "/images/services/llama.png",
        icon: "security"
      }
    ],
    footer: {
      title: "¿No sabe cuál elegir?",
      description: "Nuestros expertos analizan su modelo de negocio y flujo de trabajo para recomendarle la combinación perfecta de modelos que maximice su ROI."
    }
  },
  expansion: {
    tagline: "Escalabilidad Global",
    title: "Potenciamos tu crecimiento sin fronteras",
    description: "Transformamos tu visión en una infraestructura global. No solo diseñamos software; construimos los cimientos para que tu empresa conquiste nuevos mercados con tecnología de vanguardia.",
    items: [
      { icon: "rocket_launch", text: "Escalabilidad en Mercados Virtuales" },
      { icon: "add_business", text: "Dominio de Espacios Físicos" }
    ]
  },
  cta: {
    title: "¿Listo para conquistar el mercado?",
    description: "Únase a la vanguardia. Descubra cómo Sneyder Studio puede potenciar su negocio con tecnología activa hoy mismo.",
    buttonText: "Saber más"
  }
};
