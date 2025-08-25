/**
 * 郵便番号から住所を取得するサービス
 * zipcloud API を使用
 */

import axios from 'axios';

export interface AddressData {
  prefecture: string;
  city: string;
  town: string;
}

/**
 * 郵便番号から住所を検索
 * @param postalCode 郵便番号（ハイフンあり・なし両対応）
 * @returns 住所データ
 */
export async function searchAddressByPostalCode(postalCode: string): Promise<AddressData | null> {
  try {
    // ハイフンを除去して数字のみにする
    const cleanedCode = postalCode.replace(/[^0-9]/g, '');
    
    // 7桁でない場合はnullを返す
    if (cleanedCode.length !== 7) {
      return null;
    }
    
    // zipcloud APIを使用（無料・登録不要）
    const response = await axios.get(`https://zipcloud.ibsnet.co.jp/api/search`, {
      params: {
        zipcode: cleanedCode
      }
    });
    
    if (response.data.status === 200 && response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        prefecture: result.address1,
        city: result.address2,
        town: result.address3
      };
    }
    
    return null;
  } catch (error) {
    console.error('郵便番号検索エラー:', error);
    return null;
  }
}

/**
 * 郵便番号をフォーマット（ハイフン付き）
 * @param value 入力値
 * @returns フォーマットされた郵便番号
 */
export function formatPostalCode(value: string): string {
  const numbers = value.replace(/[^0-9]/g, '');
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}`;
  }
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}`;
}