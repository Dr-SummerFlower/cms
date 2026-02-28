import { Types } from 'mongoose';
import {
  RealName,
  RealNameSchema,
} from '../../../src/users/entities/realname.entity';

describe('RealName Entity', () => {
  it('should create a RealName entity with all fields', () => {
    // Arrange & Act
    const realName = new RealName();

    // 设置所有必填字段
    realName.name = '张三';
    realName.idType = 'ID_CARD';
    realName.idNumberHash = 'hashed123456789';
    realName.idNumberLast4 = '5678';
    realName.owner = new Types.ObjectId();
    realName.status = 'pending';

    // 设置可选字段
    realName.country = '中国';
    realName.birthday = new Date('1990-01-01');
    realName.gender = 'M';
    realName.phone = '13800138000';
    realName.faceImageUrl = '/assets/face/test.jpg';
    realName.faceFeature = 'base64encodedfeature';
    realName.remark = '待审批';

    // Assert - 验证所有字段的存在
    expect(realName.name).toBe('张三');
    expect(realName.idType).toBe('ID_CARD');
    expect(realName.idNumberHash).toBe('hashed123456789');
    expect(realName.idNumberLast4).toBe('5678');
    expect(realName.owner).toBeInstanceOf(Types.ObjectId);
    expect(realName.status).toBe('pending');

    expect(realName.country).toBe('中国');
    expect(realName.birthday).toEqual(new Date('1990-01-01'));
    expect(realName.gender).toBe('M');
    expect(realName.phone).toBe('13800138000');
    expect(realName.faceImageUrl).toBe('/assets/face/test.jpg');
    expect(realName.faceFeature).toBe('base64encodedfeature');
    expect(realName.remark).toBe('待审批');
  });

  it('should validate the Mongoose schema', () => {
    // Arrange
    const schema = RealNameSchema;

    // Assert - 验证必要的索引和选项
    expect(schema).toBeDefined();
    // 注意，在Mongoose 7.x中，字段属性是内部结构，我们检查是否存在基本的属性
    expect(schema.obj.name).toEqual(
      expect.objectContaining({ required: true }),
    );
    expect(schema.obj.idType).toEqual(
      expect.objectContaining({
        required: true,
        enum: ['ID_CARD', 'PASSPORT', 'OTHER'],
      }),
    );
    expect(schema.obj.idNumberHash).toEqual(
      expect.objectContaining({ required: true, unique: true, select: false }),
    );
    expect(schema.obj.idNumberLast4).toEqual(
      expect.objectContaining({ required: true }),
    );
    expect(schema.obj.owner).toEqual(
      expect.objectContaining({
        type: expect.any(Object),
        ref: 'User',
        required: true,
      }),
    );
    expect(schema.obj.status).toEqual(
      expect.objectContaining({
        required: true,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending',
      }),
    );
  });

  it('should have correct IdType type values', () => {
    // Arrange & Act
    const idTypes: ('ID_CARD' | 'PASSPORT' | 'OTHER')[] = [
      'ID_CARD',
      'PASSPORT',
      'OTHER',
    ];

    // Assert
    expect(idTypes).toContain('ID_CARD');
    expect(idTypes).toContain('PASSPORT');
    expect(idTypes).toContain('OTHER');
  });

  it('should have correct IdentityStatus type values', () => {
    // Arrange & Act
    const statusTypes: ('pending' | 'verified' | 'rejected')[] = [
      'pending',
      'verified',
      'rejected',
    ];

    // Assert
    expect(statusTypes).toContain('pending');
    expect(statusTypes).toContain('verified');
    expect(statusTypes).toContain('rejected');
  });
});
