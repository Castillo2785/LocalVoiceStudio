import { trpc } from "@/lib/trpc";
import {
  AudioLines,
  ChevronDown,
  Clock3,
  Download,
  FolderClock,
  Gauge,
  Headphones,
  History,
  Languages,
  Menu,
  Mic2,
  Pause,
  Play,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  WandSparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  DEFAULT_VOICE,
  LANGUAGE_OPTIONS,
  STYLE_PRESETS,
  VOICE_CATALOG,
  type AudioFormat,
  type StudioLanguage,
  type VoiceGender,
  type VoiceStyle,
} from "@shared/voice";

type HistoryEntry = {
  id: string;
  text: string;
  language: StudioLanguage;
  gender: VoiceGender;
  voiceId: string;
  style: VoiceStyle;
  duration: number;
  audioUrl: string;
  downloads: Record<AudioFormat, string>;
  createdAt: number;
};

const STORAGE_KEY = "voicestudio-local-history";
const WAVEFORM_BARS = Array.from({ length: 52 }, (_, index) => 24 + ((index * 37) % 67));

function readHistory(): HistoryEntry[] {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" }).format(timestamp);
}

function displayFormat(format: AudioFormat) {
  return format.toUpperCase();
}

function formatTime(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = Math.floor(safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function ParameterSlider({
  label,
  icon,
  value,
  min,
  max,
  step,
  valueLabel,
  onChange,
}: {
  label: string;
  icon: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  valueLabel: string;
  onChange: (value: number) => void;
}) {
  const fill = `${((value - min) / (max - min)) * 100}%`;
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3">
      <div className="mb-3 flex items-center justify-between gap-3 text-xs">
        <span className="flex items-center gap-2 font-medium text-slate-300">{icon}{label}</span>
        <span className="font-mono text-[11px] font-medium text-cyan-200">{valueLabel}</span>
      </div>
      <input
        aria-label={label}
        className="control-range"
        style={{ "--fill": fill } as React.CSSProperties}
        max={max}
        min={min}
        step={step}
        type="range"
        value={value}
        onChange={event => onChange(Number(event.target.value))}
      />
    </div>
  );
}

export default function Home() {
  const [script, setScript] = useState("In the first light of morning, every story can find a voice of its own.");
  const [language, setLanguage] = useState<StudioLanguage>("mandarin");
  const [gender, setGender] = useState<VoiceGender>("female");
  const [voiceId, setVoiceId] = useState(DEFAULT_VOICE.mandarin.female);
  const [style, setStyle] = useState<VoiceStyle>("news");
  const [rate, setRate] = useState(0.98);
  const [pitch, setPitch] = useState(0);
  const [volume, setVolume] = useState(100);
  const [pause, setPause] = useState(0.28);
  const [exportFormat, setExportFormat] = useState<AudioFormat>("mp3");
  const [activeGeneration, setActiveGeneration] = useState<HistoryEntry | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(readHistory);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackLength, setPlaybackLength] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const voiceOptions = VOICE_CATALOG[language][gender];
  const activeVoice = useMemo(() => voiceOptions.find(voice => voice.id === voiceId) ?? voiceOptions[0], [voiceId, voiceOptions]);

  const generation = trpc.voice.generate.useMutation({
    onSuccess: result => {
      const entry: HistoryEntry = {
        id: result.id,
        text: script.trim(),
        language,
        gender,
        voiceId,
        style,
        duration: result.duration,
        audioUrl: result.audioUrl,
        downloads: result.downloads,
        createdAt: Date.now(),
      };
      setActiveGeneration(entry);
      setHistory(previous => [entry, ...previous.filter(item => item.id !== entry.id)].slice(0, 12));
      toast.success("Voice ready", { description: "Preview it now or export an audio file." });
      window.setTimeout(() => audioRef.current?.play().catch(() => undefined), 120);
    },
    onError: error => toast.error("Generation failed", { description: error.message }),
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    const preferredVoice = DEFAULT_VOICE[language][gender];
    setVoiceId(preferredVoice);
  }, [language, gender]);

  useEffect(() => {
    setIsPlaying(false);
    setPlaybackPosition(0);
    setPlaybackLength(activeGeneration?.duration ?? 0);
  }, [activeGeneration]);

  const applyStyle = (preset: (typeof STYLE_PRESETS)[number]) => {
    setStyle(preset.id);
    setRate(preset.rate);
    setPitch(preset.pitch);
    setVolume(preset.volume);
    setPause(preset.pause);
  };

  const startGeneration = () => {
    const text = script.trim();
    if (!text) {
      toast.error("Enter text before generating speech");
      return;
    }
    generation.mutate({ text, language, gender, voiceId, engine: activeVoice.engine, style, rate, pitch, volume, pause });
  };

  const downloadEntry = (entry: HistoryEntry, format: AudioFormat) => {
    const anchor = document.createElement("a");
    anchor.href = entry.downloads[format];
    anchor.download = `voicestudio-${entry.id}.${format}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const playEntry = (entry: HistoryEntry) => {
    setActiveGeneration(entry);
    window.setTimeout(() => audioRef.current?.play().catch(() => undefined), 0);
  };

  const togglePreviewPlayback = () => {
    if (!audioRef.current || !activeGeneration) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => toast.error("Unable to play the current audio"));
    } else {
      audioRef.current.pause();
    }
  };

  const seekPreview = (nextPosition: number) => {
    if (!audioRef.current || !playbackLength) return;
    audioRef.current.currentTime = nextPosition;
    setPlaybackPosition(nextPosition);
  };

  const languageLabel = LANGUAGE_OPTIONS.find(option => option.id === language)?.label ?? "Mandarin";
  const wordCount = script.trim().length;

  return (
    <div className="studio-surface min-h-screen text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[238px] flex-col border-r border-white/[0.07] bg-[#0b0d12]/95 px-4 py-5 backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-200 via-cyan-400 to-teal-500 text-slate-950 shadow-[0_0_30px_rgba(74,222,228,.22)]">
            <AudioLines className="h-5 w-5 stroke-[2.3]" />
          </div>
          <div>
            <p className="text-[15px] font-extrabold tracking-[-0.04em] text-white">VoiceStudio</p>
            <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-cyan-300/70">Local voice suite</p>
          </div>
        </div>

        <nav className="mt-10 space-y-1.5">
          <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-600">Workspace</p>
          <a className="flex h-11 items-center gap-3 rounded-xl bg-cyan-300/[0.11] px-3 text-sm font-semibold text-cyan-100 ring-1 ring-inset ring-cyan-300/[0.1]" href="#studio">
            <WandSparkles className="h-4 w-4" /> Create voice
          </a>
          <a className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-200" href="#history">
            <History className="h-4 w-4" /> Recent renders
          </a>
        </nav>

        <div className="mt-auto rounded-2xl border border-cyan-300/[0.12] bg-gradient-to-br from-cyan-300/[0.1] to-transparent p-4">
          <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-300/15 text-cyan-200"><Headphones className="h-4 w-4" /></div>
          <p className="text-xs font-semibold text-slate-200">100% local workflow</p>
          <p className="mt-1.5 text-[11px] leading-5 text-slate-500">No account. No API key. Audio stays in your local project folder.</p>
        </div>

        <button className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-slate-500 transition-colors hover:bg-white/[0.04]" type="button" onClick={() => toast.info("Local mode", { description: "Configure local edge-tts and FFmpeg paths in settings." })}>
          <Settings2 className="h-4 w-4" /> Local settings
        </button>
      </aside>

      <div className="lg:pl-[238px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/[0.07] bg-[#08090d]/75 px-4 backdrop-blur-xl sm:px-7">
          <div className="flex items-center gap-3">
            <button className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.08] text-slate-300 lg:hidden" type="button" aria-label="Toggle menu" onClick={() => setIsMenuOpen(value => !value)}>
              {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <div>
              <p className="text-sm font-bold tracking-[-0.02em] text-white">Voice workspace</p>
              <p className="mt-0.5 text-[10px] text-slate-500">Edge neural voices · local render pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-300/[0.12] bg-emerald-300/[0.06] px-3 py-1.5 text-[10px] font-medium text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,.8)]" /> Local engine ready
          </div>
        </header>

        {isMenuOpen && (
          <div className="border-b border-white/[0.07] bg-[#10131a] px-4 py-3 lg:hidden">
            <div className="flex gap-2">
              <a className="rounded-lg bg-cyan-300/[0.12] px-3 py-2 text-xs font-semibold text-cyan-100" href="#studio" onClick={() => setIsMenuOpen(false)}>Create voice</a>
              <a className="rounded-lg px-3 py-2 text-xs text-slate-400" href="#history" onClick={() => setIsMenuOpen(false)}>Recent renders</a>
            </div>
          </div>
        )}

        <main id="studio" className="mx-auto max-w-[1560px] px-4 py-7 sm:px-7 lg:px-9">
          <div className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300"><Sparkles className="h-3.5 w-3.5" /> Studio-grade speech</div>
              <h1 className="text-3xl font-extrabold tracking-[-0.05em] text-white sm:text-[37px]">Script to voice, with intent.</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Turn scripts into polished voices for video, podcasts, and narrative work. Choose a voice, set the pace, and export locally.</p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> AI-generated speech disclosure enabled</div>
          </div>

          <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.32fr)_minmax(390px,.86fr)]">
            <section className="glass-panel overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2.5"><div className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-300/[0.1] text-cyan-200"><Mic2 className="h-4 w-4" /></div><div><p className="text-sm font-bold text-slate-100">Script editor</p><p className="text-[10px] text-slate-500">Your words, your direction</p></div></div>
                <div className="rounded-full bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] text-slate-500">{wordCount} chars</div>
              </div>
              <div className="p-5 sm:p-6">
                <textarea className="min-h-[205px] w-full resize-none rounded-xl border border-white/[0.07] bg-[#0a0c11] p-4 text-sm leading-7 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40 focus:ring-4 focus:ring-cyan-300/[0.06]" maxLength={3000} value={script} onChange={event => setScript(event.target.value)} placeholder="Paste or write the script you want to narrate…" />
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[10px] leading-5 text-slate-500">Use periods, question marks, or exclamation marks for natural pauses. Local renders support up to 3,000 characters.</p>
                  <button className="inline-flex items-center justify-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-200" type="button" onClick={() => setScript("")}>Clear script</button>
                </div>
              </div>

              <div className="border-t border-white/[0.07] bg-black/[0.12] p-5 sm:p-6">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-300"><Languages className="h-3.5 w-3.5 text-cyan-300" /> Language</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                  {LANGUAGE_OPTIONS.map(option => <button key={option.id} type="button" onClick={() => setLanguage(option.id)} className={`rounded-xl border px-3 py-3 text-left transition-all ${language === option.id ? "border-cyan-300/40 bg-cyan-300/[0.12] text-cyan-50 shadow-[0_0_24px_rgba(52,211,153,.05)]" : "border-white/[0.07] bg-white/[0.025] text-slate-500 hover:border-white/[0.16] hover:text-slate-300"}`}><p className="text-xs font-bold">{option.label}</p><p className="mt-1 font-mono text-[9px] opacity-55">{option.locale}</p></button>)}
                </div>
              </div>
            </section>

            <section className="glass-panel rounded-2xl p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between"><div><p className="text-sm font-bold text-slate-100">Voice direction</p><p className="mt-1 text-[10px] text-slate-500">{languageLabel} · {activeVoice.engine === "edge" ? "named neural presets" : activeVoice.engine === "mms" ? "local MMS neural model" : "local eSpeak NG model"}</p></div><SlidersHorizontal className="h-4 w-4 text-cyan-300" /></div>
              <div className="mb-5 grid grid-cols-2 rounded-xl border border-white/[0.07] bg-[#0a0c11] p-1">
                {(["female", "male"] as const).map(item => <button key={item} type="button" onClick={() => setGender(item)} className={`rounded-lg py-2.5 text-xs font-semibold transition ${gender === item ? "bg-white/[0.09] text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}>{item === "female" ? "Female voice" : "Male voice"}</button>)}
              </div>
              <div className="space-y-2">
                {voiceOptions.map(voice => <button type="button" key={voice.id} onClick={() => setVoiceId(voice.id)} className={`group flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${voiceId === voice.id ? "border-cyan-300/35 bg-cyan-300/[0.09]" : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.15]"}`}><div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold ${voiceId === voice.id ? "bg-cyan-200 text-slate-900" : "bg-white/[0.07] text-slate-400"}`}>{voice.name.slice(0, 1)}</div><div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-200">{voice.name}</p><p className="mt-1 truncate text-[10px] text-slate-500">{voice.role} · {voice.tone}</p></div><span className={`h-2 w-2 rounded-full ${voiceId === voice.id ? "bg-cyan-200 shadow-[0_0_8px_rgba(165,243,252,.8)]" : "bg-slate-700"}`} /></button>)}
              </div>
              <div className="mt-5 rounded-xl border border-dashed border-white/[0.1] bg-white/[0.015] px-3.5 py-3 text-[10px] leading-5 text-slate-500">Selected: <span className="font-medium text-slate-300">{activeVoice.name}</span> · {activeVoice.tone}. Engine: {activeVoice.engine === "edge" ? "Edge Neural" : activeVoice.engine === "mms" ? "Local MMS" : "Local eSpeak NG"}.</div>
            </section>
          </div>

          <div className="mt-5 grid gap-5 2xl:grid-cols-[minmax(0,1.32fr)_minmax(390px,.86fr)]">
            <section className="glass-panel rounded-2xl p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-bold text-slate-100">Performance style</p><p className="mt-1 text-[10px] text-slate-500">One-click parameters, then refine below</p></div><Gauge className="h-4 w-4 text-cyan-300" /></div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {STYLE_PRESETS.map(preset => <button key={preset.id} type="button" onClick={() => applyStyle(preset)} className={`rounded-xl border p-3 text-left transition ${style === preset.id ? "border-cyan-300/40 bg-cyan-300/[0.1]" : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.16]"}`}><p className={`text-xs font-bold ${style === preset.id ? "text-cyan-100" : "text-slate-300"}`}>{preset.label}</p><p className="mt-1.5 text-[10px] text-slate-500">{preset.description}</p></button>)}
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <ParameterSlider label="Pitch" icon={<AudioLines className="h-3.5 w-3.5 text-slate-500" />} value={pitch} min={-12} max={12} step={1} valueLabel={`${pitch > 0 ? "+" : ""}${pitch} Hz`} onChange={setPitch} />
                <ParameterSlider label="Speed / Rate" icon={<Gauge className="h-3.5 w-3.5 text-slate-500" />} value={rate} min={0.7} max={1.3} step={0.01} valueLabel={`${rate.toFixed(2)}×`} onChange={setRate} />
                <ParameterSlider label="Volume" icon={<Volume2 className="h-3.5 w-3.5 text-slate-500" />} value={volume} min={60} max={120} step={1} valueLabel={`${volume}%`} onChange={setVolume} />
                <ParameterSlider label="Pause / Break" icon={<Clock3 className="h-3.5 w-3.5 text-slate-500" />} value={pause} min={0} max={1.2} step={0.02} valueLabel={`${pause.toFixed(2)}s`} onChange={setPause} />
              </div>
            </section>

            <section className="glass-panel wave-grid relative overflow-hidden rounded-2xl p-5 sm:p-6">
              <div className="relative z-10 flex items-center justify-between"><div><p className="text-sm font-bold text-slate-100">Output preview</p><p className="mt-1 text-[10px] text-slate-500">{activeGeneration ? "Your latest local render" : "Waveform preview"}</p></div><span className="rounded-full border border-cyan-300/[0.18] bg-cyan-300/[0.08] px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-cyan-200">{activeGeneration ? "Ready" : "Standby"}</span></div>
              <div className="relative z-10 mt-7 flex h-[124px] items-center justify-center gap-[3px] overflow-hidden rounded-xl border border-white/[0.07] bg-[#090b10]/70 px-4">
                {WAVEFORM_BARS.map((height, index) => <span key={index} className="wave-bar w-[3px] rounded-full bg-gradient-to-b from-cyan-100 via-cyan-300 to-teal-500" style={{ height: `${height}%`, "--delay": `${(index % 7) * 90}ms` } as React.CSSProperties} />)}
              </div>
              <audio
                ref={audioRef}
                className="sr-only"
                src={activeGeneration?.audioUrl}
                onEnded={() => { setIsPlaying(false); setPlaybackPosition(0); }}
                onLoadedMetadata={event => setPlaybackLength(event.currentTarget.duration || activeGeneration?.duration || 0)}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onTimeUpdate={event => setPlaybackPosition(event.currentTarget.currentTime)}
              />
              <div className="relative z-10 mt-4 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0c0f15]/90 px-3 py-2.5">
                <button type="button" disabled={!activeGeneration} onClick={togglePreviewPlayback} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cyan-200 text-slate-950 transition hover:bg-cyan-100 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400" aria-label={isPlaying ? "Pause preview" : "Play preview"}>{isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />}</button>
                <span className="w-[35px] font-mono text-[10px] text-slate-500">{formatTime(playbackPosition)}</span>
                <input aria-label="Preview playback progress" className="control-range flex-1" style={{ "--fill": `${playbackLength ? (playbackPosition / playbackLength) * 100 : 0}%` } as React.CSSProperties} disabled={!activeGeneration} type="range" min="0" max={playbackLength || 1} step="0.01" value={Math.min(playbackPosition, playbackLength || 0)} onChange={event => seekPreview(Number(event.target.value))} />
                <span className="w-[35px] text-right font-mono text-[10px] text-slate-500">{formatTime(playbackLength)}</span>
              </div>
              <div className="relative z-10 mt-5 flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-300">{activeGeneration ? activeGeneration.text : "Your rendered voice will appear here"}</p><p className="mt-1 text-[10px] text-slate-500">{activeGeneration ? `${activeGeneration.duration.toFixed(1)} sec · ${activeVoice.name}` : "Generate to listen locally"}</p></div><button disabled={!activeGeneration} type="button" onClick={() => activeGeneration && downloadEntry(activeGeneration, exportFormat)} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/35 hover:bg-cyan-300/[0.08] disabled:cursor-not-allowed disabled:opacity-35"><Download className="h-3.5 w-3.5" /> {displayFormat(exportFormat)}</button></div>
              <div className="relative z-10 mt-3 flex gap-1.5">{(["mp3", "wav", "aac"] as AudioFormat[]).map(format => <button type="button" key={format} onClick={() => setExportFormat(format)} className={`rounded-md px-2.5 py-1.5 font-mono text-[10px] transition ${exportFormat === format ? "bg-cyan-200 text-slate-950" : "bg-white/[0.045] text-slate-500 hover:text-slate-300"}`}>{displayFormat(format)}</button>)}</div>
            </section>
          </div>

          <div className="mt-5 flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-cyan-300/[0.14] bg-gradient-to-r from-cyan-300/[0.12] via-cyan-300/[0.055] to-transparent p-4 sm:flex-row sm:items-center sm:px-5">
            <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-200 text-slate-900"><WandSparkles className="h-4 w-4" /></div><div><p className="text-sm font-bold text-slate-100">Ready to render</p><p className="mt-0.5 text-[10px] text-slate-400">{languageLabel} · {activeVoice.name} · {STYLE_PRESETS.find(item => item.id === style)?.label}</p></div></div>
            <button type="button" disabled={generation.isPending} onClick={startGeneration} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-200 via-cyan-300 to-teal-300 px-5 text-sm font-extrabold text-slate-950 shadow-[0_10px_30px_rgba(45,212,191,.16)] transition hover:brightness-105 active:scale-[0.98] disabled:cursor-wait disabled:opacity-65"><Sparkles className="h-4 w-4" /> {generation.isPending ? "Rendering locally…" : "Generate voice"}</button>
          </div>

          <section id="history" className="glass-panel mt-5 rounded-2xl p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2.5"><div className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.06] text-slate-300"><FolderClock className="h-4 w-4" /></div><div><p className="text-sm font-bold text-slate-100">Generation history</p><p className="mt-0.5 text-[10px] text-slate-500">Stored in this browser · {history.length} local renders</p></div></div>{history.length > 0 && <button type="button" onClick={() => { setHistory([]); setActiveGeneration(null); toast.info("Local history cleared"); }} className="text-[11px] text-slate-500 transition hover:text-slate-200">Clear history</button>}</div>
            {history.length === 0 ? <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.09] bg-white/[0.015] text-center"><History className="mb-2 h-5 w-5 text-slate-600" /><p className="text-xs font-medium text-slate-400">No renders yet</p><p className="mt-1 text-[10px] text-slate-600">Generated voiceovers will appear here for replay and export.</p></div> : <div className="studio-scroll overflow-x-auto"><div className="min-w-[720px] overflow-hidden rounded-xl border border-white/[0.07]"><div className="grid grid-cols-[minmax(260px,1.7fr)_110px_120px_100px_148px] border-b border-white/[0.07] bg-white/[0.025] px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-600"><span>Script</span><span>Voice</span><span>Created</span><span>Length</span><span className="text-right">Actions</span></div>{history.map(item => { const itemVoice = Object.values(VOICE_CATALOG[item.language]).flat().find(voice => voice.id === item.voiceId); return <div key={item.id} className="grid grid-cols-[minmax(260px,1.7fr)_110px_120px_100px_148px] items-center px-4 py-3.5 text-xs transition hover:bg-white/[0.025]"><div className="min-w-0 pr-5"><p className="truncate font-semibold text-slate-300">{item.text}</p><p className="mt-1 text-[10px] text-slate-600">{LANGUAGE_OPTIONS.find(option => option.id === item.language)?.label} · {item.gender === "female" ? "Female" : "Male"}</p></div><span className="text-slate-400">{itemVoice?.name ?? item.voiceId}</span><span className="text-[11px] text-slate-500">{formatDate(item.createdAt)}</span><span className="font-mono text-[11px] text-slate-500">{item.duration.toFixed(1)}s</span><div className="flex items-center justify-end gap-2"><button type="button" onClick={() => playEntry(item)} className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.09] text-slate-300 transition hover:border-cyan-300/35 hover:bg-cyan-300/[0.09]" aria-label="Replay"><Play className="h-3.5 w-3.5 fill-current" /></button><button type="button" onClick={() => downloadEntry(item, exportFormat)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.09] px-2.5 text-[10px] font-semibold text-slate-300 transition hover:border-cyan-300/35 hover:bg-cyan-300/[0.09]"><Download className="h-3.5 w-3.5" /> {displayFormat(exportFormat)}</button></div></div>})}</div></div>}
          </section>
        </main>
      </div>
    </div>
  );
}
