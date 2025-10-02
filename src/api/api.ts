import { Instance, Serie, Study } from 'types';

export const getStudies = async (url: string): Promise<Study[]> => {
  try {
    const response = await fetch(`${url}/studies`);
    const data = (await response.json()) as Study[];
    return data || [];
  } catch (error) {
    console.error('Failed to fetch studies:', error);
    throw new Error('Failed to fetch studies');
  }
};

export const getSeries = async (url: string, studyInstanceUID: string): Promise<Serie[]> => {
  try {
    const response = await fetch(`${url}/studies/${studyInstanceUID}/series`);
    const data = (await response.json()) as Serie[];
    return data || [];
  } catch (error) {
    console.error('Failed to fetch series:', error);
    throw new Error('Failed to fetch series');
  }
};

// const firstFrameExists = async ({
//   apiUrl,
//   instances,
//   seriesInstanceUID,
//   studyInstanceUID,
// }: {
//   apiUrl: string;
//   studyInstanceUID: string;
//   seriesInstanceUID: string;
//   instances: Instance[];
// }) => {
//   const url = getWadoRsUrl({ apiUrl, studyInstanceUID, seriesInstanceUID, instances }).replace('wadors:', '');
//   try {
//     const response = await fetch(`${url}`);
//     return response.ok;
//   } catch (error) {
//     console.error('Failed to fetch series:', error);
//     return false;
//   }
// };

// const filterOutFrames = async ({
//   apiUrl,
//   instances,
//   seriesInstanceUID,
//   studyInstanceUID,
// }: {
//   apiUrl: string;
//   studyInstanceUID: string;
//   seriesInstanceUID: string;
//   instances: Instance[];
// }): Promise<Instance[]> => {
//   const filtered: Instance[] = [];
//   for (const instance of instances) {
//     const exists = await firstFrameExists({ apiUrl, studyInstanceUID, seriesInstanceUID, instances: [instance] });
//     if (exists) {
//       filtered.push(instance);
//     }
//   }
//   return filtered;
// };

export const getInstances = async (
  apiUrl: string,
  studyInstanceUID: string,
  seriesInstanceUID: string
): Promise<Instance[]> => {
  try {
    const response = await fetch(`${apiUrl}/studies/${studyInstanceUID}/series/${seriesInstanceUID}/metadata`);
    const data = (await response.json()) as Instance[];
    return data || [];
    // return filterOutFrames({ instances: data || [], apiUrl, seriesInstanceUID, studyInstanceUID });
  } catch (error) {
    console.error('Failed to fetch instances:', error);
    throw new Error('Failed to fetch instances');
  }
};
