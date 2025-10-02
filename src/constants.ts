import pluginJson from './plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export enum ROUTES {
  Home = 'home',
  WithTabs = 'page-with-tabs',
  WithDrilldown = 'page-with-drilldown',
  HelloWorld = 'hello-world',
}

export const DATASOURCE_REF = {
  uid: 'gdev-testdata',
  type: 'testdata',
};

export const STUDY_INSTANCE_UID = '0020000D';
export const STUDY_DESCRIPTION = '00081030';
export const STUDY_MODALITIES_IN_STUDY = '00080061';
export const SERIES_INSTANCE_UID = '0020000E';
export const SERIES_DESCRIPTION = '0008103E';
export const MODALITY = '00080060';
export const SOP_INSTANCE_UID = '00080018';
