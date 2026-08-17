# Security Policy

## Reporting a vulnerability

Do not disclose security vulnerabilities, access tokens, user data, or sensitive reproduction material in a public Issue. Contact a repository maintainer privately through the published contact channel and include the impact, reproduction steps, and a possible remediation.

## Secrets and local data

VoiceStudio's default local mode does not require a TTS API key. If optional third-party services are added later, store real credentials only in a local `.env` file or GitHub Actions Secrets; never commit them. Generated audio in `local-data/` and the `.venv/` virtual environment must not be uploaded.
