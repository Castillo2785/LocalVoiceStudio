import { access, rm, stat } from "fs/promises";
import path from "path";
import { afterAll, describe, expect, it } from "vitest";
import { generateLocalVoice, getAudioDirectory } from "./localVoice";

const createdFiles: string[] = [];

afterAll(async () => {
  await Promise.all(createdFiles.map(file => rm(file, { force: true })));
});

describe("local edge-tts pipeline", () => {
  it("creates playable local MP3 plus WAV and AAC exports", async () => {
    const result = await generateLocalVoice({
      text: "VoiceStudio local audio pipeline verification.",
      language: "mandarin",
      gender: "female",
      voiceId: "zh-CN-XiaoxiaoNeural",
      style: "news",
      rate: 0.98,
      pitch: 0,
      volume: 100,
      pause: 0.2,
    });

    const urls = [result.downloads.mp3, result.downloads.wav, result.downloads.aac];
    const files = urls.map(url => path.join(getAudioDirectory(), path.basename(url)));
    createdFiles.push(...files);

    await Promise.all(files.map(file => access(file)));
    const sizes = await Promise.all(files.map(file => stat(file).then(metadata => metadata.size)));

    expect(result.audioUrl).toBe(result.downloads.mp3);
    expect(result.duration).toBeGreaterThan(0);
    expect(sizes.every(size => size > 512)).toBe(true);
  }, 60_000);
});
