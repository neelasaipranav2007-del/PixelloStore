"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  Upload,
  X,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  Gift,
  ArrowRight,
  Eye,
  SlidersHorizontal,
  SwitchCamera,
  Maximize2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/CartContext";
import { useHamper } from "@/context/HamperContext";
import { VisualSearchResultItem, DetectedVisualFeatures } from "@/lib/visualSearch";

interface VisualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_SAMPLE_PHOTOS = [
  { label: "Wooden Photo Frame", url: "/images/wooden_frame_main.png", tag: "Frames" },
  { label: "Custom Polaroid Set", url: "/images/polaroid_set.png", tag: "Polaroids" },
  { label: "Magic Photo Mug", url: "/images/custom_mug.png", tag: "Mugs" },
  { label: "LED Acrylic Lamp", url: "/images/led_acrylic_lamp.png", tag: "LED" },
  { label: "Music Plaque", url: "/images/spotify_plaque.png", tag: "Gifts" },
  { label: "Photo Keychain", url: "/images/keychain.png", tag: "Gifts" },
];

const SCANNING_STEPS = [
  "Analyzing image colors and composition...",
  "Comparing directly with Pixello product photos...",
  "Matching visual likeness with catalog items...",
  "Finding closest matching products...",
];

export default function VisualSearchModal({ isOpen, onClose }: VisualSearchModalProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { addToHamper } = useHamper();

  const [activeTab, setActiveTab] = useState<"upload" | "camera">("upload");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ name: string; size: string; format: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [scanningStepIndex, setScanningStepIndex] = useState(0);

  // Camera states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasCameraSupport, setHasCameraSupport] = useState<boolean>(true);

  // Search Results
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<VisualSearchResultItem[]>([]);
  const [detectedFeatures, setDetectedFeatures] = useState<DetectedVisualFeatures | null>(null);
  const [hasCloseMatch, setHasCloseMatch] = useState(true);

  // Cart / Hamper interaction feedback
  const [addedCartMap, setAddedCartMap] = useState<Record<string, boolean>>({});
  const [addedHamperMap, setAddedHamperMap] = useState<Record<string, boolean>>({});

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deviceCameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Check camera support on mount
  useEffect(() => {
    if (typeof navigator !== "undefined" && !navigator.mediaDevices?.getUserMedia) {
      setHasCameraSupport(false);
    }
  }, []);

  // Ensure video stream is attached as soon as isCameraActive is true
  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((e) => console.warn("Video play error:", e));
    }
  }, [isCameraActive]);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsCameraLoading(false);
  }, []);

  // Clean up camera when modal closes or unmounts
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      // Reset search states if closed
      setSelectedImage(null);
      setImageMeta(null);
      setErrorMessage(null);
      setCameraError(null);
      setHasSearched(false);
      setResults([]);
      setDetectedFeatures(null);
      setActiveTab("upload");
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, stopCamera]);

  // Animated scanning step switcher
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching) {
      interval = setInterval(() => {
        setScanningStepIndex((prev) => (prev + 1) % SCANNING_STEPS.length);
      }, 700);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  // Start Camera with resilient fallback constraints
  const startCamera = async (targetFacingMode: "user" | "environment" = facingMode) => {
    setCameraError(null);
    setIsCameraLoading(true);

    // Stop previous track if active
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API is not supported in this browser. Please use the device camera or file upload.");
      }

      let stream: MediaStream | null = null;

      // Attempt 1: Try with preferred facingMode (front or rear)
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: targetFacingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (err1) {
        console.warn("Camera constraint attempt 1 failed, retrying with fallback:", err1);
        // Attempt 2: Fall back to general video constraint (works on all desktop webcams)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      if (!stream) {
        throw new Error("Could not initialize video stream from camera.");
      }

      streamRef.current = stream;
      setIsCameraActive(true);
      setIsCameraLoading(false);
      setFacingMode(targetFacingMode);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn("Video play notice:", playErr);
        }
      }
    } catch (err: any) {
      console.warn("Camera access error:", err);
      setIsCameraActive(false);
      setIsCameraLoading(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError(
          "Camera permission was denied. Please allow camera access in your browser address bar icon, or use the device camera button below."
        );
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No camera device was detected on your computer or phone. Please use the device camera or upload an image file.");
      } else {
        setCameraError(`Camera notice: ${err.message || "Could not open camera"}. You can still use the system camera or upload an image below.`);
      }
    }
  };

  // Toggle Camera Front / Back
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    startCamera(nextMode);
  };

  // Capture photo from video feed
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip horizontally if front-facing user camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

    // Turn camera off immediately after taking photo
    stopCamera();

    setSelectedImage(dataUrl);
    setImageMeta({
      name: `Photo_${new Date().toLocaleTimeString().replace(/:/g, "-")}.jpg`,
      size: `${Math.round((dataUrl.length * 3) / 4 / 1024)} KB`,
      format: "JPEG (Camera Photo)",
    });
    setErrorMessage(null);
    // Automatically perform visual search immediately on capture
    handlePerformVisualSearch(dataUrl);
  };

  // Validate and handle file upload
  const handleFileProcess = (file: File) => {
    setErrorMessage(null);
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMessage("Please select a valid image file (JPG, JPEG, PNG, or WebP).");
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setErrorMessage(`The selected image is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose an image under 10MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setSelectedImage(result);
        setImageMeta({
          name: file.name,
          size: `${Math.round(file.size / 1024)} KB`,
          format: file.type.replace("image/", "").toUpperCase(),
        });
        // Automatically perform visual search immediately on upload
        handlePerformVisualSearch(result);
      }
    };
    reader.onerror = () => {
      setErrorMessage("Failed to read image file. Please try another photo.");
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Select preset sample
  const handleSelectSample = async (sampleUrl: string, sampleLabel: string) => {
    setSelectedImage(sampleUrl);
    setImageMeta({
      name: `${sampleLabel}.png`,
      size: "Catalog Sample",
      format: "PNG",
    });
    setErrorMessage(null);
    // Automatically perform visual search immediately on sample click
    handlePerformVisualSearch(sampleUrl);
  };

  // Execute AI visual search
  const handlePerformVisualSearch = async (imageOverride?: string) => {
    const targetImage = imageOverride || selectedImage;
    if (!targetImage) return;

    setIsSearching(true);
    setErrorMessage(null);
    setScanningStepIndex(0);

    try {
      let payload: any = {};
      if (targetImage.startsWith("data:")) {
        payload = { imageBase64: targetImage };
      } else {
        payload = { imageUrl: targetImage };
      }

      const res = await fetch("/api/search/visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Visual search failed. Please try again with a clearer image.");
      }

      setResults(data.results || []);
      setDetectedFeatures(data.detectedFeatures || null);
      setHasCloseMatch(data.hasCloseMatch ?? true);
      setHasSearched(true);
    } catch (err: any) {
      console.error("Visual search error:", err);
      setErrorMessage(err.message || "Failed to analyze image. Please try again with another photo.");
    } finally {
      setIsSearching(false);
    }
  };

  // Add to cart handler
  const handleAddToCart = async (product: VisualSearchResultItem) => {
    try {
      await addToCart({
        id: product.id,
        name: product.name,
        size: "Standard",
        price: product.price,
        quantity: 1,
        image: product.image,
      });
      setAddedCartMap((prev) => ({ ...prev, [product.id]: true }));
      setTimeout(() => {
        setAddedCartMap((prev) => ({ ...prev, [product.id]: false }));
      }, 2500);
    } catch (e) {
      console.error("Failed to add to cart:", e);
    }
  };

  // Add to hamper handler
  const handleAddToHamper = (product: VisualSearchResultItem) => {
    try {
      addToHamper({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
      });
      setAddedHamperMap((prev) => ({ ...prev, [product.id]: true }));
      setTimeout(() => {
        setAddedHamperMap((prev) => ({ ...prev, [product.id]: false }));
      }, 2500);
    } catch (e) {
      console.error("Failed to add to hamper:", e);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl border border-[#EFE6DD] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-5 md:px-7 border-b border-[#EFE6DD] bg-gradient-to-r from-white via-[#FFF8F2] to-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-[#FFF8F2] border border-[#D89A86]/40 text-[#D89A86] flex items-center justify-center shadow-2xs">
              <Camera className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-brand text-xl sm:text-2xl font-bold text-[#3A2B24]">
                  Visual Product Search
                </h3>
              </div>
              <p className="text-xs text-[#6C5C54] mt-0.5 font-medium">
                Upload or capture any photo to instantly discover matching frames, polaroids &amp; custom gifts.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-[#FAF7F4] hover:bg-rose-50 text-[#6C5C54] hover:text-rose-600 border border-[#EFE6DD] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            title="Close visual search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* MODAL SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-5 md:p-7 space-y-6">
          {/* ERROR ALERT */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5 shadow-2xs">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-600 hover:text-rose-800"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* STEP 1: IMAGE SELECTION (UPLOAD OR CAMERA) - SHOWN WHEN NO IMAGE SELECTED */}
          {!selectedImage && (
            <div className="space-y-5">
              {/* TAB SELECTOR: UPLOAD VS CAMERA */}
              <div className="flex p-1 bg-[#FAF7F4] rounded-2xl border border-[#EFE6DD] max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setActiveTab("upload");
                  }}
                  className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === "upload"
                      ? "bg-white text-[#3A2B24] shadow-xs border border-[#EFE6DD]"
                      : "text-[#6C5C54] hover:text-[#3A2B24]"
                  }`}
                >
                  <Upload className="h-4 w-4 text-[#D89A86]" />
                  <span>Upload Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("camera");
                    startCamera();
                  }}
                  className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === "camera"
                      ? "bg-white text-[#3A2B24] shadow-xs border border-[#EFE6DD]"
                      : "text-[#6C5C54] hover:text-[#3A2B24]"
                  }`}
                >
                  <Camera className="h-4 w-4 text-[#D89A86]" />
                  <span>Take a Photo</span>
                </button>
              </div>

              {/* TAB 1: FILE DRAG & DROP UPLOAD */}
              {activeTab === "upload" && (
                <div
                  ref={dropZoneRef}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#D89A86]/50 hover:border-[#D89A86] bg-[#FFF8F2]/40 hover:bg-[#FFF8F2]/80 rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer group flex flex-col items-center justify-center gap-4"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileProcess(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <div className="h-16 w-16 rounded-3xl bg-white border border-[#D89A86]/30 flex items-center justify-center text-[#D89A86] shadow-sm group-hover:scale-110 group-hover:bg-[#FFF8F2] transition-transform">
                    <Upload className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="font-serif-brand text-lg font-bold text-[#3A2B24]">
                      Drag &amp; drop an image here, or{" "}
                      <span className="text-[#D89A86] underline decoration-2 underline-offset-4">
                        browse files
                      </span>
                    </h4>
                    <p className="text-xs text-[#6C5C54] mt-1 font-medium">
                      Supports JPG, JPEG, PNG, or WebP files up to 10MB
                    </p>
                  </div>
                  <input
                    ref={deviceCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileProcess(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button
                      type="button"
                      className="btn-pixello-primary text-xs font-bold rounded-full px-5 h-9 shadow-xs cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      <Upload className="h-3.5 w-3.5 mr-1.5" /> Select Photo from Device
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border border-[#D89A86] bg-white hover:bg-[#FFF8F2] text-[#3A2B24] text-xs font-bold px-5 h-9 shadow-xs cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        // On touch / mobile devices, native camera capture is instant and reliable
                        if (typeof window !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
                          deviceCameraInputRef.current?.click();
                        } else {
                          setActiveTab("camera");
                          startCamera();
                        }
                      }}
                    >
                      <Camera className="h-3.5 w-3.5 mr-1.5 text-[#D89A86]" /> Use Camera
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 2: LIVE CAMERA VIEWFINDER */}
              {activeTab === "camera" && (
                <div className="flex flex-col items-center justify-center gap-4 bg-[#FAF7F4] border border-[#EFE6DD] rounded-3xl p-4 sm:p-6 text-center">
                  <input
                    ref={deviceCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileProcess(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  {cameraError ? (
                    <div className="p-6 text-center space-y-3 max-w-md bg-white rounded-2xl border border-rose-200 shadow-xs">
                      <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                        <AlertCircle className="h-6 w-6" />
                      </div>
                      <h4 className="font-bold text-sm text-[#3A2B24]">Camera Access Needed</h4>
                      <p className="text-xs text-[#6C5C54] leading-relaxed">{cameraError}</p>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                        <Button
                          type="button"
                          onClick={() => deviceCameraInputRef.current?.click()}
                          className="btn-pixello-primary text-xs font-bold rounded-full px-5 h-9 cursor-pointer w-full sm:w-auto shadow-xs"
                        >
                          <Camera className="h-3.5 w-3.5 mr-1.5" /> Take Photo with Device Camera
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setActiveTab("upload")}
                          className="text-xs font-bold rounded-full px-4 h-9 border-[#EFE6DD] hover:bg-[#FFF8F2] w-full sm:w-auto cursor-pointer"
                        >
                          <Upload className="h-3.5 w-3.5 mr-1.5" /> Select Image File
                        </Button>
                      </div>
                    </div>
                  ) : isCameraLoading ? (
                    <div className="p-10 text-center space-y-4">
                      <div className="h-14 w-14 rounded-full bg-[#FFF8F2] border border-[#D89A86]/40 flex items-center justify-center text-[#D89A86] mx-auto animate-pulse">
                        <Camera className="h-7 w-7" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#3A2B24]">Connecting to Camera...</h4>
                        <p className="text-xs text-[#6C5C54] mt-1">
                          If prompted by your browser, please click <strong>Allow</strong> to enable webcam access.
                        </p>
                      </div>
                    </div>
                  ) : !isCameraActive ? (
                    <div className="p-6 sm:p-8 text-center space-y-3">
                      <div className="h-14 w-14 rounded-3xl bg-white border border-[#D89A86]/30 flex items-center justify-center text-[#D89A86] mx-auto shadow-xs">
                        <Camera className="h-7 w-7" />
                      </div>
                      <h4 className="font-bold text-base text-[#3A2B24]">Start Your Camera</h4>
                      <p className="text-xs text-[#6C5C54] max-w-sm mx-auto">
                        Take a live photo of your picture frame, polaroid prints, or custom gift to find matching items.
                      </p>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                        <Button
                          type="button"
                          onClick={() => startCamera()}
                          className="btn-pixello-primary text-xs font-bold rounded-full px-6 h-11 shadow-md cursor-pointer w-full sm:w-auto active:scale-95 transition-all"
                        >
                          <Camera className="h-4 w-4 mr-2" /> Open Live Camera Viewfinder
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => deviceCameraInputRef.current?.click()}
                          className="rounded-full border border-[#D89A86] bg-white hover:bg-[#FFF8F2] text-[#3A2B24] text-xs font-bold px-5 h-11 shadow-xs cursor-pointer w-full sm:w-auto"
                        >
                          <Camera className="h-4 w-4 mr-2 text-[#D89A86]" /> Take Photo with Device Camera
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full max-w-lg rounded-2xl overflow-hidden bg-black flex flex-col items-center justify-center shadow-lg border border-[#3A2B24]/20">
                      <div className="relative w-full aspect-video sm:aspect-4/3 min-h-[260px] sm:min-h-[340px] bg-black overflow-hidden flex items-center justify-center">
                        <video
                          ref={(el) => {
                            videoRef.current = el;
                            if (el) {
                              el.muted = true;
                              el.playsInline = true;
                              if (streamRef.current && el.srcObject !== streamRef.current) {
                                el.srcObject = streamRef.current;
                                el.play().catch(() => {});
                              }
                            }
                          }}
                          onLoadedMetadata={(e) => {
                            const v = e.currentTarget;
                            v.muted = true;
                            v.playsInline = true;
                            v.play().catch(() => {});
                          }}
                          playsInline
                          autoPlay
                          muted
                          className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
                        />

                        {/* Optical viewfinder focus reticle */}
                        <div className="absolute inset-6 sm:inset-10 border-2 border-white/60 border-dashed rounded-2xl pointer-events-none flex items-center justify-center">
                          <div className="text-[10px] font-bold text-white/90 bg-black/60 px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-xs shadow-xs">
                            Position Product or Photo Inside
                          </div>
                        </div>
                      </div>

                      {/* Camera control buttons overlay */}
                      <div className="p-3 bg-[#2A1E18] w-full flex items-center justify-between px-4 sm:px-6">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleToggleFacingMode}
                          className="rounded-full bg-white/10 hover:bg-white/20 text-white border-white/30 h-10 px-3 text-xs shadow-md cursor-pointer"
                          title="Switch front / rear camera"
                        >
                          <SwitchCamera className="h-4 w-4 mr-1.5" />
                          <span className="hidden sm:inline">Flip Camera</span>
                        </Button>

                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#D89A86] hover:bg-[#c78672] text-white font-bold text-xs sm:text-sm shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white"
                          title="Click to take photo"
                        >
                          <Camera className="h-4 w-4" />
                          <span>Capture Photo</span>
                        </button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={stopCamera}
                          className="rounded-full bg-white/10 hover:bg-white/20 text-white border-white/30 h-10 w-10 p-0 shadow-md cursor-pointer"
                          title="Cancel live camera"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SAMPLE CATALOG PHOTOS (1-CLICK TEST) */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider block text-center">
                  Or Test Instantly With These Catalog Sample Photos:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {PRESET_SAMPLE_PHOTOS.map((sample) => (
                    <button
                      key={sample.label}
                      type="button"
                      onClick={() => handleSelectSample(sample.url, sample.label)}
                      className="p-2 rounded-2xl border border-[#EFE6DD] hover:border-[#D89A86] bg-white hover:bg-[#FFF8F2] text-left transition-all cursor-pointer group flex items-center gap-2.5 shadow-2xs"
                    >
                      <div className="h-11 w-11 rounded-xl overflow-hidden bg-[#FAF7F4] border border-[#EFE6DD] shrink-0">
                        <img
                          src={sample.url}
                          alt={sample.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#3A2B24] truncate group-hover:text-[#D89A86] transition-colors">
                          {sample.label}
                        </p>
                        <span className="text-[10px] text-[#D89A86] font-semibold">{sample.tag}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: IMAGE PREVIEW & ACTIONS (SHOWN ONCE AN IMAGE IS SELECTED) */}
          {selectedImage && (
            <div className="space-y-6">
              {/* IMAGE PREVIEW CARD */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-[#FFF8F2] via-[#FAF3EC] to-[#F5ECE3] rounded-3xl border border-[#D89A86]/30 flex flex-col sm:flex-row items-center gap-5 shadow-2xs">
                <div className="relative h-32 w-32 sm:h-36 sm:w-36 rounded-2xl overflow-hidden bg-white border-2 border-[#D89A86]/40 shrink-0 shadow-md group">
                  <img src={selectedImage} alt="Selected Search Photo" className="w-full h-full object-cover" />

                  {/* AI Scanning animation overlay while searching */}
                  {isSearching && (
                    <div className="absolute inset-0 bg-[#D89A86]/20 backdrop-blur-2xs flex flex-col items-center justify-center">
                      <div className="absolute left-0 right-0 h-1 bg-[#D89A86] shadow-[0_0_12px_#D89A86] animate-bounce" />
                      <Sparkles className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5">
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[#3A2B24] truncate max-w-xs">
                      {imageMeta?.name || "Customer Visual Query"}
                    </span>
                    {imageMeta && (
                      <Badge className="bg-white text-[#6C5C54] border-[#EFE6DD] text-[10px] font-semibold">
                        {imageMeta.format} • {imageMeta.size}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-[#6C5C54]">
                    Image ready to match against Pixello&apos;s product catalog photos.
                  </p>

                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        stopCamera();
                        setSelectedImage(null);
                        setImageMeta(null);
                        setHasSearched(false);
                        setResults([]);
                        setDetectedFeatures(null);
                      }}
                      className="rounded-full text-xs font-bold border-[#EFE6DD] hover:bg-white text-[#6C5C54] h-8 px-3.5 cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" /> Replace / Remove Photo
                    </Button>

                    {!hasSearched && (
                      <Button
                        type="button"
                        onClick={() => handlePerformVisualSearch()}
                        disabled={isSearching}
                        className="btn-pixello-primary text-xs font-bold rounded-full px-5 h-8 shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        {isSearching ? "Searching..." : "Search Matching Products"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* LOADING SCANNER PROGRESS STATE */}
              {isSearching && (
                <div className="p-8 text-center bg-[#FAF7F4] border border-[#EFE6DD] rounded-3xl space-y-3">
                  <div className="h-10 w-10 rounded-full bg-[#FFF8F2] border border-[#D89A86] text-[#D89A86] flex items-center justify-center mx-auto shadow-sm animate-spin">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h4 className="font-serif-brand text-base font-bold text-[#3A2B24]">
                    {SCANNING_STEPS[scanningStepIndex]}
                  </h4>
                  <p className="text-xs text-[#6C5C54] max-w-md mx-auto">
                    Comparing your photo directly with Pixello frames, polaroids, lamps, and custom gifts...
                  </p>
                </div>
              )}

              {/* STEP 3: SEARCH RESULTS PRESENTATION */}
              {hasSearched && !isSearching && (
                <div className="space-y-5">
                  {/* PHOTO MATCH RESULTS HEADER */}
                  <div className="p-4 bg-white rounded-2xl border border-[#EFE6DD] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#D89A86]/30 text-[#D89A86] flex items-center justify-center text-lg shrink-0">
                        📸
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-extrabold text-[#3A2B24]">
                            Photo Search Results
                          </span>
                          <span className="text-[10px] font-bold text-[#D89A86] bg-[#FFF8F2] px-2.5 py-0.5 rounded-full border border-[#D89A86]/30">
                            Matched from Uploaded Photo
                          </span>
                        </div>
                        <p className="text-xs text-[#6C5C54] mt-0.5">
                          Products visually matching your photo in Pixello&apos;s catalog
                        </p>
                      </div>
                    </div>

                    <div className="text-right sm:self-auto self-start">
                      <span className="text-[11px] font-bold text-[#D89A86] bg-[#FFF8F2] px-3 py-1 rounded-full border border-[#D89A86]/30">
                        {results.length} {results.length === 1 ? "Product Match" : "Product Matches"}
                      </span>
                    </div>
                  </div>

                  {/* RESULTS GRID OR NO RESULTS NOTICE */}
                  {results.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {results.map((product) => {
                        const isExact = product.matchType === "exact";
                        const isSimilar = product.matchType === "similar";
                        const isCartAdded = addedCartMap[product.id];
                        const isHamperAdded = addedHamperMap[product.id];

                        return (
                          <div
                            key={product.id}
                            className={`group relative bg-white rounded-2xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden ${
                              isExact
                                ? "border-emerald-300 ring-2 ring-emerald-500/20"
                                : isSimilar
                                ? "border-[#D89A86]/40 hover:border-[#D89A86]"
                                : "border-[#EFE6DD]"
                            }`}
                          >
                            {/* MATCH TYPE BADGE AT TOP */}
                            <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
                              {isExact ? (
                                <span className="text-[9px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                  <span>🎯 Exact Match</span>
                                  <span>({product.similarityScore}%)</span>
                                </span>
                              ) : isSimilar ? (
                                <span className="text-[9px] font-extrabold bg-[#D89A86] text-white px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                  <span>✨ Visually Similar</span>
                                  <span>({product.similarityScore}%)</span>
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-xs">
                                  💡 Alternative ({product.similarityScore}%)
                                </span>
                              )}
                            </div>

                            {/* PRODUCT THUMBNAIL */}
                            <Link
                              href={`/product/${product.id}`}
                              onClick={onClose}
                              className="relative aspect-square w-full overflow-hidden bg-[#FAF7F4] block"
                            >
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </Link>

                            {/* CARD CONTENT */}
                            <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
                              <div>
                                <div className="flex items-center justify-between text-[10px] text-[#6C5C54] mb-1">
                                  <span className="bg-[#FAF7F4] px-1.5 py-0.5 rounded border border-[#EFE6DD] font-medium">
                                    {product.category}
                                  </span>
                                  <span className="font-semibold text-amber-600 flex items-center gap-0.5">
                                    ★ {product.rating} ({product.reviews})
                                  </span>
                                </div>

                                <Link
                                  href={`/product/${product.id}`}
                                  onClick={onClose}
                                  className="font-bold text-xs text-[#3A2B24] hover:text-[#D89A86] line-clamp-1 transition-colors block"
                                  title={product.name}
                                >
                                  {product.name}
                                </Link>

                                <p className="text-[10px] text-[#6C5C54] line-clamp-1 mt-0.5 font-medium">
                                  {product.matchReason}
                                </p>
                              </div>

                              {/* PRICING & ACTIONS */}
                              <div className="pt-2 border-t border-[#EFE6DD]/70 space-y-2">
                                <div className="flex items-baseline justify-between">
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="font-extrabold text-sm text-[#3A2B24]">₹{product.price}</span>
                                    {product.originalPrice && product.originalPrice > product.price && (
                                      <span className="text-[10px] text-[#6C5C54] line-through">
                                        ₹{product.originalPrice}
                                      </span>
                                    )}
                                  </div>

                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                      product.stock > 0
                                        ? "text-emerald-700 bg-emerald-50"
                                        : "text-rose-700 bg-rose-50"
                                    }`}
                                  >
                                    {product.stock > 0 ? "In Stock" : "Out of Stock"}
                                  </span>
                                </div>

                                {/* ACTION BUTTONS */}
                                <div className="grid grid-cols-2 gap-1.5">
                                  {product.stock <= 0 || product.status === "Out of Stock" ? (
                                    <div className="col-span-2 py-1 px-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-center text-[10px] font-bold">
                                      ❌ Out of Stock
                                    </div>
                                  ) : (
                                    <>
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => handleAddToCart(product)}
                                        className={`h-7 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                          isCartAdded
                                            ? "bg-emerald-600 text-white"
                                            : "bg-[#FFF8F2] hover:bg-[#F2C8B5]/40 text-[#D89A86] border border-[#D89A86]/30"
                                        }`}
                                        title="Add to shopping cart"
                                      >
                                        {isCartAdded ? (
                                          <>
                                            <Check className="h-3 w-3" /> Added!
                                          </>
                                        ) : (
                                          <>
                                            <ShoppingCart className="h-3 w-3" /> Add to Cart
                                          </>
                                        )}
                                      </Button>

                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => handleAddToHamper(product)}
                                        className={`h-7 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                          isHamperAdded
                                            ? "bg-emerald-600 text-white"
                                            : "bg-[#3A2B24] hover:bg-[#523d33] text-white"
                                        }`}
                                        title="Add into Custom Gift Hamper"
                                      >
                                        {isHamperAdded ? (
                                          <>
                                            <Check className="h-3 w-3" /> In Hamper!
                                          </>
                                        ) : (
                                          <>
                                            <Gift className="h-3 w-3" /> To Hamper
                                          </>
                                        )}
                                      </Button>
                                    </>
                                  )}
                                </div>

                                <Link
                                  href={`/product/${product.id}`}
                                  onClick={onClose}
                                  className="w-full h-6 rounded-md bg-[#FAF7F4] hover:bg-[#FFF8F2] text-[#3A2B24] hover:text-[#D89A86] text-[10px] font-bold flex items-center justify-center gap-1 transition-colors border border-[#EFE6DD]"
                                >
                                  <span>View Details</span>
                                  <ArrowRight className="h-2.5 w-2.5" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* HELPFUL NO-MATCHES SCREEN */
                    <div className="p-8 text-center bg-[#FAF7F4] border border-[#EFE6DD] rounded-3xl space-y-3">
                      <span className="text-3xl block">🔍</span>
                      <h4 className="font-serif-brand text-base font-bold text-[#3A2B24]">
                        No Direct Catalog Matches Found
                      </h4>
                      <p className="text-xs text-[#6C5C54] max-w-md mx-auto leading-relaxed">
                        We couldn&apos;t find an item closely resembling this image in Pixello&apos;s current catalog. Try
                        photographing a photo frame, polaroid snapshot, ceramic mug, or custom gift.
                      </p>
                      <div className="pt-2 flex items-center justify-center gap-3">
                        <Button
                          type="button"
                          onClick={() => {
                            setSelectedImage(null);
                            setHasSearched(false);
                          }}
                          className="btn-pixello-primary text-xs font-bold rounded-full px-5 h-9"
                        >
                          Try Another Photo
                        </Button>
                        <Link
                          href="/products"
                          onClick={onClose}
                          className="h-9 px-5 rounded-full border border-[#EFE6DD] bg-white hover:bg-[#FFF8F2] text-xs font-bold text-[#3A2B24] flex items-center"
                        >
                          Browse All Products
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between p-4 md:px-7 border-t border-[#EFE6DD] bg-[#FAF7F4] flex-shrink-0 text-xs text-[#6C5C54]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-semibold">Visual Image Search • Instant Photo Matching</span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-full text-xs font-bold border-[#EFE6DD] text-[#3A2B24] hover:bg-white h-8 px-4"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
