import React, { useRef, useState } from 'react';
import { useAsync } from 'react-use';
import { Enums, eventTarget } from '@cornerstonejs/core';
import { MedTechPanelState } from 'types';
import { SceneComponentProps, SceneObjectBase } from '@grafana/scenes';
import { setViewPort } from 'vendor/cornerstone';
import { Alert, ErrorBoundary, ErrorWithStack, LoadingPlaceholder, Stack } from '@grafana/ui';

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
  setVolumeLoading: React.Dispatch<React.SetStateAction<boolean>>
): UseCornerStoneResult {
  const asyncState = useAsync(async () => {
    const { instances, orientation, seriesInstanceUID, studyInstanceUID } = state;
    if (!element) {
      return false;
    }

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

    setVolumeLoading(true);
    await run(element, state);
    return true;
  }, [element, state]);

  return {
    ok: asyncState.value || false,
    loading: asyncState.loading,
    error: asyncState.error?.message || null,
  };
}

function CornerStonePanel({ model }: SceneComponentProps<MedTechPanel>) {
  const [volumeLoading, setVolumeLoading] = useState(false);
  const state = model.useState();
  const element = useRef<HTMLDivElement>(null);
  const { error, loading } = useCornerStone(element.current, state, setVolumeLoading);

  function callback() {
    setVolumeLoading(false);
    eventTarget.removeEventListener(Enums.Events.IMAGE_VOLUME_LOADING_COMPLETED, callback);
  }

  eventTarget.addEventListener(Enums.Events.IMAGE_VOLUME_LOADING_COMPLETED, callback);

  return (
    <>
      <Stack width="100%" height="100%" direction={'column'}>
        {(loading || volumeLoading) && <LoadingPlaceholder text="Loading DICOM..." />}
        {error && <Alert title="Something went wrong">{error}</Alert>}
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
