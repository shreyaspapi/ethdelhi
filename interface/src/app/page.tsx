'use client';

import { ActionButtonList } from '@/components/action-button-list';
import { ConnectButton } from '@/components/connect-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { InfoList } from '@/components/info-list';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { API_BASE_URL, ENS_LOOKUP_ENDPOINT } from '@/config';

export default function Home() {
  const { address, isConnected } = useAccount();
  const [ensData, setEnsData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch ENS data when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      fetchEnsData(address);
    } else {
      setEnsData(null);
      setError(null);
    }
  }, [isConnected, address]);

  const fetchEnsData = async (walletAddress: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}${ENS_LOOKUP_ENDPOINT}/${walletAddress}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setEnsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ENS data');
      setEnsData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans flex flex-col items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-10">
      <header className="w-full flex justify-end">
        <div className="flex items-center gap-4">
          <ConnectButton />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="w-full max-w-md space-y-2">
          <Label htmlFor="text-input">Enter your ENS</Label>
          <Input
            id="text-input"
            placeholder="E.g. kivous.eth"
            className="w-full"
          />
        </div>

        {/* ENS Data Display */}
        {isConnected && address && (
          <div className="w-full max-w-2xl space-y-4">
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="text-lg font-semibold mb-2">Connected Wallet</h3>
              <p className="text-sm text-muted-foreground font-mono break-all">
                {address}
              </p>
            </div>

            {loading && (
              <div className="p-4 border rounded-lg bg-card">
                <p className="text-center">Loading ENS data...</p>
              </div>
            )}

            {error && (
              <div className="p-4 border rounded-lg bg-destructive/10 border-destructive/20">
                <h4 className="font-semibold text-destructive mb-2">Error</h4>
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {ensData && !loading && !error && (
              <div className="p-4 border rounded-lg bg-card">
                <h4 className="font-semibold mb-2">ENS Data</h4>
                <pre className="text-sm bg-muted p-3 rounded overflow-auto">
                  {JSON.stringify(ensData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* <ActionButtonList /> */}
        {/* <InfoList /> */}
      </main>
    </div>
  );
}
