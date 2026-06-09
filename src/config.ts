export interface ConfigType {
	OPENAI_BASE_URL: string;
	OPENAI_MODEL: string;
	OPENAI_API_KEY: string;
	BRAVE_API_KEY?: string;
}

const config: ConfigType = {
	OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || "",
	OPENAI_MODEL: process.env.OPENAI_MODEL || "",
	OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
	BRAVE_API_KEY: process.env.BRAVE_API_KEY,
};

export default config;
