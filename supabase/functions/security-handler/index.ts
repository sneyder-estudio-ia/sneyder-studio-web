/// <reference lib="deno.ns" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPPORT_WHATSAPP = Deno.env.get('SUPPORT_WHATSAPP')

Deno.serve(async (req: Request) => {
  const { user_id, action, ip_address, user_agent, metadata } = await req.json()
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  if (action === 'BLOCK_USER') {
    // Sign out user and block IP
    const { error: signOutError } = await supabase.auth.admin.signOut(user_id)
    const { error: dbError } = await supabase
      .from('user_known_devices')
      .update({ is_blocked: true })
      .match({ user_id, ip_address })

    // Log the security event
    console.log(`Security: Blocked user ${user_id} from IP ${ip_address}`)
    
    return new Response(JSON.stringify({ success: !signOutError && !dbError }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (action === 'SEND_WELCOME') {
    const html = `
    <table width="100%" bgcolor="#0c1324" style="padding:40px 0; font-family:sans-serif;">
      <tr><td align="center">
        <table width="600" bgcolor="#111827" style="border-radius:24px; border:1px solid #1f2937; overflow:hidden; box-shadow:0 20px 50px rgba(0,0,0,0.5);">
          <tr><td align="center" style="padding:60px; background:linear-gradient(45deg, #020617, #0f172a);">
            <h1 style="color:#2fd9f4; letter-spacing:10px; margin:0; font-size:24px; font-weight:900;">SNEYDER STUDIO</h1>
            <p style="color:#94a3b8; font-size:10px; margin-top:10px; text-transform:uppercase; letter-spacing:4px;">Innovación Digital Premium</p>
          </td></tr>
          <tr><td style="padding:60px; text-align:center; color:#ffffff;">
            <h2 style="font-size:32px; margin-bottom:20px; font-weight:800;">¡Bienvenido, ${metadata.manager_name || 'Líder'}!</h2>
            <p style="color:#94a3b8; line-height:1.8; font-size:16px; margin-bottom:40px;">Es un honor tenerte con nosotros. Tu cuenta ha sido activada y estamos listos para transformar tus ideas en realidades digitales de alto impacto.</p>
            <a href="https://sneyderstudio.com" style="background:#2fd9f4; color:#0f172a; padding:20px 50px; border-radius:12px; display:inline-block; text-decoration:none; font-weight:900; letter-spacing:2px; font-size:14px; box-shadow:0 10px 20px rgba(47,217,244,0.3);">ACCEDER AHORA</a>
          </td></tr>
          <tr><td align="center" style="padding:30px; background:#020617; font-size:10px; color:#475569; text-transform:uppercase; letter-spacing:4px;">
            Diseñado con Inteligencia por Sneyder Studio
          </td></tr>
        </table>
      </td></tr>
    </table>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Sneyder Studio <onboarding@resend.dev>',
        to: [metadata.email],
        subject: '🚀 ¡Bienvenido a Sneyder Studio!',
        html: html,
      }),
    })
    
    return new Response(await res.text(), { status: res.status })
  }

  if (action === 'SEND_SECURITY_ALERT') {
    const html = `
    <table width="100%" bgcolor="#f9fafb" style="padding:40px 0; font-family:sans-serif;">
        <tr><td align="center">
            <table width="600" bgcolor="#fff" style="border-radius:24px; overflow:hidden;">
                <tr><td align="center" bgcolor="#000" style="padding:50px;"><h1 style="color:#fff; letter-spacing:5px;">SNEYDER STUDIO</h1></td></tr>
                <tr><td style="padding:40px; text-align:center;">
                    <h2>¿Eres tú iniciando sesión?</h2>
                    <div style="background:#fafafa; padding:15px; border-radius:12px; text-align:left; margin-bottom:20px; font-size:14px;">
                        <p><strong>Ubicación:</strong> ${metadata.location || 'Desconocida'}</p><p><strong>Dispositivo:</strong> ${user_agent}</p>
                    </div>
                    <a href="${metadata.confirm_link}" style="background:#000; color:#fff; padding:18px; border-radius:12px; display:block; text-decoration:none; font-weight:700; margin-bottom:10px;">SÍ, SOY YO</a>
                    <a href="${metadata.block_link}" style="border:2px solid #ef4444; color:#ef4444; padding:16px; border-radius:12px; display:block; text-decoration:none; font-weight:700;">NO, BLOQUEAR ACCESO</a>
                </td></tr>
            </table>
        </td></tr>
    </table>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Sneyder Studio <sneyderestudio@gmail.com>',
        to: [metadata.email],
        subject: 'Alerta de Seguridad: Nuevo inicio de sesión',
        html: html,
      }),
    })

    return new Response(await res.text(), { status: res.status })
  }

  return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 })
})
