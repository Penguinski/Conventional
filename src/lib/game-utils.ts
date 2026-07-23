import { useEffect, useRef, useState } from "react";

export function useActiveTimer(running: boolean) {
  const [seconds, setSeconds] = useState(0);
  const startRef = useRef(0);
  const elapsedRef = useRef(0);
  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now();
    const interval = window.setInterval(() => {
      if (document.hidden) return;
      const now = performance.now();
      elapsedRef.current += now - startRef.current;
      startRef.current = now;
      setSeconds(Math.floor(elapsedRef.current / 1000));
    }, 250);
    const visibility = () => { startRef.current = performance.now(); };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [running]);
  return seconds;
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
