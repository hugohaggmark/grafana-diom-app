import {
  RenderingEngine,
  init as coreInit,
  setVolumesForViewports,
  volumeLoader,
  utilities,
} from '@cornerstonejs/core';
import { PublicViewportInput } from '@cornerstonejs/core/dist/esm/types';
import cornerstoneDICOMImageLoader, { init as dicomImageLoaderInit } from '@cornerstonejs/dicom-image-loader';
import { MedTechPanelState } from 'types';
import { convertMultiframeImageIds } from './convertMultiframeImageIds';
import removeInvalidTags from './removeInvalidTags';
// @ts-expect-error no types
import dcmjs from 'dcmjs';
import getPTImageIdInstanceMetadata from './getPTImageIdInstanceMetadata';
import { calculateSUVScalingFactors } from '@cornerstonejs/calculate-suv';
import ptScalingMetaDataProvider from './ptScalingMetaDataProvider';
import { getWadoRsUrl } from 'utils/wadoRsUrl';
import { MODALITY } from '../constants';
const { DicomMetaDictionary } = dcmjs.data;
const { calibratedPixelSpacingMetadataProvider, getPixelSpacingInformation } = utilities;

const RENDERING_ENGINE_ID = 'grafana-medtech-panel-engine';
let renderingEngine: RenderingEngine | null = null;
let promise: Promise<RenderingEngine> | null = null;

const init = async (): Promise<RenderingEngine> => {
  if (promise) {
    return promise;
  }

  promise = new Promise(async (resolve) => {
    await coreInit();
    await dicomImageLoaderInit();

    renderingEngine = new RenderingEngine(RENDERING_ENGINE_ID);
    resolve(renderingEngine);
  });

  return promise;
};

const viewportInputs: Record<string, PublicViewportInput[]> = {};

export const setViewPort = async (state: Partial<MedTechPanelState>, viewportInput: PublicViewportInput) => {
  const { apiUrl, instances, seriesInstanceUID, studyInstanceUID, orientation } = state;
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

  cornerstoneDICOMImageLoader.wadors.metaDataManager.purge();

  const { viewportId } = viewportInput;
  const engine = renderingEngine || (await init());
  const volumeId = `${studyInstanceUID}-${seriesInstanceUID}`;

  let imageIds: string[] = [];

  const modality = instances[0][MODALITY]?.Value?.[0] || '';
  for (const instance of instances) {
    const instanceUID = instance['00080018']?.Value?.[0];
    if (!instanceUID) {
      continue;
    }

    const imageId = getWadoRsUrl({ instances: [instance], apiUrl, seriesInstanceUID, studyInstanceUID });
    cornerstoneDICOMImageLoader.wadors.metaDataManager.add(imageId, instance as any);
    imageIds.push(imageId);
  }

  imageIds = convertMultiframeImageIds(imageIds);

  imageIds.forEach((imageId: any) => {
    let instanceMetaData = cornerstoneDICOMImageLoader.wadors.metaDataManager.get(imageId);

    if (!instanceMetaData) {
      return;
    }

    // It was using JSON.parse(JSON.stringify(...)) before but it is 8x slower
    instanceMetaData = removeInvalidTags(instanceMetaData);

    if (instanceMetaData) {
      // Add calibrated pixel spacing
      const metadata = DicomMetaDictionary.naturalizeDataset(instanceMetaData);
      const pixelSpacingInformation = getPixelSpacingInformation(metadata);
      const pixelSpacing = pixelSpacingInformation?.PixelSpacing;

      if (pixelSpacing) {
        calibratedPixelSpacingMetadataProvider.add(imageId, {
          rowPixelSpacing: parseFloat(pixelSpacing[0]),
          columnPixelSpacing: parseFloat(pixelSpacing[1]),
          // @ts-ignore
          type: pixelSpacingInformation.type,
        });
      }
    }
  });

  // we don't want to add non-pet
  // Note: for 99% of scanners SUV calculation is consistent bw slices
  if (modality === 'PT') {
    const InstanceMetadataArray: any[] = [];
    imageIds.forEach((imageId: any) => {
      const instanceMetadata = getPTImageIdInstanceMetadata(imageId);

      // TODO: Temporary fix because static-wado is producing a string, not an array of values
      // (or maybe dcmjs isn't parsing it correctly?)
      // It's showing up like 'DECY\\ATTN\\SCAT\\DTIM\\RAN\\RADL\\DCAL\\SLSENS\\NORM'
      // but calculate-suv expects ['DECY', 'ATTN', ...]
      if (typeof instanceMetadata.CorrectedImage === 'string') {
        instanceMetadata.CorrectedImage = instanceMetadata.CorrectedImage.split('\\');
      }

      if (instanceMetadata) {
        InstanceMetadataArray.push(instanceMetadata);
      }
    });

    if (InstanceMetadataArray.length) {
      try {
        const suvScalingFactors = calculateSUVScalingFactors(InstanceMetadataArray);
        InstanceMetadataArray.forEach((_, index) => {
          ptScalingMetaDataProvider.addInstance(imageIds[index], suvScalingFactors[index]);
        });
      } catch (error) {
        console.log(error);
      }
    }
  }

  if (!viewportInputs[volumeId]) {
    viewportInputs[volumeId] = [];
    const volume = await volumeLoader.createAndCacheVolume(volumeId, { imageIds });
    volume.load();
  }

  viewportInputs[volumeId].push(viewportInput);

  const allInputs = Object.values(viewportInputs).reduce((arr, curr) => {
    return arr.concat(curr);
  }, []);
  const filteredInputIds = viewportInputs[volumeId].map((i) => i.viewportId);

  engine.setViewports(allInputs);

  await setVolumesForViewports(engine, [{ volumeId }], filteredInputIds);
  engine.renderViewport(viewportId);
};
