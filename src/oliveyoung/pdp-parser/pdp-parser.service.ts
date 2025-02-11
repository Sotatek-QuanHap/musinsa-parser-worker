import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';

export type SelectorConfig = {
  type: 'css_selector' | 'xpath' | 'meta' | 'input';
  selector: string;
};

export type ParsingConfigurations = Record<string, SelectorConfig>;

@Injectable()
export class PDPParserService {
  private readonly logger = new Logger(PDPParserService.name);

  constructor() {}

  private async getParsingConfigurations(): Promise<ParsingConfigurations> {
    // TODO: need to sync config with Kafka
    const fakeConfigs: ParsingConfigurations = {
      productName: { type: 'input', selector: '#goodsNm' },
      productId: { type: 'input', selector: '#goodsNo' },
      category: { type: 'css_selector', selector: '#dtlCatNm' },
      brandName: { type: 'css_selector', selector: '#moveBrandShop' },
      sellerName: { type: 'css_selector', selector: '올리브영' },
      normalPrice: { type: 'css_selector', selector: 'span.price-1 > strike' },
      salePrice: { type: 'css_selector', selector: 'span.price-2 > strong' },
      couponPrice: {
        type: 'css_selector',
        selector:
          '#saleLayer > div > div:nth-child(1) > div.price_child > div:nth-child(1) > span.price',
      },
      styleNumber: {
        type: 'css_selector',
        selector: '.prd_detail_box.renew .right_area > div:nth-child(2)',
      },
    };
    return Promise.resolve(fakeConfigs);
  }

  private extractFieldValue(
    $: cheerio.CheerioAPI,
    config: SelectorConfig,
  ): string {
    switch (config.type) {
      case 'css_selector':
        return $(config.selector).text().trim();
      case 'meta':
        return (
          $(`meta[name="${config.selector}"]`).attr('content') || ''
        ).trim();
      case 'input':
        return ($(config.selector).val() || '').toString().trim();
      default:
        this.logger.warn(`Unsupported config type: ${config.type}`);
        return '';
    }
  }

  async parse(productHtml: string): Promise<Record<string, any>> {
    try {
      const $ = cheerio.load(productHtml);
      const configurations: ParsingConfigurations =
        await this.getParsingConfigurations();

      const extractedData: Record<string, any> = {};

      // Loop through each configuration entry and extract its corresponding value.
      for (const [fieldName, config] of Object.entries(configurations)) {
        extractedData[fieldName] = this.extractFieldValue($, config);
      }

      return extractedData;
    } catch (error) {
      this.logger.error(`Error parsing: ${error.message}`);
      throw error;
    }
  }
}
