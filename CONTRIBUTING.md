# Contributing to VoiceStudio

Thank you for your interest in VoiceStudio. Before submitting code, open an Issue that describes the problem or proposed feature. For larger changes, confirm the direction with a maintainer before implementation begins.

## Local setup

Follow the [open-source deployment and GitHub publishing guide](docs/OPEN_SOURCE_DEPLOYMENT_GUIDE.md) to install dependencies. Create a descriptive branch before you start, such as `feature/voice-search` or `fix/aac-export`.

## Contribution requirements

Keep code TypeScript-safe and interfaces responsive. Do not commit generated audio, `.venv/`, `node_modules/`, `.env*`, or any credentials. Before opening a pull request, run:

```bash
pnpm test
pnpm check
```

If a change affects voice parameters, export formats, or the local speech pipeline, add or update Vitest coverage. If a change affects the interface, include desktop and mobile screenshots and identify the browsers you verified.

## Pull requests

Pull requests should clearly explain the change, verification method, and possible impact. Keep each pull request focused; do not combine unrelated formatting, dependency updates, and features in one submission.

## Voice use boundaries

Contributors must not use VoiceStudio to enable impersonation, fraud, or unauthorized voice cloning. The default edge-tts integration relies on an online voice service and must not be described as fully offline or production-SLA-backed.
