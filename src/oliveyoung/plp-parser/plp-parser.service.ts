import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';

export type SelectorConfig = {
  type: 'css_selector' | 'xpath' | 'meta' | 'input' | 'attr';
  selector: string;
  attr?: string;
};

export type ParsingConfigurations = Record<string, SelectorConfig>;

@Injectable()
export class PLPParserService {
  private readonly logger = new Logger(PLPParserService.name);

  constructor() {}

  private async getParsingConfigurations(): Promise<ParsingConfigurations> {
    // TODO: need to sync config with Kafka
    const fakeConfigs: ParsingConfigurations = {
      productId: {
        type: 'attr',
        selector: '.prd_info a.prd_thumb',
        attr: 'data-ref-goodsno',
      },
      url: { type: 'attr', selector: '.prd_info a.prd_thumb', attr: 'href' },
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
      case 'attr':
        return $(config.selector).attr(config.attr || '') || '';
      default:
        this.logger.warn(`Unsupported config type: ${config.type}`);
        return '';
    }
  }

  async parse(productHtml: string): Promise<Array<Record<string, string>>> {
    try {
      const $ = cheerio.load(productHtml);
      const productData: Array<{
        productId?: string;
        productUrl?: string;
      }> = [];
      const configurations: ParsingConfigurations =
        await this.getParsingConfigurations();

      // Loop through each configuration entry and extract its corresponding value.
      $('.cate_prd_list.gtm_cate_list li').each((index, element) => {
        const $ = cheerio.load(element);
        const extractedData: Record<string, any> = {};
        for (const [fieldName, config] of Object.entries(configurations)) {
          extractedData[fieldName] = this.extractFieldValue($, config);
        }
        productData.push(extractedData);
      });

      return productData;
    } catch (error) {
      this.logger.error(`Error parsing: ${error.message}`);
      throw error;
    }
  }
}
