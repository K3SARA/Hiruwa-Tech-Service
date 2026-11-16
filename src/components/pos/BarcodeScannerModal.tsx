"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, Camera, Flashlight, SwitchCamera, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { clsx } from "clsx";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string };
  title?: string;
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
  title = "Scan Barcode / Serial Number",
}: BarcodeScannerModalProps) {
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [scanStatus, setScanStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [continuousScan, setContinuousScan] = useState(true);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedCodeRef = useRef<string>("");
  const lastScannedTimeRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);

  // Audio beep feedback using Web Audio API
  const playBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(950, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio might be blocked by browser autoplay policy
    }
  }, []);

  // Haptic feedback
  const triggerHaptic = useCallback(() => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([80, 40, 80]);
      } catch {
        // Ignore vibration errors
      }
    }
  }, []);

  // Handle scanned barcode
  const handleBarcodeDetected = useCallback(
    async (decodedText: string) => {
      const trimmed = decodedText.trim();
      const now = Date.now();

      // Debounce identical scans within 2 seconds to avoid rapid multi-firing
      if (trimmed === lastScannedCodeRef.current && now - lastScannedTimeRef.current < 2000) {
        return;
      }
      if (isProcessingRef.current) return;

      lastScannedCodeRef.current = trimmed;
      lastScannedTimeRef.current = now;
      isProcessingRef.current = true;

      playBeep();
      triggerHaptic();

      try {
        const result = await onScan(trimmed);
        if (result.success) {
          setScanStatus({ type: "success", message: result.message });
          if (!continuousScan) {
            setTimeout(() => {
              onClose();
            }, 700);
          }
        } else {
          setScanStatus({ type: "error", message: result.message });
        }
      } catch (err) {
        setScanStatus({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to lookup barcode",
        });
      } finally {
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 1200);
      }
    },
    [onScan, playBeep, triggerHaptic, continuousScan, onClose]
  );

  // Initialize camera and start scanner
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const elementId = "hiruwa-barcode-scanner";

    async function initScanner() {
      setIsInitializing(true);
      setCameraError(null);
      setScanStatus(null);

      try {
        const devices = await Html5Qrcode.getCameras();
        if (!mounted) return;

        if (!devices || devices.length === 0) {
          setCameraError("No camera found on this device.");
          setIsInitializing(false);
          return;
        }

        setCameras(devices);

        // Prefer back / environment camera if available
        let chosenId = selectedCameraId;
        if (!chosenId) {
          const backCam = devices.find((d) =>
            /back|rear|environment|primary/i.test(d.label)
          );
          chosenId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(chosenId);
        }

        const scanner = new Html5Qrcode(elementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
            Html5QrcodeSupportedFormats.ITF,
          ],
          verbose: false,
        });

        scannerRef.current = scanner;

        await scanner.start(
          chosenId,
          {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              // Barcode box: wider than tall for standard 1D / 2D barcodes
              const width = Math.floor(viewfinderWidth * 0.85);
              const height = Math.min(Math.floor(viewfinderHeight * 0.55), 240);
              return { width: Math.max(width, 240), height: Math.max(height, 140) };
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (mounted) handleBarcodeDetected(decodedText);
          },
          () => {
            // Ignore frame-by-frame non-detection
          }
        );

        if (!mounted) {
          if (scanner.isScanning) await scanner.stop();
          return;
        }

        // Check if torch capability is available
        try {
          const track = (scanner as unknown as { getRunningTrack?: () => MediaStreamTrack }).getRunningTrack?.();
          const capabilities = (track as unknown as { getCapabilities?: () => { torch?: boolean } })?.getCapabilities?.();
          setHasTorch(Boolean(capabilities?.torch));
        } catch {
          setHasTorch(false);
        }

        setIsInitializing(false);
      } catch (err) {
        if (!mounted) return;
        console.error("Camera scanner error:", err);
        setCameraError(
          err instanceof Error
            ? err.message
            : "Camera permission denied or camera not accessible."
        );
        setIsInitializing(false);
      }
    }

    initScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {}).finally(() => {
            try {
              scannerRef.current?.clear();
            } catch {}
          });
        }
      }
    };
  }, [isOpen, selectedCameraId, handleBarcodeDetected]);

  // Toggle flashlight / torch
  async function toggleTorch() {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextTorch = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as MediaTrackConstraintSet],
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn("Could not toggle torch:", e);
    }
  }

  // Switch between front/back cameras
  function switchCamera() {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCameraId(cameras[nextIndex].id);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#0C0D0E] text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-orange-500" />
            <h2 className="text-sm font-bold tracking-tight">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close camera scanner"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative aspect-square w-full overflow-hidden bg-black flex items-center justify-center">
          {/* HTML5 QR Container */}
          <div id="hiruwa-barcode-scanner" className="h-full w-full object-cover" />

          {/* Initializing Loader */}
          {isInitializing && !cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <p className="text-xs text-zinc-400">Starting camera...</p>
            </div>
          )}

          {/* Camera Error Message */}
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-[#0C0D0E] z-10">
              <div className="rounded-full bg-red-500/20 p-3 text-red-400">
                <AlertCircle size={28} />
              </div>
              <p className="text-sm font-semibold text-white">Camera Access Failed</p>
              <p className="text-xs text-zinc-400">{cameraError}</p>
              <p className="text-[11px] text-zinc-500">
                Please grant camera permission in your browser address bar and ensure no other application is using the camera.
              </p>
              <button
                onClick={onClose}
                className="mt-2 rounded-md bg-zinc-800 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700"
              >
                Close
              </button>
            </div>
          )}

          {/* Scanner Overlay Box & Laser Animation (shown while active) */}
          {!isInitializing && !cameraError && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-44 w-72 rounded-lg border-2 border-orange-500/80 shadow-[0_0_15px_rgba(247,130,35,0.4)]">
                {/* Corner Accents */}
                <span className="absolute -top-1 -left-1 h-4 w-4 border-t-2 border-l-2 border-orange-400" />
                <span className="absolute -top-1 -right-1 h-4 w-4 border-t-2 border-r-2 border-orange-400" />
                <span className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-orange-400" />
                <span className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-orange-400" />

                {/* Animated Horizontal Laser Scanline */}
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent shadow-[0_0_8px_#F78223] animate-pulse"
                     style={{
                       animation: "barcodeScan 2s ease-in-out infinite alternate",
                     }}
                />
              </div>
            </div>
          )}

          {/* Scan Status Toast Banner */}
          {scanStatus && (
            <div
              className={clsx(
                "absolute top-3 inset-x-4 z-20 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur-md transition-all duration-200 animate-in slide-in-from-top-2",
                scanStatus.type === "success" && "bg-green-600/90 text-white",
                scanStatus.type === "error" && "bg-amber-600/90 text-white",
                scanStatus.type === "info" && "bg-zinc-800/90 text-zinc-200"
              )}
            >
              {scanStatus.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
              {scanStatus.type === "error" && <AlertCircle className="h-4 w-4 shrink-0" />}
              <span className="truncate flex-1">{scanStatus.message}</span>
            </div>
          )}
        </div>

        {/* Controls Footer */}
        <div className="border-t border-zinc-800 bg-[#121316] px-4 py-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={continuousScan}
                onChange={(e) => setContinuousScan(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-black text-orange-600 focus:ring-orange-500 cursor-pointer"
              />
              <span>Continuous scanning</span>
            </label>

            <div className="flex items-center gap-1.5">
              {hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  title={torchOn ? "Turn off flashlight" : "Turn on flashlight"}
                  className={clsx(
                    "rounded-lg p-2 transition-colors",
                    torchOn ? "bg-orange-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  )}
                >
                  <Flashlight size={16} />
                </button>
              )}

              {cameras.length > 1 && (
                <button
                  type="button"
                  onClick={switchCamera}
                  title="Switch camera"
                  className="rounded-lg bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  <SwitchCamera size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <p className="text-[11px] text-zinc-400 truncate">
              Align barcode, QR, or serial code within the box.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-md bg-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
