import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import {
  CountriesController,
  CountryNotFoundExceptionFilter,
} from './countries.controller';
import { CountriesService } from './countries.service';

@Module({
  imports: [HttpModule],
  controllers: [CountriesController],
  providers: [
    CountriesService,
    {
      provide: APP_FILTER,
      useClass: CountryNotFoundExceptionFilter,
    },
  ],
  exports: [CountriesService],
})
export class CountriesModule {}
