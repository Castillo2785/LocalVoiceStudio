# VoiceStudio local deployment and GitHub publishing guide

This guide is for maintainers who want to run, verify, and publish VoiceStudio on GitHub. The project does not require cloud deployment, an account, or a TTS API key. Speech synthesis uses the open-source `edge-tts` wrapper and accesses the Microsoft Edge online voice service during rendering. The project can therefore be published as free open source, but it still needs a network connection at runtime.

> Complete the security check before the first push. GitHub explicitly warns that passwords, access tokens, API keys, and other sensitive information must never be added, committed, or pushed to a remote repository.[1]

## 1. Requirements

| Component | Minimum | Purpose | macOS check |
|---|---:|---|---|
| Node.js | 22+ | React application and local server | `node --version` |
| pnpm | 10+ | JavaScript dependency manager | `pnpm --version` |
| Python | 3.9+ | Local `edge-tts` runtime | `python3 --version` |
| FFmpeg | Current stable release | WAV/AAC conversion and sentence breaks | `ffmpeg -version` |
| Network access | Required | Calls the Edge online voice service | Verify browser connectivity |

## 2. Clone and run on macOS

The following example uses `https://github.com/YOUR_GITHUB_USERNAME/voicestudio.git`. Replace the placeholder with your GitHub username.

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/voicestudio.git
cd voicestudio

# Install JavaScript dependencies.
pnpm install --frozen-lockfile

# Create an isolated Python environment and install edge-tts.
pnpm voice:setup

# Install the audio conversion tool once.
brew install ffmpeg

# Verify the project and local speech pipeline.
pnpm test
pnpm check

# Start the local frontend and server.
pnpm dev
```

After startup, open the address printed in the terminal, usually [http://localhost:3000](http://localhost:3000). Enter a short script, select a Mandarin, English, or Cantonese voice, and choose **Generate voice**. The app writes MP3, WAV, and AAC files under `local-data/audio/`; that directory is already listed in `.gitignore` and must not be committed.

## 3. Local troubleshooting

| Symptom | Likely cause | Resolution |
|---|---|---|
| `pnpm: command not found` | pnpm is not installed | Run `corepack enable && corepack prepare pnpm@10 --activate`, or follow pnpm's official installation guide |
| `edge-tts` is missing | The Python virtual environment was not created | Run `pnpm voice:setup` from the project root |
| FFmpeg is missing | The audio converter is not installed | Run `brew install ffmpeg`, then retry |
| MP3 works but WAV/AAC fails | FFmpeg is unavailable or incomplete | Run `ffmpeg -version`, then reinstall FFmpeg if required |
| edge-tts fails | Network issue, service change, or a temporarily unavailable voice | Check network access, select another preset in the same language, and retry |

## 4. Pre-publish security check

Run the following commands in the project root. They list files that are ready to commit and search for common sensitive field names. A match is not necessarily a leak, but every result should be reviewed manually.

```bash
git status --short
git check-ignore -v .venv node_modules local-data || true
git grep -n -E "(API[_-]?KEY|SECRET|TOKEN|PASSWORD|PRIVATE[_-]?KEY)" -- . ':!pnpm-lock.yaml' || true
```

Confirm that `.venv/`, `node_modules/`, `local-data/`, `.env*`, personally generated audio, browser exports, and all access tokens are not staged. If configurable environment variables are added in the future, commit only the variable names and descriptions in `.env.example`; never commit real values.

## 5. Create an empty GitHub repository in the web interface

After signing in to GitHub, select **+** in the upper-right corner and choose **New repository**. Select your personal account as the owner, name the repository `voicestudio`, and use this optional description:

> Local-first, free text-to-speech studio with Mandarin, English and Cantonese voices.

Select **Public** for open-source visibility. Because the local project already contains a README, `.gitignore`, and license, do **not** select “Add a README file,” “Add .gitignore,” or “Choose a license” when creating the remote repository. GitHub documents that pre-populating those files while importing an existing project can introduce merge conflicts.[2]

Select **Create repository** and keep the Quick Setup page open; the next section uses the repository URL shown there.

## 6. Push with Git

Run these commands from the local project root. Replace `YOUR_GITHUB_USERNAME` with your GitHub username, and replace `voicestudio` if you choose a different repository name.

```bash
cd /Users/fanrongqing/Desktop/Manusworkspace/voicestudio

# Run only when the directory has not been initialized as a Git repository.
git init -b main

# Configure commit identity; this is needed only once.
git config user.name "YOUR NAME"
git config user.email "YOUR_EMAIL@example.com"

# Review before committing.
git add .
git status
git commit -m "Initial open-source release"

# Connect the empty GitHub repository and push.
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/voicestudio.git
git remote -v
git push -u origin main
```

GitHub may request browser authentication or a personal access token on the first `git push`. Use GitHub's authentication flow and never write a token into code, a README, or shell history. GitHub's documented flow is to add the `origin` remote, verify it with `git remote -v`, and then push `main`.[1]

## 7. Optional: publish with GitHub CLI

If GitHub CLI is installed and authenticated, the following creates a public repository, adds a remote, and pushes the current branch:

```bash
cd /Users/fanrongqing/Desktop/Manusworkspace/voicestudio
gh auth login
gh repo create voicestudio --public --source=. --remote=origin --push
```

GitHub documents `gh repo create --source=. --public --push` as a non-interactive method for publishing an existing local project.[1]

## 8. Optional: publish with GitHub Desktop

If you prefer a graphical workflow, install GitHub Desktop. Choose **File → Add local repository**, select `/Users/fanrongqing/Desktop/Manusworkspace/voicestudio`, make the initial commit, and then select **Publish repository**. Enter `voicestudio`, the description, and Public visibility before confirming the upload.

## 9. Recommended repository settings

| Setting | Recommendation | Purpose |
|---|---|---|
| About | Add the description and `tts`, `edge-tts`, `voiceover`, `mandarin`, and `cantonese` topics | Improve discoverability |
| License | Keep the included MIT License | Clarify reuse, modification, and distribution rights |
| Issues | Keep enabled | Collect bugs and feature requests |
| Branch protection | Require pull request review for `main` once collaborators join | Prevent accidental direct pushes |
| Releases | Create tags and releases such as `v0.1.0` for stable versions | Make versions clear for users |

The README is usually the first project entry point visitors see. GitHub recommends explaining what a project does, why it is useful, how to start, where to get help, and who maintains it.[3]

## References

[1] [GitHub Docs: Adding locally hosted code to GitHub](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)

[2] [GitHub Docs: Creating a new repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository)

[3] [GitHub Docs: About READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)
