import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';

interface FieldConfig {
  type: string;
  selector?: string;
  attribute?: string;
}

interface ParsingCategoryConfigurations {
  templateUrl?: string;
  parent: string;
  field: Record<string, FieldConfig>;
  children?: ParsingCategoryConfigurations;
  childrenContainerSelector?: string;
}
@Injectable()
export class CategoryParserService {
  private readonly logger = new Logger(CategoryParserService.name);

  constructor() {}

  // private getParsingConfigurations(): ParsingCategoryConfigurations {
  //   const fakeConfigs: ParsingCategoryConfigurations = {
  //     templateUrl:
  //       'https://www.oliveyoung.co.kr/store/display/getMCategoryList.do',
  //     parent: '.all_menu_wrap > li',
  //     field: {
  //       name: {
  //         type: 'css_selector',
  //         selector: '> h2',
  //       },
  //     },
  //     children: {
  //       parent: '.sub_menu_box p.sub_depth',
  //       field: {
  //         name: { type: 'css_selector' },
  //         id: {
  //           type: 'css_selector',
  //           selector: 'a',
  //           attribute: 'data-ref-dispcatno',
  //         },
  //       },
  //       childrenContainerSelector: 'ul',
  //       children: {
  //         parent: 'li',
  //         field: {
  //           name: { type: 'css_selector' },
  //           id: {
  //             type: 'css_selector',
  //             selector: 'a',
  //             attribute: 'data-ref-dispcatno',
  //           },
  //         },
  //       },
  //     },
  //   };
  //   return fakeConfigs;
  // }
  private extractFields(
    $elem: cheerio.Cheerio<any>,
    config: FieldConfig,
  ): string {
    const $target = config.selector ? $elem.find(config.selector) : $elem;
    switch (config.type) {
      case 'css_selector':
        if (config.attribute)
          return ($target.attr(config.attribute) || '').trim();
        return $target.text().trim();
      default:
        this.logger.warn(`Unsupported config type: ${config.type}`);
        return '';
    }
  }

  parseLevel(
    $: cheerio.CheerioAPI,
    $context: cheerio.Cheerio<any>,
    config: ParsingCategoryConfigurations,
    templateUrl?: string,
  ): any[] {
    const nodes: any[] = [];
    const elements = $context.find(config.parent).toArray();

    for (const elem of elements) {
      const $elem = $(elem);
      const node: any = {};
      for (const [fieldName, configSelector] of Object.entries(config.field)) {
        node[fieldName] = this.extractFields($elem, configSelector);
      }
      if (node.id) {
        node.url = templateUrl + `&dispCatNo=${node.id}`;
      }
      if (config.children) {
        const $childrenContainer = config.childrenContainerSelector
          ? $elem.next(config.childrenContainerSelector)
          : $elem;
        node.children = this.parseLevel(
          $,
          $childrenContainer,
          config.children,
          templateUrl,
        );
      }
      nodes.push(node);
    }

    return nodes;
  }

  parse(productHtml: string, configurations: ParsingCategoryConfigurations) {
    try {
      const $ = cheerio.load(productHtml);
      const parsedCategory = this.parseLevel(
        $,
        $.root(),
        configurations,
        configurations.templateUrl,
      );
      return { parsedCategory };
    } catch (error) {
      this.logger.error(`Error parsing: ${error.message}`);
      throw error;
    }
  }
}
