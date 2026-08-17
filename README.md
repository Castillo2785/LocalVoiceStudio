# VoiceStudio

VoiceStudio is a **local-first text-to-speech workspace** that requires no account or API key. It uses the open-source `edge-tts` Python wrapper to access Microsoft Edge online voices and uses FFmpeg locally to export MP3, WAV, and AAC files. The app includes named Mandarin, English, and Cantonese voice presets, gender selection, four performance styles, pitch/rate/volume/pause controls, browser playback, and local generation history.

![VoiceStudio dark professional voice studio interface](docs/images/voicestudio-dashboard.png)

*The VoiceStudio workspace: script editing, language and voice selection, parameter controls, and local generation.*

> **Important:** the project is free, open source, and does not require cloud deployment. Speech synthesis still needs network access to the Edge online voice service. It is not an offline TTS engine and should not be represented as a production service with an SLA.

## Requirements

| Dependency | Purpose | macOS setup |
|---|---|---|
| Node.js 22+ | Runs the React app and local server | Install if not already available |
| Python 3.9+ | Runs `edge-tts` | Install if not already available |
| FFmpeg | Creates silence segments and exports WAV/AAC | `brew install ffmpeg` |

## Quick start

Run the following commands from the project root:

```bash
pnpm install
pnpm voice:setup
pnpm dev
```

The terminal will print a local address, usually `http://localhost:3000`. On the first render, edge-tts retrieves audio online and stores generated files in `local-data/audio/`; this directory is ignored by Git.

## Workflow

Enter a script, select **Mandarin**, **English**, or **Cantonese**, and then choose **Female voice** or **Male voice**. Each language and gender combination offers named neural voice presets. Choose News Anchor, Storyteller, Calm, or Energetic, then refine Pitch, Speed / Rate, Volume, and Pause / Break with the sliders.

After selecting **Generate voice**, preview the render in the dark player and download it as MP3, WAV, or AAC. Generation metadata is stored in browser `localStorage` and supports replay and repeat downloads.

## Voices and formats

The verified defaults are `zh-CN-XiaoxiaoNeural / zh-CN-YunxiNeural` for Mandarin, `en-US-AriaNeural / en-US-ChristopherNeural` for English, and `zh-HK-HiuMaanNeural / zh-HK-WanLungNeural` for Cantonese. Available Edge voices may change over time.

`edge-tts` produces MP3 natively. VoiceStudio uses FFmpeg locally to convert MP3 to WAV and AAC, and inserts the selected pause duration between text segments.

## Verification

```bash
pnpm test
pnpm check
```

The test suite covers the language and voice catalog, style presets, request validation, and the real local edge-tts + FFmpeg MP3/WAV/AAC pipeline.

## References

- [edge-tts](https://github.com/rany2/edge-tts)
- [FFmpeg](https://ffmpeg.org/)
- [Local TTS decision](docs/local-tts-decision.md)
- [Local architecture](docs/local-architecture.md)
- [Open-source deployment and GitHub publishing guide](docs/OPEN_SOURCE_DEPLOYMENT_GUIDE.md)

## Open-source collaboration

This project uses the [MIT License](LICENSE). Read the [contribution guide](CONTRIBUTING.md), [security policy](SECURITY.md), and [open-source deployment and GitHub publishing guide](docs/OPEN_SOURCE_DEPLOYMENT_GUIDE.md) before contributing.
