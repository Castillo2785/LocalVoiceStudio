export type StudioLanguage = "mandarin" | "english" | "cantonese";
export type VoiceGender = "female" | "male";
export type AudioFormat = "mp3" | "wav" | "aac";

export type VoicePreset = {
  id: string;
  name: string;
  role: string;
  tone: string;
};

export const LANGUAGE_OPTIONS: Array<{ id: StudioLanguage; label: string; locale: string }> = [
  { id: "mandarin", label: "Mandarin", locale: "zh-CN" },
  { id: "english", label: "English", locale: "en-US" },
  { id: "cantonese", label: "Cantonese", locale: "zh-HK" },
];

export const VOICE_CATALOG: Record<StudioLanguage, Record<VoiceGender, VoicePreset[]>> = {
  mandarin: {
    female: [
      { id: "zh-CN-XiaoxiaoNeural", name: "Xiaoxiao", role: "News · Narrative", tone: "Warm, clear" },
      { id: "zh-CN-XiaoyiNeural", name: "Xiaoyi", role: "Character · Story", tone: "Lively, expressive" },
      { id: "zh-CN-liaoning-XiaobeiNeural", name: "Xiaobei", role: "Casual · Dialect", tone: "Humorous, bright" },
    ],
    male: [
      { id: "zh-CN-YunxiNeural", name: "Yunxi", role: "Story · Narration", tone: "Bright, natural" },
      { id: "zh-CN-YunyangNeural", name: "Yunyang", role: "News · Business", tone: "Professional, reliable" },
      { id: "zh-CN-YunjianNeural", name: "Yunjian", role: "Sport · Energy", tone: "Full, powerful" },
    ],
  },
  english: {
    female: [
      { id: "en-US-AriaNeural", name: "Aria", role: "News · Novel", tone: "Confident, clear" },
      { id: "en-US-JennyNeural", name: "Jenny", role: "General · Warm", tone: "Friendly, considerate" },
      { id: "en-US-EmmaNeural", name: "Emma", role: "Conversation", tone: "Cheerful, natural" },
    ],
    male: [
      { id: "en-US-ChristopherNeural", name: "Christopher", role: "News · Novel", tone: "Reliable, authoritative" },
      { id: "en-US-GuyNeural", name: "Guy", role: "News · Novel", tone: "Energetic, direct" },
      { id: "en-US-BrianNeural", name: "Brian", role: "Conversation", tone: "Warm, authentic" },
    ],
  },
  cantonese: {
    female: [
      { id: "zh-HK-HiuMaanNeural", name: "HiuMaan", role: "Cantonese · General", tone: "Friendly, natural" },
      { id: "zh-HK-HiuGaaiNeural", name: "HiuGaai", role: "Cantonese · General", tone: "Bright, approachable" },
    ],
    male: [
      { id: "zh-HK-WanLungNeural", name: "WanLung", role: "Cantonese · General", tone: "Steady, composed" },
    ],
  },
};

export const STYLE_PRESETS = [
  { id: "news", label: "News Anchor", description: "Clear, assured", rate: 0.98, pitch: 0, volume: 100, pause: 0.28 },
  { id: "story", label: "Storyteller", description: "Immersive, rhythmic", rate: 0.9, pitch: -2, volume: 98, pause: 0.52 },
  { id: "calm", label: "Calm", description: "Gentle, grounded", rate: 0.84, pitch: -1, volume: 92, pause: 0.62 },
  { id: "energetic", label: "Energetic", description: "Vivid, expressive", rate: 1.08, pitch: 2, volume: 106, pause: 0.18 },
] as const;

export type VoiceStyle = (typeof STYLE_PRESETS)[number]["id"];

export const DEFAULT_VOICE: Record<StudioLanguage, Record<VoiceGender, string>> = {
  mandarin: { female: "zh-CN-XiaoxiaoNeural", male: "zh-CN-YunxiNeural" },
  english: { female: "en-US-AriaNeural", male: "en-US-ChristopherNeural" },
  cantonese: { female: "zh-HK-HiuMaanNeural", male: "zh-HK-WanLungNeural" },
};
