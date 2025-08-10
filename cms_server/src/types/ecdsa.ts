/**
 * @interface
 * @property {string} publicKey 公钥
 * @property {string} privateKey 私钥
 */
export interface EcdsaKeyPair {
  publicKey: string;
  privateKey: string;
}

/**
 * @interface
 * @property {string} signature 签名
 * @property {string} data 待签名数据
 */
export interface EcdsaSignature {
  signature: string;
  data: string;
}

/**
 * @interface
 * @property {string} ticketId 票据ID
 * @property {string} signature 签名
 * @property {number} timestamp 时间戳
 */
export interface TicketQRData {
  ticketId: string;
  signature: string;
  timestamp: number;
}

/**
 * @interface
 * @property {string} ticketId 票据ID
 * @property {string} concertId 演唱会ID
 * @property {string} userId 用户ID
 * @property {number} timestamp 时间戳
 */
export interface TicketSignatureData {
  ticketId: string;
  concertId: string;
  userId: string;
  timestamp: number;
}
