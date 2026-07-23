import { useCallback, useEffect, useLayoutEffect, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react";

export type CanvasPoint = { x: number; y: number; pressure: number };

interface PointerStrokeOptions {
  logicalWidth: number;
  logicalHeight: number;
  onFrame: (stroke: CanvasPoint[]) => void;
  onStart?: (point: CanvasPoint) => void;
  onEnd: (stroke: CanvasPoint[]) => void;
  onCancel?: (stroke: CanvasPoint[]) => void;
}

export function pointFromPointer(
  event: Pick<PointerEvent, "clientX" | "clientY" | "pressure">,
  canvas: HTMLCanvasElement,
  logicalWidth: number,
  logicalHeight: number,
): CanvasPoint {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(logicalWidth, (event.clientX - rect.left) * logicalWidth / Math.max(rect.width, 1))),
    y: Math.max(0, Math.min(logicalHeight, (event.clientY - rect.top) * logicalHeight / Math.max(rect.height, 1))),
    pressure: event.pressure || .5,
  };
}

export function prepareLogicalContext(canvas: HTMLCanvasElement, logicalWidth: number, logicalHeight: number) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D non disponibile");
  context.setTransform(canvas.width / logicalWidth, 0, 0, canvas.height / logicalHeight, 0, 0);
  return context;
}

export function useResponsiveCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  logicalWidth: number,
  logicalHeight: number,
  render: () => void,
) {
  const renderRef = useRef(render);
  useLayoutEffect(() => { renderRef.current = render; }, [render]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sync = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 3);
      const width = Math.max(1, Math.round(rect.width * ratio));
      const height = Math.max(1, Math.round(rect.height * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      renderRef.current();
    };
    const observer = new ResizeObserver(sync);
    observer.observe(canvas);
    window.addEventListener("orientationchange", sync);
    sync();
    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", sync);
    };
  }, [canvasRef, logicalHeight, logicalWidth]);
}

export function usePointerStroke({
  logicalWidth,
  logicalHeight,
  onFrame,
  onStart,
  onEnd,
  onCancel,
}: PointerStrokeOptions) {
  const pointerIdRef = useRef<number | null>(null);
  const strokeRef = useRef<CanvasPoint[]>([]);
  const frameRef = useRef<number | null>(null);
  const callbacksRef = useRef({ onFrame, onStart, onEnd, onCancel });
  useEffect(() => { callbacksRef.current = { onFrame, onStart, onEnd, onCancel }; }, [onCancel, onEnd, onFrame, onStart]);

  const flush = useCallback(() => {
    frameRef.current = null;
    callbacksRef.current.onFrame(strokeRef.current);
  }, []);

  const schedule = useCallback(() => {
    if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(flush);
  }, [flush]);

  const clearActive = useCallback((canvas: HTMLCanvasElement, pointerId: number) => {
    pointerIdRef.current = null;
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (canvas.hasPointerCapture(pointerId)) {
      try { canvas.releasePointerCapture(pointerId); } catch { /* the browser already ended this pointer */ }
    }
  }, []);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (pointerIdRef.current !== null) return;
    event.preventDefault();
    const canvas = event.currentTarget;
    const point = pointFromPointer(event.nativeEvent, canvas, logicalWidth, logicalHeight);
    pointerIdRef.current = event.pointerId;
    strokeRef.current = [point];
    try { canvas.setPointerCapture(event.pointerId); } catch { /* synthetic/ended pointers still use the fallback lifecycle */ }
    callbacksRef.current.onStart?.(point);
    schedule();
  }, [logicalHeight, logicalWidth, schedule]);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    event.preventDefault();
    const point = pointFromPointer(event.nativeEvent, event.currentTarget, logicalWidth, logicalHeight);
    strokeRef.current.push(point);
    schedule();
  }, [logicalHeight, logicalWidth, schedule]);

  const finish = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    event.preventDefault();
    const canvas = event.currentTarget;
    const point = pointFromPointer(event.nativeEvent, canvas, logicalWidth, logicalHeight);
    const last = strokeRef.current.at(-1);
    if (!last || Math.hypot(point.x - last.x, point.y - last.y) > .25) strokeRef.current.push(point);
    const completed = [...strokeRef.current];
    callbacksRef.current.onFrame(completed);
    clearActive(canvas, event.pointerId);
    strokeRef.current = [];
    callbacksRef.current.onEnd(completed);
  }, [clearActive, logicalHeight, logicalWidth]);

  const cancel = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    const canvas = event.currentTarget;
    const cancelled = [...strokeRef.current];
    clearActive(canvas, event.pointerId);
    strokeRef.current = [];
    callbacksRef.current.onCancel?.(cancelled);
  }, [clearActive]);

  const lostCapture = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    const cancelled = [...strokeRef.current];
    pointerIdRef.current = null;
    strokeRef.current = [];
    callbacksRef.current.onCancel?.(cancelled);
  }, []);

  useEffect(() => () => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: finish,
    onPointerCancel: cancel,
    onLostPointerCapture: lostCapture,
  };
}
