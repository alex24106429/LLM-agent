import fs from "node:fs";
import path from "node:path";

export interface ConfigType {
	OPENAI_BASE_URL: string;
	OPENAI_MODEL: string;
	OPENAI_API_KEY: string;
	BRAVE_API_KEY?: string;
}

let fileConfig: Partial<ConfigType> = {};

try {
	// process.cwd() ensures it always looks at the root of your Next.js project
	const configPath = path.join(process.cwd(), "config.json");

	if (fs.existsSync(configPath)) {
		const rawData = fs.readFileSync(configPath, "utf-8");
		fileConfig = JSON.parse(rawData);
	}
} catch (error) {
	// You might want to log this just in case JSON parsing fails
	console.warn("[Config] Failed to load config.json, relying on env vars.", error);
}

const config: ConfigType = {
	OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || fileConfig.OPENAI_BASE_URL || "",
	OPENAI_MODEL: process.env.OPENAI_MODEL || fileConfig.OPENAI_MODEL || "",
	OPENAI_API_KEY: process.env.OPENAI_API_KEY || fileConfig.OPENAI_API_KEY || "",
	BRAVE_API_KEY: process.env.BRAVE_API_KEY || fileConfig.BRAVE_API_KEY,
};

export default config;
