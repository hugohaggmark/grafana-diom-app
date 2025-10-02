import React, { useState, useRef, useCallback, useEffect } from 'react';
import { usePreviousDistinct } from 'react-use';
import { eventTarget, Enums, cache } from '@cornerstonejs/core';
import { Stack, LoadingPlaceholder, Alert } from '@grafana/ui';
import { useCornerStone } from 'hooks/useCornerStone';
import { MedTechPanelState } from '../../types';

export function CornerStonePanel(state: Partial<MedTechPanelState>) {
  const [volumeLoading, setVolumeLoading] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [volumeLoadedFailed, setVolumeLoadedFailed] = useState(false);
  const previousOrientation = usePreviousDistinct(state.orientation);
  const element = useRef<HTMLDivElement>(null);
  const onRun = useCallback(() => {
    if (previousOrientation !== state.orientation && previousOrientation !== undefined) {
      return;
    }
    setVolumeLoading(true);
    setImageLoadError(false);
    setVolumeLoadedFailed(false);
  }, [previousOrientation, state.orientation]);

  const { error, loading } = useCornerStone(element.current, state, onRun);

  useEffect(() => {
    function imageLoadErrorCallback(event: any) {
      cache.removeImageLoadObject(event.detail.imageId);
      setImageLoadError(true);
    }

    function volumeLoadedFailedCallback(event: any) {
      cache.removeVolumeLoadObject(event.detail.volumeId);
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
      <div style={{ width: '100%', height: '100%', margin: '4px' }}>
        <Stack width="100%" height="100%" direction={'column'}>
          {(loading || volumeLoading) && !error && <LoadingPlaceholder text="Loading DICOM..." />}
          {error && <Alert title="Something went wrong">{error}</Alert>}
          {imageLoadError && <Alert title="Could not load image">Image load error</Alert>}
          {volumeLoadedFailed && <Alert title="Could not load volume">Volume load failed</Alert>}
          <div ref={element} style={{ height: '100%', width: '100%' }} />
        </Stack>
      </div>
    </>
  );
}
