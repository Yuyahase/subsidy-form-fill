import { chromium } from "playwright";
import { fillFormData, submitFormData } from "./subsidy-form-react/src/utils/formFiller";
import type { FormData } from "./subsidy-form-react/src/utils/types";

// テスト用のフォームデータ
const testData: FormData = {
  entityType: "法人",
  companyName: "株式会社テスト",
  companyNameKana: "カブシキガイシャテスト",
  representativeLastName: "山田",
  representativeFirstName: "太郎",
  representativeLastNameKana: "ヤマダ",
  representativeFirstNameKana: "タロウ",
  address1PostalCode: "100-0001",
  address1Prefecture: "東京都",
  address1City: "千代田区",
  address1Street: "千代田1-1-1",
  address2PostalCode: "",
  address2Prefecture: "",
  address2City: "",
  address2Street: "",
  workerCount: 50,
  applicationMethod: "紙申請",
  contactLastName: "佐藤",
  contactFirstName: "花子",
  contactLastNameKana: "サトウ",
  contactFirstNameKana: "ハナコ",
  contactPhone: "03-1234-5678",
  contactEmail: "test@example.com",
  agentName: "",
  applicationReason: "東京都の案内（メール・チラシ等）"
};

async function main() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // フォームページに移動
    await page.goto("https://logoform.jp/f/XqHqF");
    
    // フォームが読み込まれるのを待つ
    await page.waitForSelector('input[data-subheading="company_name"]', { timeout: 30000 });

    // フォームに入力
    await fillFormData(page, testData);

    // 確認画面へ進む（手動で確認が必要な場合はコメントアウト）
    // await submitFormData(page);

    console.log("✅ フォーム入力が完了しました");
    console.log("ブラウザを閉じるには、Enterキーを押してください...");
    
    // ユーザーの入力を待つ
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
  } finally {
    await browser.close();
  }
}

// スクリプト実行
main().catch(console.error);