import { EmbeddedScene, SceneFlexItem, SceneFlexLayout } from '@grafana/scenes';
import { DICOMSelector } from './DICOMSelector';
import { MedTechPanel } from './MedTechPanel';

export function homeScene(apiUrl = 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb') {
  const dicomSelector = new DICOMSelector({ apiUrl });

  const medtechPanel = new MedTechPanel({});

  const sub = dicomSelector.subscribeToState((newState) => {
    if (!newState.state?.apiUrl) {
      return;
    }

    if (!newState.state?.instances?.length) {
      return;
    }

    if (!newState.state?.studyInstanceUID) {
      return;
    }

    if (!newState.state?.seriesInstanceUID) {
      return;
    }

    medtechPanel.setState({
      apiUrl: newState.state.apiUrl,
      instances: newState.state.instances,
      orientation: newState.state.orientation,
      studyInstanceUID: newState.state.studyInstanceUID,
      seriesInstanceUID: newState.state.seriesInstanceUID,
    });

    return () => {
      sub.unsubscribe();
    };
  });

  return new EmbeddedScene({
    // $timeRange: timeRange,
    // $variables: new SceneVariableSet({ variables: templatised ? [customVariable] : [] }),
    // $data: queryRunner,
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          minHeight: 300,
          body: medtechPanel,
        }),
      ],
    }),
    controls: [dicomSelector],
  });
}
