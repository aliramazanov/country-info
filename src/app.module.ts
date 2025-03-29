import { Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { CalendarModule } from './calendar/calendar.module';
import { CountriesModule } from './countries/countries.module';
import { DatabaseProvider } from './database/provider';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [],
      useFactory: async () => {
        const uri = await DatabaseProvider.getMongoUri();
        return { uri };
      },
    }),
    CountriesModule,
    CalendarModule,
  ],
})
export class AppModule implements OnApplicationShutdown {
  constructor(private readonly moduleRef: ModuleRef) {}

  async onApplicationShutdown(): Promise<void> {
    await DatabaseProvider.cleanupDatabase();
  }
}
