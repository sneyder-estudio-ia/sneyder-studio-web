/// <reference lib="deno.ns" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

Deno.serve(async (req: Request) => {
  // CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, metadata } = await req.json()
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // 1. Create User via Admin API (Bypasses broken SMTP)
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: metadata,
      email_confirm: false // We want them to confirm
    })

    if (createError) throw createError

    // 2. Generate confirmation link manually (or just send a welcome email)
    // For now, let's send the "Personalized Welcome/Verification" email
    
    const html = `
    <table width="100%" bgcolor="#f4f7f9" style="padding:40px 0; font-family: 'Inter', sans-serif;">
        <tr><td align="center">
            <table width="600" bgcolor="#ffffff" style="border-radius:16px; overflow:hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <tr>
                    <td align="center" bgcolor="#0f172a" style="padding:60px 40px;">
                        <h1 style="color:#2fd9f4; letter-spacing:10px; margin:0; font-size: 24px; font-weight: 900;">SNEYDER STUDIO</h1>
                        <p style="color: #94a3b8; font-size: 12px; margin-top: 10px; text-transform: uppercase; tracking: 0.2em;">Design & Development Systems</p>
                    </td>
                </tr>
                <tr>
                    <td style="padding:60px 50px; text-align:center;">
                        <h2 style="font-size:32px; color: #0f172a; margin-bottom: 20px; font-weight: 800;">¡Hola ${metadata.manager_name || 'Innovador'}!</h2>
                        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 40px;">
                            Gracias por unirte a Sneyder Studio. Estamos emocionados de ayudarte a llevar tus proyectos al siguiente nivel. 
                            Para comenzar la experiencia, activa tu cuenta haciendo clic abajo.
                        </p>
                        
                        <a href="${Deno.env.get('APP_URL') || 'https://sneyderstudio.com'}" 
                           style="background: #2fd9f4; color: #0f172a; padding: 20px 45px; border-radius: 8px; display: inline-block; text-decoration: none; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">
                            CONFIRMAR CUENTA
                        </a>
                        
                        <p style="color: #94a3b8; font-size: 14px; margin-top: 40px;">
                            Si no creaste esta cuenta, puedes ignorar este correo tranquilamente.
                        </p>
                    </td>
                </tr>
                <tr>
                    <td align="center" style="padding:30px; background:#f8fafc; font-size:12px; color:#64748b; border-top: 1px solid #f1f5f9;">
                        © 2024 Sneyder Studio Services. San José, Costa Rica.
                    </td>
                </tr>
            </table>
        </td></tr>
    </table>`

    // 3. Send Email via Resend
    // Important: Use a fallback sender if @gmail.com domain is not verified
    const fromAddress = 'onboarding@resend.dev' // Default Resend domain if custom fails
    const sender = `Sneyder Studio <${fromAddress}>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: sender,
        to: [email],
        subject: '🚀 Activa tu cuenta en Sneyder Studio',
        html: html,
      }),
    })

    const emailResult = await res.json()

    return new Response(JSON.stringify({ 
      success: true, 
      user: userData.user,
      email_status: res.status === 200 ? 'sent' : 'failed',
      email_error: res.status !== 200 ? emailResult : null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
