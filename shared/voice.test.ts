import { describe, expect, it } from "vitest";
import { DEFAULT_VOICE, LANGUAGE_OPTIONS, STYLE_PRESETS, VOICE_CATALOG } from "./voice";

describe("VoiceStudio voice catalog", () => {
  it("covers every supported language with named female and male presets", () => {
    expect(LANGUAGE_OPTIONS.map(language => language.label)).toEqual([
      "Mandarin", "English", "Cantonese", "Spanish", "Quechua", "Aymara", "Guarani", "Japanese", "Thai", "Korean", "Hindi", "Arabic", "French",
    ]);

    for (const language of LANGUAGE_OPTIONS) {
      expect(VOICE_CATALOG[language.id].female.length).toBeGreaterThan(0);
      expect(VOICE_CATALOG[language.id].male.length).toBeGreaterThan(0);
      expect(VOICE_CATALOG[language.id].female.some(voice => voice.id === DEFAULT_VOICE[language.id].female)).toBe(true);
      expect(VOICE_CATALOG[language.id].male.some(voice => voice.id === DEFAULT_VOICE[language.id].male)).toBe(true);
      expect(VOICE_CATALOG[language.id].female.every(voice => ["edge", "espeak", "mms"].includes(voice.engine))).toBe(true);
    }
  });

  it("assigns documented local fallback engines for low-resource languages", () => {
    expect(VOICE_CATALOG.quechua.female[0].engine).toBe("espeak");
    expect(VOICE_CATALOG.guarani.male[0].engine).toBe("espeak");
    expect(VOICE_CATALOG.aymara.female[0].engine).toBe("mms");
  });

  it("includes the four one-click performance styles with usable values", () => {
    expect(STYLE_PRESETS.map(style => style.label)).toEqual(["News Anchor", "Storyteller", "Calm", "Energetic"]);
    expect(STYLE_PRESETS.every(style => style.rate >= 0.7 && style.rate <= 1.3)).toBe(true);
    expect(STYLE_PRESETS.every(style => style.pause >= 0 && style.pause <= 1.2)).toBe(true);
  });
});

