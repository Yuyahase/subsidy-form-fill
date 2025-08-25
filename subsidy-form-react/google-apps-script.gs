/**
 * Google Apps Script for handling form submissions
 * Deploy this as a Web App to handle API requests
 */

// Spreadsheet configuration
const SPREADSHEET_ID = '1yHGIEErmVXAOWjhhx_l4lnzQ1PK_6Cj3Mug2VzNr9Yc';
const SHEET_NAME = 'Form Responses';

/**
 * Handle POST requests
 */
function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Handle both old format (with action) and new format (direct form data)
    if (data.action) {
      // Old format with explicit action
      switch (data.action) {
        case 'appendRow':
          return handleAppendRow(data);
        case 'checkEmail':
          return handleCheckEmail(data.email);
        default:
          return createResponse({ error: 'Invalid action' }, 400);
      }
    } else if (data.entityType) {
      // New format: direct form data from frontend
      return handleFormSubmission(data);
    } else {
      return createResponse({ error: 'Invalid request format' }, 400);
    }
  } catch (error) {
    console.error('Error in doPost:', error);
    return createResponse({ error: error.toString() }, 500);
  }
}

/**
 * Handle GET requests
 */
function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.Content.TextOutput {
  const action = e.parameter.action;
  
  switch (action) {
    case 'getResponses':
      return handleGetResponses();
    case 'checkEmail':
      return handleCheckEmail(e.parameter.email);
    default:
      return createResponse({ status: 'OK', message: 'Service is running' }, 200);
  }
}

/**
 * Handle form submission from frontend (new format)
 */
function handleFormSubmission(formData: any): GoogleAppsScript.Content.TextOutput {
  try {
    // Transform form data to array format for spreadsheet
    const rowData = [
      new Date().toISOString(), // timestamp
      formData.entityType, // 法人種別
      formData.company.name, // 会社名
      formData.company.nameKana, // 会社名フリガナ
      formData.representative.lastName, // 代表者氏
      formData.representative.firstName, // 代表者名
      formData.representative.lastNameKana, // 代表者氏フリガナ
      formData.representative.firstNameKana, // 代表者名フリガナ
      formData.primaryAddress.postalCode, // 所在地1郵便番号
      formData.primaryAddress.prefecture, // 所在地1都道府県
      formData.primaryAddress.city, // 所在地1市区町村
      formData.primaryAddress.street, // 所在地1番地以降
      formData.secondaryAddress?.postalCode || '', // 所在地2郵便番号
      formData.secondaryAddress?.prefecture || '', // 所在地2都道府県
      formData.secondaryAddress?.city || '', // 所在地2市区町村
      formData.secondaryAddress?.street || '', // 所在地2番地以降
      formData.employeeCount, // 労働者数
      formData.applicationMethod, // 申請方法
      formData.contact.lastName, // 担当者氏
      formData.contact.firstName, // 担当者名
      formData.contact.lastNameKana, // 担当者氏フリガナ
      formData.contact.firstNameKana, // 担当者名フリガナ
      formData.contact.phone, // 担当者電話番号
      formData.contact.email, // 担当者メールアドレス
      formData.agent || '', // 代理人氏名
      formData.applicationReason // 申請理由
    ];
    
    // Use existing handleAppendRow logic
    return handleAppendRow({ data: rowData, sendEmail: true });
    
  } catch (error) {
    console.error('Error handling form submission:', error);
    return createResponse({ error: error.toString() }, 500);
  }
}

/**
 * Append a new row to the spreadsheet
 */
function handleAppendRow(data: any): GoogleAppsScript.Content.TextOutput {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      // Create sheet if it doesn't exist
      const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
      spreadsheet.insertSheet(SHEET_NAME);
    }
    
    // Create headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      const headers = [
        '送信日時', '法人種別', '会社名', '会社名フリガナ',
        '代表者氏', '代表者名', '代表者氏フリガナ', '代表者名フリガナ',
        '所在地1郵便番号', '所在地1都道府県', '所在地1市区町村', '所在地1番地以降',
        '所在地2郵便番号', '所在地2都道府県', '所在地2市区町村', '所在地2番地以降',
        '労働者数', '申請方法',
        '担当者氏', '担当者名', '担当者氏フリガナ', '担当者名フリガナ',
        '担当者電話番号', '担当者メールアドレス',
        '代理人氏名', '申請理由'
      ];
      sheet.appendRow(headers);
      
      // Style headers
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#0052cc');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
    }
    
    // Append data row
    sheet.appendRow(data.data);
    
    // Generate response ID
    const responseId = Utilities.getUuid();
    
    // Send confirmation email if configured
    if (data.sendEmail && data.data[23]) { // Email is at index 23
      sendConfirmationEmail(data.data, responseId);
    }
    
    return createResponse({ 
      success: true, 
      responseId: responseId,
      rowNumber: sheet.getLastRow()
    }, 200);
    
  } catch (error) {
    console.error('Error appending row:', error);
    return createResponse({ error: error.toString() }, 500);
  }
}

/**
 * Get all form responses
 */
function handleGetResponses(): GoogleAppsScript.Content.TextOutput {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return createResponse({ responses: [] }, 200);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const responses = [];
    
    for (let i = 1; i < data.length; i++) {
      const response: Record<string, any> = {};
      headers.forEach((header: string, index: number) => {
        response[header] = data[i][index];
      });
      responses.push(response);
    }
    
    return createResponse({ responses }, 200);
    
  } catch (error) {
    console.error('Error getting responses:', error);
    return createResponse({ error: error.toString() }, 500);
  }
}

/**
 * Check if email already exists
 */
function handleCheckEmail(email: string): GoogleAppsScript.Content.TextOutput {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return createResponse({ exists: false }, 200);
    }
    
    const data = sheet.getDataRange().getValues();
    const emailColumnIndex = 23; // Email column index
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][emailColumnIndex] === email) {
        return createResponse({ exists: true }, 200);
      }
    }
    
    return createResponse({ exists: false }, 200);
    
  } catch (error) {
    console.error('Error checking email:', error);
    return createResponse({ error: error.toString() }, 500);
  }
}

/**
 * Send confirmation email
 */
function sendConfirmationEmail(data: any[], responseId: string): void {
  const email = data[23];
  const companyName = data[2];
  const contactLastName = data[18];
  const contactFirstName = data[19];
  
  const subject = '【東京都働きやすい職場環境づくり推進奨励金】事前エントリー受付完了';
  
  const body = `
${companyName} 
${contactLastName} ${contactFirstName} 様

この度は、東京都働きやすい職場環境づくり推進奨励金の事前エントリーにお申し込みいただき、
誠にありがとうございます。

受付番号: ${responseId}

以下の内容で事前エントリーを受け付けました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ エントリー内容
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

法人種別: ${data[1]}
会社名: ${data[2]}
代表者名: ${data[4]} ${data[5]}
労働者数: ${data[16]}名
希望申請方法: ${data[17]}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

抽選結果については、後日改めてご連絡いたします。

このメールは自動送信されています。
返信いただいても、お答えすることができませんので、あらかじめご了承ください。
`;
  
  try {
    MailApp.sendEmail(email, subject, body);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

/**
 * Create JSON response with CORS headers
 */
function createResponse(data: any, statusCode: number): GoogleAppsScript.Content.TextOutput {
  const output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
    
  // Add CORS headers to allow cross-origin requests
  output.setHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  });
  
  return output;
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
function doOptions(): GoogleAppsScript.Content.TextOutput {
  return createResponse({ status: 'OK' }, 200);
}