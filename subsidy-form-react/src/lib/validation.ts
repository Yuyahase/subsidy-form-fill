/**
 * Advanced validation schema using Zod with custom refinements
 */

import { z } from 'zod';
import {
  EntityTypes,
  ApplicationMethods,
  ApplicationReasons
} from '../types/form.types';


// Person name schema
const personNameSchema = z.object({
  lastName: z.string().default(''),
  firstName: z.string().default(''),
  lastNameKana: z.string().default(''),
  firstNameKana: z.string().default('')
});

// Address schema with conditional validation
const addressSchema = z.object({
  postalCode: z.string().optional().default(''),
  prefecture: z.string().optional().default(''),
  city: z.string().optional().default(''),
  street: z.string().optional().default('')
});

// Required address schema for primary address
const requiredAddressSchema = z.object({
  postalCode: z.string().default(''),
  prefecture: z.string().default(''),
  city: z.string().default(''),
  street: z.string().default('')
});

// Main form validation schema with advanced refinements
export const subsidyFormSchema = z.object({
  entityType: z.enum([EntityTypes.CORPORATION, EntityTypes.SOLE_PROPRIETOR], {
    errorMap: () => ({ message: '法人種別を選択してください' })
  }),
  
  company: z.object({
    name: z.string().default(''),
    nameKana: z.string().default('')
  }),
  
  representative: personNameSchema,
  
  primaryAddress: requiredAddressSchema,
  
  secondaryAddress: addressSchema.optional(),
  
  employeeCount: z
    .number({ invalid_type_error: '数値を入力してください' })
    .int({ message: '整数を入力してください' })
    .min(2, { message: '労働者数は2名以上である必要があります' })
    .max(300, { message: '労働者数は300名以下である必要があります' }),
  
  applicationMethod: z.enum([ApplicationMethods.PAPER, ApplicationMethods.ELECTRONIC], {
    errorMap: () => ({ message: '申請方法を選択してください' })
  }),
  
  contact: personNameSchema.extend({
    phone: z.string().default(''),
    email: z.string().default('')
  }),
  
  agent: z.optional(z.string()),
  
  applicationReason: z.enum(Object.values(ApplicationReasons) as [string, ...string[]], {
    errorMap: () => ({ message: '申請理由を選択してください' })
  })
})
.superRefine((data, ctx) => {
  // Custom validation: Check if Tokyo address is provided
  const hasPrimaryTokyoAddress = data.primaryAddress.prefecture === '東京都';
  const hasSecondaryTokyoAddress = data.secondaryAddress?.prefecture === '東京都';
  
  if (data.entityType === EntityTypes.CORPORATION) {
    if (!hasPrimaryTokyoAddress && !hasSecondaryTokyoAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '法人の場合、東京都内の住所が必要です',
        path: ['primaryAddress', 'prefecture']
      });
    }
  } else if (data.entityType === EntityTypes.SOLE_PROPRIETOR) {
    if (!hasPrimaryTokyoAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '個人事業主の場合、都内の事業所住所が必要です',
        path: ['primaryAddress', 'prefecture']
      });
    }
  }
  
  // Validate secondary address requirements
  if (data.entityType === EntityTypes.CORPORATION && data.primaryAddress.prefecture !== '東京都') {
    if (!data.secondaryAddress || !data.secondaryAddress.prefecture) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '本店が都外の場合、都内支店の住所（会社所在地２）が必要です',
        path: ['secondaryAddress']
      });
    }
  }
});

// Step-wise validation schemas for multi-step form
export const stepSchemas = {
  companyInfo: subsidyFormSchema.pick({
    entityType: true,
    company: true,
    representative: true
  }),
  
  address: subsidyFormSchema.pick({
    primaryAddress: true,
    secondaryAddress: true
  }),
  
  employee: subsidyFormSchema.pick({
    employeeCount: true,
    applicationMethod: true
  }),
  
  contact: subsidyFormSchema.pick({
    contact: true,
    agent: true,
    applicationReason: true
  })
} as const;

// Type inference from schemas
export type SubsidyFormInput = z.input<typeof subsidyFormSchema>;
export type SubsidyFormOutput = z.output<typeof subsidyFormSchema>;

// Validation helper with proper error formatting
export const validateFormData = <T extends keyof typeof stepSchemas>(
  step: T,
  data: unknown
): { success: true; data: z.output<typeof stepSchemas[T]> } | { success: false; errors: z.ZodError } => {
  const result = stepSchemas[step].safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error };
};

// Email confirmation validation
export const validateEmailConfirmation = (email: string, confirmation: string): boolean => {
  return email === confirmation;
};

// Custom async validation for duplicate check
export const checkDuplicateEntry = async (): Promise<boolean> => {
  // This would call your backend API
  // For now, returning false (no duplicate)
  return new Promise((resolve) => {
    setTimeout(() => resolve(false), 500);
  });
};