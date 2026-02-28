import { model, models } from 'mongoose';
import {
  Concert,
  ConcertSchema,
} from '../../../src/concerts/entities/concert.entity';

describe('ConcertEntity', () => {
  afterEach(() => {
    delete models.ConcertEntityTest;
  });

  it('当创建实体时，应应用默认值', () => {
    const ConcertModel = model<Concert>('ConcertEntityTest', ConcertSchema);

    const doc = new ConcertModel({
      name: '演唱会',
      date: new Date('2025-09-01T19:30:00.000Z'),
      venue: '北京国家体育场（鸟巢）',
      adultPrice: 680,
      childPrice: 380,
      totalTickets: 5000,
      publicKey: 'publicKey',
      privateKey: 'privateKey',
    });

    expect(doc.soldTickets).toBe(0);
    expect(doc.maxAdultTicketsPerUser).toBe(2);
    expect(doc.maxChildTicketsPerUser).toBe(1);
    expect(doc.status).toBe('upcoming');
  });

  it('当设置私钥时，应进行加密与解密', () => {
    const privateKeyPath = ConcertSchema.path('privateKey');
    const setter = privateKeyPath.options.set;
    const getter = privateKeyPath.options.get;
    const originalKey = process.env.ENCRYPTION_KEY;

    process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';
    try {
      const encrypted = setter?.call({}, 'secret-key');
      const decrypted = getter?.call({}, encrypted);

      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe('secret-key');
      expect(decrypted).toBe('secret-key');
    } finally {
      process.env.ENCRYPTION_KEY = originalKey;
    }
  });

  it('当私钥格式无效时，应返回原值', () => {
    const privateKeyPath = ConcertSchema.path('privateKey');
    const getter = privateKeyPath.options.get;

    const result = getter?.call({}, 'invalid-value');

    expect(result).toBe('invalid-value');
  });
});
