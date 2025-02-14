export const ConfigSynchronizerConfigs = {
  name: 'olive-young.parser-config-synchronizer',
  groupId: 'olive-young-parser-config-synchronizer-group',
};

export const KafkaTopics = {
  configRequest: 'olive-young.parser-config.request',
  configUpdate: 'olive-young.parser-config.update',
};

export interface ConfigSynchronizerRequest {
  service: string;
  request: string;
}

export interface CachedConfigurations {
  PDPParser: any;
  PLPParser: any;
  CategoryParser: any;
}

export interface ConfigSynchronizerUpdatePayload {
  type: 'update_config';
  value: CachedConfigurations;
}
