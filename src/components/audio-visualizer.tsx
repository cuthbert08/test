'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

type AudioVisualizerProps = {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
};

const AudioVisualizer = ({ audioElement, isPlaying }: AudioVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!audioElement) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    }

    const draw = () => {
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      if (!canvas || !analyser) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 2;
      let barHeight;
      let x = 0;

      const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent');
      const [h, s, l] = accentColor.trim().split(' ').map(parseFloat);
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        
        const opacity = barHeight > 0 ? Math.min(barHeight / 100, 0.8) + 0.2 : 0;
        ctx.fillStyle = `hsla(${h}, ${s}%, ${l}%, ${opacity})`;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
      
      animationFrameIdRef.current = requestAnimationFrame(draw);
    };

    if (isPlaying) {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      animationFrameIdRef.current = requestAnimationFrame(draw);
    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      const canvas = canvasRef.current;
      if(canvas) {
        const ctx = canvas.getContext('2d');
        if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isPlaying, audioElement, theme]);

  return <canvas ref={canvasRef} width="1000" height="120" className="w-full h-32 rounded-lg" />;
};

export default AudioVisualizer;
