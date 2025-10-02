import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAsync } from 'react-use';
import { cache, Enums, eventTarget } from '@cornerstonejs/core';
import { MedTechPanelState } from 'types';
import { SceneComponentProps, SceneObjectBase } from '@grafana/scenes';
import { setViewPort } from 'vendor/cornerstone';
import { Alert, ErrorBoundary, ErrorWithStack, LoadingPlaceholder, Stack } from '@grafana/ui';
import { getInstances } from 'api/api';

export class MedTechPanel extends SceneObjectBase<Partial<MedTechPanelState>> {
  static Component = MedTechPanelRenderer;
}

/**
 * Runs the demo
 */
async function run(element: HTMLDivElement, state: Partial<MedTechPanelState>) {
  const { instances, orientation, seriesInstanceUID, studyInstanceUID } = state;
  if (!instances?.length) {
    return;
  }

  if (!seriesInstanceUID) {
    return;
  }

  if (!studyInstanceUID) {
    return;
  }

  if (!orientation) {
    return;
  }

  // const imageIds = await createImageIdsAndCacheMetaData({
  //   StudyInstanceUID: studyInstanceUID,
  //   SeriesInstanceUID: seriesId,
  //   wadoRsRoot: wadoRsRoot,
  // });

  const viewportId = `viewport-${orientation}-${studyInstanceUID}-${seriesInstanceUID}-${Date.now}`;
  const viewportInput = {
    viewportId,
    element: element,
    type: Enums.ViewportType.ORTHOGRAPHIC,
    defaultOptions: {
      orientation: orientation as Enums.OrientationAxis,
    },
  };

  await setViewPort(state, viewportInput);
}

type UseCornerStoneResult = {
  ok: boolean;
  loading: boolean;
  error: string | null;
};

function useCornerStone(
  element: HTMLDivElement | null,
  state: Partial<MedTechPanelState>,
  onRun: () => void
): UseCornerStoneResult {
  const { orientation, seriesInstanceUID, studyInstanceUID } = state;

  const asyncState = useAsync(async () => {
    if (!element) {
      return false;
    }

    if (!seriesInstanceUID) {
      return;
    }

    if (!studyInstanceUID) {
      return;
    }

    if (!orientation) {
      return;
    }

    const instances = await getInstances(state.apiUrl, studyInstanceUID, seriesInstanceUID);

    if (!instances?.length) {
      return;
    }

    onRun();
    await run(element, { ...state, instances });
    return true;
  }, [element, orientation, seriesInstanceUID, studyInstanceUID]);

  return {
    ok: asyncState.value || false,
    loading: asyncState.loading,
    error: asyncState.error?.message || null,
  };
}

function CornerStonePanel({ model }: SceneComponentProps<MedTechPanel>) {
  const [volumeLoading, setVolumeLoading] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [volumeLoadedFailed, setVolumeLoadedFailed] = useState(false);
  const state = model.useState();
  const element = useRef<HTMLDivElement>(null);
  const onRun = useCallback(() => {
    setVolumeLoading(true);
    setImageLoadError(false);
    setVolumeLoadedFailed(false);
  }, []);

  const { error, loading } = useCornerStone(element.current, state, onRun);

  useEffect(() => {
    function imageLoadErrorCallback(event: any) {
      console.log('imageLoadErrorCallback', event);
      setImageLoadError(true);
    }

    function volumeLoadedFailedCallback(event: any) {
      console.log('volumeLoadedFailedCallback', event);
      cache.purgeVolumeCache();
      setVolumeLoadedFailed(true);
    }

    function callback() {
      setVolumeLoading(false);
    }

    eventTarget.addEventListener(Enums.Events.IMAGE_LOAD_ERROR, imageLoadErrorCallback);
    eventTarget.addEventListener(Enums.Events.IMAGE_VOLUME_LOADING_COMPLETED, callback);
    eventTarget.addEventListener(Enums.Events.VOLUME_LOADED_FAILED, volumeLoadedFailedCallback);

    return () => {
      eventTarget.removeEventListener(Enums.Events.IMAGE_VOLUME_LOADING_COMPLETED, callback);
      eventTarget.removeEventListener(Enums.Events.IMAGE_LOAD_ERROR, imageLoadErrorCallback);
      eventTarget.removeEventListener(Enums.Events.VOLUME_LOADED_FAILED, volumeLoadedFailedCallback);
    };
  }, []);

  return (
    <>
      <Stack width="100%" height="100%" direction={'column'}>
        {(loading || volumeLoading) && <LoadingPlaceholder text="Loading DICOM..." />}
        {error && <Alert title="Something went wrong">{error}</Alert>}
        {imageLoadError && <Alert title="Could not load image">Image load error</Alert>}
        {volumeLoadedFailed && <Alert title="Could not load volume">Volume load failed</Alert>}
        <div ref={element} style={{ height: '100%', width: '100%' }} />
      </Stack>
    </>
  );
}

function MedTechPanelRenderer({ model }: SceneComponentProps<MedTechPanel>) {
  return (
    <ErrorBoundary>
      {({ error, errorInfo }) => {
        if (error) {
          return <ErrorWithStack error={error} title="An unexpected error happened" errorInfo={errorInfo} />;
        }

        return <CornerStonePanel model={model} />;
      }}
    </ErrorBoundary>
  );
}
