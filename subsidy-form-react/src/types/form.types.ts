/**
 * Advanced TypeScript types for Tokyo Subsidy Form
 * Using branded types, template literal types, and const assertions
 */

// Branded types for type safety
type Brand<K, T> = K & { __brand: T };

export type PostalCode = Brand<string, 'PostalCode'>;
export type PhoneNumber = Brand<string, 'PhoneNumber'>;
export type Email = Brand<string, 'Email'>;
export type KatakanaString = Brand<string, 'Katakana'>;

// Entity types with const assertion
export const EntityTypes = {
  CORPORATION: '法人',
  SOLE_PROPRIETOR: '個人事業主'
} as const;

export type EntityType = typeof EntityTypes[keyof typeof EntityTypes];

// Application methods
export const ApplicationMethods = {
  PAPER: '紙申請',
  ELECTRONIC: '電子申請'
} as const;

export type ApplicationMethod = typeof ApplicationMethods[keyof typeof ApplicationMethods];

// Prefecture type with template literals
export const Prefectures = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
] as const;

export type Prefecture = typeof Prefectures[number];

// Application reasons
export const ApplicationReasons = {
  TOKYO_WEBSITE: '東京都のウェブサイト',
  OTHER_WEBSITE: 'その他のウェブサイト',
  SNS: 'SNS',
  EMAIL_MAGAZINE: 'メールマガジン',
  BROCHURE: 'チラシ・パンフレット',
  SEMINAR: 'セミナー・説明会',
  REFERRAL: '知人の紹介',
  OTHER: 'その他'
} as const;

export type ApplicationReason = typeof ApplicationReasons[keyof typeof ApplicationReasons];

// Address type with discriminated union
export type Address = {
  postalCode: PostalCode;
  prefecture: Prefecture;
  city: string;
  street: string;
};

// Name type with type predicates
export type PersonName = {
  lastName: string;
  firstName: string;
  lastNameKana: KatakanaString;
  firstNameKana: KatakanaString;
};

// Main form data type with strict typing
export interface SubsidyFormData {
  readonly entityType: EntityType;
  readonly company: {
    readonly name: string;
    readonly nameKana: KatakanaString;
  };
  readonly representative: PersonName;
  readonly primaryAddress: Address;
  readonly secondaryAddress?: Partial<Address>;
  readonly employeeCount: number;
  readonly applicationMethod: ApplicationMethod;
  readonly contact: PersonName & {
    readonly phone: PhoneNumber;
    readonly email: Email;
  };
  readonly agent?: string;
  readonly applicationReason: ApplicationReason;
}

// Form step types for multi-step form
export const FormSteps = {
  COMPANY_INFO: 'companyInfo',
  ADDRESS: 'address',
  EMPLOYEE: 'employee',
  CONTACT: 'contact',
  CONFIRMATION: 'confirmation',
  COMPLETION: 'completion'
} as const;

export type FormStep = typeof FormSteps[keyof typeof FormSteps];

// Form state with discriminated unions
export type FormState = 
  | { step: 'companyInfo'; data: Partial<Pick<SubsidyFormData, 'entityType' | 'company' | 'representative'>> }
  | { step: 'address'; data: Partial<Pick<SubsidyFormData, 'primaryAddress' | 'secondaryAddress'>> }
  | { step: 'employee'; data: Partial<Pick<SubsidyFormData, 'employeeCount' | 'applicationMethod'>> }
  | { step: 'contact'; data: Partial<Pick<SubsidyFormData, 'contact' | 'agent' | 'applicationReason'>> }
  | { step: 'confirmation'; data: SubsidyFormData }
  | { step: 'completion'; submissionId: string };

// Validation error types
export type ValidationError<T = unknown> = {
  field: keyof T;
  message: string;
  code: string;
};

// API Response types with generics
export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string; details?: ValidationError[] };

// Google Forms API types
export interface GoogleFormConfig {
  formId: string;
  clientId: string;
  apiKey: string;
  discoveryDocs: readonly string[];
  scopes: readonly string[];
}

export interface GoogleFormField {
  questionId: string;
  title: string;
  type: 'TEXT' | 'RADIO' | 'CHECKBOX' | 'DROPDOWN' | 'DATE' | 'TIME';
  required: boolean;
  options?: readonly string[];
}

export interface GoogleFormResponse {
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  answers: Record<string, unknown>;
}

// Type guards
export const isPostalCode = (value: string): value is PostalCode => {
  return /^\d{3}-\d{4}$/.test(value);
};

export const isPhoneNumber = (value: string): value is PhoneNumber => {
  return /^0\d{1,4}-\d{1,4}-\d{4}$/.test(value) && !/^0[789]0/.test(value);
};

export const isEmail = (value: string): value is Email => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export const isKatakana = (value: string): value is KatakanaString => {
  return /^[ァ-ヶー\s]+$/.test(value);
};

// Utility types for form fields
export type FormFieldConfig<T> = {
  name: keyof T;
  label: string;
  placeholder?: string;
  required: boolean;
  validate?: (value: unknown) => string | undefined;
  transform?: (value: unknown) => unknown;
};

// Deep readonly utility
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// Form submission result
export type FormSubmissionResult = 
  | { type: 'success'; formId: string; responseId: string }
  | { type: 'error'; message: string; retryable: boolean }
  | { type: 'validation'; errors: ValidationError<SubsidyFormData>[] };