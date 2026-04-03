import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import {
  createSign,
  createVerify,
  generateKeyPairSync,
  Sign,
  Verify,
} from 'crypto';
import { EcdsaKeyPair, EcdsaSignature, TicketQRData } from '../types';

/**
 * 提供 ECDSA 密钥生成、签名、验签与票务二维码数据处理能力。
 */
@Injectable()
export class EcdsaService {
  private readonly logger = new Logger(EcdsaService.name);

  /**
   * 生成一组新的 ECDSA 公私钥。
   *
   * @returns PEM 格式编码的公钥与私钥
   * @throws InternalServerErrorException 当密钥生成失败时抛出
   */
  generateKeyPair(): EcdsaKeyPair {
    try {
      const { publicKey, privateKey } = generateKeyPairSync('ec', {
        namedCurve: 'secp256k1',
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      });

      // 公钥可随票据下发参与验签，私钥仅保留在后端用于签名。
      return {
        publicKey,
        privateKey,
      };
    } catch (error) {
      this.logger.error(`ECDSA 密钥对生成失败 [${error instanceof Error ? error.constructor.name : typeof error}]: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('密钥生成失败，请稍后重试');
    }
  }

  /**
   * 使用私钥对原始字符串进行签名。
   *
   * @param data - 待签名的原始数据
   * @param privateKey - PEM 格式的私钥
   * @returns 包含原始数据与十六进制签名结果的对象
   */
  sign(data: string, privateKey: string): EcdsaSignature {
    try {
      const sign: Sign = createSign('SHA256');
      sign.update(data);
      sign.end();

      // 所有票据签名统一输出为十六进制字符串，便于落库和写入二维码。
      const signature: string = sign.sign(privateKey, 'hex');

      return {
        signature,
        data,
      };
    } catch (error) {
      this.logger.error(`ECDSA 签名失败，请检查私钥格式是否正确 [${error instanceof Error ? error.constructor.name : typeof error}]: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('票据签名失败，请检查密钥配置');
    }
  }

  /**
   * 校验签名是否与原始数据及公钥匹配。
   *
   * @param data - 原始数据
   * @param signature - 十六进制编码的签名结果
   * @param publicKey - PEM 格式的公钥
   * @returns 验签通过时返回 `true`
   */
  verify(data: string, signature: string, publicKey: string): boolean {
    try {
      const verify: Verify = createVerify('SHA256');
      verify.update(data);
      verify.end();

      // 只要原文、签名或公钥任一被篡改，验签结果都会失败。
      return verify.verify(publicKey, signature, 'hex');
    } catch {
      return false;
    }
  }

  /**
   * 组装票据签名时使用的稳定字符串。
   *
   * @param ticketId - 票据 ID
   * @param concertId - 演唱会 ID
   * @param userId - 用户 ID
   * @param timestamp - 生成时间戳
   * @returns 以冒号分隔的签名原文
   */
  generateTicketSignatureData(
    ticketId: string,
    concertId: string,
    userId: string,
    timestamp: number,
  ): string {
    // 将票据、场次、用户和时间戳绑定到同一份原文中，避免二维码被跨场次复用。
    return `${ticketId}:${concertId}:${userId}:${timestamp}`;
  }

  /**
   * 将票据关键信息序列化为二维码内容。
   *
   * @param ticketId - 票据 ID
   * @param signature - 票据签名
   * @param timestamp - 二维码生成时间戳
   * @returns 可直接写入二维码的 JSON 字符串
   */
  generateQRCodeData(
    ticketId: string,
    signature: string,
    timestamp: number,
  ): string {
    // 二维码中只保留验票必需字段，其他票务信息仍以数据库为准。
    return JSON.stringify({
      ticketId,
      signature,
      timestamp,
    });
  }

  /**
   * 解析二维码中的票据数据。
   *
   * @param qrData - 扫描得到的二维码原始字符串
   * @returns 结构合法时返回票据二维码数据，否则返回 `null`
   */
  parseQRCodeData(qrData: string): TicketQRData | null {
    try {
      const parsed: TicketQRData = JSON.parse(qrData) as TicketQRData;

      // 仅返回关键字段齐全的数据，避免下游在缺失字段时继续验签。
      if (parsed.ticketId && parsed.signature && parsed.timestamp) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }
}
