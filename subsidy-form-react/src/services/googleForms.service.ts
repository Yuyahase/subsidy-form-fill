/**
 * Google Sheets API Service (Browser-compatible)
 * Uses Google Apps Script as backend instead of direct API calls
 */

import type { 
  SubsidyFormData, 
  FormSubmissionResult 
} from '../types/form.types';

// Service configuration
const SERVICE_CONFIG = {
  SHEETS_API_ENDPOINT: import.meta.env.VITE_SHEETS_API_ENDPOINT || ''
} as const;

/**
 * Google Forms Service Class
 */
export class GoogleFormsService {
  private static instance: GoogleFormsService | null = null;
  private accessToken: string | null = null;

  private constructor() {}

  /**
   * Singleton pattern
   */
  public static getInstance(): GoogleFormsService {
    if (!GoogleFormsService.instance) {
      GoogleFormsService.instance = new GoogleFormsService();
    }
    return GoogleFormsService.instance;
  }

  /**
   * Initialize with access token
   */
  public setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Submit form data to Google Sheets via Apps Script
   */
  public async submitFormData(data: SubsidyFormData): Promise<FormSubmissionResult> {
    try {
      // Transform data to flat structure for Sheets
      const rowData = this.transformToSheetRow(data);
      
      // Submit to Google Sheets via Apps Script Web App
      // no-corsモードを使用（Google Apps ScriptのCORS制限回避）
      await fetch(SERVICE_CONFIG.SHEETS_API_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      // no-corsモードではレスポンスが読めないため、
      // 成功と仮定してレスポンスを返す
      
      return {
        type: 'success',
        formId: 'subsidy-form',
        responseId: crypto.randomUUID()
      };
    } catch (error) {
      console.error('Submission error:', error);
      
      return {
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        retryable: true
      };
    }
  }

  /**
   * Transform form data to sheet row format
   */
  private transformToSheetRow(data: SubsidyFormData): (string | number)[] {
    return [
      new Date().toISOString(),
      data.entityType,
      data.company.name,
      data.company.nameKana,
      data.representative.lastName,
      data.representative.firstName,
      data.representative.lastNameKana,
      data.representative.firstNameKana,
      data.primaryAddress.postalCode,
      data.primaryAddress.prefecture,
      data.primaryAddress.city,
      data.primaryAddress.street,
      data.secondaryAddress?.postalCode || '',
      data.secondaryAddress?.prefecture || '',
      data.secondaryAddress?.city || '',
      data.secondaryAddress?.street || '',
      data.employeeCount,
      data.applicationMethod,
      data.contact.lastName,
      data.contact.firstName,
      data.contact.lastNameKana,
      data.contact.firstNameKana,
      data.contact.phone,
      data.contact.email,
      data.agent || '',
      data.applicationReason
    ];
  }

  /**
   * Check for duplicate email submissions
   */
  public async checkDuplicateEmail(email: string): Promise<boolean> {
    try {
      // GETリクエストはCORSの影響を受けないので通常モード
      const response = await fetch(`${SERVICE_CONFIG.SHEETS_API_ENDPOINT}?action=checkEmail&email=${encodeURIComponent(email)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.exists || false;
    } catch (error) {
      console.error('Error checking duplicate:', error);
      return false;
    }
  }
}

/**
 * Hook for React components
 */
export const useGoogleFormsService = () => {
  const service = GoogleFormsService.getInstance();
  
  return {
    submitForm: (data: SubsidyFormData) => service.submitFormData(data),
    checkDuplicate: (email: string) => service.checkDuplicateEmail(email),
    setAccessToken: (token: string) => service.setAccessToken(token)
  };
};