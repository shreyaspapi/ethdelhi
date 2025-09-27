'use client';

import { ActionButtonList } from '@/components/action-button-list';
import { InfoList } from '@/components/info-list';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  API_BASE_URL,
  ENS_LOOKUP_ENDPOINT,
  FACE_BY_ENS_ENDPOINT,
} from '@/config';

export default function Home() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [ensData, setEnsData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceData, setFaceData] = useState<Record<string, unknown> | null>(
    null
  );
  const [faceLoading, setFaceLoading] = useState(false);
  const [faceError, setFaceError] = useState<string | null>(null);

  // Fetch ENS data when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      fetchEnsData(address);
    } else {
      setEnsData(null);
      setError(null);
      setFaceData(null);
      setFaceError(null);
    }
  }, [isConnected, address]);

  // Check face data when ENS data is available
  useEffect(() => {
    if (ensData && ensData.name && typeof ensData.name === 'string') {
      checkFaceData(ensData.name);
    } else {
      setFaceData(null);
      setFaceError(null);
    }
  }, [ensData]);

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

  const checkFaceData = async (ensDomain: string) => {
    setFaceLoading(true);
    setFaceError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}${FACE_BY_ENS_ENDPOINT}/${ensDomain}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          // No face data found - user is not registered
          setFaceData(null);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
        const data = await response.json();
        setFaceData(data);
      }
    } catch (err) {
      console.error('Failed to check face data:', err);
      setFaceError(
        err instanceof Error ? err.message : 'Failed to fetch face data'
      );
      setFaceData(null);
    } finally {
      setFaceLoading(false);
    }
  };

  const handleNavigation = () => {
    if (ensData && ensData.ensName && typeof ensData.ensName === 'string') {
      const ensName = ensData.ensName;
      if (faceData) {
        // Navigate to profile page - user has face data (registered)
        router.push(`/${ensName}`);
      } else {
        // Navigate to registration page - no face data (not registered)
        router.push('/register');
      }
    }
  };

  return (
    <div className="font-sans flex flex-col items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-10">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
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
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-card">
                  <h4 className="font-semibold mb-2">ENS Data</h4>
                  <pre className="text-sm bg-muted p-3 rounded overflow-auto">
                    {JSON.stringify(ensData, null, 2)}
                  </pre>
                </div>

                {/* Face Data Status */}
                {faceLoading ? (
                  <div className="p-4 border rounded-lg bg-card">
                    <p className="text-center">Checking face data...</p>
                  </div>
                ) : faceError ? (
                  <div className="p-4 border rounded-lg bg-destructive/10 border-destructive/20">
                    <h4 className="font-semibold text-destructive mb-2">
                      Face Data Error
                    </h4>
                    <p className="text-sm text-destructive">{faceError}</p>
                  </div>
                ) : (
                  <div className="p-4 border rounded-lg bg-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold mb-1">
                          Registration Status
                        </h4>
                        <p
                          className={`text-sm ${
                            faceData ? 'text-green-600' : 'text-orange-600'
                          }`}
                        >
                          {faceData
                            ? '✅ Registered (Face data found)'
                            : '❌ Not Registered (No face data)'}
                        </p>
                      </div>
                      <Button
                        onClick={handleNavigation}
                        disabled={!ensData?.ensName}
                        className="ml-4"
                      >
                        {faceData ? 'View Profile' : 'Register'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Face Data Display */}
                {faceData && (
                  <div className="p-4 border rounded-lg bg-card">
                    <h4 className="font-semibold mb-2">Face Data</h4>
                    <pre className="text-sm bg-muted p-3 rounded overflow-auto">
                      {JSON.stringify(faceData, null, 2)}
                    </pre>
                  </div>
                )}
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
