// lib/whatsapp.ts
// Opening a WhatsApp chat with a message ready to send (wa.me links).

/**
 * WhatsApp needs the number in international form without "+":
 * an Egyptian "010 1234 5678" becomes "201012345678".
 */
export function toWhatsAppNumber(phone: string | null | undefined) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return `20${digits.slice(1)}`;
  return digits || null;
}

/** Opens the chat in a new tab. Call it straight from the click, or popup blockers stop it. */
export function openWhatsApp(number: string, text: string) {
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
}
