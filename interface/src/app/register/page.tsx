'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Camera, Check, X } from 'lucide-react';

interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  content: React.ReactNode;
}

export default function RegisterPage() {
  const { address, isConnected } = useAccount();
  const { signMessage } = useSignMessage();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(
    null
  );
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isFaceAligned, setIsFaceAligned] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [ensData, setEnsData] = useState<Record<string, unknown> | null>(null);

  // Redirect if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  // Fetch ENS data when connected
  useEffect(() => {
    if (isConnected && address) {
      fetchEnsData(address);
    }
  }, [isConnected, address]);

  const fetchEnsData = async (walletAddress: string) => {
    try {
      const response = await fetch(
        `http://localhost:3001/ens-lookup/${walletAddress}`
      );
      if (response.ok) {
        const data = await response.json();
        setEnsData(data);
      }
    } catch (error) {
      console.error('Failed to fetch ENS data:', error);
    }
  };

  const requestCameraPermission = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });
      setStream(mediaStream);
      setCameraPermission(true);
    } catch (error) {
      console.error('Camera permission denied:', error);
      setCameraPermission(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Flip the image horizontally to match the video preview
    context.scale(-1, 1);
    context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    setIsCapturing(false);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const proceedToSignature = () => {
    setCurrentSlide(5);
  };

  const registerFace = async () => {
    if (!capturedImage || !address || !ensData?.name) return;

    setIsRegistering(true);
    try {
      // First, sign the message
      const message =
        registrationMessage || `Registering face for ENS: ${ensData.name}`;
      const signatureResult = await signMessage({ message });

      if (typeof signatureResult !== 'string') {
        throw new Error('Failed to sign message');
      }

      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Create FormData
      const formData = new FormData();
      formData.append('image', blob, 'face.jpg');
      formData.append('ensDomain', ensData.name as string);
      formData.append('signature', signatureResult);
      formData.append('message', message);

      // Send to API
      const apiResponse = await fetch('/api/register-face', {
        method: 'POST',
        body: formData,
      });

      if (apiResponse.ok) {
        const result = await apiResponse.json();
        console.log('Registration successful:', result);
        // Navigate to the user's profile page
        router.push(`/${ensData.name}`);
      } else {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      // Handle error - you might want to show an error message to the user
      alert(
        `Registration failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    } finally {
      setIsRegistering(false);
    }
  };

  const nextSlide = () => {
    // Prevent navigation from camera permission slide if permission is not granted
    if (currentSlide === 1 && cameraPermission !== true) {
      return;
    }

    if (currentSlide < onboardingSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const onboardingSlides: OnboardingSlide[] = [
    {
      id: 0,
      title: 'Welcome to Face Registration',
      description: "Let's get you registered with your ENS domain",
      content: (
        <div className="space-y-4 text-center">
          <div className="text-6xl mb-4">📸</div>
          <div className="space-y-2">
            <p>
              We&apos;ll help you register your face with your ENS domain in a
              few simple steps:
            </p>
            <ul className="text-left space-y-2 mt-4">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Take a clear photo of your face
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Verify your ENS domain ownership
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Link your face to your ENS record
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 1,
      title: 'Camera Permission',
      description: 'We need access to your camera to take your photo',
      content: (
        <div className="space-y-4 text-center">
          <div className="text-6xl mb-4">📷</div>
          <div className="space-y-2">
            <p>To register your face, we need to access your camera.</p>
            <p className="text-sm text-muted-foreground">
              Your photo will only be used for face recognition and will be
              securely stored.
            </p>
            <div className="space-y-4">
              {cameraPermission === true && (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <Check className="w-4 h-4" />
                  Camera permission granted!
                </div>
              )}
              {cameraPermission === false && (
                <Button
                  onClick={requestCameraPermission}
                  className="w-full max-w-md"
                  variant={'outline'}
                >
                  Retry Camera Permission
                </Button>
              )}

              {cameraPermission === null && (
                <Button
                  onClick={requestCameraPermission}
                  className="w-full max-w-md"
                  variant={'default'}
                >
                  Grant Camera Permission
                </Button>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: 'Camera Quality Check',
      description: "Let's make sure your camera is working properly",
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🔍</div>
            <p>We&apos;ll check if your camera feed is clear and well-lit.</p>
          </div>
          {stream && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-w-md mx-auto rounded-lg"
                style={{ transform: 'scaleX(-1)' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white rounded-full opacity-50"></div>
              </div>
            </div>
          )}
          {!stream && cameraPermission && (
            <div className="text-center">
              <p className="text-muted-foreground">Starting camera...</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 3,
      title: 'Face Alignment',
      description: 'Position your face within the outline for the best photo',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-6xl mb-4">👤</div>
            <p>
              Align your face with the outline. The border will turn green when
              you&apos;re positioned correctly.
            </p>
          </div>
          {stream && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-w-md mx-auto rounded-lg"
                style={{ transform: 'scaleX(-1)' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={`w-48 h-48 border-4 rounded-full transition-colors duration-300 ${
                    isFaceAligned ? 'border-green-500' : 'border-white'
                  } opacity-70`}
                ></div>
              </div>
            </div>
          )}
          <div className="text-center">
            <p
              className={`text-sm ${
                isFaceAligned ? 'text-green-600' : 'text-orange-600'
              }`}
            >
              {isFaceAligned
                ? '✅ Perfect! Your face is well-aligned'
                : '⏳ Please align your face with the outline'}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: 'Capture Photo',
      description: capturedImage
        ? 'Review your photo'
        : 'Take your registration photo',
      content: (
        <div className="space-y-4">
          {!capturedImage ? (
            <>
              <div className="text-center">
                <div className="text-6xl mb-4">📸</div>
                <p>
                  When you&apos;re ready, click the capture button to take your
                  photo.
                </p>
              </div>
              {stream && (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-w-md mx-auto rounded-lg"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className={`w-48 h-48 border-4 rounded-full transition-colors duration-300 ${
                        isFaceAligned ? 'border-green-500' : 'border-white'
                      } opacity-70`}
                    ></div>
                  </div>
                </div>
              )}
              <div className="text-center">
                <Button
                  onClick={capturePhoto}
                  disabled={!isFaceAligned || isCapturing}
                  className="w-full max-w-md"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {isCapturing ? 'Capturing...' : 'Capture Photo'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <div className="text-6xl mb-4">🖼️</div>
                <p>
                  Review your photo. If you&apos;re happy with it, click
                  continue. Otherwise, retake it.
                </p>
              </div>
              <div className="relative">
                <Image
                  src={capturedImage}
                  alt="Captured photo"
                  width={400}
                  height={400}
                  className="w-full max-w-md mx-auto rounded-lg"
                />
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={retakePhoto}>
                  <X className="w-4 h-4 mr-2" />
                  Retake
                </Button>
                <Button onClick={proceedToSignature}>
                  <Check className="w-4 h-4 mr-2" />
                  Continue
                </Button>
              </div>
            </>
          )}
        </div>
      ),
    },
    {
      id: 5,
      title: 'Final Step',
      description: 'Sign a message to verify your ENS domain ownership',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-6xl mb-4">✍️</div>
            <p>
              Add a personal message and sign it to verify your ENS domain
              ownership.
            </p>
          </div>

          {ensData?.name && typeof ensData.name === 'string' ? (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Registering for ENS domain:
              </p>
              <p className="font-semibold">{ensData.name}</p>
            </div>
          ) : null}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Personal Message (optional)
              </label>
              <textarea
                value={registrationMessage}
                onChange={(e) => setRegistrationMessage(e.target.value)}
                placeholder="Enter a personal message for your registration..."
                className="w-full p-3 border rounded-lg resize-none"
                rows={3}
              />
            </div>
            <Button
              onClick={registerFace}
              disabled={isRegistering || !ensData?.name}
              className="w-full"
            >
              {isRegistering ? 'Registering...' : 'Complete Registration'}
            </Button>
          </div>
        </div>
      ),
    },
  ];

  // Simulate face alignment detection
  useEffect(() => {
    if (stream && currentSlide === 3) {
      const interval = setInterval(() => {
        // This is a simplified check - in a real app you'd use face detection
        setIsFaceAligned(Math.random() > 0.5);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [stream, currentSlide]);

  if (!isConnected) {
    return <div>Please connect your wallet first.</div>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center">
            {onboardingSlides[currentSlide].title}
          </CardTitle>
          <p className="text-center text-muted-foreground">
            {onboardingSlides[currentSlide].description}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {onboardingSlides[currentSlide].content}

            <div className="flex justify-between items-center pt-4">
              <Button
                variant="outline"
                onClick={prevSlide}
                disabled={currentSlide === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex space-x-2">
                {onboardingSlides.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentSlide ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={nextSlide}
                disabled={
                  currentSlide === onboardingSlides.length - 1 ||
                  (currentSlide === 1 && cameraPermission !== true)
                }
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
