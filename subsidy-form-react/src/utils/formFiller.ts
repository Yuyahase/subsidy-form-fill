import type { Page } from "playwright";
import { logger } from "./logger";
import type { FormData } from "./types";

// フォーム入力用の関数群

export const selectEntityType = async (page: Page, type: "法人" | "個人事業主"): Promise<void> => {
  logger.debug(`法人種別を選択: ${type}`);
  // ラジオボタンの親要素（.v-radio）をクリック
  const radioContainer = page.locator('.v-radio').filter({ has: page.locator(`input[value="${type}"]`) });
  await radioContainer.click();
  await page.waitForTimeout(500);
};

export const fillCompanyInfo = async (page: Page, data: FormData): Promise<void> => {
  logger.debug("会社情報を入力");

  // 会社名
  await page.locator('input[data-subheading="company_name"]').fill(data.companyName);

  // 会社名フリガナ
  await page.locator('input[data-subheading="company_furigana"]').fill(data.companyNameKana);
};

export const fillRepresentativeInfo = async (page: Page, data: FormData): Promise<void> => {
  logger.debug("会社代表者情報を入力");

  // 姓
  await page.locator('input[data-subheading="lastname"]').fill(data.representativeLastName);

  // 名
  await page.locator('input[data-subheading="firstname"]').fill(data.representativeFirstName);

  // 姓フリガナ
  await page.locator('input[data-subheading="lastfurigana"]').fill(data.representativeLastNameKana);

  // 名フリガナ
  await page.locator('input[data-subheading="firstfurigana"]').fill(data.representativeFirstNameKana);
};

export const fillCompanyAddress1 = async (page: Page, data: FormData): Promise<void> => {
  logger.debug("会社所在地1を入力");

  // 郵便番号
  await page.locator('input[data-item-id="4"][data-subheading="zipcode"]').fill(data.address1PostalCode);

  // 都道府県
  const prefectureField = page.locator('input[data-item-id="4"][data-subheading="prefecture"]');
  // 親のv-selectコンテナをクリック
  const selectContainer = prefectureField.locator('..').locator('..');
  await selectContainer.click();
  await page.waitForTimeout(500);
  // メニューが表示されるのを待つ
  await page.waitForSelector('.v-menu__content:visible', { timeout: 5000 });
  await page.getByRole("option", { name: data.address1Prefecture }).click();

  // 市区町村
  await page.locator('input[data-item-id="4"][data-subheading="address1"]').fill(data.address1City);

  // 番地以降
  await page.locator('input[data-item-id="4"][data-subheading="address2"]').fill(data.address1Street);
};

export const fillCompanyAddress2 = async (page: Page, data: FormData): Promise<void> => {
  logger.debug("会社所在地2を入力");

  // 郵便番号
  if (data.address2PostalCode) {
    await page.locator('input[data-item-id="5"][data-subheading="zipcode"]').fill(data.address2PostalCode);
  }

  // 都道府県
  if (data.address2Prefecture) {
    const prefectureField = page.locator('input[data-item-id="5"][data-subheading="prefecture"]');
    // 親のv-selectコンテナをクリック
    const selectContainer = prefectureField.locator('..').locator('..');
    await selectContainer.click();
    await page.waitForTimeout(500);
    // メニューが表示されるのを待つ
    await page.waitForSelector('.v-menu__content:visible', { timeout: 5000 });
    await page.getByRole("option", { name: data.address2Prefecture }).click();
  }

  // 市区町村
  if (data.address2City) {
    await page.locator('input[data-item-id="5"][data-subheading="address1"]').fill(data.address2City);
  }

  // 番地以降
  if (data.address2Street) {
    await page.locator('input[data-item-id="5"][data-subheading="address2"]').fill(data.address2Street);
  }
};

export const fillWorkerCount = async (page: Page, count: number): Promise<void> => {
  logger.debug(`労働者数を入力: ${count}`);
  await page.locator("#label6").fill(count.toString());
};

export const selectApplicationMethod = async (page: Page, method: string): Promise<void> => {
  logger.debug(`申請方法を選択: ${method}`);
  // ラジオボタンの親要素（.v-radio）をクリック
  const radioContainer = page.locator('.v-radio').filter({ has: page.locator(`input[value="${method}"]`) });
  await radioContainer.click();
  await page.waitForTimeout(500);
};

export const fillContactInfo = async (page: Page, data: FormData): Promise<void> => {
  logger.debug("担当者情報を入力");

  // 姓
  await page.locator('input[data-subheading="saff_lastname"]').fill(data.contactLastName);

  // 名
  await page.locator('input[data-subheading="saff_firstname"]').fill(data.contactFirstName);

  // 姓フリガナ
  await page.locator('input[data-subheading="saff_lastfurigana"]').fill(data.contactLastNameKana);

  // 名フリガナ
  await page.locator('input[data-subheading="staff_firstfurigana"]').fill(data.contactFirstNameKana);

  // 電話番号
  await page.locator('#label20').fill(data.contactPhone);

  // メールアドレス
  await page.locator('input[data-subheading="email"]').fill(data.contactEmail);
  await page.locator('input[data-subheading="reemail"]').fill(data.contactEmail);
};

export const fillAgentName = async (page: Page, agentName: string): Promise<void> => {
  logger.debug(`代理人氏名を入力: ${agentName}`);
  await page.locator('#label15').fill(agentName);
};

export const selectApplicationReason = async (page: Page, reason: string): Promise<void> => {
  logger.debug(`申請理由を選択: ${reason}`);

  // オートコンプリート入力フィールドをクリック
  const reasonInput = page.locator('#label23');
  await reasonInput.click();
  await page.waitForTimeout(1000);

  // 入力フィールドに直接入力
  await reasonInput.fill('');
  await reasonInput.type(reason.substring(0, 3)); // 最初の3文字を入力
  await page.waitForTimeout(500);

  // 選択肢が表示されるのを待つ
  try {
    await page.waitForSelector('.v-menu__content .v-list', { state: 'visible', timeout: 3000 });
    // 完全一致するオプションをクリック
    await page.locator('.v-menu__content .v-list-item').filter({ hasText: reason }).first().click();
  } catch {
    // メニューが表示されない場合は、直接値を入力
    await reasonInput.fill(reason);
    await reasonInput.press('Enter');
  }
};

// メインのフォーム入力関数
export const fillFormData = async (page: Page, data: FormData): Promise<void> => {
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

// フォーム送信関数
export const submitFormData = async (page: Page): Promise<string> => {
  logger.info("📤 フォームを送信します");

  // 確認画面へ
  await page.getByTestId("form-detail--to-confirm-button").click();
  await page.waitForLoadState("networkidle");

  // 送信
  await page.getByTestId("form-detail--to-completion-button").click();
  await page.waitForLoadState("networkidle");

  // 受付番号を取得
  const receiptNumberElement = await page.getByText(/＜ 受付番号: \w+ ＞/);
  const receiptNumber = await receiptNumberElement.textContent();

  logger.info(`✅ フォーム送信完了: ${receiptNumber}`);
  return receiptNumber || "";
};

// 確認画面へ進む
export const proceedToConfirmationScreen = async (page: Page): Promise<void> => {
  logger.info("確認画面へ進みます");
  await page.getByTestId("form-detail--to-confirm-button").click();
  await page.waitForLoadState("networkidle");
  logger.info("確認画面に遷移しました");
};

// エラーハンドリング用の関数
export const safeFormFill = async (page: Page, data: FormData): Promise<{ success: boolean; error?: Error }> => {
  try {
    await fillFormData(page, data);
    return { success: true };
  } catch (error) {
    logger.error("フォーム入力に失敗しました", error);
    return { success: false, error: error as Error };
  }
};