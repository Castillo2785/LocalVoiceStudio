# VoiceStudio local and free TTS decision

## Decision

VoiceStudio uses **edge-tts** as its default engine. It can run from the local project without an account, API key, or paid quota; synthesis still needs network access to the Microsoft Edge online voice service. The project stores generated MP3 files locally and uses locally installed FFmpeg to export WAV and AAC.

> edge-tts is an open-source Python wrapper, not a fully offline voice model. It is not Microsoft's developer-facing Speech REST API: its documentation demonstrates calls to the Edge online service and notes that custom SSML is constrained by that service.[1] VoiceStudio therefore limits it to local, personal, or internal use and does not promise offline availability, long-term interface compatibility, concurrency capacity, or production-grade reliability.

| Engine | Mandarin / English / Cantonese | API key | Runtime requirements | VoiceStudio role |
|---|---|---:|---|---|
| edge-tts | Supported; all three languages were verified locally | No | Local Python, network, and FFmpeg | Default engine |
| GPT-SoVITS | The project declares Chinese, English, and Cantonese support | No | Local models, Python/PyTorch, and a heavier setup | Optional fully offline advanced extension |
| Azure Speech F0 | Official support | Yes | Cloud resource and a monthly free quota | Not included in the default local setup |

## Verified default voices

| Language | Female voice | Male voice |
|---|---|---|
| Mandarin | `zh-CN-XiaoxiaoNeural` | `zh-CN-YunxiNeural` |
| English | `en-US-AriaNeural` | `en-US-ChristopherNeural` |
| Cantonese | `zh-HK-HiuMaanNeural` | `zh-HK-WanLungNeural` |

The local environment verified that the listed Mandarin, English, and Cantonese voices can produce playable MP3 files. edge-tts supports voice, rate, volume, and pitch controls. Because the Edge service permits only constrained prosody markup, VoiceStudio implements pauses by splitting text and inserting silent local audio segments.

## References

[1] [edge-tts project](https://github.com/rany2/edge-tts)

[2] [GPT-SoVITS project](https://github.com/RVC-Boss/GPT-SoVITS)

[3] [Azure Speech REST API](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-text-to-speech)
