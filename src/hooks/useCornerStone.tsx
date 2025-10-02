import { Enums } from '@cornerstonejs/core';
import { getInstances } from 'api/api';
import { useAsync } from 'react-use';
import { MedTechPanelState } from 'types';
import { setViewPort } from 'vendor/cornerstone';

type UseCornerStoneResult = {
  ok: boolean;
  loading: boolean;
  error: string | null;
};

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

export function useCornerStone(
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

    element.oncontextmenu = (e) => e.preventDefault();
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
