'use client';

import React, { useState, useEffect } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { FlowSheet } from '@/components/flow-popups/flow-sheet';
import { FlowPopupHeader } from '@/components/flow-popups/flow-popup-header';
import { FlowPopupFooter } from '@/components/flow-popups/flow-popup-footer';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';

export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AvatarCropSheetProps {
  imageSrc: string | null;
  isOpen: boolean;
  onClose: () => void;
  onCrop: (croppedDataUrl: string) => void;
  id?: string;
  ownerId?: string;
}

const IS_DEV = process.env.NODE_ENV !== 'production';

export function logAvatarDebug(message: string, data?: any) {
  if (IS_DEV) {
    console.log(`[AVATAR_DEBUG] ${message}`, data ? JSON.stringify(data) : '');
  }
}

export type NormalizedAvatarImage = {
  previewSrc: string;          // must be directly usable by <img src>
  canvasSrc: string;           // must be drawable to canvas
  mimeType: string;
  cleanup?: () => void;
};

/**
 * Unified native and web image acquisition function.
 * On native Capacitor Android, uses Camera.getPhoto (source: Photos, resultType: DataUrl)
 * On web, falls back to programmatic file input reader.
 */
export async function pickAndNormalizeAvatarImage(): Promise<NormalizedAvatarImage | null> {
  logAvatarDebug('pickAndNormalizeAvatarImage: initiating image acquisition');
  
  if (Capacitor.isNativePlatform()) {
    logAvatarDebug('pickAndNormalizeAvatarImage: platform is NATIVE, triggering Capacitor Camera picker');
    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        width: 1024,
        height: 1024,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      });

      logAvatarDebug('pickAndNormalizeAvatarImage: Camera.getPhoto response keys:', Object.keys(photo));

      if (!photo.dataUrl) {
        throw new Error('Native photo picker did not return image data.');
      }

      // Safeguard mime-type prefix formatting
      let src = photo.dataUrl;
      const mime = photo.format ? `image/${photo.format}` : 'image/jpeg';
      if (!src.startsWith('data:image/')) {
        src = src.includes(';base64,') ? src : `data:${mime};base64,${src}`;
      }

      logAvatarDebug('pickAndNormalizeAvatarImage: normalized native base64 source loaded successfully', {
        mimeType: mime,
        prefix: src.substring(0, 50),
        length: src.length
      });

      return {
        previewSrc: src,
        canvasSrc: src,
        mimeType: mime
      };
    } catch (err: any) {
      logAvatarDebug('pickAndNormalizeAvatarImage: native error or cancel', { error: err.message || err });
      // Handle cancelled actions silently
      if (
        err.message?.toLowerCase().includes('cancel') ||
        err.message?.toLowerCase().includes('user cancelled')
      ) {
        return null;
      }
      throw err;
    }
  } else {
    logAvatarDebug('pickAndNormalizeAvatarImage: platform is WEB, triggering fallback file input dialog');
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png, image/jpeg, image/webp';

      const cleanUp = () => {
        input.onchange = null;
        input.onerror = null;
      };

      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          cleanUp();
          resolve(null);
          return;
        }

        logAvatarDebug('pickAndNormalizeAvatarImage web file select:', {
          name: file.name,
          size: file.size,
          type: file.type
        });

        if (!file.type.startsWith('image/')) {
          cleanUp();
          reject(new Error('Please select a valid image file (JPEG, PNG or WebP).'));
          return;
        }

        if (file.size > 10 * 1024 * 1024) {
          cleanUp();
          reject(new Error('File size exceeds 10MB limit.'));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          cleanUp();
          logAvatarDebug('pickAndNormalizeAvatarImage: web file read success', {
            prefix: result.substring(0, 50),
            length: result.length
          });
          resolve({
            previewSrc: result,
            canvasSrc: result,
            mimeType: file.type
          });
        };
        reader.onerror = () => {
          cleanUp();
          reject(new Error('Failed to read image file.'));
        };
        reader.readAsDataURL(file);
      };

      input.onerror = () => {
        cleanUp();
        reject(new Error('File selector error.'));
      };

      input.click();
    });
  }
}

/**
 * Robust canvas crop/export function drawing directly from the loaded HTMLImageElement preview.
 * Includes defensive blank/white verification guards.
 */
export function createCroppedAvatarImage(
  image: HTMLImageElement,
  croppedAreaPixels: Area
): string {
  if (!image) {
    throw new Error('Loaded image element is missing.');
  }

  logAvatarDebug('createCroppedAvatarImage: drawing coordinates', {
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    imageComplete: image.complete,
    croppedAreaPixels
  });

  if (image.naturalWidth === 0 || image.naturalHeight === 0) {
    throw new Error('Image dimensions are invalid or zero.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to create 2D canvas context.');
  }

  // Pre-fill background with white to avoid transparent PNG pixels turning black in JPEG output
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 512, 512);

  // Clamp coordinates within native dimensions
  const sourceX = Math.max(0, Math.min(croppedAreaPixels.x, image.naturalWidth));
  const sourceY = Math.max(0, Math.min(croppedAreaPixels.y, image.naturalHeight));
  const sourceWidth = Math.max(1, Math.min(croppedAreaPixels.width, image.naturalWidth - sourceX));
  const sourceHeight = Math.max(1, Math.min(croppedAreaPixels.height, image.naturalHeight - sourceY));

  logAvatarDebug('createCroppedAvatarImage: clamped draw parameters', {
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight
  });

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    512,
    512
  );

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  if (!dataUrl || dataUrl.length < 1000) {
    throw new Error('Exported image is suspiciously small or empty.');
  }

  // Verify pixels defensively to catch solid white blank crops
  const samples = [
    ctx.getImageData(256, 256, 1, 1).data, // center
    ctx.getImageData(10, 10, 1, 1).data,   // top-left
    ctx.getImageData(500, 10, 1, 1).data,  // top-right
    ctx.getImageData(10, 500, 1, 1).data,  // bottom-left
    ctx.getImageData(500, 500, 1, 1).data  // bottom-right
  ];

  const isAllWhite = samples.every(p => p[0] === 255 && p[1] === 255 && p[2] === 255);
  const isAllBlack = samples.every(p => p[0] === 0 && p[1] === 0 && p[2] === 0);

  logAvatarDebug('createCroppedAvatarImage: check exported pixels', {
    length: dataUrl.length,
    isAllWhite,
    isAllBlack,
    centerPixel: samples[0] ? `rgb(${samples[0][0]}, ${samples[0][1]}, ${samples[0][2]})` : 'none'
  });

  if (isAllWhite) {
    throw new Error('Cropped output is a blank white circle. Please make sure the image is visible inside the crop preview.');
  }

  return dataUrl;
}

export function AvatarCropSheet({
  imageSrc,
  isOpen,
  onClose,
  onCrop,
  id,
  ownerId,
}: AvatarCropSheetProps) {
  const [isSavingCrop, setIsSavingCrop] = useState(false);
  const [cropError, setCropError] = useState<string | null>(null);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [decodedImage, setDecodedImage] = useState<string | null>(null);

  // Dynamic crop viewport size responsiveness
  const [cropSize, setCropSize] = useState(280);
  const cropSizeRef = React.useRef(280);

  useEffect(() => {
    cropSizeRef.current = cropSize;
  }, [cropSize]);

  useEffect(() => {
    const handleResize = () => {
      const height = window.innerHeight;
      const calculated = Math.max(200, Math.min(280, height - 268));
      setCropSize(calculated);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 10. Maintain separate persisted and draft state
  const [cropDraft, setCropDraft] = useState<{
    sourceUrl: string;
    baseScale: number;
    zoom: number;
    offsetX: number;
    offsetY: number;
    sessionId: string;
  } | null>(null);

  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const sliderRef = React.useRef<HTMLInputElement | null>(null);
  const zoomDisplayRef = React.useRef<HTMLSpanElement | null>(null);
  const stateRef = React.useRef({
    sessionId: '',
    x: 0,
    y: 0,
    zoom: 1.0,
    baseScale: 1.0,
    naturalWidth: 0,
    naturalHeight: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    isPinching: false,
    startDistance: 0,
    startZoom: 1.0,
    pointers: new Map<number, PointerEvent>()
  });

  const rafIdRef = React.useRef<number | null>(null);
  const requestTransformUpdate = (withTransition = false) => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      if (imageRef.current) {
        const { x, y, baseScale, zoom } = stateRef.current;
        const scale = baseScale * zoom;
        imageRef.current.style.transition = withTransition ? 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
        imageRef.current.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0px) scale(${scale})`;
      }
    });
  };

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Programmatically monitor image source loading inside crop sheet
  useEffect(() => {
    if (!isOpen || !imageSrc) {
      setDecodedImage(null);
      setIsMediaLoaded(false);
      return;
    }

    logAvatarDebug('AvatarCropSheet: monitoring imageSrc loading', {
      prefix: imageSrc.substring(0, 50),
      length: imageSrc.length
    });

    setIsMediaLoaded(false);
    setCropError(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      logAvatarDebug('AvatarCropSheet Programmatic Loader: image loaded', {
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      });
      try {
        if ('decode' in img) {
          await img.decode();
          logAvatarDebug('AvatarCropSheet Programmatic Loader: decode() success');
        }

        // 14. Use a unique crop-session ID so stale callbacks from earlier sessions cannot mutate current
        const newSessionId = Math.random().toString(36).substring(2, 11);

        // 11. On every new crop session, create fresh draft state after selected image has decoded.
        // Never reuse zoom, offsets, pointer maps, drag velocity, or animation values from a previous session.
        const baseScale = Math.max(cropSizeRef.current / img.naturalWidth, cropSizeRef.current / img.naturalHeight);
        stateRef.current = {
          sessionId: newSessionId,
          x: 0,
          y: 0,
          zoom: 1.0,
          baseScale,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          isDragging: false,
          startX: 0,
          startY: 0,
          isPinching: false,
          startDistance: 0,
          startZoom: 1.0,
          pointers: new Map<number, PointerEvent>()
        };

        setCropDraft({
          sourceUrl: imageSrc,
          baseScale,
          zoom: 1.0,
          offsetX: 0,
          offsetY: 0,
          sessionId: newSessionId
        });

        setDecodedImage(imageSrc);
        setIsMediaLoaded(true);

        // Update display refs
        if (sliderRef.current) {
          sliderRef.current.value = '1';
        }
        if (zoomDisplayRef.current) {
          zoomDisplayRef.current.innerText = '100%';
        }
      } catch (err: any) {
        logAvatarDebug('AvatarCropSheet Programmatic Loader: decode() failed', { error: err.message });
        setCropError('Failed to load image preview.');
      }
    };
    img.onerror = () => {
      logAvatarDebug('AvatarCropSheet Programmatic Loader: image failed to load');
      setCropError('Failed to load image preview. Please try another image.');
    };
    img.src = imageSrc;
  }, [imageSrc, isOpen]);

  // Apply initial transform when image mounts or isMediaLoaded becomes true
  useEffect(() => {
    if (isMediaLoaded && decodedImage) {
      requestTransformUpdate(false);
    }
  }, [isMediaLoaded, decodedImage]);

  // 7. Route cross button, Android Back, and Escape key through one canonical cancelCropSession
  const cancelCropSession = () => {
    // 12. During cancellation, stop pending animation frames, release captured pointers, clear active pointer maps, reset transient gesture refs, and revoke temporary object URLs when safe.
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // Reset transient gesture refs
    const state = stateRef.current;
    state.pointers.clear();
    state.isDragging = false;
    state.isPinching = false;
    state.startX = 0;
    state.startY = 0;
    state.startDistance = 0;
    state.startZoom = 1.0;

    // Revoke temporary object URLs when safe
    if (imageSrc && imageSrc.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(imageSrc);
      } catch (e) {}
    }

    // Discard only the unsaved crop draft, call onClose to let the parent know.
    // 9. cancelCropSession() must discard only the unsaved crop draft. It must never modify or remove currently saved avatar.
    onClose();
  };

  const removePointer = (pointerId: number) => {
    const state = stateRef.current;
    state.pointers.delete(pointerId);
    if (state.pointers.size === 0) {
      state.isDragging = false;
      state.isPinching = false;

      // 13. Process drag and pinch updates through requestAnimationFrame. 
      // Avoid React state updates on every pointer-move frame, but update cropDraft on gesture end.
      setCropDraft(prev => {
        if (!prev || prev.sessionId !== state.sessionId) return prev;
        return {
          ...prev,
          zoom: state.zoom,
          offsetX: state.x,
          offsetY: state.y
        };
      });
    } else if (state.pointers.size === 1) {
      state.isPinching = false;
      state.isDragging = true;
      const remainingPointer = Array.from(state.pointers.values())[0];
      state.startX = remainingPointer.clientX - state.x;
      state.startY = remainingPointer.clientY - state.y;
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // 5. Prevent crop and zoom-slider gestures from propagating into any parent sheet gesture listener.
    e.stopPropagation();

    if (!isMediaLoaded) return;
    
    // 4. Ensure dragging and pinch-zooming inside the crop viewport belong exclusively to the crop editor.
    // Use pointer capture and handle pointerup, pointercancel, and lostpointercapture symmetrically.
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const state = stateRef.current;
    state.pointers.set(e.pointerId, e.nativeEvent);

    if (imageRef.current) {
      imageRef.current.style.transition = 'none';
    }

    if (state.pointers.size === 1) {
      state.isDragging = true;
      state.startX = e.clientX - state.x;
      state.startY = e.clientY - state.y;
    } else if (state.pointers.size === 2) {
      state.isPinching = true;
      const [p1, p2] = Array.from(state.pointers.values());
      const dx = p1.clientX - p2.clientX;
      const dy = p1.clientY - p2.clientY;
      state.startDistance = Math.sqrt(dx * dx + dy * dy);
      state.startZoom = state.zoom;

      const centerX = (p1.clientX + p2.clientX) / 2;
      const centerY = (p1.clientY + p2.clientY) / 2;
      state.startX = centerX - state.x;
      state.startY = centerY - state.y;
    }
  };

  const updatePosition = React.useCallback((targetX: number, targetY: number) => {
    const state = stateRef.current;
    const scale = state.baseScale * state.zoom;

    const limitX = Math.max(0, (state.naturalWidth * scale - cropSizeRef.current) / 2);
    const limitY = Math.max(0, (state.naturalHeight * scale - cropSizeRef.current) / 2);

    const clampedX = Math.max(-limitX, Math.min(limitX, targetX));
    const clampedY = Math.max(-limitY, Math.min(limitY, targetY));

    state.x = clampedX;
    state.y = clampedY;

    requestTransformUpdate(false);
  }, []);

  // Update baseScale and clamp image position when cropSize updates responsively
  useEffect(() => {
    if (isMediaLoaded && decodedImage) {
      const img = new Image();
      img.src = decodedImage;
      img.onload = () => {
        const baseScale = Math.max(cropSize / img.naturalWidth, cropSize / img.naturalHeight);
        stateRef.current.baseScale = baseScale;
        updatePosition(stateRef.current.x, stateRef.current.y);
      };
    }
  }, [cropSize, isMediaLoaded, decodedImage, updatePosition]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const state = stateRef.current;
    if (!state.pointers.has(e.pointerId)) return;
    state.pointers.set(e.pointerId, e.nativeEvent);

    if (state.isPinching && state.pointers.size === 2) {
      const [p1, p2] = Array.from(state.pointers.values());
      const dx = p1.clientX - p2.clientX;
      const dy = p1.clientY - p2.clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (state.startDistance > 0) {
        const zoomRatio = distance / state.startDistance;
        const targetZoom = Math.max(1.0, Math.min(3.0, state.startZoom * zoomRatio));
        
        state.zoom = targetZoom;
        if (sliderRef.current) {
          sliderRef.current.value = targetZoom.toString();
        }
        if (zoomDisplayRef.current) {
          zoomDisplayRef.current.innerText = `${Math.round(targetZoom * 100)}%`;
        }
      }

      const centerX = (p1.clientX + p2.clientX) / 2;
      const centerY = (p1.clientY + p2.clientY) / 2;
      updatePosition(centerX - state.startX, centerY - state.startY);
    } else if (state.isDragging && !state.isPinching) {
      const p = state.pointers.get(e.pointerId);
      if (p) {
        updatePosition(p.clientX - state.startX, p.clientY - state.startY);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
    removePointer(e.pointerId);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
    removePointer(e.pointerId);
  };

  const handleLostPointerCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    removePointer(e.pointerId);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetZoom = parseFloat(e.target.value);
    const state = stateRef.current;
    state.zoom = targetZoom;

    if (zoomDisplayRef.current) {
      zoomDisplayRef.current.innerText = `${Math.round(targetZoom * 100)}%`;
    }

    updatePosition(state.x, state.y);

    // Update cropDraft state
    setCropDraft(prev => {
      if (!prev || prev.sessionId !== state.sessionId) return prev;
      return {
        ...prev,
        zoom: targetZoom,
        offsetX: state.x,
        offsetY: state.y
      };
    });
  };

  const handleSave = () => {
    if (!imageSrc || !isMediaLoaded) {
      return;
    }

    setIsSavingCrop(true);
    setCropError(null);

    // Short timeout to let the UI update to "Saving..."
    setTimeout(() => {
      try {
        const imgEl = imageRef.current;
        if (!imgEl) {
          throw new Error('Preview image element was not found in the DOM.');
        }

        const { x, y, baseScale, zoom, naturalWidth, naturalHeight } = stateRef.current;
        const scale = baseScale * zoom;

        const w = cropSizeRef.current / scale;
        const h = cropSizeRef.current / scale;
        const x1 = (-cropSizeRef.current / 2 - x) / scale + naturalWidth / 2;
        const y1 = (-cropSizeRef.current / 2 - y) / scale + naturalHeight / 2;

        const croppedAreaPixels: Area = {
          x: x1,
          y: y1,
          width: w,
          height: h
        };

        const croppedUrl = createCroppedAvatarImage(imgEl, croppedAreaPixels);
        
        // 17. Keep Save Photo transactional: generate cropped image first, persist successfully, then close and clean.
        onCrop(croppedUrl);
      } catch (err: any) {
        console.error('Failed to crop avatar:', err);
        setCropError(err.message || 'Failed to process image. Please try another image.');
      } finally {
        setIsSavingCrop(false);
      }
    }, 50);
  };

  // 16. Keep Reset limited to centering the current draft at its calculated cover scale. It must not cancel the editor.
  const handleReset = () => {
    logAvatarDebug('handleReset: resetting crop and zoom');
    const state = stateRef.current;
    state.x = 0;
    state.y = 0;
    state.zoom = 1.0;

    if (sliderRef.current) {
      sliderRef.current.value = '1';
    }
    if (zoomDisplayRef.current) {
      zoomDisplayRef.current.innerText = '100%';
    }

    setCropDraft(prev => {
      if (!prev || prev.sessionId !== state.sessionId) return prev;
      return {
        ...prev,
        zoom: 1.0,
        offsetX: 0,
        offsetY: 0
      };
    });

    requestTransformUpdate(true);
  };

  const handleExitComplete = () => {
    // 13. Keep the sheet mounted until exit completes. 
    // Perform final draft cleanup in onExitComplete, making cleanup idempotent so rapid close/reopen cannot clear newer.
    if (!isOpen) {
      logAvatarDebug('handleExitComplete: final draft cleanup');
      setDecodedImage(null);
      setIsMediaLoaded(false);
      setCropError(null);
      setCropDraft(null);

      stateRef.current = {
        sessionId: '',
        x: 0,
        y: 0,
        zoom: 1.0,
        baseScale: 1.0,
        naturalWidth: 0,
        naturalHeight: 0,
        isDragging: false,
        startX: 0,
        startY: 0,
        isPinching: false,
        startDistance: 0,
        startZoom: 1.0,
        pointers: new Map<number, PointerEvent>()
      };
    }
  };

  return (
    <FlowSheet
      id={id}
      ownerId={ownerId}
      open={isOpen}
      onOpenChange={(open) => !open && !isSavingCrop && cancelCropSession()}
      // 8. Do not allow backdrop tapping or downward dragging to dismiss this specific editor.
      onPointerDownOutside={(e) => e.preventDefault()}
      onEscapeKeyDown={(e) => {
        e.preventDefault();
        cancelCropSession();
      }}
      onExitComplete={handleExitComplete}
      // 2. Pass dragToDismiss={false} only from AvatarCropSheet.
      dragToDismiss={false}
      floating={true}
      className="p-5 select-none flex flex-col gap-0 overflow-hidden"
      style={{
        maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 24px)'
      }}
    >
      <div className="flex flex-row items-start justify-between gap-4 w-full flex-shrink-0 pb-3">
        <div className="flex flex-col gap-1 min-w-0">
          <h2 className="text-lg font-extrabold text-foreground tracking-tight leading-tight">
            Adjust Profile Photo
          </h2>
          <p className="text-xs font-semibold text-muted-foreground leading-normal">
            Drag and zoom to fit inside the circle.
          </p>
        </div>
        <button
          type="button"
          onClick={cancelCropSession}
          className="h-11 w-11 flex-shrink-0 rounded-full border-2 border-muted-foreground/30 hover:border-foreground/50 hover:bg-muted/50 active:bg-muted/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center justify-center relative focus:outline-none"
          style={{
            WebkitTapHighlightColor: 'transparent',
            outline: 'none',
          }}
          aria-label="Cancel Profile Photo Adjustment"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollable-area flex flex-col py-2 gap-4 select-none">
        {/* Crop Viewport container with explicit inline-style sizes to prevent collapsings */}
        <div 
          className="bg-neutral-950 rounded-2xl overflow-hidden border border-border/60 shadow-inner mx-auto flex-shrink-0 relative select-none touch-none"
          style={{ width: `${cropSize}px`, height: `${cropSize}px`, touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onLostPointerCapture={handleLostPointerCapture}
        >
          {isOpen && decodedImage && (
            <img
              ref={imageRef}
              src={decodedImage}
              alt="Preview"
              className="absolute left-1/2 top-1/2 max-w-none select-none pointer-events-none"
              style={{
                opacity: isMediaLoaded ? 1 : 0,
                transformOrigin: 'center',
                transform: `translate(-50%, -50%) translate3d(${stateRef.current.x}px, ${stateRef.current.y}px, 0px) scale(${stateRef.current.baseScale * stateRef.current.zoom})`
              }}
            />
          )}

          {isMediaLoaded && (
            <div className="absolute inset-0 pointer-events-none rounded-full border border-white/20 shadow-[0_0_0_9999px_rgba(10,10,10,0.85)]" />
          )}

          {(!isMediaLoaded || !decodedImage) && (
            <div 
              className="flex flex-col items-center justify-center bg-neutral-900/80 gap-2 select-none z-10"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            >
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <span className="text-xs font-semibold text-muted-foreground select-none">
                Loading preview...
              </span>
            </div>
          )}
        </div>

        {/* Zoom Slider */}
        <div className="w-full space-y-2 mx-auto flex-shrink-0" style={{ maxWidth: `${cropSize}px` }}>
          <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1 select-none">
            <span>Zoom</span>
            <span ref={zoomDisplayRef}>100%</span>
          </div>
          <input
            ref={sliderRef}
            type="range"
            min={1}
            max={3}
            step={0.02}
            defaultValue={1}
            onChange={handleSliderChange}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerMove={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            disabled={isSavingCrop || !isMediaLoaded}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary animate-none"
          />
        </div>

        {cropError && (
          <p className="text-xs font-semibold text-destructive text-center w-full mx-auto bg-destructive/10 p-2.5 rounded-xl border border-destructive/20 select-none animate-none flex-shrink-0" style={{ maxWidth: `${cropSize}px` }}>
            {cropError}
          </p>
        )}
      </div>

      <FlowPopupFooter className="flex flex-row justify-center gap-3 pt-3 mx-auto w-full flex-shrink-0" style={{ maxWidth: `${cropSize}px` }}>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isSavingCrop || !isMediaLoaded}
          className="h-11 rounded-xl flex-1 text-xs font-bold border-input"
        >
          Reset
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSavingCrop || !isMediaLoaded}
          className="h-11 rounded-xl flex-1 text-xs font-bold text-white bg-primary hover:bg-primary/90 shadow-sm"
        >
          {isSavingCrop ? 'Saving...' : 'Save photo'}
        </Button>
      </FlowPopupFooter>
    </FlowSheet>
  );
}
