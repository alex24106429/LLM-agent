import fs from "node:fs";

export interface ConfigType {
	OPENAI_BASE_URL: string;
	OPENAI_MODEL: string;
	OPENAI_API_KEY: string;
	BRAVE_API_KEY?: string;
}

let fileConfig: Partial<ConfigType> = {};

try {
	const configPath = new URL("../config.json", import.meta.url);
	const rawData = fs.readFileSync(configPath, "utf-8");
	fileConfig = JSON.parse(rawData);
} catch (_) {
	// If the file doesn't exist or is invalid JSON, we silently catch the error.
	// The app will now rely purely on environment variables.
}

const config: ConfigType = {
	OPENAI_BASE_URL:
		process.env.OPENAI_BASE_URL || fileConfig.OPENAI_BASE_URL || "",
	OPENAI_MODEL: process.env.OPENAI_MODEL || fileConfig.OPENAI_MODEL || "",
	OPENAI_API_KEY:
		process.env.OPENAI_API_KEY || fileConfig.OPENAI_API_KEY || "",
	BRAVE_API_KEY: process.env.BRAVE_API_KEY || fileConfig.BRAVE_API_KEY,
};

export default config;
