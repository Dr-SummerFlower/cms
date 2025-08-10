import { Module } from '@nestjs/common';
import { EcdsaService } from './ecdsa.service';

/**
 * ECDSA模块
 * @description 提供ECDSA密钥生成、签名和验证功能的模块
 */
@Module({
  providers: [EcdsaService],
  exports: [EcdsaService],
})
export class EcdsaModule {}
