import { z } from 'zod';

export const businessGeneralSettingsSchema = z.object({
  tradeName: z.string().trim().min(2, 'Ingresa el nombre del negocio.'),
});

export const businessContactSettingsSchema = z.object({
  cellphone: z
    .string()
    .trim()
    .regex(
      /^\+[1-9]\d{7,14}$/,
      'Usa un número en formato internacional, por ejemplo +51999999999.',
    ),
});

export const cashRegisterSettingsSchema = z
  .object({
    enableCashCount: z.boolean(),
    validateCashCount: z.boolean(),
  })
  .refine((value) => value.enableCashCount || !value.validateCashCount, {
    path: ['validateCashCount'],
    message: 'La validación requiere que el arqueo esté habilitado.',
  });

export const createCashRegisterSchema = z.object({
  name: z.string().trim().min(2, 'Ingresa un nombre de al menos 2 caracteres.'),
});

export const updateCashRegisterSchema = z.object({
  name: z.string().trim().min(2, 'Ingresa un nombre de al menos 2 caracteres.'),
  status: z.enum(['enabled', 'disabled']),
});

export const salesTipSettingsSchema = z.object({
  tipEnabled: z.boolean(),
  tipRate: z.number().min(0, 'Debe ser mayor o igual a 0.').max(100, 'No puede superar 100.'),
  tipMaxRate: z.number().min(0, 'Debe ser mayor o igual a 0.').max(100, 'No puede superar 100.'),
});

export const salesDiscountSettingsSchema = z.object({
  discountEnabled: z.boolean(),
  discountEnabledMaxRate: z.boolean(),
  discountMaxRate: z
    .number()
    .min(0, 'Debe ser mayor o igual a 0.')
    .max(100, 'No puede superar 100.'),
});

export type BusinessGeneralSettingsSchema = typeof businessGeneralSettingsSchema;
export type BusinessContactSettingsSchema = typeof businessContactSettingsSchema;
export type CashRegisterSettingsSchema = typeof cashRegisterSettingsSchema;
export type CreateCashRegisterSchema = typeof createCashRegisterSchema;
export type UpdateCashRegisterSchema = typeof updateCashRegisterSchema;
export type SalesTipSettingsSchema = typeof salesTipSettingsSchema;
export type SalesDiscountSettingsSchema = typeof salesDiscountSettingsSchema;
