import {
  ArgumentsHost,
  Catch,
  Controller,
  ExceptionFilter,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { Response } from 'express';
import { CountriesService } from './countries.service';
import { CountryCodeParam } from './dto/param.dto';

@Catch(NotFoundException)
export class CountryNotFoundExceptionFilter implements ExceptionFilter {
  catch(exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const message = exception.message;

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}

@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  async getAvailableCountries() {
    try {
      const countries = await this.countriesService.getApiCountries();

      return {
        success: true,
        data: countries,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get available countries',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':countryCode')
  async getCountryDetails(@Param() params: CountryCodeParam) {
    try {
      const countryDetails = await this.countriesService.getCountryDetails(
        params.countryCode,
      );

      return {
        success: true,
        data: countryDetails,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: `Error getting country details for ${params.countryCode}`,
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
