import { SceneAppPage } from '@grafana/scenes';
import { homeScene } from './homeScene';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';

export const homePage = new SceneAppPage({
  title: 'DICOM',
  url: prefixRoute(ROUTES.Home),
  routePath: ROUTES.Home,
  subTitle: 'This app show cases DICOM abillities in Grafana',
  getScene: () => homeScene(),
});
