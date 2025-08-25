import { chromium } from "playwright";
import { fillFormData, submitFormData } from "./subsidy-form-react/src/utils/formFiller";
import type { FormData } from "./subsidy-form-react/src/utils/types";
import * as fs from "fs";
import * as path from "path";

async function main() {
  // JSONファイルからデータを読み込む
  const jsonPath = process.argv[2] || path.join(__dirname, "form-data.json");
  
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ JSONファイルが見つかりません: ${jsonPath}`);
    console.log("使用方法: npx tsx fillFormFromJson.ts [JSONファイルパス]");
    process.exit(1);
  }

  const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const formData: FormData = jsonData;

  console.log("📋 以下のデータでフォームを入力します:");
  console.log(`  会社名: ${formData.companyName}`);
  console.log(`  代表者: ${formData.representativeLastName} ${formData.representativeFirstName}`);
  console.log(`  労働者数: ${formData.workerCount}名`);

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // フォームページに移動
    await page.goto("https://logoform.jp/f/XqHqF");
    
    // フォームが読み込まれるのを待つ
    await page.waitForSelector('input[data-subheading="company_name"]', { timeout: 30000 });

    // フォームに入力
    await fillFormData(page, formData);

    console.log("✅ フォーム入力が完了しました");
    console.log("内容を確認してください。");
    console.log("送信する場合は 'y' を、キャンセルする場合は 'n' を入力してください:");
    
    // ユーザーの確認を待つ
    const userInput = await new Promise<string>(resolve => {
      process.stdin.once('data', data => {
        resolve(data.toString().trim().toLowerCase());
      });
    });

    if (userInput === 'y') {
      const receiptNumber = await submitFormData(page);
      console.log(`✅ フォームを送信しました！受付番号: ${receiptNumber}`);
    } else {
      console.log("❌ 送信をキャンセルしました");
    }

  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
  } finally {
    await browser.close();
  }
}

// スクリプト実行
main().catch(console.error);