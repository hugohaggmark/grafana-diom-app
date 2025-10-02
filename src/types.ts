import { SceneObjectState } from '@grafana/scenes';
import {
  MODALITY,
  SERIES_DESCRIPTION,
  SERIES_INSTANCE_UID,
  SOP_INSTANCE_UID,
  STUDY_DESCRIPTION,
  STUDY_INSTANCE_UID,
  STUDY_MODALITIES_IN_STUDY,
} from './constants';

export interface DicomValue {
  Value?: string[];
}
export interface Study {
  [STUDY_INSTANCE_UID]?: DicomValue;
  [STUDY_DESCRIPTION]?: DicomValue;
  [STUDY_MODALITIES_IN_STUDY]?: DicomValue;
}

export interface Serie {
  [SERIES_INSTANCE_UID]?: DicomValue;
  [SERIES_DESCRIPTION]?: DicomValue;
}

export interface Instance {
  [SOP_INSTANCE_UID]?: DicomValue;
  [MODALITY]?: DicomValue;
}

export interface MedTechPanelState extends SceneObjectState {
  apiUrl?: string;
  studyInstanceUID?: string | null;
  seriesInstanceUID?: string | null;
  instances: Instance[];
  orientation: 'axial' | 'coronal' | 'sagittal';
}
