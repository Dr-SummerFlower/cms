import { Injectable } from '@nestjs/common';
import {
  createSign,
  createVerify,
  generateKeyPairSync,
  Sign,
  Verify,
} from 'crypto';
import { EcdsaKeyPair, EcdsaSignature, TicketQRData } from '../types';

/**
 * ECDSA服务类
 * @description 提供ECDSA密钥生成、签名和验证功能
 */
@Injectable()
export class EcdsaService {
  /**
   * 生成ECDSA密钥对
   * @description 使用secp256k1曲线生成ECDSA密钥对
   * @returns 返回包含公钥和私钥的对象
   */
  generateKeyPair(): EcdsaKeyPair {
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

    return {
      publicKey,
      privateKey,
    };
  }

  /**
   * 使用私钥对数据进行签名
   * @description 使用ECDSA算法对数据进行数字签名
   * @param data 要签名的数据
   * @param privateKey 私钥（PEM格式）
   * @returns 返回签名结果
   */
  sign(data: string, privateKey: string): EcdsaSignature {
    const sign: Sign = createSign('SHA256');
    sign.update(data);
    sign.end();

    const signature: string = sign.sign(privateKey, 'hex');

    return {
      signature,
      data,
    };
  }

  /**
   * 使用公钥验证签名
   * @description 使用ECDSA算法验证数字签名的有效性
   * @param data 原始数据
   * @param signature 签名
   * @param publicKey 公钥（PEM格式）
   * @returns 返回验证结果
   */
  verify(data: string, signature: string, publicKey: string): boolean {
    try {
      const verify: Verify = createVerify('SHA256');
      verify.update(data);
      verify.end();

      return verify.verify(publicKey, signature, 'hex');
    } catch {
      return false;
    }
  }

  /**
   * 生成票据签名数据
   * @description 为票据生成包含关键信息的签名数据
   * @param ticketId 票据ID
   * @param concertId 演唱会ID
   * @param userId 用户ID
   * @param timestamp 时间戳
   * @returns 返回用于签名的数据字符串
   */
  generateTicketSignatureData(
    ticketId: string,
    concertId: string,
    userId: string,
    timestamp: number,
  ): string {
    return `${ticketId}:${concertId}:${userId}:${timestamp}`;
  }

  /**
   * 生成二维码数据
   * @description 为票据生成包含签名的二维码数据
   * @param ticketId 票据ID
   * @param signature 签名
   * @param timestamp 时间戳
   * @returns 返回二维码数据字符串
   */
  generateQRCodeData(
    ticketId: string,
    signature: string,
    timestamp: number,
  ): string {
    return JSON.stringify({
      ticketId,
      signature,
      timestamp,
    });
  }

  /**
   * 解析二维码数据
   * @description 解析二维码中的票据信息
   * @param qrData 二维码数据
   * @returns 返回解析后的票据信息
   */
  parseQRCodeData(qrData: string): TicketQRData | null {
    try {
      const parsed: TicketQRData = JSON.parse(qrData) as TicketQRData;
      if (parsed.ticketId && parsed.signature && parsed.timestamp) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }
}
