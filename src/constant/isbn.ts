/**
 * ISBN-10の長さ
 */
export const ISBN_10_LENGTH = 10;

/**
 * ISBN-13の長さ
 */
export const ISBN_13_LENGTH = 13;

/**
 * ISBN-10のベース（チェックディジット計算用）
 */
export const ISBN_10_BASE = 11;

/**
 * ISBN-13のベース（チェックディジット計算用）
 */
export const ISBN_13_BASE = 10;

/**
 * ISBN-13のデフォルトプレフィックス
 */
export const DEFAULT_ISBN_13_PREFIX = '978';

/**
 * 有効なISBN長さの配列
 */
export const VALID_ISBN_LENGTHS = [ISBN_10_LENGTH, ISBN_13_LENGTH] as const;

/**
 * ISBN-10の正規表現パターン
 */
export const ISBN_10_PATTERN = /^[0-9]{9}[0-9X]$/;

/**
 * ISBN-13の正規表現パターン
 */
export const ISBN_13_PATTERN = /^[0-9]{13}$/;
