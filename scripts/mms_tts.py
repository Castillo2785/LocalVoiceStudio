#!/usr/bin/env python3
"""Generate a WAV file with a local Hugging Face MMS-TTS model."""

import argparse
import wave

import torch
from transformers import AutoTokenizer, VitsModel, set_seed


def write_wav(path: str, samples: torch.Tensor, sample_rate: int) -> None:
    pcm = (samples.detach().cpu().numpy().clip(-1, 1) * 32767).astype("int16")
    with wave.open(path, "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(sample_rate)
        output.writeframes(pcm.tobytes())


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate speech with an MMS-TTS model.")
    parser.add_argument("--model", required=True)
    parser.add_argument("--text", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--rate", type=float, default=1.0)
    args = parser.parse_args()

    tokenizer = AutoTokenizer.from_pretrained(args.model)
    model = VitsModel.from_pretrained(args.model)
    model.speaking_rate = max(0.7, min(1.3, args.rate))
    inputs = tokenizer(args.text, return_tensors="pt")
    set_seed(555)
    with torch.no_grad():
        waveform = model(**inputs).waveform[0]
    write_wav(args.output, waveform, model.config.sampling_rate)


if __name__ == "__main__":
    main()
