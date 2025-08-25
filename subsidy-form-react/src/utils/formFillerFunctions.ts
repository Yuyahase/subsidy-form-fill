import type { Page } from "playwright";
import { logger } from "./logger";
import type { FormData } from "./types";

// フォーム入力用の関数群

export const selectEntityType = async (page: Page, entityType: string): Promise<void> => {
  const selector = entityType === "法人" 
    ? 'input[name="entityType"][value="法人"]'
    : 'input[name="entityType"][value="個人事業主"]';
  
  await page.locator(selector).click();
  logger.info(`法人種別: ${entityType}を選択しました`);
};

export const fillCompanyInfo = async (page: Page, data: FormData): Promise<void> => {
  await page.locator('input[name="companyName"]').fill(data.companyName);
  await page.locator('input[name="companyNameKana"]').fill(data.companyNameKana);
  logger.info("会社情報を入力しました");
};

export const fillRepresentativeInfo = async (page: Page, data: FormData): Promise<void> => {
  await page.locator('input[name="representativeLastName"]').fill(data.representativeLastName);
  await page.locator('input[name="representativeFirstName"]').fill(data.representativeFirstName);
  await page.locator('input[name="representativeLastNameKana"]').fill(data.representativeLastNameKana);
  await page.locator('input[name="representativeFirstNameKana"]').fill(data.representativeFirstNameKana);
  logger.info("代表者情報を入力しました");
};

export const fillCompanyAddress1 = async (page: Page, data: FormData): Promise<void> => {
  await page.locator('input[name="address1PostalCode"]').fill(data.address1PostalCode);
  await page.locator('select[name="address1Prefecture"]').selectOption(data.address1Prefecture);
  await page.locator('input[name="address1City"]').fill(data.address1City);
  await page.locator('textarea[name="address1Street"]').fill(data.address1Street);
  logger.info("会社所在地1を入力しました");
};

export const fillCompanyAddress2 = async (page: Page, data: FormData): Promise<void> => {
  if (data.address2PostalCode) {
    await page.locator('input[name="address2PostalCode"]').fill(data.address2PostalCode);
  }
  if (data.address2Prefecture) {
    await page.locator('select[name="address2Prefecture"]').selectOption(data.address2Prefecture);
  }
  if (data.address2City) {
    await page.locator('input[name="address2City"]').fill(data.address2City);
  }
  if (data.address2Street) {
    await page.locator('textarea[name="address2Street"]').fill(data.address2Street);
  }
  logger.info("会社所在地2を入力しました");
};

export const fillWorkerCount = async (page: Page, workerCount: number): Promise<void> => {
  await page.locator('input[name="employeeCount"]').fill(workerCount.toString());
  logger.info(`労働者数: ${workerCount}名を入力しました`);
};

export const selectApplicationMethod = async (page: Page, method: string): Promise<void> => {
  const selector = method === "紙申請" 
    ? 'input[name="applicationMethod"][value="紙申請"]'
    : 'input[name="applicationMethod"][value="電子申請"]';
  
  await page.locator(selector).click();
  logger.info(`申請方法: ${method}を選択しました`);
};

export const fillContactInfo = async (page: Page, data: FormData): Promise<void> => {
  await page.locator('input[name="contactLastName"]').fill(data.contactLastName);
  await page.locator('input[name="contactFirstName"]').fill(data.contactFirstName);
  await page.locator('input[name="contactLastNameKana"]').fill(data.contactLastNameKana);
  await page.locator('input[name="contactFirstNameKana"]').fill(data.contactFirstNameKana);
  await page.locator('input[name="contactPhone"]').fill(data.contactPhone);
  await page.locator('input[name="contactEmail"]').fill(data.contactEmail);
  await page.locator('input[name="contactEmailConfirm"]').fill(data.contactEmail);
  logger.info("担当者情報を入力しました");
};

export const fillAgentName = async (page: Page, agentName: string): Promise<void> => {
  await page.locator('input[name="agentName"]').fill(agentName);
  logger.info(`代理人氏名: ${agentName}を入力しました`);
};

export const selectApplicationReason = async (page: Page, reason: string): Promise<void> => {
  await page.locator('select[name="applicationReason"]').selectOption(reason);
  logger.info(`申請理由: ${reason}を選択しました`);
};

// メインのフォーム入力関数
export const fillForm = async (page: Page, data: FormData): Promise<void> => {
  logger.info("📝 フォーム入力を開始します");

  try {
    // 法人種別の選択
    await selectEntityType(page, data.entityType);

    // 会社情報の入力
    await fillCompanyInfo(page, data);

    // 会社代表者情報の入力
    await fillRepresentativeInfo(page, data);

    // 会社所在地1の入力
    await fillCompanyAddress1(page, data);

    // 会社所在地2の入力（任意）
    if (data.address2PostalCode || data.address2City || data.address2Street) {
      await fillCompanyAddress2(page, data);
    }

    // 労働者数の入力
    await fillWorkerCount(page, data.workerCount);

    // 申請方法の選択
    await selectApplicationMethod(page, data.applicationMethod);

    // 担当者情報の入力
    await fillContactInfo(page, data);

    // 代理人氏名の入力（任意）
    if (data.agentName) {
      await fillAgentName(page, data.agentName);
    }

    // 申請理由の選択
    await selectApplicationReason(page, data.applicationReason);

    logger.info("✅ フォーム入力が完了しました");
  } catch (error) {
    logger.error("❌ フォーム入力中にエラーが発生しました", error);
    throw error;
  }
};

// 確認画面へ進む
export const proceedToConfirmation = async (page: Page): Promise<void> => {
  logger.info("確認画面へ進みます");
  await page.locator('button#confirmBtn').click();
  await page.waitForSelector('#confirmationScreen');
  logger.info("確認画面に遷移しました");
};

// フォーム送信
export const submitForm = async (page: Page): Promise<void> => {
  logger.info("フォームを送信します");
  await page.locator('button#submitBtn').click();
  await page.waitForSelector('#completionScreen');
  logger.info("✅ フォーム送信が完了しました！");
};