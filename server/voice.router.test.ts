import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const emptyContext = {
  user: null,
  req: {},
  res: {},
} as TrpcContext;

describe("voice.generate", () => {
  it("rejects scripts over the local generation limit before invoking edge-tts", async () => {
    const caller = appRouter.createCaller(emptyContext);
    await expect(caller.voice.generate({
      text: "x".repeat(3001),
      language: "mandarin",
      gender: "female",
      voiceId: "zh-CN-XiaoxiaoNeural",
      style: "news",
      rate: 0.98,
      pitch: 0,
      volume: 100,
      pause: 0.28,
    })).rejects.toThrow();
  });
});
