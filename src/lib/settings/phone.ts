import type { Phone } from '$lib/settings/types';

export function getFullPhone(phone?: Partial<Phone> | null) {
  if (!phone) {
    return '';
  }

  const fullCellphone = phone.fullCellphone?.trim();

  if (fullCellphone) {
    return fullCellphone;
  }

  const code = phone.code?.trim() ?? '';
  const cellphone = phone.cellphone?.trim() ?? '';

  return `${code}${cellphone}`;
}
