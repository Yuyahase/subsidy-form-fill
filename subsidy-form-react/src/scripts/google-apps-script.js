/**
 * Google Apps Script for handling form submissions
 * 
 * セットアップ手順：
 * 1. Google Driveで新しいGoogle Sheetsを作成
 * 2. 拡張機能 > Apps Script を開く
 * 3. このコードを貼り付ける
 * 4. デプロイ > 新しいデプロイ
 * 5. 種類: ウェブアプリ
 * 6. 説明: Tokyo Subsidy Form Handler
 * 7. 実行ユーザー: 自分
 * 8. アクセスできるユーザー: 全員
 * 9. デプロイボタンをクリック
 * 10. 生成されたWeb App URLをscript.jsのGOOGLE_SCRIPT_URLに設定
 */

// スプレッドシートのIDを設定（作成したGoogle SheetsのURLから取得）
// 例: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

// POSTリクエストを処理
function doPost(e) {
    try {
        // リクエストデータを解析
        const data = JSON.parse(e.postData.contents);
        
        // スプレッドシートを開く
        const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
        
        // ヘッダー行がない場合は作成
        if (sheet.getLastRow() === 0) {
            createHeaders(sheet);
        }
        
        // データを配列に変換
        const rowData = [
            new Date().toLocaleString('ja-JP'), // 送信日時
            data.entityType || '',
            data.companyName || '',
            data.companyNameKana || '',
            data.representativeLastName || '',
            data.representativeFirstName || '',
            data.representativeLastNameKana || '',
            data.representativeFirstNameKana || '',
            data.address1PostalCode || '',
            data.address1Prefecture || '',
            data.address1City || '',
            data.address1Street || '',
            data.address2PostalCode || '',
            data.address2Prefecture || '',
            data.address2City || '',
            data.address2Street || '',
            data.employeeCount || '',
            data.applicationMethod || '',
            data.contactLastName || '',
            data.contactFirstName || '',
            data.contactLastNameKana || '',
            data.contactFirstNameKana || '',
            data.contactPhone || '',
            data.contactEmail || '',
            data.agentName || '',
            data.applicationReason || ''
        ];
        
        // スプレッドシートに追加
        sheet.appendRow(rowData);
        
        // 確認メールを送信（オプション）
        if (data.contactEmail) {
            sendConfirmationEmail(data);
        }
        
        // 成功レスポンスを返す
        return ContentService
            .createTextOutput(JSON.stringify({
                status: 'success',
                message: 'データが正常に保存されました'
            }))
            .setMimeType(ContentService.MimeType.JSON);
            
    } catch (error) {
        // エラーレスポンスを返す
        console.error('Error:', error);
        return ContentService
            .createTextOutput(JSON.stringify({
                status: 'error',
                message: error.toString()
            }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

// GETリクエストを処理（テスト用）
function doGet(e) {
    return ContentService
        .createTextOutput(JSON.stringify({
            status: 'ok',
            message: 'Google Apps Script is running'
        }))
        .setMimeType(ContentService.MimeType.JSON);
}

// ヘッダー行を作成
function createHeaders(sheet) {
    const headers = [
        '送信日時',
        '法人種別',
        '会社名',
        '会社名フリガナ',
        '代表者氏',
        '代表者名',
        '代表者氏フリガナ',
        '代表者名フリガナ',
        '所在地1郵便番号',
        '所在地1都道府県',
        '所在地1市区町村',
        '所在地1番地以降',
        '所在地2郵便番号',
        '所在地2都道府県',
        '所在地2市区町村',
        '所在地2番地以降',
        '労働者数',
        '申請方法',
        '担当者氏',
        '担当者名',
        '担当者氏フリガナ',
        '担当者名フリガナ',
        '担当者電話番号',
        '担当者メールアドレス',
        '代理人氏名',
        '申請理由'
    ];
    
    sheet.appendRow(headers);
    
    // ヘッダー行のスタイルを設定
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#0052cc');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    
    // 列幅を自動調整
    for (let i = 1; i <= headers.length; i++) {
        sheet.autoResizeColumn(i);
    }
}

// 確認メールを送信
function sendConfirmationEmail(data) {
    const recipient = data.contactEmail;
    const subject = '【東京都働きやすい職場環境づくり推進奨励金】事前エントリー受付完了';
    
    const body = `
${data.companyName} 
${data.contactLastName} ${data.contactFirstName} 様

この度は、東京都働きやすい職場環境づくり推進奨励金の事前エントリーにお申し込みいただき、
誠にありがとうございます。

以下の内容で事前エントリーを受け付けました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ エントリー内容
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

法人種別: ${data.entityType}
会社名: ${data.companyName}
代表者名: ${data.representativeLastName} ${data.representativeFirstName}
労働者数: ${data.employeeCount}名
希望申請方法: ${data.applicationMethod}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

抽選結果については、後日改めてご連絡いたします。

なお、このメールは自動送信されています。
このメールに返信いただいても、お答えすることができませんので、
あらかじめご了承ください。

ご不明な点がございましたら、以下までお問い合わせください。

【お問い合わせ先】
東京都産業労働局雇用就業部
電話: 03-XXXX-XXXX
受付時間: 平日 9:00-17:00
`;
    
    try {
        MailApp.sendEmail({
            to: recipient,
            subject: subject,
            body: body,
            noReply: true
        });
    } catch (error) {
        console.error('メール送信エラー:', error);
    }
}

/**
 * スプレッドシートから特定の条件でデータを取得する関数
 * @param {string} email - 検索するメールアドレス
 * @return {Array} マッチしたデータの配列
 */
function getEntriesByEmail(email) {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const emailColumnIndex = headers.indexOf('担当者メールアドレス');
    
    const results = [];
    for (let i = 1; i < data.length; i++) {
        if (data[i][emailColumnIndex] === email) {
            const entry = {};
            headers.forEach((header, index) => {
                entry[header] = data[i][index];
            });
            results.push(entry);
        }
    }
    
    return results;
}

/**
 * すべてのエントリーを取得する関数
 * @return {Array} すべてのエントリーデータ
 */
function getAllEntries() {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const results = [];
    for (let i = 1; i < data.length; i++) {
        const entry = {};
        headers.forEach((header, index) => {
            entry[header] = data[i][index];
        });
        results.push(entry);
    }
    
    return results;
}

/**
 * 重複チェック関数
 * @param {string} email - チェックするメールアドレス
 * @return {boolean} 重複がある場合はtrue
 */
function checkDuplicateEmail(email) {
    const entries = getEntriesByEmail(email);
    return entries.length > 0;
}