/**
 * Main form component with advanced TypeScript patterns
 */

import React, { useCallback, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
// import { useGoogleLogin } from '@react-oauth/google';
import { useMultiStepForm } from '../hooks/useMultiStepForm';
import { subsidyFormSchema, type SubsidyFormInput } from '../lib/validation';
import { useGoogleFormsService } from '../services/googleForms.service';
import type { SubsidyFormData } from '../types/form.types';

// Component Props
interface SubsidyFormProps {
  googleClientId?: string;
  onSubmitSuccess?: (responseId: string) => void;
  onSubmitError?: (error: Error) => void;
}

// Step components
const CompanyInfoStep: React.FC<{
  control: ReturnType<typeof useForm<SubsidyFormInput>>['control'];
  errors: ReturnType<typeof useForm<SubsidyFormInput>>['formState']['errors'];
}> = ({ control, errors }) => (
  <div className="form-step">
    <h2>企業情報</h2>
    
    <div className="form-group">
      <label>法人種別 <span className="required">*</span></label>
      <Controller
        name="entityType"
        control={control}
        render={({ field }) => (
          <div className="radio-group">
            <label>
              <input
                type="radio"
                {...field}
                value="法人"
                checked={field.value === '法人'}
              />
              法人
            </label>
            <label>
              <input
                type="radio"
                {...field}
                value="個人事業主"
                checked={field.value === '個人事業主'}
              />
              個人事業主
            </label>
          </div>
        )}
      />
      {errors.entityType && <span className="error">{errors.entityType.message}</span>}
    </div>

    <div className="form-group">
      <label htmlFor="company.name">会社名 <span className="required">*</span></label>
      <Controller
        name="company.name"
        control={control}
        render={({ field }) => (
          <input type="text" {...field} />
        )}
      />
      {errors.company?.name && <span className="error">{errors.company.name.message}</span>}
    </div>

    <div className="form-group">
      <label htmlFor="company.nameKana">会社名フリガナ <span className="required">*</span></label>
      <Controller
        name="company.nameKana"
        control={control}
        render={({ field }) => (
          <input type="text" {...field} pattern="[ァ-ヶー\s]+" />
        )}
      />
      {errors.company?.nameKana && <span className="error">{errors.company.nameKana.message}</span>}
    </div>

    <div className="form-row">
      <div className="form-group">
        <label>代表者氏 <span className="required">*</span></label>
        <Controller
          name="representative.lastName"
          control={control}
          render={({ field }) => <input type="text" {...field} />}
        />
        {errors.representative?.lastName && <span className="error">{errors.representative.lastName.message}</span>}
      </div>

      <div className="form-group">
        <label>代表者名 <span className="required">*</span></label>
        <Controller
          name="representative.firstName"
          control={control}
          render={({ field }) => <input type="text" {...field} />}
        />
        {errors.representative?.firstName && <span className="error">{errors.representative.firstName.message}</span>}
      </div>
    </div>
  </div>
);

// Main Form Component
export const SubsidyForm: React.FC<SubsidyFormProps> = ({
  onSubmitSuccess,
  onSubmitError
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    currentStep,
    formData,
    isFirstStep,
    isLastStep,
    progress,
    nextStep,
    previousStep
  } = useMultiStepForm();

  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger
  } = useForm<SubsidyFormInput>({
    resolver: zodResolver(subsidyFormSchema),
    defaultValues: formData as SubsidyFormInput,
    mode: 'onBlur'
  });

  const { submitForm } = useGoogleFormsService();

  // Google OAuth login (commented out for now - optional feature)
  // const login = useGoogleLogin({
  //   onSuccess: async (tokenResponse) => {
  //     console.log('Login successful', tokenResponse);
  //   },
  //   onError: (error) => {
  //     console.error('Login failed', error);
  //     onSubmitError?.(new Error('Google login failed'));
  //   },
  //   scope: 'https://www.googleapis.com/auth/forms.body https://www.googleapis.com/auth/spreadsheets'
  // });

  // Handle form submission
  const onSubmit = useCallback(async (data: SubsidyFormInput) => {
    setIsSubmitting(true);
    try {
      const result = await submitForm(data as SubsidyFormData);
      
      if (result.type === 'success') {
        onSubmitSuccess?.(result.responseId);
      } else if (result.type === 'error') {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Submission error:', error);
      onSubmitError?.(error as Error);
    } finally {
      setIsSubmitting(false);
    }
  }, [submitForm, onSubmitSuccess, onSubmitError]);

  // Handle step navigation
  const handleNext = useCallback(async () => {
    const isValid = await trigger();
    if (isValid) {
      const data = control._formValues;
      nextStep(data);
    }
  }, [trigger, control, nextStep]);

  return (
    <div className="subsidy-form-container">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {currentStep === 'companyInfo' && (
          <CompanyInfoStep control={control} errors={errors} />
        )}

        <div className="form-actions">
          {!isFirstStep && (
            <button
              type="button"
              onClick={previousStep}
              className="btn btn-secondary"
            >
              戻る
            </button>
          )}

          {!isLastStep ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn btn-primary"
            >
              次へ
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? '送信中...' : '送信'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};