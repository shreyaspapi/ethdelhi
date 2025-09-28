'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Camera, Check, X, Search } from 'lucide-react';

interface RecognizeApiResponseMatch {
  ensDomain: string;
  ownerAddress: string;
  confidence: number;
  registeredAt?: string;
}

interface RecognizeApiResponse {
  success: boolean;
  match: RecognizeApiResponseMatch | null;
  message?: string;
}

export default function RecognizePage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isFaceAligned, setIsFaceAligned] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<RecognizeApiResponse | null>(null);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  // Redirect if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

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

  const stopCameraStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
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
    setRecognitionResult(null);
    setRecognitionError(null);
    // Restart camera for retaking photo
    requestCameraPermission();
  };

  const recognizeFace = async () => {
    if (!capturedImage) return;

    setIsRecognizing(true);
    setRecognitionError(null);

    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Create FormData
      const formData = new FormData();
      formData.append('image', blob, 'face.jpg');

      // Send to recognition API
      const apiResponse = await fetch('http://localhost:3001/recognize-face', {
        method: 'POST',
        body: formData,
      });

      if (apiResponse.ok) {
        const result = (await apiResponse.json()) as RecognizeApiResponse;
        setRecognitionResult(result);
        setCurrentSlide(2);
      } else {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || 'Recognition failed');
      }
    } catch (error) {
      console.error('Recognition error:', error);
      setRecognitionError(
        error instanceof Error ? error.message : 'Recognition failed'
      );
    } finally {
      setIsRecognizing(false);
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

    if (currentSlide < recognitionSlides.length - 1) {
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

  const recognitionSlides = [
    {
      id: 0,
      title: 'Face Recognition',
      description: 'Recognize a face and find the associated ENS domain',
      content: (
        <div className="space-y-4 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <div className="space-y-2">
            <p>
              We&apos;ll help you recognize a face and find the associated ENS domain:
            </p>
            <ul className="text-left space-y-2 mt-4">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Take a clear photo of the face to recognize
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Our AI will analyze the face
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Find the associated ENS domain
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 1,
      title: 'Capture Face Photo',
      description: capturedImage
        ? 'Review your photo'
        : 'Grant camera permission and capture the face to recognize',
      content: (
        <div className="space-y-4">
          {!capturedImage ? (
            <>
              <div className="text-center">
                <div className="text-6xl mb-4">📸</div>
                <p>
                  We need access to your camera to capture the face. Align
                  the face with the outline below. The border will turn green
                  when positioned correctly, then capture the photo.
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
                        ? '✅ Perfect! Face is well-aligned'
                        : '⏳ Please align the face with the outline'}
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
                  Review the captured photo. If it looks good, proceed to recognition.
                  Otherwise, retake it.
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
                <Button onClick={recognizeFace} disabled={isRecognizing}>
                  <Search className="w-4 h-4 mr-2" />
                  {isRecognizing ? 'Recognizing...' : 'Recognize Face'}
                </Button>
              </div>
            </>
          )}
        </div>
      ),
    },
    {
      id: 2,
      title: 'Recognition Results',
      description: 'Face recognition results',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🎯</div>
            <p>Face recognition completed!</p>
          </div>

          {recognitionError ? (
            <div className="p-4 border rounded-lg bg-destructive/10 border-destructive/20">
              <h4 className="font-semibold text-destructive mb-2">Recognition Error</h4>
              <p className="text-sm text-destructive">{recognitionError}</p>
              <Button 
                onClick={retakePhoto} 
                className="mt-2"
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          ) : recognitionResult ? (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-card">
                <h4 className="font-semibold mb-2">Recognition Results</h4>
                <div className="space-y-2">
                  {recognitionResult.message && (
                    <p><strong>Message:</strong> {recognitionResult.message}</p>
                  )}
                  {recognitionResult.match ? (
                    <>
                      <p><strong>ENS Domain:</strong> {recognitionResult.match.ensDomain}</p>
                      <p><strong>Owner Address:</strong> {recognitionResult.match.ownerAddress}</p>
                      <p>
                        <strong>Confidence:</strong>{' '}
                        {Number.isFinite(recognitionResult.match.confidence)
                          ? (recognitionResult.match.confidence * 100).toFixed(1) + '%'
                          : '—'}
                      </p>
                    </>
                  ) : (
                    <p>No matching face found.</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => recognitionResult.match && router.push(`/${recognitionResult.match.ensDomain}`)}
                  className="flex-1"
                  disabled={!recognitionResult.match}
                >
                  View Profile
                </Button>
                <Button 
                  onClick={retakePhoto} 
                  variant="outline"
                >
                  Recognize Another
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 border rounded-lg bg-card">
              <p className="text-center">No face found in the database.</p>
              <Button 
                onClick={retakePhoto} 
                className="mt-2 w-full"
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      ),
    },
  ];

  // Connect stream to video element
  useEffect(() => {
    if (stream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = stream;
      video.load();

      const handleLoadedMetadata = () => {
        console.log('Video metadata loaded');
      };

      const handleCanPlay = () => {
        video.play().catch((error) => {
          console.error('Failed to play video:', error);
        });
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('canplay', handleCanPlay);

      video.play().catch((error) => {
        console.error('Failed to play video immediately:', error);
      });

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('canplay', handleCanPlay);
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
            {recognitionSlides[currentSlide].title}
          </CardTitle>
          <p className="text-center text-muted-foreground">
            {recognitionSlides[currentSlide].description}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {recognitionSlides[currentSlide].content}

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
                {recognitionSlides.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentSlide ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>

              {currentSlide !== recognitionSlides.length - 1 && (
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
