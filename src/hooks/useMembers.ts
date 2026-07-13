import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from './useAuth';

export function useMembers() {
  const { listAccounts, session } = useAuth();

  const query = useQuery({
    queryKey: ['members'],
    queryFn: listAccounts,
    enabled: Boolean(session),
  });

  const memberMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const account of query.data ?? []) {
      map.set(account.id, account.username);
    }
    return map;
  }, [query.data]);

  function getMemberName(assigneeId: string | null): string | null {
    if (!assigneeId) return null;
    return memberMap.get(assigneeId) ?? null;
  }

  return {
    members: query.data ?? [],
    memberMap,
    getMemberName,
    loading: query.isLoading,
  };
}
