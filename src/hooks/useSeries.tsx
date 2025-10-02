import { getSeries } from 'api/api';
import { useAsync } from 'react-use';
import { Serie } from 'types';

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
