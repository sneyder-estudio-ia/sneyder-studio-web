const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");

// Credenciales inyectadas via variables de entorno
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'AYRp6FMZnmtwv6wCwMfx66DAHQMFRBDGvtE1xnE3zcCD8G-Z-dBFgjX0tSnW5KqHKyO5XxMY5PQAi3E2';
const SECRET = process.env.PAYPAL_CLIENT_SECRET || 'EFoDV3FQWdszqE3kB1vdt5MRWm2JLD36GrNxO0aGZy76PUUhDpHbIAppHEONsIvTU1OKGTYtw-lC67nf';
const ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT || 'live';
const PAYPAL_API = ENVIRONMENT === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

/**
 * Obtiene un token de acceso OAuth2 de PayPal
 */
async function getAccessToken() {
    const auth = Buffer.from(`${CLIENT_ID}:${SECRET}`).toString('base64');
    const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    if (!data.access_token) {
        throw new Error("No se pudo obtener el token de acceso: " + JSON.stringify(data));
    }
    return data.access_token;
}

/**
 * Configuración del servidor MCP
 */
const server = new Server(
  {
    name: "paypal-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

/**
 * Recursos disponibles: lecturas de órdenes y pagos
 */
const { ListResourcesRequestSchema, ReadResourceRequestSchema } = require("@modelcontextprotocol/sdk/types.js");

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "paypal://orders",
        name: "Lista de Órdenes Recientes",
        description: "Permite listar las últimas órdenes creadas en la cuenta",
        mimeType: "application/json",
      },
      {
        uri: "paypal://payments",
        name: "Lista de Pagos Recientes",
        description: "Permite listar los últimos pagos recibidos",
        mimeType: "application/json",
      }
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const token = await getAccessToken();
  const uri = request.params.uri;
  
  if (uri === "paypal://orders") {
    // Aquí se podría implementar una lógica para listar órdenes reales de la API
    return {
      contents: [{
        uri: uri,
        mimeType: "application/json",
        text: JSON.stringify({ message: "Utilice 'get_paypal_order' con un ID específico para ver detalles de una orden." }, null, 2),
      }],
    };
  }

  throw new Error(`Recurso no encontrado: ${uri}`);
});

/**
 * Definición de las herramientas disponibles
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_paypal_balance",
        description: "Obtiene el saldo actual de la cuenta de PayPal (Producción)",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "list_paypal_transactions",
        description: "Lista las transacciones de PayPal en un rango de fechas",
        inputSchema: {
          type: "object",
          properties: {
            start_date: { 
                type: "string", 
                description: "Fecha de inicio en formato ISO (ej: 2023-10-01T00:00:00Z)" 
            },
            end_date: { 
                type: "string", 
                description: "Fecha de fin en formato ISO (ej: 2023-10-31T23:59:59Z)" 
            },
          },
        },
      },
      {
        name: "create_paypal_order",
        description: "Crea una orden de pago simple en PayPal",
        inputSchema: {
          type: "object",
          properties: {
            amount: { type: "string", description: "Monto total (ej: '10.00')" },
            currency: { type: "string", description: "Código de moneda (ej: 'USD')" },
          },
          required: ["amount", "currency"],
        },
      },
      {
        name: "get_paypal_order",
        description: "Obtiene los detalles de una orden de PayPal",
        inputSchema: {
          type: "object",
          properties: {
            order_id: { type: "string", description: "El ID de la orden de PayPal" },
          },
          required: ["order_id"],
        },
      },
      {
        name: "capture_paypal_order",
        description: "Captura el pago de una orden aprobada de PayPal",
        inputSchema: {
          type: "object",
          properties: {
            order_id: { type: "string", description: "El ID de la orden de PayPal" },
          },
          required: ["order_id"],
        },
      }
    ],
  };
});

/**
 * Lógica para manejar las llamadas a las herramientas
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const token = await getAccessToken();
    
    switch (request.params.name) {
      case "get_paypal_balance": {
        const response = await fetch(`${PAYPAL_API}/v1/reporting/balances`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }
      
      case "list_paypal_transactions": {
        const { start_date, end_date } = request.params.arguments || {};
        const url = new URL(`${PAYPAL_API}/v1/reporting/transactions`);
        // Nota: El reporting API requiere campos específicos y a veces tarda en actualizarse
        if (start_date) url.searchParams.append('start_date', start_date);
        if (end_date) url.searchParams.append('end_date', end_date);
        
        const response = await fetch(url.toString(), {
          headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "create_paypal_order": {
        const { amount, currency } = request.params.arguments;
        const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [{
              amount: {
                currency_code: currency,
                value: amount
              }
            }]
          })
        });
        const data = await response.json();
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "get_paypal_order": {
        const { order_id } = request.params.arguments;
        const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${order_id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "capture_paypal_order": {
        const { order_id } = request.params.arguments;
        const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${order_id}/capture`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      default:
        throw new Error(`Herramienta no encontrada: ${request.params.name}`);
    }
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text", text: error.message }],
    };
  }
});

/**
 * Inicio del servidor
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("PayPal MCP Server iniciado correctamente");
}

main().catch((error) => {
  console.error("Error crítico en el servidor:", error);
  process.exit(1);
});
