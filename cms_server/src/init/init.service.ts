import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Concert } from '../concerts/entities/concert.entity';
import { EcdsaService } from '../ecdsa/ecdsa.service';
import { IS_TEST } from '../global/global.module';
import { StoragesService } from '../storages/storages.service';
import { User } from '../users/entities/user.entity';
import {
  DEFAULT_AVATAR_BASE64,
  TEST_CONCERT_DESCRIPTION,
  TEST_CONCERT_NAME,
  TEST_CONCERT_POSTER_BASE64,
  TEST_CONCERT_VENUE,
  TEST_EMAIL_DOMAIN,
  TEST_INSPECTOR_COUNT,
  TEST_REGULAR_USER_COUNT,
  TEST_USER_PASSWORD,
} from './init-data.constant';

/**
 * 负责应用启动阶段初始化默认数据的服务。
 */
@Injectable()
export class InitService implements OnModuleInit {
  private readonly logger: Logger = new Logger(InitService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Concert.name) private readonly concertModel: Model<Concert>,
    private readonly configService: ConfigService,
    private readonly storagesService: StoragesService,
    private readonly ecdsaService: EcdsaService,
  ) {}

  /**
   * 在模块初始化时执行启动检查和默认数据准备。
   *
   * @returns 初始化完成时不返回内容
   */
  async onModuleInit(): Promise<void> {
    await this.createDefaultAdmin();
    if (IS_TEST) {
      await this.seedTestData();
    }
  }

  /**
   * 在系统中不存在管理员时创建默认管理员账户。
   *
   * @returns 创建流程结束时不返回内容
   */
  private async createDefaultAdmin(): Promise<void> {
    try {
      const existingAdmin = (await this.userModel.findOne({
        role: 'ADMIN',
      })) as User;
      if (existingAdmin) return;

      const avatarBuffer = Buffer.from(DEFAULT_AVATAR_BASE64, 'base64');

      const username = this.configService.get<string>('ADMIN_USER', 'admin');
      const avatar = await this.storagesService.uploadBuffer(
        avatarBuffer,
        'default.png',
        'image/png',
        'avatars',
      );
      const email = this.configService.get<string>(
        'ADMIN_EMAIL',
        'admin@example.com',
      );
      const password = this.configService.get<string>('ADMIN_PWD', 'admin123');

      const defaultAdmin = {
        username,
        avatar,
        email,
        password,
        role: 'ADMIN',
      };

      await this.userModel.create(defaultAdmin);
      this.logger.log('默认管理员账户创建成功');
      this.logger.log(`用户名: ${username}`);
      this.logger.log(`邮箱: ${email}`);
      this.logger.log(`密码: ${password}`);
      this.logger.log('请及时修改默认密码！');
    } catch (error) {
      this.logger.error('创建默认管理员账户失败:', error);
    }
  }

  /**
   * 批量创建测试用户与示例演唱会（仅由 {@link onModuleInit} 在 `RUNNING_ENV=test` 时调用）。
   *
   * @returns 种子数据流程结束时不返回内容
   */
  private async seedTestData(): Promise<void> {
    try {
      const markerEmail = this.formatTestUserEmail(1);
      const existingMarker = (await this.userModel.findOne({
        email: markerEmail,
      })) as User;

      const avatarUrl =
        existingMarker?.avatar ||
        (await this.uploadBase64Image(
          DEFAULT_AVATAR_BASE64,
          'test-avatar.png',
          'avatars',
        ));
      if (!avatarUrl) {
        this.logger.warn('测试头像上传失败，跳过测试数据初始化');
        return;
      }

      await this.createTestUsers(avatarUrl);
      await this.createTestConcert();

      this.logger.log(
        `测试数据初始化完成：普通用户 ${TEST_REGULAR_USER_COUNT} 名，验票员 ${TEST_INSPECTOR_COUNT} 名，演唱会 1 场`,
      );
      this.logger.log(`测试账号统一密码: ${TEST_USER_PASSWORD}`);
      this.logger.log(
        `普通用户示例: ${this.formatTestUsername(1)} / ${markerEmail}`,
      );
      this.logger.log(
        `验票员示例: ${this.formatTestInspectorUsername(1)} / ${this.formatTestInspectorEmail(1)}`,
      );
    } catch (error) {
      this.logger.error('测试环境种子数据初始化失败:', error);
    }
  }

  /**
   * 批量创建普通用户与验票员测试账号
   *
   * @param avatarUrl - 共用的头像存储路径
   * @returns 创建流程结束时不返回内容
   */
  private async createTestUsers(avatarUrl: string): Promise<void> {
    const users: Array<{
      username: string;
      email: string;
      password: string;
      avatar: string;
      role: string;
    }> = [];

    for (let i = 1; i <= TEST_REGULAR_USER_COUNT; i++) {
      users.push({
        username: this.formatTestUsername(i),
        email: this.formatTestUserEmail(i),
        password: TEST_USER_PASSWORD,
        avatar: avatarUrl,
        role: 'USER',
      });
    }

    for (let i = 1; i <= TEST_INSPECTOR_COUNT; i++) {
      users.push({
        username: this.formatTestInspectorUsername(i),
        email: this.formatTestInspectorEmail(i),
        password: TEST_USER_PASSWORD,
        avatar: avatarUrl,
        role: 'INSPECTOR',
      });
    }

    const existingUsers = (await this.userModel
      .find({ email: { $in: users.map((u) => u.email) } })
      .select('email')
      .exec()) as Array<{ email: string }>;

    const existingEmails = new Set(
      existingUsers.map((u: { email: string }): string => u.email),
    );

    const toInsert = users.filter((u) => !existingEmails.has(u.email));

    if (toInsert.length > 0) {
      await this.userModel.insertMany(toInsert);
    }
    this.logger.log(
      `已创建测试用户 ${TEST_REGULAR_USER_COUNT} 名、验票员 ${TEST_INSPECTOR_COUNT} 名`,
    );
  }

  /**
   * 创建测试演唱会
   *
   * @returns 创建流程结束时不返回内容
   */
  private async createTestConcert(): Promise<void> {
    const existingConcert = (await this.concertModel.findOne({
      name: TEST_CONCERT_NAME,
    })) as Concert;
    if (existingConcert) {
      await this.concertModel.updateOne(
        { _id: existingConcert._id },
        {
          $set: {
            totalTickets: 100000,
            maxAdultTicketsPerUser: 5,
            maxChildTicketsPerUser: 1,
          },
        },
      );
      this.logger.log(`已更新测试演唱会配置: ${TEST_CONCERT_NAME}`);
      return;
    }

    const posterBase64 =
      TEST_CONCERT_POSTER_BASE64.trim() || DEFAULT_AVATAR_BASE64;
    const posterUrl = await this.uploadBase64Image(
      posterBase64,
      'test-concert-poster.png',
      'posters',
    );
    if (!posterUrl) {
      this.logger.warn('测试演唱会海报上传失败，跳过演唱会创建');
      return;
    }

    if (!TEST_CONCERT_POSTER_BASE64.trim()) {
      this.logger.log(
        '未配置 TEST_CONCERT_POSTER_BASE64，已使用默认占位图作为海报',
      );
    }

    const keyPair = this.ecdsaService.generateKeyPair();
    const concertDate = new Date();
    concertDate.setMonth(concertDate.getMonth() + 3);

    await this.concertModel.create({
      name: TEST_CONCERT_NAME,
      poster: posterUrl,
      date: concertDate,
      venue: TEST_CONCERT_VENUE,
      adultPrice: 100,
      childPrice: 50,
      totalTickets: 100000,
      maxAdultTicketsPerUser: 5,
      maxChildTicketsPerUser: 1,
      description: TEST_CONCERT_DESCRIPTION,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    });

    this.logger.log(`已创建测试演唱会: ${TEST_CONCERT_NAME}`);
  }

  /**
   * 将 base64 图片上传至对象存储。
   *
   * @param base64 - 纯 base64 编码（不含 data URL 前缀）
   * @param filename - 上传时使用的文件名
   * @param folder - 存储目录
   * @returns 上传成功后的对象路径；内容无效时返回 null
   */
  private async uploadBase64Image(
    base64: string,
    filename: string,
    folder: 'avatars' | 'posters',
  ): Promise<string | null> {
    const trimmed = base64.trim();
    if (!trimmed) return null;

    try {
      const buffer = Buffer.from(trimmed, 'base64');
      if (buffer.length === 0) return null;
      return await this.storagesService.uploadBuffer(
        buffer,
        filename,
        'image/png',
        folder,
      );
    } catch (error) {
      this.logger.error(`上传 base64 图片失败 (${filename}):`, error);
      return null;
    }
  }

  /**
   * 生成普通测试用户用户名
   *
   * @param index - 用户序号（从 1 开始）
   * @returns 用户名
   */
  private formatTestUsername(index: number): string {
    return `testuser${String(index).padStart(3, '0')}`;
  }

  /**
   * 生成普通测试用户邮箱
   *
   * @param index - 用户序号（从 1 开始）
   * @returns 邮箱地址
   */
  private formatTestUserEmail(index: number): string {
    return `${this.formatTestUsername(index)}${TEST_EMAIL_DOMAIN}`;
  }

  /**
   * 生成验票员测试用户名
   *
   * @param index - 验票员序号（从 1 开始）
   * @returns 用户名
   */
  private formatTestInspectorUsername(index: number): string {
    return `testinspector${String(index).padStart(2, '0')}`;
  }

  /**
   * 生成验票员测试邮箱
   *
   * @param index - 验票员序号（从 1 开始）
   * @returns 邮箱地址
   */
  private formatTestInspectorEmail(index: number): string {
    return `${this.formatTestInspectorUsername(index)}${TEST_EMAIL_DOMAIN}`;
  }
}
