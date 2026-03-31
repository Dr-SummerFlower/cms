/**
 * 将图片地址转换为可直接用于 `<img src>` 的字符串。
 *
 * @param url - 原始图片地址
 * @returns 非空时返回原字符串，否则返回 `undefined`
 */
export function getImageUrl(
  url: string | undefined | null,
): string | undefined {
  return url ?? undefined;
}
