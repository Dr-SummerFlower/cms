import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
})
export class Concert extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  poster: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  venue: string;

  @Prop({ required: true })
  adultPrice: number;

  @Prop({ required: true })
  childPrice: number;

  @Prop({ required: true })
  totalTickets: number;

  @Prop({ default: 0 })
  soldTickets: number;

  @Prop({ default: 2 })
  maxAdultTicketsPerUser: number;

  @Prop({ default: 1 })
  maxChildTicketsPerUser: number;

  @Prop({ enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' })
  status: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  publicKey: string;

  @Prop({
    required: true,
    select: false,
    get: function (value: string) {
      if (!value) return value;
      try {
        const encryptionKey =
          process.env.ENCRYPTION_KEY || 'default-key-32-characters-long!';
        const parts = value.split(':');
        if (parts.length !== 2) return value;
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = parts[1];
        const decipher = createDecipheriv(
          'aes-256-cbc',
          Buffer.from(encryptionKey.slice(0, 32)),
          iv,
        );
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      } catch {
        return value;
      }
    },
    set: function (value: string) {
      if (!value) return value;
      try {
        const encryptionKey =
          process.env.ENCRYPTION_KEY || 'default-key-32-characters-long!';
        const iv = randomBytes(16);
        const cipher = createCipheriv(
          'aes-256-cbc',
          Buffer.from(encryptionKey.slice(0, 32)),
          iv,
        );
        let encrypted = cipher.update(value, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
      } catch {
        return value;
      }
    },
  })
  privateKey: string;
}

export type ConcertDocument = Concert & Document;

export const ConcertSchema = SchemaFactory.createForClass(Concert);
