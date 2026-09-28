# Visual identity and image sources

- College wordmark: user-provided `تصميم بدون عنوان.svg`, kept as the source in `assets/college-logo-source.svg`. The browser-ready `public/images/college-logo.webp` is a lossless render at the source's full 2048 × 773 pixel size; every rendered pixel was verified identical to that render.
- College seal: original image extracted from the user-provided visual identity PDF, losslessly encoded as `public/images/college-seal.webp`; decoded pixels are identical to the PNG source.
- Brand palette: `#041B3D`, `#082B65`, `#0082BF`, `#2C97D2`, `#FFFFFF`, from the provided guide.
- AlUla photograph: Khawaja Umer Farooq, [Unsplash](https://unsplash.com/photos/AT9KXQzmfks), [Unsplash License](https://unsplash.com/license).
- Historic Jeddah photograph: muhammad ahkamul hakim, [Unsplash](https://unsplash.com/photos/FDGA5A7IQF4), [Unsplash License](https://unsplash.com/license).
- Arabic typeface: IBM Plex Sans Arabic, self-hosted via Fontsource, SIL Open Font License. Used as an open alternative to DIN Arabic; no licensed DIN webfont was supplied.
- Typography reference: user-provided `tmp/references/page-4.png`. Poppins (English headings and numerals) and Hanken Grotesk (the current name of HK Grotesk, Latin body/headings) are self-hosted via Fontsource, SIL Open Font License. Sources: [Poppins](https://fontsource.org/fonts/poppins/about), [Hanken Grotesk](https://github.com/marcologous/hanken-grotesk). IBM Plex Sans Arabic remains the Arabic fallback until a licensed DIN Arabic webfont is supplied. Manrope remains available for legacy administrative styles.
- Transition sound effects: original filtered wind and plucked triangle-wave notes generated using Web Audio in `src/components/tourism-sound.ts`; no external recording or sample. Triggered only after the visitor enables sound.
- Icons: Lucide, ISC license.
- Current music: original 40-second synthesized instrumental, `public/audio/saudi-invitation.mp3`, created by `scripts/create-invitation-audio.py`. Original melody and sound synthesis, no sampled recordings. Inspired by the drum framework described in [Saudipedia](https://saudipedia.com/en/saudi-ardah-rhythms). It is a contemporary original cue inspired by Saudi Ardah rhythm, not an authentic traditional performance or official tourism song. The added synthetic oud is a contemporary compositional layer, not a claim about traditional Ardah instrumentation. 160 kbps MP3, decoded true peak −4.07 dBFS, no clipping.
- Previous, unused music: “Desert City” by Kevin MacLeod ([official track](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100564)), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Kept as a local earlier asset, no longer played by the site.
- Kaizen: organizer-supplied logo. `assets/kaizen-logo-source.png` retains the website-ready image supplied earlier; `public/images/kaizen-logo.webp` is a lossless encoding with identical pixels and dimensions.
- Rijal Almaa: Satishaa Javali, [Unsplash](https://unsplash.com/photos/L08hlqtD_qE), [Unsplash License](https://unsplash.com/license), `public/images/rijal-almaa.jpg`.
- Diriyah: Ibrahim Abdullah, [Unsplash](https://unsplash.com/photos/XVeesLYfWIo), [Unsplash License](https://unsplash.com/license), `public/images/diriyah.jpg`.
- At-Turaif: ほっきー, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:At-Turaif_District_in_ad-Dir%27iyah_2025.jpg), [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/), `public/images/turaif.jpg`.
- Research-only audio, not shipped, played or sampled: `tmp/audio-archive/saudi-rhythm-example.ogg`, “Saudi Ejemplo” by Derbake, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Saudi_Ejemplo.ogg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). It is an educational Saudi/Khaliji rhythm example, not a complete Ardah performance. No part was used in the original soundtrack. The previous Desert City file is archived in the same directory and is also not shipped.

The location illustration is decorative, not a geographic map. The link opens the exact Google Maps URL supplied by the organizer.

Framework references: [Next.js route handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route), [server cookies](https://nextjs.org/docs/app/api-reference/functions/cookies).
