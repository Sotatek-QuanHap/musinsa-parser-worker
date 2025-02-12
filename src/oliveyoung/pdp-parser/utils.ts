import { UpdateConfigRequestPayload } from './types';

export const isUpdateConfigRequest = (
  payload: any,
): payload is UpdateConfigRequestPayload => payload.type === 'update_config';
