"""Create an original, sample-free Saudi-Ardah-inspired invitation soundscape.

Requirements: numpy, scipy; imageio_ffmpeg (or ffmpeg on PATH) for MP3.
Run from any directory: python scripts/create-invitation-audio.py

This is a contemporary synthetic composition, not an authentic Ardah recording.
The melody is newly written here and no recordings or third-party music are used.
"""

from __future__ import annotations

import json
import math
from pathlib import Path
import shutil
import subprocess
import wave

import numpy as np
from scipy.signal import butter, sosfilt, resample_poly


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "audio"
WORK = ROOT / "tmp" / "invitation-audio"
SR = 44100
DOTTED_QUARTER_BPM = 72
EIGHTH = 60 / DOTTED_QUARTER_BPM / 3
BAR = EIGHTH * 6
BARS = 24
DURATION = BARS * BAR
N = round(DURATION * SR)
RNG = np.random.default_rng(20261001)
DRUMS = np.zeros((N, 2), dtype=np.float64)
MUSIC = np.zeros_like(DRUMS)
AIR = np.zeros_like(DRUMS)


def hz(midi: float) -> float:
    return 440 * 2 ** ((midi - 69) / 12)


def place(bus: np.ndarray, signal: np.ndarray, seconds: float, volume: float, pan: float = 0) -> None:
    """Equal-power stereo pan, with deterministic tiny human timing offsets."""
    start = round(seconds * SR)
    if start < 0:
        signal, start = signal[-start:], 0
    length = min(len(signal), N - start)
    if length <= 0:
        return
    angle = (pan + 1) * math.pi / 4
    bus[start : start + length, 0] += signal[:length] * volume * math.cos(angle)
    bus[start : start + length, 1] += signal[:length] * volume * math.sin(angle)


def colored_noise(length: int, cutoff: float, kind: str = "lowpass") -> np.ndarray:
    noise = RNG.standard_normal(length)
    return sosfilt(butter(2, cutoff, kind, fs=SR, output="sos"), noise)


def dum(velocity: float = 1) -> np.ndarray:
    """Warm synthetic large frame drum: membrane modes, no kick sample."""
    t = np.arange(round(0.63 * SR)) / SR
    phase = 2 * np.pi * (83 * t + 14 * 0.045 * (1 - np.exp(-t / 0.045)))
    drum = np.sin(phase) * np.exp(-t / 0.135)
    drum += 0.31 * np.sin(2 * np.pi * 139 * t + 0.2) * np.exp(-t / 0.087)
    drum += 0.13 * np.sin(2 * np.pi * 212 * t) * np.exp(-t / 0.063)
    drum += 0.075 * colored_noise(len(t), 2900) * np.exp(-t / 0.018)
    return drum * (1 - np.exp(-t / 0.0012)) * velocity


def tek(variant: int = 0) -> np.ndarray:
    """Muted small-drum response, intentionally soft above 5 kHz."""
    t = np.arange(round(0.24 * SR)) / SR
    f = 233 if variant == 0 else 278
    membrane = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.037)
    membrane += 0.38 * np.sin(2 * np.pi * f * 1.57 * t) * np.exp(-t / 0.028)
    skin = colored_noise(len(t), 4300) * np.exp(-t / 0.015)
    result = 0.58 * membrane + 0.48 * skin
    return result * (1 - np.exp(-t / 0.0007))


def oud(midi: float, length: float = 1.7, soft: bool = False) -> np.ndarray:
    """Two-course additive plucked string, with a dark, short oud-like body."""
    t = np.arange(round(length * SR)) / SR
    fundamental = hz(midi)
    tone = np.zeros_like(t)
    vibrato = 0.0013 * np.sin(2 * np.pi * 4.4 * t) * (1 - np.exp(-t / 0.26))
    for course, cents in enumerate((-1.4, 1.4)):
        frequency = fundamental * 2 ** (cents / 1200)
        for harmonic in range(1, 15):
            strength = math.sin(harmonic * math.pi * 0.21) / harmonic ** 1.25
            decay = np.exp(-t * (1.55 + harmonic * (0.43 if soft else 0.29)))
            angle = 2 * np.pi * frequency * harmonic * t + vibrato * harmonic
            tone += strength * decay * np.sin(angle + course * 0.045)
    tone += 0.028 * colored_noise(len(t), 2500) * np.exp(-t / 0.009)
    tone *= (1 - np.exp(-t / 0.003))
    # A short release keeps tails click-free when a note ends.
    release = min(round(0.09 * SR), len(tone))
    tone[-release:] *= np.linspace(1, 0, release) ** 2
    return tone * 0.67


def pad(notes: tuple[int, ...], length: float) -> np.ndarray:
    t = np.arange(round(length * SR)) / SR
    value = np.zeros_like(t)
    for note in notes:
        f = hz(note)
        for ratio, amp in ((1, 1), (2, 0.14), (3, 0.035)):
            value += amp * np.sin(2 * np.pi * f * ratio * t + 0.09 * np.sin(2 * np.pi * 0.21 * t))
            value += amp * 0.27 * np.sin(2 * np.pi * f * ratio * 1.0011 * t)
    fade_in = np.minimum(t / 0.9, 1)
    fade_out = np.minimum((length - t) / 1.15, 1)
    return value / len(notes) * np.sin(fade_in * np.pi / 2) ** 2 * np.sin(fade_out * np.pi / 2) ** 2


# Newly composed D-Hijaz-coloured motif. This scale is regional, not claimed
# exclusive to Saudi music. Timing is in eighth-note units of a 6/8 bar.
# D4=62, Eb4=63, F#4=66, G4=67, A4=69, Bb4=70, C5=72, D5=74.
PHRASE_A = [
    [(0, 62, .75), (3, 66, .55)],
    [(0, 67, .68), (2, 66, .46), (4, 63, .51)],
    [(0, 62, .78), (4, 57, .42)],
    [(1, 62, .54), (3, 63, .45), (4.5, 66, .55)],
    [(0, 67, .70), (3, 69, .60)],
    [(0, 70, .54), (2, 69, .52), (4, 67, .52)],
    [(0, 66, .62), (3, 63, .52)],
    [(0, 62, .76)],
]
PHRASE_B = [
    [(0, 69, .68), (3, 72, .53)],
    [(0, 74, .60), (3, 72, .46), (5, 70, .40)],
    [(0, 69, .67), (3, 67, .52)],
    [(0, 66, .58), (3.5, 69, .48)],
    [(0, 67, .66), (2, 66, .46), (4, 63, .50)],
    [(0, 66, .63), (3, 67, .47), (5, 69, .43)],
    [(0, 66, .58), (3, 63, .49)],
    [(0, 62, .76)],
]

for bar_index in range(BARS):
    at = bar_index * BAR
    lift = 0.66 if bar_index < 2 else 0.88 if bar_index < 8 else 1.0 if bar_index < 16 else 0.88
    if bar_index >= 22:
        lift *= 0.75

    # Two groups of three: large-drum pulse followed by two smaller responses.
    for eighth, level in ((0, .28), (3, .21)):
        place(DRUMS, dum(), at + eighth * EIGHTH, level * lift, -.02)
    if bar_index > 0:
        for eighth, level, variant in ((1, .068, 0), (2, .084, 1), (4, .065, 0), (5, .095, 1)):
            timing = float(RNG.uniform(-0.004, 0.005))
            place(DRUMS, tek(variant), at + eighth * EIGHTH + timing, level * lift, -.13 if variant == 0 else .16)

    phrase = PHRASE_B if 8 <= bar_index < 16 else PHRASE_A
    events = phrase[bar_index % 8]
    # Gentle opening; final cadence is D and leaves space for its natural decay.
    if bar_index == 0:
        events = [(1.5, 62, .68), (4.5, 66, .42)]
    if bar_index == 23:
        events = [(0, 62, .71)]
    for eighth, note, strength in events:
        place(MUSIC, oud(note), at + eighth * EIGHTH, .27 * strength, -.12)
    # Sparse low-course answering notes add body without filling every beat.
    if bar_index % 2 == 0 and bar_index < 22:
        bass = 50 if bar_index % 8 < 4 else 55 if bar_index % 8 < 6 else 57
        place(MUSIC, oud(bass, 1.6, soft=True), at + 0.04, .12, .16)
    if 8 <= bar_index < 20 and bar_index % 4 == 2:
        place(MUSIC, oud(74, 1.3, soft=True), at + 5 * EIGHTH, .038, .25)

# Open fifths preserve space around the melody, rather than imposing a Western
# chord progression on the rhythmic reference.
for group in range(6):
    notes = (50, 57, 62) if group % 2 == 0 else (50, 55, 62)
    place(AIR, pad(notes, BAR * 4 + .8), group * BAR * 4, .046, -.22)
    place(AIR, pad(notes, BAR * 4 + .8), group * BAR * 4 + .023, .038, .22)

mix = DRUMS + MUSIC + AIR
# Short stereo room reflections. No external impulse response or sampled audio.
for delay, gain in ((.049, .105), (.091, .09), (.157, .072), (.251, .055), (.379, .041), (.553, .028), (.791, .018), (1.13, .009)):
    shift = round(delay * SR)
    reflection = (MUSIC + AIR * .35)[:-shift, ::-1]
    mix[shift:] += reflection * gain
for delay, gain in ((.031, .04), (.069, .025), (.113, .017)):
    shift = round(delay * SR)
    mix[shift:] += DRUMS[:-shift, ::-1] * gain

# Gentle mastering, rumble removal, and click-free boundaries.
mix = sosfilt(butter(2, 38, "highpass", fs=SR, output="sos"), mix, axis=0)
mix = sosfilt(butter(2, 8500, "lowpass", fs=SR, output="sos"), mix, axis=0)
mix = np.tanh(mix * 1.25)
fade_in = round(.7 * SR)
fade_out = round(1.65 * SR)
mix[:fade_in] *= np.sin(np.linspace(0, np.pi / 2, fade_in))[:, None] ** 2
mix[-fade_out:] *= np.cos(np.linspace(0, np.pi / 2, fade_out))[:, None] ** 2
mix *= 10 ** (-3.65 / 20) / np.max(np.abs(mix))
mix[0] = 0
mix[-1] = 0

OUT.mkdir(parents=True, exist_ok=True)
WORK.mkdir(parents=True, exist_ok=True)
wav_path = WORK / "saudi-invitation-master.wav"
pcm = np.round(mix * 32767).astype("<i2")
with wave.open(str(wav_path), "wb") as wav:
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(SR)
    wav.writeframes(pcm.tobytes())

ffmpeg = shutil.which("ffmpeg")
if not ffmpeg:
    try:
        import imageio_ffmpeg
        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        pass

public_path = OUT / ("saudi-invitation.mp3" if ffmpeg else "saudi-invitation.wav")
decoded = mix
if ffmpeg:
    subprocess.run([
        ffmpeg, "-y", "-hide_banner", "-loglevel", "error", "-i", str(wav_path),
        "-codec:a", "libmp3lame", "-b:a", "160k", "-ar", str(SR),
        "-metadata", "title=Saudi Invitation - Original Ardah-inspired Soundscape",
        "-metadata", "comment=Original synthetic composition; no sampled recordings; not traditional Ardah.",
        str(public_path),
    ], check=True)
    raw = subprocess.run([
        ffmpeg, "-hide_banner", "-loglevel", "error", "-i", str(public_path),
        "-f", "f32le", "-acodec", "pcm_f32le", "-ac", "2", "-ar", str(SR), "-",
    ], check=True, capture_output=True).stdout
    decoded = np.frombuffer(raw, dtype="<f4").reshape(-1, 2)
else:
    shutil.copyfile(wav_path, public_path)


def dbfs(value: float) -> float:
    return float(20 * np.log10(max(float(value), 1e-12)))


true_peak = float(np.max(np.abs(resample_poly(decoded, 4, 1, axis=0))))
metrics = {
    "file": str(public_path.relative_to(ROOT)),
    "duration_seconds": round(len(decoded) / SR, 3),
    "sample_rate_hz": SR,
    "channels": 2,
    "bitrate_kbps": 160 if ffmpeg else None,
    "meter": "6/8",
    "dotted_quarter_bpm": DOTTED_QUARTER_BPM,
    "sample_peak_dbfs": round(dbfs(np.max(np.abs(decoded))), 2),
    "true_peak_4x_dbfs": round(dbfs(true_peak), 2),
    "rms_dbfs": round(dbfs(np.sqrt(np.mean(decoded.astype(np.float64) ** 2))), 2),
    "clipped_samples": int(np.count_nonzero(np.abs(decoded) >= 1)),
    "size_bytes": public_path.stat().st_size,
    "first_sample_abs_max": float(np.max(np.abs(decoded[0]))),
    "last_sample_abs_max": float(np.max(np.abs(decoded[-1]))),
}
assert 35 <= metrics["duration_seconds"] <= 45
assert metrics["clipped_samples"] == 0
assert true_peak < 10 ** (-3 / 20), "Peak ceiling exceeded after MP3 encoding"
(WORK / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
print(json.dumps(metrics, indent=2))
