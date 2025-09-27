'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useClientMounted } from '@/hooks/useClientMounted';

export const ConnectButton = () => {
  const mounted = useClientMounted();
  return (
    <>
      {mounted ? (
        <div className="flex items-center gap-2">
          <appkit-network-button />
          <appkit-button />
        </div>
      ) : (
        <Skeleton className="h-[40px] w-[160px] rounded-lg" />
      )}
    </>
  );
};
