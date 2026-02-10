import { KokoroTTS } from "kokoro-js";

const model_id = "onnx-community/Kokoro-82M-v1.0-ONNX";
const tts = await KokoroTTS.from_pretrained(model_id, {
	dtype: "q8",
	device: "cpu",
});

tts.list_voices();

const text = "Life is like a box of chocolates. You never know what you're gonna get.";
const audio = await tts.generate(text, {
	voice: "af_heart",
});
audio.save("audio.wav");
