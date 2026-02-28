import { Test, TestingModule } from '@nestjs/testing';
import { EcdsaService } from '../../../src/ecdsa/ecdsa.service';

describe('EcdsaService', () => {
  let service: EcdsaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EcdsaService],
    }).compile();

    service = module.get<EcdsaService>(EcdsaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('服务实例应被正确定义', () => {
    expect(service).toBeDefined();
  });

  describe('generateKeyPair', () => {
    it('应生成有效的 ECDSA 密钥对', () => {
      // Act
      const keyPair = service.generateKeyPair();

      // Assert
      expect(keyPair).toHaveProperty('publicKey');
      expect(keyPair).toHaveProperty('privateKey');
      expect(typeof keyPair.publicKey).toBe('string');
      expect(typeof keyPair.privateKey).toBe('string');
      expect(keyPair.publicKey).toContain('-----BEGIN PUBLIC KEY-----');
      expect(keyPair.publicKey).toContain('-----END PUBLIC KEY-----');
      expect(keyPair.privateKey).toContain('-----BEGIN PRIVATE KEY-----');
      expect(keyPair.privateKey).toContain('-----END PRIVATE KEY-----');
    });
  });

  describe('sign', () => {
    it('应对给定数据使用私钥进行签名', () => {
      // Arrange
      const data = 'test data';
      const keyPair = service.generateKeyPair();

      // Act
      const signature = service.sign(data, keyPair.privateKey);

      // Assert
      expect(signature).toHaveProperty('signature');
      expect(signature).toHaveProperty('data');
      expect(signature.data).toBe(data);
      expect(typeof signature.signature).toBe('string');
      expect(typeof signature.signature).toBe('string');
      expect(signature.signature).toMatch(/^[0-9a-f]+$/); // 验证是十六进制字符串
    });

    it('应为不同数据生成不同的签名', () => {
      // Arrange
      const keyPair = service.generateKeyPair();

      // Act
      const signature1 = service.sign('data1', keyPair.privateKey);
      const signature2 = service.sign('data2', keyPair.privateKey);

      // Assert
      expect(signature1.signature).not.toBe(signature2.signature);
      expect(signature1.data).toBe('data1');
      expect(signature2.data).toBe('data2');
    });
  });

  describe('verify', () => {
    it('使用正确的公钥和签名应验证成功', () => {
      // Arrange
      const data = 'test data';
      const keyPair = service.generateKeyPair();
      const signature = service.sign(data, keyPair.privateKey);

      // Act
      const isValid = service.verify(
        data,
        signature.signature,
        keyPair.publicKey,
      );

      // Assert
      expect(isValid).toBe(true);
    });

    it('使用错误的数据应验证失败', () => {
      // Arrange
      const data = 'test data';
      const wrongData = 'wrong data';
      const keyPair = service.generateKeyPair();
      const signature = service.sign(data, keyPair.privateKey);

      // Act
      const isValid = service.verify(
        wrongData,
        signature.signature,
        keyPair.publicKey,
      );

      // Assert
      expect(isValid).toBe(false);
    });

    it('使用错误的公钥应验证失败', () => {
      // Arrange
      const data = 'test data';
      const keyPair1 = service.generateKeyPair();
      const keyPair2 = service.generateKeyPair();
      const signature = service.sign(data, keyPair1.privateKey);

      // Act
      const isValid = service.verify(
        data,
        signature.signature,
        keyPair2.publicKey,
      );

      // Assert
      expect(isValid).toBe(false);
    });

    it('使用错误的签名应验证失败', () => {
      // Arrange
      const data = 'test data';
      const keyPair = service.generateKeyPair();
      service.sign(data, keyPair.privateKey); // 创建第一个签名但不使用
      const anotherData = 'another data';
      const anotherSignature = service.sign(
        anotherData,
        keyPair.privateKey,
      ).signature;

      // Act
      const isValid = service.verify(data, anotherSignature, keyPair.publicKey);

      // Assert
      expect(isValid).toBe(false);
    });

    it('使用无效的公钥格式应验证失败', () => {
      // Arrange
      const data = 'test data';
      const keyPair = service.generateKeyPair();
      const signature = service.sign(data, keyPair.privateKey);
      const invalidPublicKey = 'invalid public key';

      // Act
      const isValid = service.verify(
        data,
        signature.signature,
        invalidPublicKey,
      );

      // Assert
      expect(isValid).toBe(false);
    });

    it('使用无效的签名格式应验证失败', () => {
      // Arrange
      const data = 'test data';
      const keyPair = service.generateKeyPair();
      const invalidSignature = 'invalid signature';

      // Act
      const isValid = service.verify(data, invalidSignature, keyPair.publicKey);

      // Assert
      expect(isValid).toBe(false);
    });
  });

  describe('generateTicketSignatureData', () => {
    it('应正确生成门票签名数据字符串', () => {
      // Arrange
      const ticketId = 'ticket123';
      const concertId = 'concert456';
      const userId = 'user789';
      const timestamp = 1234567890;

      // Act
      const result = service.generateTicketSignatureData(
        ticketId,
        concertId,
        userId,
        timestamp,
      );

      // Assert
      expect(result).toBe(`${ticketId}:${concertId}:${userId}:${timestamp}`);
    });

    it('应正确处理各种参数类型', () => {
      // Arrange
      const ticketId = 't1';
      const concertId = 'c2';
      const userId = 'u3';
      const timestamp = 9999999999;

      // Act
      const result = service.generateTicketSignatureData(
        ticketId,
        concertId,
        userId,
        timestamp,
      );

      // Assert
      expect(result).toBe(`${ticketId}:${concertId}:${userId}:${timestamp}`);
    });
  });

  describe('generateQRCodeData', () => {
    it('应正确生成二维码数据JSON字符串', () => {
      // Arrange
      const ticketId = 'ticket123';
      const signature = 'some_signature_hex_string';
      const timestamp = 1234567890;

      // Act
      const result = service.generateQRCodeData(ticketId, signature, timestamp);

      // Assert
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({
        ticketId,
        signature,
        timestamp,
      });
    });

    it('应生成有效的JSON字符串', () => {
      // Arrange
      const ticketId = 'abc';
      const signature = 'def';
      const timestamp = 1;

      // Act & Assert
      const result = service.generateQRCodeData(ticketId, signature, timestamp);
      expect(() => JSON.parse(result)).not.toThrow();
    });
  });

  describe('parseQRCodeData', () => {
    it('当数据格式正确时，应正确解析二维码数据', () => {
      // Arrange
      const qrData = JSON.stringify({
        ticketId: 'ticket123',
        signature: 'signature123',
        timestamp: 1234567890,
      });

      // Act
      const result = service.parseQRCodeData(qrData);

      // Assert
      expect(result).toEqual({
        ticketId: 'ticket123',
        signature: 'signature123',
        timestamp: 1234567890,
      });
    });

    it('当缺少必填字段时，应返回 null', () => {
      // Arrange
      const qrDataWithMissingField = JSON.stringify({
        ticketId: 'ticket123',
        // 缺少 signature 字段
        timestamp: 1234567890,
      });

      // Act
      const result = service.parseQRCodeData(qrDataWithMissingField);

      // Assert
      expect(result).toBeNull();
    });

    it('当是无效 JSON 时，应返回 null', () => {
      // Arrange
      const invalidJson = '{ invalid json }';

      // Act
      const result = service.parseQRCodeData(invalidJson);

      // Assert
      expect(result).toBeNull();
    });

    it('当是空字符串时，应返回 null', () => {
      // Arrange
      const emptyString = '';

      // Act
      const result = service.parseQRCodeData(emptyString);

      // Assert
      expect(result).toBeNull();
    });

    it('当数据格式不正确时，应返回 null', () => {
      // Arrange
      const qrDataWithWrongType = JSON.stringify({
        ticketId: null, // 应该是字符串
        signature: undefined, // 应该是字符串
        timestamp: 'not_a_number', // 应该是数字
      });

      // Act
      const result = service.parseQRCodeData(qrDataWithWrongType);

      // Assert
      expect(result).toBeNull();
    });
  });
});
