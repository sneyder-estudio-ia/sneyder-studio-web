# PayPal MCP Server

Este es un servidor de Model Context Protocol (MCP) que permite interactuar con la API de PayPal (Producción) utilizando herramientas directas.

## Características

- `get_paypal_balance`: Obtiene el saldo de la cuenta.
- `list_paypal_transactions`: Lista transacciones en un rango de fechas.
- `create_paypal_order`: Crea una orden de pago para capturar fondos.

## Configuración para Claude Desktop

Para usar este MCP en Claude Desktop, añade lo siguiente a tu archivo `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "paypal": {
      "command": "node",
      "args": ["d:/Documents/josepe/Desktop/Sneyder Studio/Sneyder Studio Web/paypal-mcp/index.js"]
    }
  }
}
```

## Estado de la Conexión
- **Validado**: Las credenciales proporcionadas han sido probadas con éxito contra el endpoint de Sandbox de PayPal.
- **Acceso**: Se ha obtenido exitosamente un token OAuth2.

---
*Generado automáticamente por Antigravity para Sneyder Studio.*
