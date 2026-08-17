import { access, rm, stat } from "fs/promises";
import path from "path";
import { afterAll, describe, expect, it } from "vitest";
import { generateLocalVoice, getAudioDirectory } from "./localVoice";

const createdFiles: string[] = [];
const describeMms = process.env.RUN_MMS_INTEGRATION === "1" ? describe : describe.skip;

afterAll(async () => {
  await Promise.all(createdFiles.map(file => rm(file, { force: true })));
});

describeMms("local Central Aymara MMS pipeline", () => {
  it("creates previewable MP3 plus WAV and AAC exports", async () => {
    const result = await generateLocalVoice({
      text: "Kamisaraki, VoiceStudio uñt’ayawi.",
      language: "aymara",
      gender: "female",
      voiceId: "facebook/mms-tts-ayr",
      engine: "mms",
      style: "calm",
      rate: 0.96,
      pitch: 0,
      volume: 100,
      pause: 0.2,
    });
    const files = [result.downloads.mp3, result.downloads.wav, result.downloads.aac]
      .map(url => path.join(getAudioDirectory(), path.basename(url)));
    createdFiles.push(...files);

    await Promise.all(files.map(file => access(file)));
    const sizes = await Promise.all(files.map(file => stat(file).then(metadata => metadata.size)));
    expect(result.duration).toBeGreaterThan(0);
    expect(sizes.every(size => size > 512)).toBe(true);
  }, 120_000);
});
