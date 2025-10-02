import {
  RenderingEngine,
  init as coreInit,
  setVolumesForViewports,
  volumeLoader,
  utilities,
  Types,
} from '@cornerstonejs/core';
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
import { MODALITY, SOP_INSTANCE_UID } from '../constants';
const { DicomMetaDictionary } = dcmjs.data;
const { calibratedPixelSpacingMetadataProvider, getPixelSpacingInformation } = utilities;
// import * as cornerstoneTools from '@cornerstonejs/tools';
//const { PanTool, WindowLevelTool, StackScrollTool, ZoomTool, PlanarRotateTool } = cornerstoneTools;

const RENDERING_ENGINE_ID = 'grafana-health-dicom-engine';
let renderingEngine: RenderingEngine | null = null;
let promise: Promise<RenderingEngine> | null = null;

const init = async (): Promise<RenderingEngine> => {
  if (promise) {
    return promise;
  }

  promise = new Promise(async (resolve) => {
    await coreInit();
    await dicomImageLoaderInit();
    // await cornerstoneTools.init();
    // cornerstoneTools.addTool(PanTool);
    // cornerstoneTools.addTool(WindowLevelTool);
    // cornerstoneTools.addTool(StackScrollTool);
    // cornerstoneTools.addTool(ZoomTool);
    // cornerstoneTools.addTool(PlanarRotateTool);

    renderingEngine = new RenderingEngine(RENDERING_ENGINE_ID);
    resolve(renderingEngine);
  });

  return promise;
};

const viewportInputs: Record<string, Types.PublicViewportInput[]> = {};

export const setViewPort = async (state: Partial<MedTechPanelState>, viewportInput: Types.PublicViewportInput) => {
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
    const instanceUID = instance[SOP_INSTANCE_UID]?.Value?.[0];
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

  // let toolGroup = ToolGroupManager.getToolGroupForViewport(viewportId);
  // if (!toolGroup) {
  //   toolGroup = ToolGroupManager.createToolGroup(viewportId);
  // }

  // toolGroup!.addTool(WindowLevelTool.toolName);
  // toolGroup!.addTool(PanTool.toolName);
  // toolGroup!.addTool(ZoomTool.toolName);
  // toolGroup!.addTool(StackScrollTool.toolName, { loop: false });
  // toolGroup!.addTool(PlanarRotateTool.toolName);

  // toolGroup!.setToolActive(WindowLevelTool.toolName, {
  //   bindings: [
  //     {
  //       mouseButton: csToolsEnums.MouseBindings.Primary, // Left Click
  //     },
  //   ],
  // });
  // toolGroup!.setToolActive(PanTool.toolName, {
  //   bindings: [
  //     {
  //       mouseButton: csToolsEnums.MouseBindings.Auxiliary, // Middle Click
  //     },
  //   ],
  // });
  // toolGroup!.setToolActive(ZoomTool.toolName, {
  //   bindings: [
  //     {
  //       mouseButton: csToolsEnums.MouseBindings.Secondary, // Right Click
  //     },
  //   ],
  // });

  // // The Stack Scroll mouse wheel is a tool using the `mouseWheelCallback`
  // // and needs to be registered against the 'Wheel' binding.
  // toolGroup!.setToolActive(StackScrollTool.toolName, {
  //   bindings: [
  //     {
  //       mouseButton: csToolsEnums.MouseBindings.Wheel, // Wheel Mouse
  //     },
  //   ],
  // });
  // toolGroup!.setToolActive(PlanarRotateTool.toolName, {
  //   bindings: [
  //     {
  //       mouseButton: csToolsEnums.MouseBindings.Wheel, // Shift Wheel Mouse
  //       modifierKey: csToolsEnums.KeyboardBindings.Shift,
  //     },
  //     {
  //       mouseButton: csToolsEnums.MouseBindings.Wheel_Primary, // Left Click+Wheel Mouse
  //     },
  //   ],
  // });

  viewportInputs[volumeId].push(viewportInput);

  const allInputs = Object.values(viewportInputs).reduce((arr, curr) => {
    return arr.concat(curr);
  }, []);
  const filteredInputIds = viewportInputs[volumeId].map((i) => i.viewportId);

  engine.setViewports(allInputs);

  await setVolumesForViewports(engine, [{ volumeId }], filteredInputIds);

  //toolGroup!.addViewport(viewportId, RENDERING_ENGINE_ID);

  engine.renderViewport(viewportId);
};
