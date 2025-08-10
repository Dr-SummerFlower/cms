import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { EcdsaModule } from '../ecdsa/ecdsa.module';
import { ConcertsController } from './concerts.controller';
import { ConcertsService } from './concerts.service';
import { Concert, ConcertSchema } from './entities/concert.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Concert.name, schema: ConcertSchema }]),
    forwardRef(() => AuthModule),
    EcdsaModule,
  ],
  controllers: [ConcertsController],
  providers: [ConcertsService],
  exports: [ConcertsService],
})
export class ConcertsModule {}
