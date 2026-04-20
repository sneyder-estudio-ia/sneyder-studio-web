/// <reference lib="deno.ns" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, metadata, action } = await req.json()
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    if (action === 'SIGNUP') {
      // 1. Create user with Admin API (No SMTP check)
      const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: metadata,
        email_confirm: true // Force confirm to make it work INSTANTLY for the user
      })

      if (createError) throw createError

      // 2. Send Personalized Welcome Email (Async)
      // We use the Resend API directly here
      const html = `
      <table width="100%" bgcolor="#0c1324" style="padding:40px 0; font-family:sans-serif;">
        <tr><td align="center">
          <table width="600" bgcolor="#111827" style="border-radius:24px; border:1px solid #1f2937; overflow:hidden; box-shadow:0 20px 50px rgba(0,0,0,0.5);">
            <tr><td align="center" style="padding:60px; background:linear-gradient(45deg, #020617, #0f172a);">
              <h1 style="color:#2fd9f4; letter-spacing:10px; margin:0; font-size:24px; font-weight:900;">SNEYDER STUDIO</h1>
              <p style="color:#94a3b8; font-size:10px; margin-top:10px; text-transform:uppercase; letter-spacing:4px;">Inovación Digital Premium</p>
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

      // Note: If gmail.com is failing in Resend, this might still fail if not using a verified domain.
      // But at least the user is ALREADY created in the step above.
      if (RESEND_API_KEY) {
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Sneyder Studio <onboarding@resend.dev>', // Safer default
            to: [email],
            subject: '🚀 ¡Bienvenido a Sneyder Studio!',
            html: html,
          }),
        }).catch(e => console.error("Email failed but user created:", e))
      }

      return new Response(JSON.stringify({ success: true, user: userData.user }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
