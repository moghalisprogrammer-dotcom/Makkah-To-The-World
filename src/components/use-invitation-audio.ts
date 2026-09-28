"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

export function useInvitationAudio(
  ref: RefObject<HTMLAudioElement | null>,
  effects: (value: boolean) => Promise<void>,
) {
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const mutedByUser = useRef(false);
  const pending = useRef(false);
  const generation = useRef(0);
  const start = useCallback(async () => {
    const audio = ref.current;
    if (
      !audio ||
      mutedByUser.current ||
      document.hidden ||
      pending.current ||
      !audio.paused
    )
      return;
    pending.current = true;
    const attempt = ++generation.current;
    audio.volume = 0.32;
    try {
      await audio.play();
      if (attempt !== generation.current || mutedByUser.current) return;
      setAudioError(false);
      void effects(true).catch(() => {});
    } catch (error) {
      if (attempt === generation.current) {
        // Browser autoplay restrictions are expected; retry on a real gesture.
        setAudioError(
          !(
            error instanceof DOMException &&
            ["NotAllowedError", "AbortError"].includes(error.name)
          ),
        );
      }
    } finally {
      if (attempt === generation.current) pending.current = false;
    }
  }, [ref, effects]);
  const pause = useCallback(() => {
    generation.current++;
    pending.current = false;
    ref.current?.pause();
    setPlaying(false);
    void effects(false).catch(() => {});
  }, [ref, effects]);
  const toggleSound = useCallback(() => {
    const audio = ref.current;
    if (!audio) return;
    mutedByUser.current = !audio.paused;
    try {
      localStorage.setItem("makkah_sound", mutedByUser.current ? "off" : "on");
    } catch {}
    if (mutedByUser.current) pause();
    else void start();
  }, [ref, pause, start]);

  useEffect(() => {
    const audio = ref.current;
    if (!audio) return;
    try {
      mutedByUser.current = localStorage.getItem("makkah_sound") === "off";
    } catch {}
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const gesture = (event: Event) => {
      if (
        event.target instanceof Element &&
        event.target.closest("[data-audio-toggle]")
      )
        return;
      void start();
    };
    const visibility = () => {
      if (document.hidden) pause();
      else void start();
    };
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    for (const name of ["pointerup", "touchend", "click", "keydown"])
      document.addEventListener(name, gesture);
    document.addEventListener("visibilitychange", visibility);
    void start();
    return () => {
      generation.current++;
      pending.current = false;
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      for (const name of ["pointerup", "touchend", "click", "keydown"])
        document.removeEventListener(name, gesture);
      document.removeEventListener("visibilitychange", visibility);
      audio.pause();
      void effects(false).catch(() => {});
    };
  }, [ref, start, pause, effects]);
  return { playing, audioError, toggleSound };
}
