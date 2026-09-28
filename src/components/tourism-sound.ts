"use client";
import { useCallback, useEffect, useRef } from "react";

// Original, short wind-and-plucked-string cues generated locally in the browser.
export function useTourismSound() {
  const context = useRef<AudioContext | null>(null);
  const enabled = useRef(false);
  const last = useRef(0);
  const cue = useCallback((index = 0) => {
    const audio = context.current;
    if (
      !enabled.current ||
      !audio ||
      audio.state !== "running" ||
      document.hidden
    )
      return;
    const start = audio.currentTime;
    if (start - last.current < 0.35) return;
    last.current = start;
    const master = audio.createGain();
    master.gain.value = 0.1;
    master.connect(audio.destination);
    const buffer = audio.createBuffer(
      1,
      Math.ceil(audio.sampleRate * 0.65),
      audio.sampleRate,
    );
    const noise = buffer.getChannelData(0);
    for (let i = 0; i < noise.length; i++)
      noise[i] =
        (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / noise.length) * 0.24;
    const source = audio.createBufferSource();
    source.buffer = buffer;
    const filter = audio.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(450, start);
    filter.frequency.exponentialRampToValueAtTime(1700, start + 0.3);
    filter.frequency.exponentialRampToValueAtTime(380, start + 0.65);
    source.connect(filter).connect(master);
    source.start(start);
    const base = [220, 246.94, 293.66, 329.63][index % 4];
    [1, 1.5, 2].forEach((ratio, i) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = "triangle";
      osc.frequency.value = base * ratio;
      gain.gain.setValueAtTime(0, start + i * 0.055);
      gain.gain.linearRampToValueAtTime(
        0.22 / (i + 1),
        start + i * 0.055 + 0.008,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.8 + i * 0.055);
      osc.connect(gain).connect(master);
      osc.start(start + i * 0.055);
      osc.stop(start + 1);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    });
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
    };
    setTimeout(() => master.disconnect(), 1400);
  }, []);
  const setEnabled = useCallback(
    async (value: boolean) => {
      enabled.current = value;
      if (value) {
        try {
          context.current ||= new AudioContext();
          await context.current.resume();
          cue();
        } catch {
          enabled.current = false;
        }
      } else await context.current?.suspend();
    },
    [cue],
  );
  useEffect(
    () => () => {
      void context.current?.close();
    },
    [],
  );
  return { cue, setEnabled };
}
