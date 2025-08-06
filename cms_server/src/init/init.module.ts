import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InitService } from './init.service';
import { User, UserSchema } from '../users/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [InitService],
})
export class InitModule {}
