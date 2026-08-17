import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { generateLocalVoice } from "./localVoice";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  voice: router({
    generate: publicProcedure
      .input(z.object({
        text: z.string().min(1).max(3000),
        language: z.enum(["mandarin", "english", "cantonese"]),
        gender: z.enum(["female", "male"]),
        voiceId: z.string().min(3).max(120),
        style: z.enum(["news", "story", "calm", "energetic"]),
        rate: z.number().min(0.7).max(1.3),
        pitch: z.number().min(-12).max(12),
        volume: z.number().min(60).max(120),
        pause: z.number().min(0).max(1.2),
      }))
      .mutation(({ input }) => generateLocalVoice(input)),
  }),
});

export type AppRouter = typeof appRouter;
