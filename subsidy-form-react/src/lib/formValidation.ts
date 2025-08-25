/**
 * Form validation with proper error messages
 */

import { z } from 'zod';
import {
  EntityTypes,
  ApplicationMethods,
  Prefectures,
  ApplicationReasons,
  isPostalCode,
  isPhoneNumber,
  isKatakana
} from '../types/form.types';

// Base schemas with only default values
const baseStringSchema = z.string().default('');

// Address schema - optional for secondary address
const addressSchema = z.object({
  postalCode: baseStringSchema,
  prefecture: baseStringSchema,
  city: baseStringSchema,
  street: baseStringSchema
});

// Main form validation schema - with validation for required fields
export const subsidyFormSchema = z.object({
  entityType: z.enum([EntityTypes.CORPORATION, EntityTypes.SOLE_PROPRIETOR])
    .describe('法人種別を選択してください')
    .default(EntityTypes.CORPORATION),
  
  company: z.object({
    name: z.string().min(1, { message: '会社名を入力してください' }).default(''),
    nameKana: z.string().min(1, { message: '会社名フリガナを入力してください' })
      .refine((val) => !val || isKatakana(val), { message: 'カタカナで入力してください' }).default('')
  }),
  
  representative: z.object({
    lastName: z.string().min(1, { message: '代表者の氏を入力してください' }).default(''),
    firstName: z.string().min(1, { message: '代表者の名を入力してください' }).default(''),
    lastNameKana: z.string().min(1, { message: '代表者のフリガナ（氏）を入力してください' })
      .refine((val) => !val || isKatakana(val), { message: 'カタカナで入力してください' }).default(''),
    firstNameKana: z.string().min(1, { message: '代表者のフリガナ（名）を入力してください' })
      .refine((val) => !val || isKatakana(val), { message: 'カタカナで入力してください' }).default('')
  }),
  
  primaryAddress: z.object({
    postalCode: z.string().min(1, { message: '郵便番号を入力してください' })
      .refine((val) => !val || isPostalCode(val), { message: '郵便番号は XXX-XXXX の形式で入力してください' }).default(''),
    prefecture: z.string().min(1, { message: '都道府県を選択してください' }).default(''),
    city: z.string().min(1, { message: '市区町村を入力してください' }).default(''),
    street: z.string().min(1, { message: '番地以降を入力してください' }).default('')
  }),
  
  secondaryAddress: addressSchema,
  
  employeeCount: z
    .number()
    .int({ message: '整数を入力してください' })
    .min(2, { message: '労働者数は2名以上である必要があります' })
    .max(300, { message: '労働者数は300名以下である必要があります' })
    .default(2),
  
  applicationMethod: z.enum([ApplicationMethods.PAPER, ApplicationMethods.ELECTRONIC])
    .describe('申請方法を選択してください')
    .default(ApplicationMethods.PAPER),
  
  contact: z.object({
    lastName: z.string().min(1, { message: '担当者の氏を入力してください' }).default(''),
    firstName: z.string().min(1, { message: '担当者の名を入力してください' }).default(''),
    lastNameKana: z.string().min(1, { message: '担当者のフリガナ（氏）を入力してください' })
      .refine((val) => !val || isKatakana(val), { message: 'カタカナで入力してください' }).default(''),
    firstNameKana: z.string().min(1, { message: '担当者のフリガナ（名）を入力してください' })
      .refine((val) => !val || isKatakana(val), { message: 'カタカナで入力してください' }).default(''),
    phone: z.string().min(1, { message: '電話番号を入力してください' })
      .refine((val) => !val || isPhoneNumber(val), { message: '固定電話番号を入力してください（携帯電話不可）' }).default(''),
    email: z.string().min(1, { message: 'メールアドレスを入力してください' })
      .email({ message: '有効なメールアドレスを入力してください' }).default('')
  }),
  
  agent: baseStringSchema,
  
  applicationReason: z.string().min(1, { message: '申請理由を選択してください' }).default('')
});

// Validation schema for form submission (with required fields)
export const subsidyFormSubmitSchema = z.object({
  entityType: z.enum([EntityTypes.CORPORATION, EntityTypes.SOLE_PROPRIETOR], {
    errorMap: () => ({ message: '法人種別を選択してください' })
  }),
  
  company: z.object({
    name: z.string().min(1, { message: '会社名を入力してください' }),
    nameKana: z.string().min(1, { message: '会社名フリガナを入力してください' })
      .refine(isKatakana, { message: 'カタカナで入力してください' })
  }),
  
  representative: z.object({
    lastName: z.string().min(1, { message: '氏を入力してください' }),
    firstName: z.string().min(1, { message: '名を入力してください' }),
    lastNameKana: z.string().min(1, { message: 'フリガナ（氏）を入力してください' })
      .refine(isKatakana, { message: 'カタカナで入力してください' }),
    firstNameKana: z.string().min(1, { message: 'フリガナ（名）を入力してください' })
      .refine(isKatakana, { message: 'カタカナで入力してください' })
  }),
  
  primaryAddress: z.object({
    postalCode: z.string().min(1, { message: '郵便番号を入力してください' })
      .refine(isPostalCode, { message: '郵便番号は XXX-XXXX の形式で入力してください' }),
    prefecture: z.enum(Prefectures, { 
      errorMap: () => ({ message: '都道府県を選択してください' })
    }),
    city: z.string().min(1, { message: '市区町村を入力してください' }),
    street: z.string().min(1, { message: '番地以降を入力してください' })
  }),
  
  secondaryAddress: z.object({
    postalCode: z.string().optional(),
    prefecture: z.string().optional(),
    city: z.string().optional(),
    street: z.string().optional()
  }).optional(),
  
  employeeCount: z
    .number({ invalid_type_error: '数値を入力してください' })
    .int({ message: '整数を入力してください' })
    .min(2, { message: '労働者数は2名以上である必要があります' })
    .max(300, { message: '労働者数は300名以下である必要があります' }),
  
  applicationMethod: z.enum([ApplicationMethods.PAPER, ApplicationMethods.ELECTRONIC], {
    errorMap: () => ({ message: '申請方法を選択してください' })
  }),
  
  contact: z.object({
    lastName: z.string().min(1, { message: '担当者の氏を入力してください' }),
    firstName: z.string().min(1, { message: '担当者の名を入力してください' }),
    lastNameKana: z.string().min(1, { message: '担当者のフリガナ（氏）を入力してください' })
      .refine(isKatakana, { message: 'カタカナで入力してください' }),
    firstNameKana: z.string().min(1, { message: '担当者のフリガナ（名）を入力してください' })
      .refine(isKatakana, { message: 'カタカナで入力してください' }),
    phone: z.string().min(1, { message: '電話番号を入力してください' })
      .refine(isPhoneNumber, { message: '固定電話番号を入力してください（携帯電話不可）' }),
    email: z.string().min(1, { message: 'メールアドレスを入力してください' })
      .email({ message: '有効なメールアドレスを入力してください' })
  }),
  
  agent: z.string().optional(),
  
  applicationReason: z.enum(Object.values(ApplicationReasons) as [string, ...string[]], {
    errorMap: () => ({ message: '申請理由を選択してください' })
  })
});

export type SubsidyFormInput = z.infer<typeof subsidyFormSchema>;