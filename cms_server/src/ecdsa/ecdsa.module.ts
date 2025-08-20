import { Module } from '@nestjs/common';
import { EcdsaService } from './ecdsa.service';

@Module({
  providers: [EcdsaService],
  exports: [EcdsaService],
})
export class EcdsaModule {}
