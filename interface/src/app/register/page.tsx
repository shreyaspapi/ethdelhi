'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [isSigning, setIsSigning] = useState(false);
  const [messageSigned, setMessageSigned] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
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
      console.log('Camera stream obtained:', mediaStream);
      console.log('Stream tracks:', mediaStream.getTracks());
      setStream(mediaStream);
      setCameraPermission(true);
    } catch (error) {
      console.error('Camera permission denied:', error);
      setCameraPermission(false);
    }
  };

  const stopCameraStream = useCallback(() => {
    if (stream) {
      console.log('Stopping camera stream');
      stream.getTracks().forEach((track) => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      setStream(null);
      setCameraPermission(null);
    }
  }, [stream]);

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

    // Stop the camera stream after capturing the photo
    stopCameraStream();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    // Restart camera for retaking photo
    requestCameraPermission();
  };

  const proceedToSignature = () => {
    setCurrentSlide(2);
  };

  const handleSignMessage = async () => {
    console.log('handleSignMessage called');
    console.log('address:', address);
    console.log('ensData:', ensData);
    console.log('ensData?.ensName:', ensData?.ensName);

    if (!address || !ensData?.ensName) {
      console.log('Early return - missing address or ensData.ensName');
      return;
    }

    console.log('Starting signing process...');
    setIsSigning(true);
    try {
      const message =
        registrationMessage || `Registering face for ENS: ${ensData.ensName}`;

      console.log('Signing message:', message);
      // Use wagmi's signMessage hook with proper mutation handling
      signMessage(
        { message: message },
        {
          onSuccess: (signatureResult) => {
            console.log('onSuccess called with:', signatureResult);
            setSignature(signatureResult);
            setMessageSigned(true);
            setIsSigning(false);
            console.log('Message signed successfully:', signatureResult);
          },
          onError: (error) => {
            console.error('onError called with:', error);
            setIsSigning(false);
            alert(
              `Failed to sign message: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`
            );
          },
        }
      );
    } catch (error) {
      console.error('Signing error:', error);
      setIsSigning(false);
      alert(
        `Failed to sign message: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  };

  const registerFace = async () => {
    if (!capturedImage || !address || !ensData?.ensName || !signature) return;

    setIsRegistering(true);
    try {
      const message =
        registrationMessage || `Registering face for ENS: ${ensData.ensName}`;

      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Create FormData
      const formData = new FormData();
      formData.append('image', blob, 'face.jpg');
      formData.append('ensDomain', ensData.ensName as string);
      formData.append('signature', signature);
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
        router.push(`/${ensData.ensName}`);
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
    // Prevent navigation from camera step if permission is not granted
    if (currentSlide === 1 && cameraPermission !== true) {
      return;
    }

    // Stop camera stream when leaving the camera step
    if (currentSlide === 1 && stream) {
      stopCameraStream();
    }

    if (currentSlide < onboardingSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    // Stop camera stream when leaving the camera step
    if (currentSlide === 1 && stream) {
      stopCameraStream();
    }

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
      title: 'Take Your Photo',
      description: capturedImage
        ? 'Review your photo'
        : 'Grant camera permission and capture your registration photo',
      content: (
        <div className="space-y-4">
          {!capturedImage ? (
            <>
              <div className="text-center">
                <div className="text-6xl mb-4">📸</div>
                <p>
                  We need access to your camera to register your face. Align
                  your face with the outline below. The border will turn green
                  when you&apos;re positioned correctly, then capture your
                  photo.
                </p>
              </div>

              {/* Camera permission section */}
              {cameraPermission !== true && (
                <div className="text-center space-y-4">
                  {cameraPermission === false && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-red-600">
                        <X className="w-4 h-4" />
                        Camera permission denied. Please enable it in your
                        browser settings.
                      </div>
                      <Button
                        onClick={requestCameraPermission}
                        className="w-full max-w-md"
                        variant={'outline'}
                      >
                        Retry Camera Permission
                      </Button>
                    </div>
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
              )}

              {/* Camera feed and capture section */}
              {cameraPermission === true && (
                <>
                  <div className="relative w-full max-w-md mx-auto">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full rounded-lg bg-black"
                      style={{ transform: 'scaleX(-1)' }}
                    />

                    {/* Face alignment indicator around the video */}
                    <div
                      className={`absolute inset-0 border-4 rounded-lg transition-all duration-300 pointer-events-none ${
                        isFaceAligned
                          ? 'border-green-500 shadow-lg shadow-green-500/50'
                          : 'border-white/50'
                      }`}
                    />

                    {!stream && cameraPermission && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                        <p className="text-white">Starting camera...</p>
                      </div>
                    )}
                  </div>

                  <div className="text-center space-y-3">
                    <p
                      className={`text-sm ${
                        isFaceAligned ? 'text-green-600' : 'text-orange-600'
                      }`}
                    >
                      {isFaceAligned
                        ? '✅ Perfect! Your face is well-aligned'
                        : '⏳ Please align your face with the outline'}
                    </p>

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
              )}
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
      id: 2,
      title: 'Final Step',
      description: 'Sign a message to verify your ENS domain ownership',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-6xl mb-4">✍️</div>
            <p>
              Add a personal message and sign it to verify your ENS domain
              ownership. This signature will be used to complete your
              registration.
            </p>
          </div>

          {ensData?.ensName && typeof ensData.ensName === 'string' ? (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Registering for ENS domain:
              </p>
              <p className="font-semibold">{ensData.ensName}</p>
            </div>
          ) : null}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Personal Message (required)
              </label>
              <textarea
                value={registrationMessage}
                onChange={(e) => setRegistrationMessage(e.target.value)}
                placeholder="Enter a personal message for your registration..."
                className="w-full p-3 border rounded-lg resize-none"
                rows={3}
                required
              />
            </div>

            {!messageSigned ? (
              <div className="space-y-2">
                <Button
                  onClick={handleSignMessage}
                  disabled={
                    isSigning ||
                    !registrationMessage.trim() ||
                    !ensData?.ensName
                  }
                  className="w-full"
                >
                  {isSigning ? 'Signing Message...' : 'Sign Message'}
                </Button>
                <div className="text-xs text-muted-foreground">
                  Debug: isSigning={isSigning.toString()}, hasMessage=
                  {registrationMessage.trim().length > 0}, hasEnsName=
                  {!!ensData?.ensName}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-600 p-4 bg-green-50 rounded-lg">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">
                    Message signed successfully!
                  </span>
                </div>
                <Button
                  onClick={registerFace}
                  disabled={isRegistering}
                  className="w-full"
                >
                  {isRegistering
                    ? 'Completing Registration...'
                    : 'Complete Registration'}
                </Button>
              </div>
            )}
          </div>
        </div>
      ),
    },
  ];

  // Connect stream to video element
  useEffect(() => {
    if (stream && videoRef.current) {
      console.log('Connecting stream to video element');
      console.log('Video element:', videoRef.current);
      console.log('Stream:', stream);
      console.log('Stream tracks:', stream.getTracks());

      const video = videoRef.current;

      // Set the stream source
      video.srcObject = stream;

      // Force load the video
      video.load();

      const handleLoadedMetadata = () => {
        console.log('Video metadata loaded');
        console.log(
          'Video dimensions:',
          video.videoWidth,
          'x',
          video.videoHeight
        );
        console.log('Video ready state:', video.readyState);
      };

      const handleCanPlay = () => {
        console.log('Video can play');
        // Force play when ready
        video.play().catch((error) => {
          console.error('Failed to play video:', error);
        });
      };

      const handlePlay = () => {
        console.log('Video started playing');
      };

      const handleError = (e: Event) => {
        console.error('Video error:', e);
      };

      const handleLoadedData = () => {
        console.log('Video data loaded');
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('play', handlePlay);
      video.addEventListener('error', handleError);

      // Try to play immediately
      video.play().catch((error) => {
        console.error('Failed to play video immediately:', error);
      });

      // Cleanup event listeners
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('error', handleError);
      };
    }
  }, [stream]);

  // Simulate face alignment detection
  useEffect(() => {
    if (stream && currentSlide === 1) {
      const interval = setInterval(() => {
        // This is a simplified check - in a real app you'd use face detection
        setIsFaceAligned(true);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [stream, currentSlide]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stream, stopCameraStream]);

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

              {currentSlide !== onboardingSlides.length - 1 && (
                <Button
                  onClick={nextSlide}
                  disabled={currentSlide === 1 && cameraPermission !== true}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
