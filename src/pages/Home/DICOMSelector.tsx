import React, { useMemo } from 'react';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Alert, Combobox, InlineField, Stack } from '@grafana/ui';
import { MedTechPanelState } from 'types';
import {
  SERIES_DESCRIPTION,
  SERIES_INSTANCE_UID,
  STUDY_DESCRIPTION,
  STUDY_INSTANCE_UID,
  STUDY_MODALITIES_IN_STUDY,
} from '../../constants';
import { useStudies } from 'hooks/useStudies';
import { useSeries } from 'hooks/useSeries';

interface DICOMSelectorState extends SceneObjectState {
  apiUrl: string;
  panelState?: MedTechPanelState;
}

export class DICOMSelector extends SceneObjectBase<DICOMSelectorState> {
  static Component = CustomSceneObjectRenderer;

  onInstanceChange = (state: MedTechPanelState) => {
    this.setState({ panelState: state });
  };
}

function CustomSceneObjectRenderer({ model }: SceneComponentProps<DICOMSelector>) {
  const state = model.useState();
  const { studyInstanceUID } = state.panelState || {};
  const { error, loading, studies } = useStudies(state.apiUrl);
  const options = useMemo(
    () =>
      studies
        ?.map((study) => {
          const studyDesc = study[STUDY_DESCRIPTION]?.Value?.[0] || '';
          const label = studyDesc ? `${studyDesc} (${study[STUDY_MODALITIES_IN_STUDY]?.Value?.[0] || ''})` : '';
          const value = study[STUDY_INSTANCE_UID]?.Value?.[0] || '';
          return { label, value };
        })
        .filter((s) => Boolean(s.label) && Boolean(s.value)),
    [studies]
  );
  const { error: seriesError, loading: seriesLoading, series } = useSeries(state.apiUrl, studyInstanceUID);
  const seriesOptions = useMemo(
    () =>
      series
        ?.map((serie) => {
          const label = serie[SERIES_DESCRIPTION]?.Value?.[0] || '';
          const value = serie[SERIES_INSTANCE_UID]?.Value?.[0] || '';
          return { label, value };
        })
        .filter((s) => Boolean(s.label) && Boolean(s.value)),
    [series]
  );

  if (error || seriesError) {
    <Alert title="Something went wrong">{error || seriesError}</Alert>;
  }

  return (
    <>
      <Stack>
        <InlineField label="Study">
          <Combobox
            loading={loading}
            options={options}
            onChange={(option) => {
              model.onInstanceChange({
                orientation: state.panelState?.orientation || 'axial',
                apiUrl: state.apiUrl,
                instances: [],
                seriesInstanceUID: null,
                studyInstanceUID: option.value,
              });
            }}
          />
        </InlineField>
        <InlineField label="Series">
          <Combobox
            loading={seriesLoading}
            options={seriesOptions}
            onChange={(option) => {
              model.onInstanceChange({
                orientation: state.panelState?.orientation || 'axial',
                apiUrl: state.apiUrl,
                instances: [],
                seriesInstanceUID: option.value,
                studyInstanceUID: state.panelState?.studyInstanceUID || null,
              });
            }}
          />
        </InlineField>
      </Stack>
    </>
  );
}
