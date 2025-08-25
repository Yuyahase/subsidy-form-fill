/**
 * Complete single-page form component - 全項目を1ページに表示
 */

import React, { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { subsidyFormSchema, type SubsidyFormInput } from '../lib/validation';
import { useGoogleFormsService } from '../services/googleForms.service';
import { searchAddressByPostalCode, formatPostalCode } from '../services/postalCode.service';
import { 
  Prefectures, 
  ApplicationReasons,
  type SubsidyFormData 
} from '../types/form.types';

interface CompleteSubsidyFormProps {
  onSubmitSuccess?: (responseId: string) => void;
  onSubmitError?: (error: Error) => void;
}

export const CompleteSubsidyForm: React.FC<CompleteSubsidyFormProps> = ({
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
    
    // 7桁入力されたら住所を検索
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

  // Handle form submission
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

  // Show confirmation screen
  const handleConfirm = () => {
    setShowConfirmation(true);
  };

  // Back to form
  const handleBack = () => {
    setShowConfirmation(false);
  };

  // Completion screen
  if (showCompletion) {
    return (
      <div className="subsidy-form-container">
        <div className="progress-indicator">
          <div className="step">1. 入力</div>
          <div className="step">2. 確認</div>
          <div className="step active">3. 完了</div>
        </div>
        
        <div className="completion-screen">
          <h2>送信完了</h2>
          <p>事前エントリーを受け付けました。</p>
          <p>入力いただいたメールアドレスに確認メールを送信しました。</p>
        </div>
      </div>
    );
  }

  // Confirmation screen
  if (showConfirmation) {
    const formData = getValues();
    return (
      <div className="subsidy-form-container">
        <div className="progress-indicator">
          <div className="step">1. 入力</div>
          <div className="step active">2. 確認</div>
          <div className="step">3. 完了</div>
        </div>
        
        <div className="confirmation-screen">
          <h2>入力内容の確認</h2>
          
          <div className="confirmation-table">
            <div className="confirmation-row">
              <div className="confirmation-label">法人種別</div>
              <div className="confirmation-value">{formData.entityType}</div>
            </div>
            <div className="confirmation-row">
              <div className="confirmation-label">会社名</div>
              <div className="confirmation-value">{formData.company?.name}</div>
            </div>
            <div className="confirmation-row">
              <div className="confirmation-label">会社名フリガナ</div>
              <div className="confirmation-value">{formData.company?.nameKana}</div>
            </div>
            <div className="confirmation-row">
              <div className="confirmation-label">代表者名</div>
              <div className="confirmation-value">
                {formData.representative?.lastName} {formData.representative?.firstName}
              </div>
            </div>
            <div className="confirmation-row">
              <div className="confirmation-label">労働者数</div>
              <div className="confirmation-value">{formData.employeeCount}名</div>
            </div>
            <div className="confirmation-row">
              <div className="confirmation-label">申請方法</div>
              <div className="confirmation-value">{formData.applicationMethod}</div>
            </div>
            <div className="confirmation-row">
              <div className="confirmation-label">担当者メールアドレス</div>
              <div className="confirmation-value">{formData.contact?.email}</div>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={handleBack} className="btn btn-secondary">
              入力画面に戻る
            </button>
            <button 
              type="button" 
              onClick={handleSubmit(onSubmit)} 
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? '送信中...' : '送信する'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="subsidy-form-container">
      <div className="progress-indicator">
        <div className="step active">1. 入力</div>
        <div className="step">2. 確認</div>
        <div className="step">3. 完了</div>
      </div>

      <form onSubmit={handleSubmit(handleConfirm)}>
        <div className="notice-box">
          <p><strong>※申請企業以外の方(代理人等)が事前エントリーを行った場合、抽選対象外となります。必ず申請企業等の代表者や従業員等がエントリーをしてください。</strong></p>
          <p><strong>※同一の代表者で複数の企業のエントリーはできません。</strong></p>
          <p><strong>※1代表者で1企業のみエントリーが可能です。過去に本奨励金を利用したことがある場合、当該企業からのみエントリー可能です。</strong></p>
        </div>

        <div className="privacy-notice">
          <p>
            本フォームにご入力いただいた個人情報は、当社の
            <a 
              href="https://www.spot-s.jp/privacy/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="privacy-link"
            >
              プライバシーポリシー
            </a>
            に基づき適切に管理いたします。
          </p>
        </div>

        <section className="form-section">
          <h2>エントリー企業の情報を入力してください。</h2>

          <div className="form-group">
            <label>法人種別 <span className="required">必須</span></label>
            <Controller
              name="entityType"
              control={control}
              render={({ field }) => (
                <div className="radio-group">
                  <label>
                    <input type="radio" {...field} value="法人" checked={field.value === '法人'} />
                    法人
                  </label>
                  <label>
                    <input type="radio" {...field} value="個人事業主" checked={field.value === '個人事業主'} />
                    個人事業主
                  </label>
                </div>
              )}
            />
            {errors.entityType && <span className="error">{errors.entityType.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="company.name">会社名 <span className="required">必須</span></label>
            <Controller
              name="company.name"
              control={control}
              render={({ field }) => <input type="text" {...field} />}
            />
            {errors.company?.name && <span className="error">{errors.company.name.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="company.nameKana">会社名フリガナ <span className="required">必須</span></label>
            <Controller
              name="company.nameKana"
              control={control}
              render={({ field }) => <input type="text" {...field} pattern="[ァ-ヶー\s]+" />}
            />
            {errors.company?.nameKana && <span className="error">{errors.company.nameKana.message}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>氏 <span className="required">必須</span></label>
              <Controller
                name="representative.lastName"
                control={control}
                render={({ field }) => <input type="text" {...field} />}
              />
              {errors.representative?.lastName && <span className="error">{errors.representative.lastName.message}</span>}
            </div>
            <div className="form-group">
              <label>名 <span className="required">必須</span></label>
              <Controller
                name="representative.firstName"
                control={control}
                render={({ field }) => <input type="text" {...field} />}
              />
              {errors.representative?.firstName && <span className="error">{errors.representative.firstName.message}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>氏フリガナ <span className="required">必須</span></label>
              <Controller
                name="representative.lastNameKana"
                control={control}
                render={({ field }) => <input type="text" {...field} pattern="[ァ-ヶー\s]+" />}
              />
              {errors.representative?.lastNameKana && <span className="error">{errors.representative.lastNameKana.message}</span>}
            </div>
            <div className="form-group">
              <label>名フリガナ <span className="required">必須</span></label>
              <Controller
                name="representative.firstNameKana"
                control={control}
                render={({ field }) => <input type="text" {...field} pattern="[ァ-ヶー\s]+" />}
              />
              {errors.representative?.firstNameKana && <span className="error">{errors.representative.firstNameKana.message}</span>}
            </div>
          </div>

          <p className="form-note">※会社名について：個人事業主の場合は個人事業主の開業・廃業届出書に記載した屋号を入力してください。</p>
          <p className="form-note">※代表者名について：役職名は除いて入力してください。</p>
        </section>

        <section className="form-section">
          <h2>会社所在地の入力に関する注意事項</h2>
          <div className="info-box">
            <ol>
              <li><strong>登記上の本店住所が都内の場合</strong>
                <ul>
                  <li>「会社所在地１」に登記上の本店住所を入力してください。</li>
                  <li>実際の営業地が登記上の本店住所と異なる場合は「会社所在地２」に営業地の住所を入力してください。</li>
                </ul>
              </li>
              <li><strong>登記上の本店住所が都外の場合</strong>
                <ul>
                  <li>「会社所在地１」に登記上の本店住所を入力してください。</li>
                  <li>「会社所在地２」に都内の支店（事務所）の住所を入力してください。</li>
                </ul>
              </li>
              <li><strong>個人事業主の場合</strong>
                <ul>
                  <li>「会社所在地１」に都内の事業所の住所を入力してください。</li>
                </ul>
              </li>
            </ol>
          </div>
        </section>

        <section className="form-section">
          <h3>会社所在地１</h3>
          
          <div className="form-group">
            <label>郵便番号 <span className="required">必須</span></label>
            <Controller
              name="primaryAddress.postalCode"
              control={control}
              render={({ field }) => (
                <div className="postal-code-input">
                  <input 
                    type="text" 
                    {...field}
                    placeholder="〒000-0000"
                    onChange={(e) => handlePostalCodeChange(e.target.value, 'primary')}
                    maxLength={8}
                  />
                  <span className="input-hint">※郵便番号を入力すると住所が自動入力されます</span>
                </div>
              )}
            />
            {errors.primaryAddress?.postalCode && <span className="error">{errors.primaryAddress.postalCode.message}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>都道府県 <span className="required">必須</span></label>
              <Controller
                name="primaryAddress.prefecture"
                control={control}
                render={({ field }) => (
                  <select {...field}>
                    <option value="">選択してください</option>
                    {Prefectures.map(pref => (
                      <option key={pref} value={pref}>{pref}</option>
                    ))}
                  </select>
                )}
              />
              {errors.primaryAddress?.prefecture && <span className="error">{errors.primaryAddress.prefecture.message}</span>}
            </div>

            <div className="form-group">
              <label>市区町村 <span className="required">必須</span></label>
              <Controller
                name="primaryAddress.city"
                control={control}
                render={({ field }) => <input type="text" {...field} />}
              />
              {errors.primaryAddress?.city && <span className="error">{errors.primaryAddress.city.message}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>番地以降 <span className="required">必須</span></label>
            <Controller
              name="primaryAddress.street"
              control={control}
              render={({ field }) => <textarea {...field} rows={2} />}
            />
            {errors.primaryAddress?.street && <span className="error">{errors.primaryAddress.street.message}</span>}
          </div>

          <p className="form-note">※登記上の本店住所を入力してください。</p>
        </section>

        <section className="form-section">
          <h3>会社所在地２</h3>
          
          <div className="form-group">
            <label>郵便番号</label>
            <Controller
              name="secondaryAddress.postalCode"
              control={control}
              render={({ field }) => (
                <div className="postal-code-input">
                  <input 
                    type="text" 
                    {...field}
                    placeholder="〒000-0000"
                    onChange={(e) => handlePostalCodeChange(e.target.value, 'secondary')}
                    maxLength={8}
                  />
                  <span className="input-hint">※郵便番号を入力すると住所が自動入力されます</span>
                </div>
              )}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>都道府県</label>
              <Controller
                name="secondaryAddress.prefecture"
                control={control}
                render={({ field }) => (
                  <select {...field}>
                    <option value="">選択してください</option>
                    {Prefectures.map(pref => (
                      <option key={pref} value={pref}>{pref}</option>
                    ))}
                  </select>
                )}
              />
            </div>

            <div className="form-group">
              <label>市区町村</label>
              <Controller
                name="secondaryAddress.city"
                control={control}
                render={({ field }) => <input type="text" {...field} />}
              />
            </div>
          </div>

          <div className="form-group">
            <label>番地以降</label>
            <Controller
              name="secondaryAddress.street"
              control={control}
              render={({ field }) => <textarea {...field} rows={2} />}
            />
          </div>
        </section>

        <section className="form-section">
          <div className="form-group">
            <label>常時雇用する労働者数を入力してください。 <span className="required">必須</span></label>
            <div className="input-with-unit">
              <Controller
                name="employeeCount"
                control={control}
                render={({ field }) => (
                  <input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    min="2" 
                    max="300" 
                  />
                )}
              />
              <span className="unit">名</span>
            </div>
            {errors.employeeCount && <span className="error">{errors.employeeCount.message}</span>}
            <p className="form-note">※エントリー時点の概ねの会社全体の人数を入力してください（数字のみ）</p>
            <p className="form-note">※常時雇用する労働者が2名以上300名以下であることが申請要件の１つです。</p>
          </div>
        </section>

        <section className="form-section">
          <div className="form-group">
            <label>希望する申請方法を入力してください。 <span className="required">必須</span></label>
            <Controller
              name="applicationMethod"
              control={control}
              render={({ field }) => (
                <div className="radio-group">
                  <label>
                    <input type="radio" {...field} value="紙申請" checked={field.value === '紙申請'} />
                    ①紙申請を希望する
                  </label>
                  <label>
                    <input type="radio" {...field} value="電子申請" checked={field.value === '電子申請'} />
                    ②電子申請（Jグランツ）を希望する
                  </label>
                </div>
              )}
            />
            {errors.applicationMethod && <span className="error">{errors.applicationMethod.message}</span>}
            <p className="form-note">※電子申請（Jグランツ）により受け付けられる数には限りがあります。</p>
          </div>
        </section>

        <section className="form-section">
          <h2>企業の担当者について入力してください。</h2>

          <div className="form-row">
            <div className="form-group">
              <label>氏 <span className="required">必須</span></label>
              <Controller
                name="contact.lastName"
                control={control}
                render={({ field }) => <input type="text" {...field} />}
              />
              {errors.contact?.lastName && <span className="error">{errors.contact.lastName.message}</span>}
            </div>
            <div className="form-group">
              <label>名 <span className="required">必須</span></label>
              <Controller
                name="contact.firstName"
                control={control}
                render={({ field }) => <input type="text" {...field} />}
              />
              {errors.contact?.firstName && <span className="error">{errors.contact.firstName.message}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>氏フリガナ <span className="required">必須</span></label>
              <Controller
                name="contact.lastNameKana"
                control={control}
                render={({ field }) => <input type="text" {...field} pattern="[ァ-ヶー\s]+" />}
              />
              {errors.contact?.lastNameKana && <span className="error">{errors.contact.lastNameKana.message}</span>}
            </div>
            <div className="form-group">
              <label>名フリガナ <span className="required">必須</span></label>
              <Controller
                name="contact.firstNameKana"
                control={control}
                render={({ field }) => <input type="text" {...field} pattern="[ァ-ヶー\s]+" />}
              />
              {errors.contact?.firstNameKana && <span className="error">{errors.contact.firstNameKana.message}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>電話番号 <span className="required">必須</span></label>
            <Controller
              name="contact.phone"
              control={control}
              render={({ field }) => <input type="tel" {...field} placeholder="03-0000-0000" />}
            />
            {errors.contact?.phone && <span className="error">{errors.contact.phone.message}</span>}
            <p className="form-note">※原則として、携帯電話の入力は不可です。</p>
          </div>

          <div className="form-group">
            <label>メールアドレス <span className="required">必須</span></label>
            <Controller
              name="contact.email"
              control={control}
              render={({ field }) => <input type="email" {...field} />}
            />
            {errors.contact?.email && <span className="error">{errors.contact.email.message}</span>}
            <p className="form-note">※企業の担当者以外のメールアドレスを入力した場合は抽選対象となりません。</p>
          </div>
        </section>

        <section className="form-section">
          <div className="form-group">
            <label>代理人に委任する場合は、代理人氏名を入力してください。</label>
            <Controller
              name="agent"
              control={control}
              render={({ field }) => <input type="text" {...field} />}
            />
            <p className="form-note">※事務担当業務を代理人に委任する場合のみ記入してください。</p>
          </div>
        </section>

        <section className="form-section">
          <div className="form-group">
            <label>当事業の奨励金について、申請しようと考えた直接の理由は何ですか？ <span className="required">必須</span></label>
            <Controller
              name="applicationReason"
              control={control}
              render={({ field }) => (
                <select {...field}>
                  <option value="">選択してください</option>
                  {Object.entries(ApplicationReasons).map(([key, value]) => (
                    <option key={key} value={value}>{value}</option>
                  ))}
                </select>
              )}
            />
            {errors.applicationReason && <span className="error">{errors.applicationReason.message}</span>}
          </div>
        </section>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            確認画面へ進む
          </button>
        </div>
      </form>
    </div>
  );
};