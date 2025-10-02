import React, { useMemo } from 'react';
import { useAsync } from 'react-use';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Alert, Combobox, InlineField, Stack } from '@grafana/ui';
import { Instance, MedTechPanelState, Serie, Study } from 'types';
import { getInstances, getSeries, getStudies } from 'api/api';
import {
  SERIES_DESCRIPTION,
  SERIES_INSTANCE_UID,
  STUDY_DESCRIPTION,
  STUDY_INSTANCE_UID,
  STUDY_MODALITIES_IN_STUDY,
} from '../../constants';

interface DICOMSelectorState extends SceneObjectState {
  apiUrl: string;
  state?: MedTechPanelState;
}

export class DICOMSelector extends SceneObjectBase<DICOMSelectorState> {
  static Component = CustomSceneObjectRenderer;

  onInstanceChange = (state: MedTechPanelState) => {
    this.setState({ state });
  };
}

type UseSeriesResult = {
  series: Serie[];
  loading: boolean;
  error: string | null;
};

export function useSeries(url: string, studyInstanceUID: string | null | undefined): UseSeriesResult {
  const asyncState = useAsync(async () => {
    if (!studyInstanceUID) {
      return [];
    }

    return await getSeries(url, studyInstanceUID);
  }, [url, studyInstanceUID]);

  return {
    series: asyncState.value || [],
    loading: asyncState.loading,
    error: asyncState.error?.message || null,
  };
}

type UseStudiesResult = {
  studies: Study[];
  loading: boolean;
  error: string | null;
};

export function useStudies(url: string): UseStudiesResult {
  const asyncState = useAsync(async () => {
    return await getStudies(url);
  }, [url]);

  return {
    studies: asyncState.value || [],
    loading: asyncState.loading,
    error: asyncState.error?.message || null,
  };
}

type UseSInstancesResult = {
  instances: Instance[];
  loading: boolean;
  error: string | null;
};

export function useInstances(
  url: string,
  studyInstanceUID: string | null | undefined,
  seriesInstanceUID: string | null | undefined
): UseSInstancesResult {
  const asyncState = useAsync(async () => {
    if (!studyInstanceUID) {
      return [];
    }

    if (!seriesInstanceUID) {
      return [];
    }

    return await getInstances(url, studyInstanceUID, seriesInstanceUID);
  }, [url, studyInstanceUID, seriesInstanceUID]);

  return {
    instances: asyncState.value || [],
    loading: asyncState.loading,
    error: asyncState.error?.message || null,
  };
}

function CustomSceneObjectRenderer({ model }: SceneComponentProps<DICOMSelector>) {
  const state = model.useState();
  console.log('CustomSceneObjectRenderer', { state: state.state });
  const { studyInstanceUID } = state.state || {};
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
                orientation: state.state?.orientation || 'axial',
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
                orientation: state.state?.orientation || 'axial',
                apiUrl: state.apiUrl,
                instances: [],
                seriesInstanceUID: option.value,
                studyInstanceUID: state.state?.studyInstanceUID || null,
              });
            }}
          />
        </InlineField>
      </Stack>
    </>
  );
}
