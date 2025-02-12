import { SelectorConfig } from 'src/oliveyoung/constants';
import { CheerioAPI } from 'cheerio';

export function extractFieldValue(
  $: CheerioAPI,
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
    case 'attr':
      return $(config.selector).attr(config.attr || '') || '';
    default:
      console.warn(`Unsupported config type: ${config.type}`);
      return '';
  }
}
