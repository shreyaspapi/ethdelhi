'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Home } from 'lucide-react';

export default function SuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Registration Successful!</CardTitle>
          <p className="text-muted-foreground">
            Your face has been successfully registered with your ENS domain.
          </p>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => router.push('/')} className="w-full">
            <Home className="w-4 h-4 mr-2" />
            Return Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
