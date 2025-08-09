import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/entities/user.entity';
import { InitService } from './init.service';

/**
 * 初始化模块
 * @description 配置应用初始化相关的服务，负责系统启动时的初始化操作
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [InitService],
})
export class InitModule {}
