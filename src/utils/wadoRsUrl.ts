import { MedTechPanelState } from 'types';
import { ensureSlash } from './ensureSlash';
import { SOP_INSTANCE_UID } from '../constants';

export const getWadoRsUrl = (state: Partial<MedTechPanelState>): string => {
  const { apiUrl, seriesInstanceUID, studyInstanceUID, instances } = state;
  const urlWithSlash = ensureSlash(apiUrl);
  const instanceUID = instances?.[0][SOP_INSTANCE_UID]?.Value?.[0];

  return `wadors:${urlWithSlash}studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${instanceUID}/frames/1`;
};
