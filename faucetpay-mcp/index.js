const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const fetch = require("node-fetch");

// Credenciales inyectadas via variables de entorno o constantes
const MERCHANT_USERNAME = process.env.FAUCETPAY_MERCHANT_ID || 'axel1994';
const API_KEY = process.env.FAUCETPAY_API_KEY || '42265bbdd23ccdb168f7e431011483685d2ffe1025a550adcf5f4b8d4c9d4668';

/**
 * Configuración del servidor MCP
 */
const server = new Server(
  {
    name: "faucetpay-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Definición de las herramientas disponibles
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_faucetpay_checkout",
        description: "Genera los parámetros para un formulario de checkout de FaucetPay",
        inputSchema: {
          type: "object",
          properties: {
            amount: { type: "string", description: "Monto en USD (ej: '15.50')" },
            currency: { type: "string", enum: ["USDT", "TRX"], description: "Moneda de pago deseada" },
            order_id: { type: "string", description: "ID de la orden o factura" },
            callback_url: { type: "string", description: "URL de IPN para notificaciones" },
            success_url: { type: "string", description: "URL de redirección al completar" },
            cancel_url: { type: "string", description: "URL de redirección al cancelar" }
          },
          required: ["amount", "currency", "order_id"],
        },
      },
      {
        name: "verify_faucetpay_payment",
        description: "Verifica un pago de FaucetPay usando el token recibido en el IPN",
        inputSchema: {
          type: "object",
          properties: {
            token: { type: "string", description: "Token de pago recibido en el IPN" },
          },
          required: ["token"],
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
    switch (request.params.name) {
      case "generate_faucetpay_checkout": {
        const { amount, currency, order_id, callback_url, success_url, cancel_url } = request.params.arguments;
        
        // FaucetPay Merchant Checkout parameters
        const checkoutData = {
          merchant_username: MERCHANT_USERNAME,
          item_name: `Pago Factura #${order_id.slice(0, 8)}`,
          amount1: amount,
          currency1: "USD",
          currency2: currency,
          custom: order_id,
          callback_url: callback_url || "https://sneyderstudio.com/api/webhooks/faucetpay",
          success_url: success_url || `https://sneyderstudio.com/mis-pedidos/${order_id}/pagar/crypto/success`,
          cancel_url: cancel_url || `https://sneyderstudio.com/mis-pedidos/${order_id}/pagar`,
          m_checkout_url: "https://faucetpay.io/merchant/webscr"
        };

        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify({
              message: "Parámetros de checkout generados exitosamente",
              action_url: checkoutData.m_checkout_url,
              form_parameters: checkoutData
            }, null, 2) 
          }],
        };
      }

      case "verify_faucetpay_payment": {
        const { token } = request.params.arguments;
        const response = await fetch(`https://faucetpay.io/merchant/get-payment/${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        // La respuesta de FaucetPay incluye valid: true si el token es legítimo
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify(data, null, 2) 
          }],
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
}

main().catch((error) => {
  process.exit(1);
});
