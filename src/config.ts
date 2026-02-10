import rawConfig from "../config.json" with { type: "json" };

interface configType {
	OPENAI_BASE_URL: string,
	OPENAI_MODEL: string,
	OPENAI_API_KEY: string,
	BRAVE_API_KEY?: string
}

export default rawConfig as configType;
