import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  Country,
  CountryDetails,
  CountryInfo,
  FlagResponse,
  PopulationCount,
  PopulationResponse,
  SingleCountryPopulationResponse,
} from './interfaces/country.interface';

@Injectable()
export class CountriesService {
  private readonly dateAPI: string;
  private readonly countriesAPI: string;
  private readonly logger = new Logger(CountriesService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.dateAPI = this.configService.get<string>(
      'DATE_NAGER_API_URL',
      'https://date.nager.at/api/v3',
    );

    this.countriesAPI = this.configService.get<string>(
      'COUNTRIES_NOW_API_URL',
      'https://countriesnow.space/api/v0.1',
    );

    this.logger.log(`Using Date Nager API: ${this.dateAPI}`);
    this.logger.log(`Using Countries Now API: ${this.countriesAPI}`);
  }

  async getApiCountries(): Promise<Country[]> {
    try {
      this.logger.debug('Getting countries from Date Nager');

      const response = await firstValueFrom(
        this.httpService.get<Country[]>(`${this.dateAPI}/AvailableCountries`),
      );

      this.logger.debug(`Received: ${response.data.length} countries`);

      return response.data;
    } catch (error) {
      const err = error as Error;

      this.logger.error(
        `Failed to get available countries: ${err.message}`,
        err.stack,
      );

      throw new Error(`Failed to get available countries`);
    }
  }

  async getCountryInfo(countryCode: string): Promise<CountryInfo> {
    try {
      this.logger.debug(`Getting country info for ${countryCode}`);

      const response = await firstValueFrom(
        this.httpService.get<CountryInfo>(
          `${this.dateAPI}/CountryInfo/${countryCode}`,
        ),
      );

      return response.data;
    } catch (error) {
      const err = error as Error;
      const isNotFound =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        'response' in err && (err as any).response?.status === 404;

      if (!isNotFound) {
        this.logger.error(
          `Failed to get country info for ${countryCode}: ${err.message}`,
          err.stack,
        );
      } else {
        this.logger.warn(`Country info not found for ${countryCode}`);
      }

      throw new NotFoundException(`Country info not found for ${countryCode}`);
    }
  }

  async getPopulationData(countryName: string): Promise<PopulationCount[]> {
    this.logger.debug(`Getting population for ${countryName}`);

    try {
      const requestUrl = `${this.countriesAPI}/countries/population`;
      const requestBody = { country: countryName };

      const response = await firstValueFrom(
        this.httpService.post<
          SingleCountryPopulationResponse | PopulationResponse
        >(requestUrl, requestBody, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }),
      );

      this.logger.debug(`Response status: ${response.status}`);

      const responseData = response.data;

      if (responseData.error) {
        this.logger.error(`API returned error: ${responseData.msg}`);
        return [];
      }

      if (
        responseData.data &&
        typeof responseData.data === 'object' &&
        !Array.isArray(responseData.data) &&
        'populationCounts' in responseData.data
      ) {
        const countryData = responseData.data;

        if (
          countryData.country &&
          countryData.country.toLowerCase() === countryName.toLowerCase()
        ) {
          this.logger.debug(
            `Found population data with ${countryData.populationCounts.length} records`,
          );

          return countryData.populationCounts.map((count) => ({
            year: String(count.year),
            value: count.value,
          }));
        }
      }

      if (
        responseData.data &&
        Array.isArray(responseData.data) &&
        responseData.data.length > 0
      ) {
        const countryData = responseData.data.find(
          (data) => data.country.toLowerCase() === countryName.toLowerCase(),
        );

        if (countryData) {
          return countryData.populationCounts.map((count) => ({
            year: String(count.year),
            value: count.value,
          }));
        }
      }

      this.logger.warn(`No matching population: ${countryName}`);
      return [];
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        const err = error as Error;

        if ('response' in err) {
          const httpError = err as {
            response?: { status?: number; data?: unknown };
          };

          if (httpError.response) {
            this.logger.error(`API error status: ${httpError.response.status}`);
            this.logger.error(
              `API error data: ${JSON.stringify(httpError.response.data)}`,
            );
          }
        }

        this.logger.error(
          `Failed to get population data for ${countryName}: ${err.message}`,
          err.stack,
        );
      }

      throw error;
    }
  }

  async getFlagUrl(countryName: string): Promise<string> {
    this.logger.debug(`Getting flag URL for ${countryName}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get<FlagResponse>(
          `${this.countriesAPI}/countries/flag/images`,
        ),
      );

      const countryData = response.data.data.find(
        (data) => data.name.toLowerCase() === countryName.toLowerCase(),
      );

      if (countryData) {
        return countryData.flag;
      }

      const flexibleMatch = response.data.data.find(
        (data) =>
          data.name.toLowerCase().includes(countryName.toLowerCase()) ||
          countryName.toLowerCase().includes(data.name.toLowerCase()),
      );

      if (flexibleMatch) {
        return flexibleMatch.flag;
      }

      this.logger.warn(`Flag not found for ${countryName}`);
      return '';
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to get flag for ${countryName}: ${err.message}`,
        err.stack,
      );
      return '';
    }
  }

  async getCountryDetails(countryCode: string): Promise<CountryDetails> {
    this.logger.debug(`Getting country details for ${countryCode}`);

    const countryInfo = await this.getCountryInfo(countryCode);

    this.logger.debug(`Getting basic info for ${countryInfo.commonName}`);

    let populationData: PopulationCount[] = [];

    try {
      populationData = await this.getPopulationData(countryInfo.commonName);
      this.logger.debug(`Found ${populationData.length} population records`);
    } catch (error) {
      const err = error as Error;
      this.logger.warn(
        `Error on population data: ${countryInfo.commonName}: ${err.message}`,
      );
    }

    let flagUrl = '';

    try {
      flagUrl = await this.getFlagUrl(countryInfo.commonName);
      this.logger.debug(`Retrieved flag URL: ${flagUrl ? 'Yes' : 'No'}`);
    } catch (error) {
      const err = error as Error;
      this.logger.warn(
        `Error getting flag URL: ${countryInfo.commonName}: ${err.message}`,
      );
    }

    return {
      name: countryInfo.commonName,
      countryCode: countryInfo.countryCode,
      borders: countryInfo.borders.map((border) => ({
        name: border.commonName,
        countryCode: border.countryCode,
      })),
      population: populationData,
      flagUrl,
    };
  }
}
