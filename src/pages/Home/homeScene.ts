import { EmbeddedScene, SceneFlexItem, SceneFlexLayout } from '@grafana/scenes';
import { DICOMSelector } from './DICOMSelector';
import { MedTechPanel } from './MedTechPanel';

export function homeScene(apiUrl = 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb') {
  const dicomSelector = new DICOMSelector({ apiUrl });

  const medtechPanel = new MedTechPanel({});

  const sub = dicomSelector.subscribeToState((newState) => {
    if (!newState.panelState?.apiUrl) {
      return;
    }

    if (!newState.panelState?.studyInstanceUID) {
      return;
    }

    if (!newState.panelState?.seriesInstanceUID) {
      return;
    }

    medtechPanel.setState({
      apiUrl: newState.panelState.apiUrl,
      orientation: newState.panelState.orientation,
      studyInstanceUID: newState.panelState.studyInstanceUID,
      seriesInstanceUID: newState.panelState.seriesInstanceUID,
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
