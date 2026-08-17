import { spawn } from "child_process";
import { mkdir, rm, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import type { StudioLanguage, VoiceEngine, VoiceGender, VoiceStyle } from "../shared/voice";

const LOCAL_DATA_DIR = path.join(process.cwd(), "local-data");
const AUDIO_DIR = path.join(LOCAL_DATA_DIR, "audio");
const WORK_DIR = path.join(LOCAL_DATA_DIR, "work");
const MAX_CHARS = 3000;

export type LocalVoiceRequest = {
  text: string;
  language: StudioLanguage;
  gender: VoiceGender;
  voiceId: string;
  engine: VoiceEngine;
  style: VoiceStyle;
  rate: number;
  pitch: number;
  volume: number;
  pause: number;
};

type ProcessResult = { stdout: string; stderr: string };

export function getAudioDirectory() {
  return AUDIO_DIR;
}

export async function ensureLocalVoiceDirectories() {
  await Promise.all([mkdir(AUDIO_DIR, { recursive: true }), mkdir(WORK_DIR, { recursive: true })]);
}

function run(command: string, args: string[], cwd = process.cwd()): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, shell: false, windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", data => { stdout += data.toString(); });
    child.stderr.on("data", data => { stderr += data.toString(); });
    child.on("error", error => reject(error));
    child.on("close", code => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${command} exited with code ${code}: ${stderr || stdout}`));
    });
  });
}

function findPython() {
  const candidates = [
    process.env.VOICE_STUDIO_PYTHON,
    path.join(process.cwd(), ".venv", "bin", "python"),
    path.join(process.cwd(), ".venv", "Scripts", "python.exe"),
    "python3",
    "python",
  ].filter((candidate): candidate is string => Boolean(candidate));
  return candidates.find(candidate => candidate === "python3" || candidate === "python" || existsSync(candidate)) ?? "python3";
}

function getFfmpeg() {
  return process.env.VOICE_STUDIO_FFMPEG || "ffmpeg";
}

function getEspeak() {
  return process.env.VOICE_STUDIO_ESPEAK || "espeak-ng";
}

function getMmsScript() {
  return path.join(process.cwd(), "scripts", "mms_tts.py");
}

function splitScript(text: string) {
  const chunks = text.match(/[^。！？.!?]+[。！？.!?]?/g)?.map(item => item.trim()).filter(Boolean) ?? [text];
  const result: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length <= 900) result.push(chunk);
    else for (let start = 0; start < chunk.length; start += 900) result.push(chunk.slice(start, start + 900));
  }
  return result;
}

function durationEstimate(text: string, rate: number, pause: number, segments: number) {
  const speech = Math.max(1.2, text.length / (4.3 * rate));
  return Number((speech + Math.max(0, segments - 1) * pause).toFixed(1));
}

function quoteForConcat(filePath: string) {
  return `file '${filePath.replace(/'/g, "'\\''")}'`;
}

function withExplicitSign(value: number, suffix: string) {
  return `${value >= 0 ? "+" : ""}${value}${suffix}`;
}

async function synthesizeEdgeSegment(input: LocalVoiceRequest, segment: string, outputPath: string) {
  const python = findPython();
  const ratePercent = withExplicitSign(Math.round((input.rate - 1) * 100), "%");
  const volumePercent = withExplicitSign(Math.round(input.volume - 100), "%");
  const pitchHz = withExplicitSign(Math.round(input.pitch), "Hz");
  try {
    await run(python, ["-m", "edge_tts", "--voice", input.voiceId, `--rate=${ratePercent}`, `--volume=${volumePercent}`, `--pitch=${pitchHz}`, "--text", segment, "--write-media", outputPath]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("No module named edge_tts") || message.includes("ENOENT")) {
      throw new Error("edge-tts was not found. Run: python3 -m venv .venv && .venv/bin/pip install edge-tts");
    }
    throw new Error(`edge-tts generation failed. Check your network connection and voice ID. ${message.slice(0, 180)}`);
  }
}

async function synthesizeEspeakSegment(input: LocalVoiceRequest, segment: string, outputPath: string) {
  const rawWav = outputPath.replace(/\.mp3$/, ".espeak.wav");
  const rate = Math.round(175 * input.rate);
  const pitch = Math.max(0, Math.min(99, Math.round(50 + input.pitch * 4)));
  const amplitude = Math.max(0, Math.min(200, Math.round(input.volume * 1.7)));
  try {
    await run(getEspeak(), ["-v", input.voiceId, "-s", String(rate), "-p", String(pitch), "-a", String(amplitude), "-w", rawWav, segment]);
    await run(getFfmpeg(), ["-y", "-i", rawWav, "-c:a", "libmp3lame", "-b:a", "64k", outputPath]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("ENOENT")) throw new Error("eSpeak NG was not found. On macOS, run: brew install espeak-ng");
    throw new Error(`eSpeak NG generation failed. Check the local voice installation. ${message.slice(0, 180)}`);
  } finally {
    await rm(rawWav, { force: true });
  }
}

async function synthesizeMmsSegment(input: LocalVoiceRequest, segment: string, outputPath: string) {
  const python = findPython();
  const rawWav = outputPath.replace(/\.mp3$/, ".mms.wav");
  try {
    await run(python, [getMmsScript(), "--model", input.voiceId, "--text", segment, "--output", rawWav, "--rate", input.rate.toFixed(2)]);
    await run(getFfmpeg(), ["-y", "-i", rawWav, "-filter:a", `volume=${(input.volume / 100).toFixed(2)}`, "-c:a", "libmp3lame", "-b:a", "64k", outputPath]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("No module named") || message.includes("ENOENT")) {
      throw new Error("The local MMS engine is not ready. Run: pnpm voice:setup:extended");
    }
    throw new Error(`MMS generation failed. The first run downloads the selected model and may take a moment. ${message.slice(0, 180)}`);
  } finally {
    await rm(rawWav, { force: true });
  }
}

async function synthesizeSegment(input: LocalVoiceRequest, segment: string, outputPath: string) {
  if (input.engine === "espeak") return synthesizeEspeakSegment(input, segment, outputPath);
  if (input.engine === "mms") return synthesizeMmsSegment(input, segment, outputPath);
  return synthesizeEdgeSegment(input, segment, outputPath);
}

export async function generateLocalVoice(input: LocalVoiceRequest) {
  const text = input.text.trim();
  if (!text) throw new Error("Enter text before generating speech.");
  if (text.length > MAX_CHARS) throw new Error(`Local generation supports up to ${MAX_CHARS} characters per request.`);

  await ensureLocalVoiceDirectories();
  const id = `${Date.now()}-${nanoid(8)}`;
  const taskDir = path.join(WORK_DIR, id);
  const mp3File = `voicestudio-${id}.mp3`;
  const wavFile = `voicestudio-${id}.wav`;
  const aacFile = `voicestudio-${id}.aac`;
  const mp3Path = path.join(AUDIO_DIR, mp3File);
  const wavPath = path.join(AUDIO_DIR, wavFile);
  const aacPath = path.join(AUDIO_DIR, aacFile);
  await mkdir(taskDir, { recursive: true });

  try {
    const segments = splitScript(text);
    const sourceFiles: string[] = [];
    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index];
      if (!segment) continue;
      const segmentFile = path.join(taskDir, `speech-${index}.mp3`);
      await synthesizeSegment(input, segment, segmentFile);
      sourceFiles.push(segmentFile);
      if (input.pause > 0 && index < segments.length - 1) {
        const pauseFile = path.join(taskDir, `pause-${index}.mp3`);
        try {
          await run(getFfmpeg(), ["-y", "-f", "lavfi", "-t", input.pause.toFixed(2), "-i", "anullsrc=channel_layout=mono:sample_rate=24000", "-c:a", "libmp3lame", "-b:a", "48k", pauseFile]);
        } catch {
          throw new Error("FFmpeg was not found. Install FFmpeg before generating pauses or multi-format exports.");
        }
        sourceFiles.push(pauseFile);
      }
    }

    if (sourceFiles.length === 1) {
      await run(getFfmpeg(), ["-y", "-i", sourceFiles[0], "-c:a", "libmp3lame", "-b:a", "64k", mp3Path]);
    } else {
      const concatList = path.join(taskDir, "concat.txt");
      await writeFile(concatList, sourceFiles.map(quoteForConcat).join("\n"), "utf8");
      await run(getFfmpeg(), ["-y", "-f", "concat", "-safe", "0", "-i", concatList, "-c:a", "libmp3lame", "-b:a", "64k", mp3Path]);
    }

    try {
      await Promise.all([
        run(getFfmpeg(), ["-y", "-i", mp3Path, "-c:a", "pcm_s16le", wavPath]),
        run(getFfmpeg(), ["-y", "-i", mp3Path, "-c:a", "aac", "-b:a", "128k", aacPath]),
      ]);
    } catch {
      throw new Error("Speech was generated, but FFmpeg could not convert WAV / AAC. Confirm that a complete FFmpeg installation is available.");
    }

    return {
      id,
      duration: durationEstimate(text, input.rate, input.pause, segments.length),
      audioUrl: `/local-audio/${mp3File}`,
      downloads: { mp3: `/local-audio/${mp3File}`, wav: `/local-audio/${wavFile}`, aac: `/local-audio/${aacFile}` },
    };
  } finally {
    await rm(taskDir, { recursive: true, force: true });
  }
}
