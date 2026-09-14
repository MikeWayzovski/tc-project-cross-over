/**
 * Kopieert tekst naar het klembord. navigator.clipboard faalt vaak in een iframe
 * (Trimble Connect blokkeert clipboard-write); dan valt dit terug op execCommand.
 */
export const copyToClipboard = async (text) => {
  const value = String(text ?? '').trim();
  if (!value) return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // iframe of ontbrekende permissie: probeer de klassieke fallback
  }

  try {
    const field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.setAttribute('aria-hidden', 'true');
    field.className = 'position-fixed';
    field.style.cssText = 'top:0;left:-9999px;opacity:0';
    document.body.appendChild(field);
    field.select();
    field.setSelectionRange(0, field.value.length);
    const copied = document.execCommand('copy');
    field.remove();
    return copied;
  } catch {
    return false;
  }
};
