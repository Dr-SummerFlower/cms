import { Injectable } from '@nestjs/common';
import {
  createSign,
  createVerify,
  generateKeyPairSync,
  Sign,
  Verify,
} from 'crypto';
import { EcdsaKeyPair, EcdsaSignature, TicketQRData } from '../types';

@Injectable()
export class EcdsaService {
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

  generateTicketSignatureData(
    ticketId: string,
    concertId: string,
    userId: string,
    timestamp: number,
  ): string {
    return `${ticketId}:${concertId}:${userId}:${timestamp}`;
  }

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
