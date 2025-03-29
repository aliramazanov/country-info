import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CalendarEventDocument = CalendarEvent & Document;

@Schema({ timestamps: true })
export class CalendarEvent {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true, trim: true, uppercase: true })
  countryCode: string;

  @Prop({ required: true })
  holidayType: string;

  @Prop({ trim: true })
  description?: string;
}

export const EventSchema = SchemaFactory.createForClass(CalendarEvent);

EventSchema.index({ userId: 1, date: 1 });
