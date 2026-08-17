import { access, rm, stat } from "fs/promises";
import path from "path";
import { afterAll, describe, expect, it } from "vitest";
import { generateLocalVoice, getAudioDirectory } from "./localVoice";

const createdFiles: string[] = [];

afterAll(async () => {
  await Promise.all(createdFiles.map(file => rm(file, { force: true })));
});

describe("expanded Edge Neural language pipeline", () => {
  it("creates previewable Spanish MP3 plus WAV and AAC exports", async () => {
    const result = await generateLocalVoice({
      text: "Hola, esto es una prueba de VoiceStudio.",
      language: "spanish",
      gender: "female",
      voiceId: "es-ES-ElviraNeural",
      engine: "edge",
      style: "news",
      rate: 0.98,
      pitch: 0,
      volume: 100,
      pause: 0.2,
    });
    const files = [result.downloads.mp3, result.downloads.wav, result.downloads.aac]
      .map(url => path.join(getAudioDirectory(), path.basename(url)));
    createdFiles.push(...files);

    await Promise.all(files.map(file => access(file)));
    const sizes = await Promise.all(files.map(file => stat(file).then(metadata => metadata.size)));
    expect(result.audioUrl).toBe(result.downloads.mp3);
    expect(sizes.every(size => size > 512)).toBe(true);
  }, 60_000);
});
