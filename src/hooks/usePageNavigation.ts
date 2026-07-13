import { useEffect } from 'react';
import type { AppPage } from '../components/Footer';

export function usePageNavigation(page: AppPage): void {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [page]);
}
