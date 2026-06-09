import OpenAI from "openai";
import config from "../config";

let _openai: OpenAI | null = null;

export function getOpenAI(): OpenAI {
	if (!_openai) {
		if (!config.OPENAI_API_KEY) {
			throw new Error("OPENAI_API_KEY is not set. Create a .env file with your API key (see .env.example).");
		}

		_openai = new OpenAI({
			baseURL: config.OPENAI_BASE_URL || undefined,
			apiKey: config.OPENAI_API_KEY
		});
	}
	return _openai;
}
