/**
 * ECDSA 公私钥对。
 *
 * @category Model
 */
export interface EcdsaKeyPair {
  /** 公钥。 */
  publicKey: string;
  /** 私钥。 */
  privateKey: string;
}

/**
 * ECDSA 签名结果。
 *
 * @category Model
 */
export interface EcdsaSignature {
  /** 十六进制签名内容。 */
  signature: string;
  /** 被签名的原始数据。 */
  data: string;
}

/**
 * 二维码中承载的票据数据。
 *
 * @category Model
 */
export interface TicketQRData {
  /** 临时票据 ID。 */
  ticketId: string;
  /** 对应的签名。 */
  signature: string;
  /** 二维码生成时间戳。 */
  timestamp: number;
}
