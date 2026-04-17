export const siteData = {
  sectionsOrder: ['hero', 'services', 'ai', 'cyber', 'cta'],
  hero: {
    tagline: "The Sentinel Insight",
    title: "Arquitectura Digital de Alta Precisión.",
    titleHighlight: "Digital",
    description: "En Sneyder Studio, fusionamos inteligencia artificial avanzada con ciberseguridad robusta para orquestar ecosistemas digitales que no solo funcionan, sino que evolucionan.",
    primaryCta: "Iniciar Proyecto",
    secondaryCta: "Explorar Servicios",
    aiStatus: "IA activa: Sentinel v2.4"
  },
  services: [
    {
      icon: "web",
      title: "Desarrollo de Apps Web",
      description: "Construimos plataformas escalables de alto rendimiento utilizando arquitecturas modernas que priorizan la velocidad, la seguridad y la experiencia del usuario editorial.",
      tags: ["Next.js", "Tailwind CSS", "WebAssembly"]
    },
    {
      icon: "encrypted",
      title: "Cyber Sentinel",
      description: "Protección de activos digitales mediante auditorías proactivas y encriptación de grado militar. No solo bloqueamos amenazas; las anticipamos.",
      items: ["Zero Trust Architecture", "Real-time Monitoring"]
    }
  ],
  aiModels: {
    title: "Automatización con IA",
    description: "Orquestamos los modelos más potentes del mercado para transformar sus flujos de trabajo. Integración nativa con sistemas empresariales.",
    models: [
      { name: "Gemini", sub: "Google DeepMind" },
      { name: "GPT-4", sub: "OpenAI" },
      { name: "Claude", sub: "Anthropic" },
      { name: "Llama 3", sub: "Meta AI" },
      { name: "Eva & Gabriel", sub: "Custom Models" }
    ]
  },
  cybersecurity: {
    tagline: "SEGURIDAD",
    title: "Construido para Defender",
    description: "La seguridad no es una ocurrencia tardía; es nuestra base. Cada línea de código y cada modelo de IA que implementamos se somete a pruebas riguroras bajo el protocolo de seguridad \"Sentinel Insight\".",
    items: [
      { icon: "encrypted", text: "Cifrado de Extremo a Extremo por Defecto" },
      { icon: "security_update_good", text: "Mitigación Autónoma de Amenazas" }
    ]
  },
  cta: {
    title: "¿Listo para el siguiente nivel?",
    description: "Únase a la vanguardia tecnológica. Descubra cómo el Sentinel Insight de Sneyder Studio puede potenciar su visión empresarial hoy mismo.",
    buttonText: "Suscribirse"
  }
};
