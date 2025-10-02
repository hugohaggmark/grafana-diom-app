import React, { useState, useRef, useCallback, useEffect } from 'react';
import { eventTarget, Enums } from '@cornerstonejs/core';
import { SceneComponentProps } from '@grafana/scenes';
import { Stack, LoadingPlaceholder, Alert } from '@grafana/ui';
import { useCornerStone } from 'hooks/useCornerstone';
import { MedTechPanel } from './MedTechPanel';

export function CornerStonePanel({ model }: SceneComponentProps<MedTechPanel>) {
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
      setImageLoadError(true);
    }

    function volumeLoadedFailedCallback(event: any) {
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
        {(loading || volumeLoading) && !error && <LoadingPlaceholder text="Loading DICOM..." />}
        {error && <Alert title="Something went wrong">{error}</Alert>}
        {imageLoadError && <Alert title="Could not load image">Image load error</Alert>}
        {volumeLoadedFailed && <Alert title="Could not load volume">Volume load failed</Alert>}
        <div ref={element} style={{ height: '100%', width: '100%' }} />
      </Stack>
    </>
  );
}
