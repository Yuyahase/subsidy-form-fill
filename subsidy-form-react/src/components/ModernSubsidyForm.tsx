/**
 * Modern Tailwind CSS based form with minimal design
 */

import React, { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { subsidyFormSchema, type SubsidyFormInput } from '../lib/validation';
import { useGoogleFormsService } from '../services/googleForms.service';
import { searchAddressByPostalCode, formatPostalCode } from '../services/postalCode.service';
import { ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { 
  Prefectures, 
  ApplicationReasons,
  type SubsidyFormData 
} from '../types/form.types';

interface ModernSubsidyFormProps {
  onSubmitSuccess?: (responseId: string) => void;
  onSubmitError?: (error: Error) => void;
}

export const ModernSubsidyForm: React.FC<ModernSubsidyFormProps> = ({
  onSubmitSuccess,
  onSubmitError
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  
  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue
  } = useForm<SubsidyFormInput>({
    resolver: zodResolver(subsidyFormSchema),
    mode: 'onBlur'
  });

  const { submitForm } = useGoogleFormsService();

  // 郵便番号から住所を自動入力
  const handlePostalCodeChange = useCallback(async (value: string, addressType: 'primary' | 'secondary') => {
    const formatted = formatPostalCode(value);
    if (addressType === 'primary') {
      setValue('primaryAddress.postalCode', formatted);
    } else {
      setValue('secondaryAddress.postalCode', formatted);
    }
    
    const cleanedCode = value.replace(/[^0-9]/g, '');
    if (cleanedCode.length === 7) {
      const addressData = await searchAddressByPostalCode(cleanedCode);
      if (addressData) {
        if (addressType === 'primary') {
          setValue('primaryAddress.prefecture', addressData.prefecture);
          setValue('primaryAddress.city', addressData.city + addressData.town);
        } else {
          setValue('secondaryAddress.prefecture', addressData.prefecture);
          setValue('secondaryAddress.city', addressData.city + addressData.town);
        }
      }
    }
  }, [setValue]);

  const onSubmit = useCallback(async (data: SubsidyFormInput) => {
    setIsSubmitting(true);
    try {
      const result = await submitForm(data as SubsidyFormData);
      
      if (result.type === 'success') {
        setShowCompletion(true);
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

  const handleConfirm = () => {
    setShowConfirmation(true);
  };

  const handleBack = () => {
    setShowConfirmation(false);
  };

  // Completion screen
  if (showCompletion) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">送信完了</h2>
            <p className="text-gray-600">事前エントリーを受け付けました。</p>
            <p className="text-gray-600">入力いただいたメールアドレスに確認メールを送信しました。</p>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation screen
  if (showConfirmation) {
    const formData = getValues();
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">入力内容の確認</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">法人種別</div>
                <div className="md:col-span-2 text-sm">{formData.entityType}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">会社名</div>
                <div className="md:col-span-2 text-sm">{formData.company?.name}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">代表者名</div>
                <div className="md:col-span-2 text-sm">
                  {formData.representative?.lastName} {formData.representative?.firstName}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">労働者数</div>
                <div className="md:col-span-2 text-sm">{formData.employeeCount}名</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">メールアドレス</div>
                <div className="md:col-span-2 text-sm">{formData.contact?.email}</div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t flex justify-between">
              <button
                onClick={handleBack}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                戻る
              </button>
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? '送信中...' : '送信する'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <form onSubmit={handleSubmit(handleConfirm)} className="space-y-6">
          
          {/* Notice */}
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
              <div className="ml-3 text-sm text-amber-700">
                <p className="mb-2">申請企業以外の方が事前エントリーを行った場合、抽選対象外となります。</p>
                <p>同一の代表者で複数の企業のエントリーはできません。</p>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-900">
              本フォームにご入力いただいた個人情報は、当社の
              <a href="https://www.spot-s.jp/privacy/" target="_blank" rel="noopener noreferrer" 
                className="underline font-medium mx-1">
                プライバシーポリシー
              </a>
              に基づき適切に管理いたします。
            </p>
          </div>

          {/* Company Information */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">企業情報</h2>
            </div>
            <div className="p-6 space-y-6">
              
              {/* Entity Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  法人種別 <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="entityType"
                  control={control}
                  render={({ field }) => (
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          {...field}
                          value="法人"
                          checked={field.value === '法人'}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">法人</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          {...field}
                          value="個人事業主"
                          checked={field.value === '個人事業主'}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">個人事業主</span>
                      </label>
                    </div>
                  )}
                />
                {errors.entityType && (
                  <p className="mt-1 text-sm text-red-600">{errors.entityType.message}</p>
                )}
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  会社名 <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="company.name"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                />
                {errors.company?.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.company.name.message}</p>
                )}
              </div>

              {/* Company Name Kana */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  会社名フリガナ <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="company.nameKana"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                />
                {errors.company?.nameKana && (
                  <p className="mt-1 text-sm text-red-600">{errors.company.nameKana.message}</p>
                )}
              </div>

              {/* Representative Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    代表者 氏 <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="representative.lastName"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    )}
                  />
                  {errors.representative?.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.representative.lastName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    代表者 名 <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="representative.firstName"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    )}
                  />
                  {errors.representative?.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.representative.firstName.message}</p>
                  )}
                </div>
              </div>

              {/* Representative Name Kana */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    氏フリガナ <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="representative.lastNameKana"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    )}
                  />
                  {errors.representative?.lastNameKana && (
                    <p className="mt-1 text-sm text-red-600">{errors.representative.lastNameKana.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    名フリガナ <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="representative.firstNameKana"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    )}
                  />
                  {errors.representative?.firstNameKana && (
                    <p className="mt-1 text-sm text-red-600">{errors.representative.firstNameKana.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Primary Address */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">会社所在地１</h2>
            </div>
            <div className="p-6 space-y-6">
              
              {/* Postal Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  郵便番号 <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="primaryAddress.postalCode"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <input
                        {...field}
                        type="text"
                        placeholder="123-4567"
                        onChange={(e) => handlePostalCodeChange(e.target.value, 'primary')}
                        className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">郵便番号を入力すると住所が自動入力されます</p>
                    </div>
                  )}
                />
                {errors.primaryAddress?.postalCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.primaryAddress.postalCode.message}</p>
                )}
              </div>

              {/* Prefecture and City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    都道府県 <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="primaryAddress.prefecture"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">選択してください</option>
                        {Prefectures.map(pref => (
                          <option key={pref} value={pref}>{pref}</option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.primaryAddress?.prefecture && (
                    <p className="mt-1 text-sm text-red-600">{errors.primaryAddress.prefecture.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    市区町村 <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="primaryAddress.city"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    )}
                  />
                  {errors.primaryAddress?.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.primaryAddress.city.message}</p>
                  )}
                </div>
              </div>

              {/* Street */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  番地以降 <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="primaryAddress.street"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                />
                {errors.primaryAddress?.street && (
                  <p className="mt-1 text-sm text-red-600">{errors.primaryAddress.street.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Secondary Address */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">会社所在地２（任意）</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Similar fields as primary address but optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">郵便番号</label>
                <Controller
                  name="secondaryAddress.postalCode"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="123-4567"
                      onChange={(e) => handlePostalCodeChange(e.target.value, 'secondary')}
                      className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Employee Count & Application Method */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">申請情報</h2>
            </div>
            <div className="p-6 space-y-6">
              
              {/* Employee Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  常時雇用する労働者数 <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="employeeCount"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      <input
                        {...field}
                        type="number"
                        min="2"
                        max="300"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">名</span>
                    </div>
                  )}
                />
                <p className="mt-1 text-xs text-gray-500">2名以上300名以下である必要があります</p>
                {errors.employeeCount && (
                  <p className="mt-1 text-sm text-red-600">{errors.employeeCount.message}</p>
                )}
              </div>

              {/* Application Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  希望する申請方法 <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="applicationMethod"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          {...field}
                          value="紙申請"
                          checked={field.value === '紙申請'}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">紙申請を希望する</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          {...field}
                          value="電子申請"
                          checked={field.value === '電子申請'}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">電子申請（Jグランツ）を希望する</span>
                      </label>
                    </div>
                  )}
                />
                {errors.applicationMethod && (
                  <p className="mt-1 text-sm text-red-600">{errors.applicationMethod.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">担当者情報</h2>
            </div>
            <div className="p-6 space-y-6">
              
              {/* Contact Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    担当者 氏 <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="contact.lastName"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    )}
                  />
                  {errors.contact?.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.contact.lastName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    担当者 名 <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="contact.firstName"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    )}
                  />
                  {errors.contact?.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.contact.firstName.message}</p>
                  )}
                </div>
              </div>

              {/* Contact Email & Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="contact.email"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                />
                {errors.contact?.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.contact.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  電話番号 <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="contact.phone"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="tel"
                      placeholder="03-0000-0000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                />
                <p className="mt-1 text-xs text-gray-500">携帯電話不可</p>
                {errors.contact?.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.contact.phone.message}</p>
                )}
              </div>

              {/* Application Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  申請理由 <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="applicationReason"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">選択してください</option>
                      {Object.entries(ApplicationReasons).map(([key, value]) => (
                        <option key={key} value={value}>{value}</option>
                      ))}
                    </select>
                  )}
                />
                {errors.applicationReason && (
                  <p className="mt-1 text-sm text-red-600">{errors.applicationReason.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center py-6">
            <button
              type="submit"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              確認画面へ進む
              <ChevronRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};