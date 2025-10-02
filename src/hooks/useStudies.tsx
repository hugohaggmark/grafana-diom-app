import { getStudies } from 'api/api';
import { useAsync } from 'react-use';
import { Study } from 'types';

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
