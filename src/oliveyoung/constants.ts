export type SelectorConfig = {
  type: 'css_selector' | 'xpath' | 'meta' | 'input';
  selector: string;
};

export type ParsingConfigurations = Record<string, SelectorConfig>;

export const PDPParserConfigs = {
  name: 'olive-young.pdp-parser',
  groupId: 'olive-young-pdp-parser-group',
};

export const CategoryParserConfigs = {
  name: 'olive-young.category-parser',
  groupId: 'olive-young-category-parser-group',
};

export const KafkaTopics = {
  categoryParserRequest: 'olive-young.category-parser.request',
  categoryResult: 'olive-young.category.result',

  plpParserRequest: 'olive-young.plp-parser.request',
  plpResult: 'olive-young.plp.result',

  pdpParserRequest: 'olive-young.pdp-parser.request',
  pdpResult: 'olive-young.pdp.result',

  pdpConfigRequest: 'olive-young.pdp-config.request',
  pdpConfigUpdate: 'olive-young.pdp-config.update',
};
