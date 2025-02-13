import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { plainToInstance } from 'class-transformer';
import { ProductDto } from './types';
import { extractFieldValue } from 'src/utils/parser.utils';
import { ParsingConfigurations } from '../constants';

@Injectable()
export class PDPParserService {
  private readonly logger = new Logger(PDPParserService.name);

  constructor() {}

  parse(data: any, configurations: ParsingConfigurations) {
    const parsedProduct = this.parseProduct(data.productHtml, configurations);
    const parsedExtraInfo = this.parseExtraInfo(
      data.extraInfoHtml,
      configurations,
    );

    return {
      ...parsedProduct,
      url: data.url,
      extraInfo: parsedExtraInfo,
    };
  }

  parseProduct(productHtml: string, configurations: ParsingConfigurations) {
    try {
      const $ = cheerio.load(productHtml);

      const extractedData: Record<string, any> = {};

      // Loop through each configuration entry and extract its corresponding value.
      for (const [fieldName, config] of Object.entries(configurations)) {
        extractedData[fieldName] = extractFieldValue($, config);
      }

      // Data calculated from the extracted data.
      extractedData.couponPrice =
        extractedData.salePrice - extractedData.finalPrice;

      // Transform and validate the raw data into a ProductDto instance.
      const product = plainToInstance(ProductDto, extractedData, {
        enableImplicitConversion: true,
      });

      return product;
    } catch (error) {
      this.logger.error(`Error parsing: ${error.message}`);
      throw error;
    }
  }

  parseExtraInfo(extraInfoHtml: string, configurations: ParsingConfigurations) {
    const config = configurations['extraInfo'];
    if (!config) return [];

    const $ = cheerio.load(extraInfoHtml);
    const extraData = {};

    $(config.selector).each((_, element) => {
      const dt = $(element).find('dt').text().trim();
      const dd = $(element).find('dd').html()?.trim(); // Using .html() to keep line breaks
      if (dt && dd) {
        extraData[dt] = dd;
      }
    });

    return extraData;
  }
}
