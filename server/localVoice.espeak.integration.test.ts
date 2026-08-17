import { access, rm, stat } from "fs/promises";
import path from "path";
import { afterAll, describe, expect, it } from "vitest";
import { generateLocalVoice, getAudioDirectory } from "./localVoice";

const createdFiles: string[] = [];

afterAll(async () => {
  await Promise.all(createdFiles.map(file => rm(file, { force: true })));
});

describe("local eSpeak NG fallback pipeline", () => {
  it("creates exportable Quechua and Guarani audio files", async () => {
    const samples = [
      { language: "quechua" as const, gender: "female" as const, voiceId: "qu+f3", text: "Allin p'unchay." },
      { language: "guarani" as const, gender: "male" as const, voiceId: "gn+m3", text: "Mba'eichapa." },
    ];

    for (const sample of samples) {
      const result = await generateLocalVoice({
        ...sample,
        engine: "espeak",
        style: "calm",
        rate: 0.92,
        pitch: 0,
        volume: 100,
        pause: 0.2,
      });
      const files = [result.downloads.mp3, result.downloads.wav, result.downloads.aac]
        .map(url => path.join(getAudioDirectory(), path.basename(url)));
      createdFiles.push(...files);
      await Promise.all(files.map(file => access(file)));
      const sizes = await Promise.all(files.map(file => stat(file).then(metadata => metadata.size)));
      expect(sizes.every(size => size > 512)).toBe(true);
    }
  }, 60_000);
});
