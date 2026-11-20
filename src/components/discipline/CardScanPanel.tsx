import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CameraOff,
  CheckCircle2,
  ImageUp,
  Loader2,
  RotateCcw,
  ScanLine,
  ShieldAlert,
  UserRound,
} from 'lucide-react';
import jsQR from 'jsqr';
import { extractCardToken, isValidCardToken } from '../../lib/cardToken';
import { POINT_STATUS_LABELS, POINT_STATUS_STYLES } from '../../lib/discipline';
import { staffService } from '../../services/staffService';
import type { CardScanResult } from '../../types';

interface CardScanPanelProps {
  canRecord: boolean;
  onRecord: (result: CardScanResult) => void;
  onClose: () => void;
}

type CameraState = 'idle' | 'starting' | 'scanning';

const MAX_DECODE_WIDTH = 640;
const MAX_UPLOAD_WIDTH = 900;

function drawToCanvas(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (!sourceWidth || !sourceHeight) return null;
  const scale = Math.min(1, maxWidth / sourceWidth);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return { canvas, ctx };
}

function decodeCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): string {
  const image = ctx.getImageData(0, 0, width, height);
  const code = jsQR(image.data, width, height, { inversionAttempts: 'dontInvert' });
  return code?.data?.trim() || '';
}

async function decodeImageFile(file: File): Promise<string> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    try {
      const drawn = drawToCanvas(bitmap, bitmap.width, bitmap.height, MAX_UPLOAD_WIDTH);
      if (!drawn) return '';
      return decodeCanvas(drawn.ctx, drawn.canvas.width, drawn.canvas.height);
    } finally {
      bitmap.close();
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Gambar tidak bisa dibaca.'));
      element.src = url;
    });
    const drawn = drawToCanvas(image, image.naturalWidth, image.naturalHeight, MAX_UPLOAD_WIDTH);
    if (!drawn) return '';
    return decodeCanvas(drawn.ctx, drawn.canvas.width, drawn.canvas.height);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function CardScanPanel({ canRecord, onRecord, onClose }: CardScanPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const resolvingRef = useRef(false);

  const [camera, setCamera] = useState<CameraState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState('');
  const [result, setResult] = useState<CardScanResult | null>(null);
  const [resolving, setResolving] = useState(false);

  const stopCamera = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const stream = streamRef.current;
    streamRef.current = null;
    stream?.getTracks().forEach((track) => track.stop());
    const video = videoRef.current;
    if (video) {
      if (video.srcObject) {
        try {
          video.pause();
        } catch {
          /* jsdom / browser tanpa media */
        }
      }
      video.srcObject = null;
    }
    setCamera('idle');
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const resolveToken = useCallback(
    async (raw: string) => {
      if (resolvingRef.current) return;
      const token = extractCardToken(raw);
      if (!isValidCardToken(token)) {
        setError('Kode kartu tidak valid. Pastikan QR kartu SIM-BK, bukan QR lain.');
        return;
      }

      resolvingRef.current = true;
      stopCamera();
      setResolving(true);
      setError(null);
      try {
        const next = await staffService.resolveCard(token);
        setResult(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kartu tidak bisa dibaca.');
      } finally {
        resolvingRef.current = false;
        setResolving(false);
      }
    },
    [stopCamera],
  );

  const startCamera = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Kamera tidak didukung browser ini. Tempel kode kartu atau unggah foto QR.');
      return;
    }

    setCamera('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setCamera('idle');
        return;
      }
      video.srcObject = stream;
      await video.play();
      setCamera('scanning');

      timerRef.current = window.setInterval(() => {
        if (resolvingRef.current) return;
        const element = videoRef.current;
        if (!element || element.readyState < 2) return;
        const drawn = drawToCanvas(
          element,
          element.videoWidth,
          element.videoHeight,
          MAX_DECODE_WIDTH,
        );
        if (!drawn) return;
        const value = decodeCanvas(drawn.ctx, drawn.canvas.width, drawn.canvas.height);
        if (value) void resolveToken(value);
      }, 280);
    } catch (err) {
      stopCamera();
      const name = (err as { name?: string })?.name;
      setError(
        name === 'NotAllowedError'
          ? 'Izin kamera ditolak. Izinkan kamera atau tempel kode kartu manual.'
          : 'Kamera tidak bisa dibuka. Tempel kode kartu atau unggah foto QR.',
      );
    }
  }, [resolveToken, stopCamera]);

  const onUpload = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setResolving(true);
    try {
      const value = await decodeImageFile(file);
      if (!value) {
        setError('QR tidak terbaca dari gambar. Coba foto yang lebih jelas atau tempel kode manual.');
        return;
      }
      await resolveToken(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gambar tidak bisa dibaca.');
    } finally {
      setResolving(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setManual('');
    resolvingRef.current = false;
  };

  if (result) {
    const statusLabel = POINT_STATUS_LABELS[result.status] || result.status;
    const statusStyle = POINT_STATUS_STYLES[result.status] || 'bg-bg text-muted border-border';

    return (
      <div className="space-y-3.5">
        <div className="flex items-start gap-3 rounded-[16px] border border-emerald-300 bg-emerald-50 p-3.5">
          <CheckCircle2 size={20} className="mt-0.5 flex-none text-emerald-700" />
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-emerald-900">Kartu dikenali</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-emerald-800">
              Data siswa dibuka tanpa PIN. Pindaian dicatat di audit sekolah.
            </p>
          </div>
        </div>

        <div className="rounded-[16px] border border-border bg-white p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-neutral-900 text-sm font-extrabold text-white">
              {result.nama
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase() ?? '')
                .join('') || 'S'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-extrabold text-text">{result.nama}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-muted">
                Kelas {result.kelas || '-'} · NIS {result.nis || '-'}
              </p>
              <span
                className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${statusStyle}`}
              >
                {statusLabel}
              </span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <PointTile label="Total poin" value={result.totalPoints} />
            <PointTile label="Sisa poin" value={result.balance} />
            <PointTile label="Semester" value={result.semesterPoints} />
            <PointTile label="Poin buku" value={result.totalGuidebookPoints} />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-[11px] border border-border bg-white px-4 text-xs font-bold text-text hover:bg-gray-50"
          >
            <RotateCcw size={14} /> Scan lagi
          </button>
          {canRecord ? (
            <button
              type="button"
              onClick={() => onRecord(result)}
              className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-[11px] bg-black px-4 text-xs font-extrabold text-white hover:bg-neutral-800"
            >
              <ShieldAlert size={14} /> Catat Pelanggaran
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-[11px] bg-black px-4 text-xs font-extrabold text-white hover:bg-neutral-800"
            >
              Selesai
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      <div className="relative overflow-hidden rounded-[16px] border border-border bg-neutral-900">
        <video
          ref={videoRef}
          className={`aspect-[4/3] w-full object-cover ${camera === 'scanning' ? '' : 'opacity-40'}`}
          muted
          playsInline
        />
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="relative h-[56%] w-[64%] max-w-[260px] rounded-[14px] border-2 border-white/80">
            <span className="absolute -left-0.5 -top-0.5 h-5 w-5 rounded-tl-[14px] border-l-4 border-t-4 border-emerald-400" />
            <span className="absolute -right-0.5 -top-0.5 h-5 w-5 rounded-tr-[14px] border-r-4 border-t-4 border-emerald-400" />
            <span className="absolute -bottom-0.5 -left-0.5 h-5 w-5 rounded-bl-[14px] border-b-4 border-l-4 border-emerald-400" />
            <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-br-[14px] border-b-4 border-r-4 border-emerald-400" />
          </div>
        </div>

        {camera !== 'scanning' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 px-4 text-center text-white">
            <ScanLine size={30} className="opacity-80" />
            <p className="text-xs font-bold">
              {camera === 'starting' ? 'Membuka kamera…' : 'Arahkan kamera ke QR di kartu siswa'}
            </p>
            {camera === 'starting' && <Loader2 size={18} className="animate-spin" />}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {camera === 'scanning' ? (
          <button
            type="button"
            onClick={stopCamera}
            className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-[11px] border border-border bg-white px-3 text-xs font-bold text-text hover:bg-gray-50"
          >
            <CameraOff size={14} /> Matikan kamera
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void startCamera()}
            disabled={camera === 'starting' || resolving}
            className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-[11px] bg-black px-3 text-xs font-bold text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {camera === 'starting' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Camera size={14} />
            )}
            Nyalakan kamera
          </button>
        )}

        <label className="inline-flex min-h-[40px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[11px] border border-border bg-white px-3 text-xs font-bold text-text hover:bg-gray-50">
          <ImageUp size={14} /> Unggah foto QR
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(event) => {
              void onUpload(event.target.files?.[0] ?? null);
              event.target.value = '';
            }}
          />
        </label>
      </div>

      <div className="rounded-[14px] border border-border bg-bg/50 p-3">
        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-muted">
            Atau tempel kode kartu
          </span>
          <div className="mt-1 flex gap-2">
            <input
              value={manual}
              onChange={(event) => setManual(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void resolveToken(manual);
                }
              }}
              placeholder="SIMBK1:… atau tempel URL kartu"
              className="min-h-[42px] min-w-0 flex-1 rounded-[10px] border border-border bg-white px-3 text-xs font-semibold text-text focus:border-black focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void resolveToken(manual)}
              disabled={resolving || !manual.trim()}
              className="inline-flex min-h-[42px] flex-none items-center gap-1.5 rounded-[10px] bg-black px-3.5 text-xs font-extrabold text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {resolving ? <Loader2 size={14} className="animate-spin" /> : <ScanLine size={14} />}
              Cek
            </button>
          </div>
        </label>
      </div>

      {resolving && (
        <p className="flex items-center gap-2 text-[11px] font-semibold text-muted">
          <Loader2 size={14} className="animate-spin" /> Membaca kartu…
        </p>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-[12px] border border-red-300 bg-red-50 p-3 text-[11px] leading-relaxed text-red-800">
          <AlertTriangle size={15} className="mt-0.5 flex-none" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-[12px] border border-border bg-bg/40 p-3 text-[10.5px] leading-relaxed text-muted">
        <UserRound size={14} className="mt-0.5 flex-none" />
        <p>
          BK dapat memindai semua siswa di sekolahnya. Wali kelas hanya bisa membuka siswa di
          kelas yang diampu. PIN tetap diperlukan bila siswa membuka portal sendiri.
        </p>
      </div>
    </div>
  );
}

function PointTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[10px] border border-border bg-bg/40 px-2.5 py-2">
      <p className="text-[9px] font-extrabold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 text-base font-extrabold leading-none tabular-nums text-text">
        {value}
      </p>
    </div>
  );
}
