import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { AddHolidaysDto } from './dto/add-holidays.dto';
import { Holiday } from './interfaces/holiday.interface';
import { CalendarEvent, CalendarEventDocument } from './schemas/event.schema';
import { User, UserDocument } from './schemas/user.schema';
import { ErrorWithResponse } from './interfaces/err.interface';

@Injectable()
export class CalendarService {
  private readonly dateAPI: string;
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(CalendarEvent.name)
    private calEvent: Model<CalendarEventDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.dateAPI = this.configService.get<string>(
      'DATE_NAGER_API_URL',
      'https://date.nager.at/api/v3',
    );
    this.logger.log(`Using Date Nager API: ${this.dateAPI}`);
  }

  async getPublicHolidays(
    countryCode: string,
    year: number,
  ): Promise<Holiday[]> {
    try {
      this.logger.debug(
        `Request for public holidays: ${countryCode} in ${year}`,
      );

      const response = await firstValueFrom(
        this.httpService.get<Holiday[]>(
          `${this.dateAPI}/PublicHolidays/${year}/${countryCode}`,
        ),
      );

      this.logger.debug(
        `Found ${response.data.length} holidays for ${countryCode}`,
      );

      return response.data;
    } catch (error) {
      const errorDetails = this.extractErrorDetails(error as ErrorWithResponse);

      if (errorDetails.status === 404) {
        this.logger.warn(
          `No public holidays for: ${countryCode} in ${year}: ${errorDetails.message}`,
        );
        throw new BadRequestException(
          `Invalid code or no data for ${countryCode} in ${year}`,
        );
      }

      this.logger.error(
        `Failed on getting public holidays: ${countryCode} in ${year}: ${errorDetails.message}`,
      );

      throw new Error(
        `Failed on getting public holidays: ${countryCode} in ${year}`,
      );
    }
  }

  async getUserHolidays(userId: string): Promise<CalendarEventDocument[]> {
    this.logger.debug(`Retrieving holidays for user ${userId}`);

    const userExists = await this.userModel.exists({ _id: userId });

    if (!userExists) {
      this.logger.warn(`User with ID ${userId} not found`);
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const holidays = await this.calEvent.find({ userId }).sort({ date: 1 });

    this.logger.debug(`Found ${holidays.length} holidays for user ${userId}`);

    return holidays;
  }

  async addHolidaysToCalendar(
    userId: string,
    addHolidaysDto: AddHolidaysDto,
  ): Promise<{ added: number; message: string }> {
    this.logger.debug(
      `Adding holidays for ${addHolidaysDto.countryCode} in ${addHolidaysDto.year} to user ${userId}`,
    );

    const userExists = await this.userModel.exists({ _id: userId });

    if (!userExists) {
      this.logger.warn(`User with ID ${userId} not found`);
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const holidays = await this.getPublicHolidays(
      addHolidaysDto.countryCode,
      addHolidaysDto.year,
    );

    const requestedHolidays = addHolidaysDto.holidays;

    const holidaysToAdd = requestedHolidays
      ? holidays.filter((holiday) =>
          requestedHolidays.some(
            (requestedHoliday) =>
              holiday.name
                .toLowerCase()
                .includes(requestedHoliday.toLowerCase()) ||
              holiday.localName
                .toLowerCase()
                .includes(requestedHoliday.toLowerCase()),
          ),
        )
      : holidays;

    if (holidaysToAdd.length === 0) {
      this.logger.debug('No holidays found to add');
      return {
        added: 0,
        message: 'No holidays found to add to calendar',
      };
    }

    const calendarEvents = holidaysToAdd.map((holiday) => ({
      userId,
      title: holiday.name,
      date: new Date(holiday.date),
      countryCode: holiday.countryCode,
      holidayType: holiday.types.join(', '),
      description: `${holiday.localName} - ${
        holiday.global ? 'National' : 'Regional'
      } holiday in ${holiday.countryCode}`,
    }));

    const existingEvents = await this.calEvent.find({
      userId,
      countryCode: addHolidaysDto.countryCode,
      date: {
        $gte: new Date(`${addHolidaysDto.year}-01-01`),
        $lte: new Date(`${addHolidaysDto.year}-12-31`),
      },
    });

    const uniqueEvents = calendarEvents.filter(
      (newEvent) =>
        !existingEvents.some(
          (existingEvent) =>
            existingEvent.title === newEvent.title &&
            existingEvent.date.toISOString().split('T')[0] ===
              newEvent.date.toISOString().split('T')[0],
        ),
    );

    if (uniqueEvents.length === 0) {
      this.logger.debug('All holidays already exist');
      return {
        added: 0,
        message: 'All holidays already exist',
      };
    }

    await this.calEvent.insertMany(uniqueEvents);

    this.logger.debug(
      `Added ${uniqueEvents.length} holidays to calendar for user ${userId}`,
    );

    return {
      added: uniqueEvents.length,
      message: `Successfully added ${uniqueEvents.length} holidays to calendar`,
    };
  }

  private extractErrorDetails(error: ErrorWithResponse): {
    status: number;
    message: string;
  } {
    const status = error.response?.status || 500;
    let message = 'Unknown error';

    if (error.message) {
      message = error.message;
    }

    if (error.response?.data) {
      const data =
        typeof error.response.data === 'string'
          ? error.response.data
          : JSON.stringify(error.response.data);
      message = `${message} - ${data}`;
    }

    return { status, message };
  }
}
