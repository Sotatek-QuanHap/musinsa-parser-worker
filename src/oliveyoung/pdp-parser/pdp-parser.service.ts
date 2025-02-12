import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { plainToInstance } from 'class-transformer';
import { ProductDto } from './types';

export type SelectorConfig = {
  type: 'css_selector' | 'xpath' | 'meta' | 'input';
  selector: string;
};

export type ParsingConfigurations = Record<string, SelectorConfig>;

@Injectable()
export class PDPParserService {
  private readonly logger = new Logger(PDPParserService.name);

  constructor() {}

  // private async getParsingConfigurations(): Promise<ParsingConfigurations> {
  //   const fakeConfigs: ParsingConfigurations = {
  //     productName: { type: 'input', selector: '#goodsNm' },
  //     productId: { type: 'input', selector: '#goodsNo' },
  //     category: { type: 'css_selector', selector: '#dtlCatNm' },
  //     brandName: { type: 'css_selector', selector: '#moveBrandShop' },
  //     sellerName: { type: 'css_selector', selector: '올리브영' },
  //     normalPrice: { type: 'meta', selector: 'eg:originalPrice' },
  //     salePrice: { type: 'meta', selector: 'eg:salePrice' },
  //     finalPrice: { type: 'input', selector: '#finalPrc' },
  //     reviewCount: { type: 'input', selector: '#premiumGdasCnt' },
  //     stock: {
  //       type: 'input',
  //       selector: '#avalInvQty',
  //     },
  //   };
  //   return Promise.resolve(fakeConfigs);
  // }

  private extractFieldValue(
    $: cheerio.CheerioAPI,
    config: SelectorConfig,
  ): string {
    switch (config.type) {
      case 'css_selector':
        return $(config.selector).text().trim();
      case 'meta':
        return (
          $(`meta[property="${config.selector}"]`).attr('content') || ''
        ).trim();
      case 'input':
        return ($(config.selector).val() || '').toString().trim();
      default:
        this.logger.warn(`Unsupported config type: ${config.type}`);
        return '';
    }
  }

  parse(data: any, configurations: ParsingConfigurations) {
    const parsedProduct = this.parseProduct(data.productHtml, configurations);
    const parsedExtraInfo = this.parseExtraInfo(
      data.extraInfoHtml,
      configurations,
    );

    return {
      ...parsedProduct,
      extraInfo: parsedExtraInfo,
    };
  }

  parseProduct(productHtml: string, configurations: ParsingConfigurations) {
    try {
      const $ = cheerio.load(productHtml);

      const extractedData: Record<string, any> = {};

      // Loop through each configuration entry and extract its corresponding value.
      for (const [fieldName, config] of Object.entries(configurations)) {
        extractedData[fieldName] = this.extractFieldValue($, config);
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
