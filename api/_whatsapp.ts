// Envio pela WhatsApp Business Cloud API (Meta).
// Mensagens iniciadas pela empresa exigem um TEMPLATE aprovado (categoria "Utilidade"),
// com um texto como: "Para redefinir sua senha acesse: {{1}} (vale por 30 minutos)".
export function whatsappConfigured() {
  return Boolean(
    process.env.WHATSAPP_TOKEN &&
      process.env.WHATSAPP_PHONE_ID &&
      process.env.WHATSAPP_TEMPLATE,
  );
}

export async function sendResetLink(phone: string, link: string) {
  const version = process.env.WHATSAPP_API_VERSION ?? "v21.0";
  const response = await fetch(
    `https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: process.env.WHATSAPP_TEMPLATE,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG ?? "pt_BR" },
          components: [
            { type: "body", parameters: [{ type: "text", text: link }] },
          ],
        },
      }),
    },
  );
  if (!response.ok) {
    throw new Error(`WhatsApp ${response.status}: ${await response.text()}`);
  }
}
