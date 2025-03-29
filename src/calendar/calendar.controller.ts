import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { AddHolidaysDto } from './dto/add-holidays.dto';
import { UserIdParam } from './dto/user-id.dto';

@Controller('users')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post(':userId/calendar/holidays')
  async addHolidaysToCalendar(
    @Param() params: UserIdParam,
    @Body() addHolidaysDto: AddHolidaysDto,
  ) {
    try {
      const result = await this.calendarService.addHolidaysToCalendar(
        params.userId,
        addHolidaysDto,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
            error: 'Not Found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        {
          success: false,
          message: `Failed to add holidays to calendar`,
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':userId/calendar/holidays')
  async getUserHolidays(@Param() params: UserIdParam) {
    try {
      const holidays = await this.calendarService.getUserHolidays(
        params.userId,
      );

      return {
        success: true,
        data: holidays,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
            error: 'Not Found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        {
          success: false,
          message: `Failed to get holidays for user ${params.userId}`,
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('public-holidays/:year/:countryCode')
  async getPublicHolidays(
    @Param('year') year: number,
    @Param('countryCode') countryCode: string,
  ) {
    try {
      const holidays = await this.calendarService.getPublicHolidays(
        countryCode,
        +year,
      );

      return {
        success: true,
        data: holidays,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: `Failed to get public holidays for ${countryCode} in ${year}`,
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
