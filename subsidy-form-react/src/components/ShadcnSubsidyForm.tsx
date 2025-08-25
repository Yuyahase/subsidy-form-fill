import React, { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { subsidyFormSchema, type SubsidyFormInput } from '../lib/formValidation';
import { useGoogleFormsService } from '../services/googleForms.service';
import { searchAddressByPostalCode, formatPostalCode } from '../services/postalCode.service';
import { ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { 
  Prefectures, 
  ApplicationReasons,
  type SubsidyFormData 
} from '../types/form.types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Textarea } from './ui/Textarea';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Alert, AlertDescription } from './ui/Alert';
import { RadioGroup, RadioGroupItem } from './ui/RadioGroup';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';

interface ShadcnSubsidyFormProps {
  onSubmitSuccess?: (responseId: string) => void;
  onSubmitError?: (error: Error) => void;
}

export const ShadcnSubsidyForm: React.FC<ShadcnSubsidyFormProps> = ({
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
    mode: 'onBlur',
    defaultValues: {
      entityType: '法人',
      employeeCount: 2,
      applicationMethod: '紙申請',
      company: {
        name: '',
        nameKana: ''
      },
      representative: {
        lastName: '',
        firstName: '',
        lastNameKana: '',
        firstNameKana: ''
      },
      primaryAddress: {
        postalCode: '',
        prefecture: '',
        city: '',
        street: ''
      },
      secondaryAddress: {
        postalCode: '',
        prefecture: '',
        city: '',
        street: ''
      },
      contact: {
        lastName: '',
        firstName: '',
        lastNameKana: '',
        firstNameKana: '',
        email: '',
        phone: ''
      },
      agent: '',
      applicationReason: ''
    }
  });

  const { submitForm } = useGoogleFormsService();

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

  if (showCompletion) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardContent className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">送信完了</h2>
              <p className="text-gray-600">事前エントリーを受け付けました。</p>
              <p className="text-gray-600">入力いただいたメールアドレスに確認メールを送信しました。</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    const formData = getValues();
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle>入力内容の確認</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">法人種別</div>
                <div className="md:col-span-2 text-sm">{formData.entityType}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">会社名</div>
                <div className="md:col-span-2 text-sm">
                  {formData.company?.name}<br />
                  <span className="text-gray-500">（フリガナ：{formData.company?.nameKana}）</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">代表者名</div>
                <div className="md:col-span-2 text-sm">
                  {formData.representative?.lastName} {formData.representative?.firstName}<br />
                  <span className="text-gray-500">
                    （フリガナ：{formData.representative?.lastNameKana} {formData.representative?.firstNameKana}）
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">会社所在地１</div>
                <div className="md:col-span-2 text-sm">
                  〒{formData.primaryAddress?.postalCode}<br />
                  {formData.primaryAddress?.prefecture} {formData.primaryAddress?.city}<br />
                  {formData.primaryAddress?.street}
                </div>
              </div>
              {formData.secondaryAddress?.postalCode && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-sm text-gray-500">会社所在地２</div>
                  <div className="md:col-span-2 text-sm">
                    〒{formData.secondaryAddress?.postalCode}<br />
                    {formData.secondaryAddress?.prefecture} {formData.secondaryAddress?.city}<br />
                    {formData.secondaryAddress?.street}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">労働者数</div>
                <div className="md:col-span-2 text-sm">{formData.employeeCount}名</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">申請方法</div>
                <div className="md:col-span-2 text-sm">{formData.applicationMethod}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">担当者名</div>
                <div className="md:col-span-2 text-sm">
                  {formData.contact?.lastName} {formData.contact?.firstName}<br />
                  <span className="text-gray-500">
                    （フリガナ：{formData.contact?.lastNameKana} {formData.contact?.firstNameKana}）
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">電話番号</div>
                <div className="md:col-span-2 text-sm">{formData.contact?.phone}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">メールアドレス</div>
                <div className="md:col-span-2 text-sm">{formData.contact?.email}</div>
              </div>
              {formData.agent && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-sm text-gray-500">代理人</div>
                  <div className="md:col-span-2 text-sm">{formData.agent}</div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">申請理由</div>
                <div className="md:col-span-2 text-sm">{formData.applicationReason}</div>
              </div>
              
              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={handleBack}>
                  戻る
                </Button>
                <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                  {isSubmitting ? '送信中...' : '送信する'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12" style={{ backgroundColor: '#f9fafb' }}>
      <div className="max-w-3xl mx-auto px-4">
        <form onSubmit={handleSubmit(handleConfirm)} className="space-y-6">
          
          <Alert className="bg-amber-50 border-amber-400">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-amber-700">
              <p className="mb-2">申請企業以外の方が事前エントリーを行った場合、抽選対象外となります。</p>
              <p className="mb-2">同一の代表者で複数の企業のエントリーはできません。</p>
              <p className="mb-2">1代表者で1企業のみエントリーが可能です。</p>
              <p>過去に本奨励金を利用したことがある場合、当該企業からのみエントリー可能です。</p>
            </AlertDescription>
          </Alert>

          <Alert className="bg-blue-50 border-blue-400">
            <AlertDescription className="text-blue-900">
              本フォームにご入力いただいた個人情報は、当社の
              <a href="https://www.spot-s.jp/privacy/" target="_blank" rel="noopener noreferrer" 
                className="underline font-medium mx-1">
                プライバシーポリシー
              </a>
              に基づき適切に管理いたします。
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>企業情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>法人種別 <span className="text-red-500">*</span></Label>
                <Controller
                  name="entityType"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup value={field.value} onValueChange={field.onChange}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="法人" id="corporation" />
                        <Label htmlFor="corporation">法人</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="個人事業主" id="sole-proprietor" />
                        <Label htmlFor="sole-proprietor">個人事業主</Label>
                      </div>
                    </RadioGroup>
                  )}
                />
                {errors.entityType && (
                  <p className="mt-1 text-sm text-red-600">{errors.entityType.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="company-name">会社名 <span className="text-red-500">*</span></Label>
                <Controller
                  name="company.name"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} id="company-name" />
                  )}
                />
                <p className="mt-1 text-xs text-gray-500">個人事業主の場合は個人事業主の開業・廃業届出書に記載した屋号を入力してください。</p>
                {errors.company?.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.company.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="company-name-kana">会社名フリガナ <span className="text-red-500">*</span></Label>
                <Controller
                  name="company.nameKana"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} id="company-name-kana" />
                  )}
                />
                {errors.company?.nameKana && (
                  <p className="mt-1 text-sm text-red-600">{errors.company.nameKana.message}</p>
                )}
              </div>

              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rep-last-name">代表者 氏 <span className="text-red-500">*</span></Label>
                    <Controller
                      name="representative.lastName"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} id="rep-last-name" />
                      )}
                    />
                    {errors.representative?.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.representative.lastName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="rep-first-name">代表者 名 <span className="text-red-500">*</span></Label>
                    <Controller
                      name="representative.firstName"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} id="rep-first-name" />
                      )}
                    />
                    {errors.representative?.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.representative.firstName.message}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">役職名は除いて入力してください。</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rep-last-name-kana">氏フリガナ <span className="text-red-500">*</span></Label>
                  <Controller
                    name="representative.lastNameKana"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} id="rep-last-name-kana" />
                    )}
                  />
                  {errors.representative?.lastNameKana && (
                    <p className="mt-1 text-sm text-red-600">{errors.representative.lastNameKana.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="rep-first-name-kana">名フリガナ <span className="text-red-500">*</span></Label>
                  <Controller
                    name="representative.firstNameKana"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} id="rep-first-name-kana" />
                    )}
                  />
                  {errors.representative?.firstNameKana && (
                    <p className="mt-1 text-sm text-red-600">{errors.representative.firstNameKana.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>会社所在地１</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-gray-700">
                  <div className="space-y-3">
                    <div>
                      <strong className="text-gray-900">登記上の本店住所が都内の場合</strong>
                      <ul className="mt-1 ml-4 list-disc text-gray-600">
                        <li>「会社所在地１」に登記上の本店住所を入力してください。</li>
                        <li>実際の営業地が登記上の本店住所と異なる場合は「会社所在地２」に営業地の住所を入力してください。</li>
                      </ul>
                    </div>
                    <div>
                      <strong className="text-gray-900">登記上の本店住所が都外の場合</strong>
                      <ul className="mt-1 ml-4 list-disc text-gray-600">
                        <li>「会社所在地１」に登記上の本店住所を入力してください。</li>
                        <li>「会社所在地２」に都内の支店（事務所）の住所を入力してください。</li>
                      </ul>
                    </div>
                    <div>
                      <strong className="text-gray-900">個人事業主の場合</strong>
                      <ul className="mt-1 ml-4 list-disc text-gray-600">
                        <li>「会社所在地１」に都内の事業所の住所を入力してください。</li>
                      </ul>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
              <div>
                <Label htmlFor="postal-code">郵便番号 <span className="text-red-500">*</span></Label>
                <Controller
                  name="primaryAddress.postalCode"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Input
                        {...field}
                        id="postal-code"
                        placeholder="123-4567"
                        onChange={(e) => handlePostalCodeChange(e.target.value, 'primary')}
                        className="w-48"
                      />
                      <p className="mt-1 text-xs text-gray-500">郵便番号を入力すると住所が自動入力されます</p>
                    </div>
                  )}
                />
                {errors.primaryAddress?.postalCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.primaryAddress.postalCode.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prefecture">都道府県 <span className="text-red-500">*</span></Label>
                  <Controller
                    name="primaryAddress.prefecture"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="prefecture">
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          {Prefectures.map(pref => (
                            <SelectItem key={pref} value={pref}>{pref}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.primaryAddress?.prefecture && (
                    <p className="mt-1 text-sm text-red-600">{errors.primaryAddress.prefecture.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="city">市区町村 <span className="text-red-500">*</span></Label>
                  <Controller
                    name="primaryAddress.city"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} id="city" />
                    )}
                  />
                  {errors.primaryAddress?.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.primaryAddress.city.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="street">番地以降 <span className="text-red-500">*</span></Label>
                <Controller
                  name="primaryAddress.street"
                  control={control}
                  render={({ field }) => (
                    <Textarea {...field} id="street" rows={2} />
                  )}
                />
                {errors.primaryAddress?.street && (
                  <p className="mt-1 text-sm text-red-600">{errors.primaryAddress.street.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>会社所在地２（任意）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="postal-code-2">郵便番号</Label>
                <Controller
                  name="secondaryAddress.postalCode"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Input
                        {...field}
                        id="postal-code-2"
                        placeholder="123-4567"
                        onChange={(e) => handlePostalCodeChange(e.target.value, 'secondary')}
                        className="w-48"
                      />
                      <p className="mt-1 text-xs text-gray-500">郵便番号を入力すると住所が自動入力されます</p>
                    </div>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prefecture-2">都道府県</Label>
                  <Controller
                    name="secondaryAddress.prefecture"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="prefecture-2">
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          {Prefectures.map(pref => (
                            <SelectItem key={pref} value={pref}>{pref}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div>
                  <Label htmlFor="city-2">市区町村</Label>
                  <Controller
                    name="secondaryAddress.city"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} id="city-2" />
                    )}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="street-2">番地以降</Label>
                <Controller
                  name="secondaryAddress.street"
                  control={control}
                  render={({ field }) => (
                    <Textarea {...field} id="street-2" rows={2} />
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>申請情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="employee-count">常時雇用する労働者数 <span className="text-red-500">*</span></Label>
                <Controller
                  name="employeeCount"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      <Input
                        {...field}
                        id="employee-count"
                        type="number"
                        min="2"
                        max="300"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        className="w-32"
                      />
                      <span className="text-sm text-gray-700">名</span>
                    </div>
                  )}
                />
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500">※エントリー時点の概ねの会社全体の人数を入力してください（数字のみ）</p>
                  <p className="text-xs text-gray-500">※常時雇用する労働者が2名以上300名以下であることが申請要件の１つです。要件を満たしているか、今一度ご確認ください。なお、要件の詳細は申請の手引きをご覧ください。</p>
                </div>
                {errors.employeeCount && (
                  <p className="mt-1 text-sm text-red-600">{errors.employeeCount.message}</p>
                )}
              </div>

              <div>
                <Label>希望する申請方法 <span className="text-red-500">*</span></Label>
                <Controller
                  name="applicationMethod"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup value={field.value} onValueChange={field.onChange}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="紙申請" id="paper" />
                        <Label htmlFor="paper">①紙申請を希望する</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="電子申請" id="electronic" />
                        <Label htmlFor="electronic">②電子申請（Jグランツ）を希望する</Label>
                      </div>
                    </RadioGroup>
                  )}
                />
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500">※電子申請（Jグランツ）により受け付けられる数には限りがあります。超過した場合は、当選しても紙申請として申請いただく場合があります。</p>
                  <p className="text-xs text-gray-500">※紙申請枠で当選した場合は電子申請での受付はいたしません。予めご了承ください。</p>
                </div>
                {errors.applicationMethod && (
                  <p className="mt-1 text-sm text-red-600">{errors.applicationMethod.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>担当者情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact-last-name">担当者 氏 <span className="text-red-500">*</span></Label>
                    <Controller
                      name="contact.lastName"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} id="contact-last-name" />
                      )}
                    />
                    {errors.contact?.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.contact.lastName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="contact-first-name">担当者 名 <span className="text-red-500">*</span></Label>
                    <Controller
                      name="contact.firstName"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} id="contact-first-name" />
                      )}
                    />
                    {errors.contact?.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.contact.firstName.message}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">※役職名等は除いて入力してください。</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact-last-name-kana">担当者 氏フリガナ <span className="text-red-500">*</span></Label>
                  <Controller
                    name="contact.lastNameKana"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} id="contact-last-name-kana" />
                    )}
                  />
                  {errors.contact?.lastNameKana && (
                    <p className="mt-1 text-sm text-red-600">{errors.contact.lastNameKana.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="contact-first-name-kana">担当者 名フリガナ <span className="text-red-500">*</span></Label>
                  <Controller
                    name="contact.firstNameKana"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} id="contact-first-name-kana" />
                    )}
                  />
                  {errors.contact?.firstNameKana && (
                    <p className="mt-1 text-sm text-red-600">{errors.contact.firstNameKana.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">メールアドレス <span className="text-red-500">*</span></Label>
                <Controller
                  name="contact.email"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} id="email" type="email" />
                  )}
                />
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500">※企業の担当者以外のメールアドレスを入力した場合は抽選対象となりません。</p>
                  <p className="text-xs text-gray-500">※同じメールアドレスでの複数エントリーはできません。</p>
                  <p className="text-xs text-gray-500">●受信拒否設定機能などを設定している場合は、no-reply@logoform.jpからのメールを受信できるように設定を変更してください。</p>
                  <p className="text-xs text-gray-500">●携帯電話のメールアドレスを入力した場合、お送りするメールの本文が長いため、機種によってはすべて受信できない場合があります。</p>
                </div>
                {errors.contact?.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.contact.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">電話番号 <span className="text-red-500">*</span></Label>
                <Controller
                  name="contact.phone"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} id="phone" type="tel" placeholder="03-0000-0000" />
                  )}
                />
                <p className="mt-1 text-xs text-gray-500">※原則として、携帯電話の入力は不可です。</p>
                {errors.contact?.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.contact.phone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="agent">代理人に委任する場合は、代理人氏名を入力してください。</Label>
                <Controller
                  name="agent"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} id="agent" />
                  )}
                />
                <p className="mt-1 text-xs text-gray-500">※事務担当業務を代理人に委任する場合のみ記入してください。</p>
              </div>

              <div>
                <Label htmlFor="reason">当事業の奨励金について、申請しようと考えた直接の理由は何ですか？ <span className="text-red-500">*</span></Label>
                <Controller
                  name="applicationReason"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="reason">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ApplicationReasons).map(([key, value]) => (
                          <SelectItem key={key} value={value}>{value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.applicationReason && (
                  <p className="mt-1 text-sm text-red-600">{errors.applicationReason.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center py-6">
            <Button type="submit" size="lg">
              確認画面へ進む
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};