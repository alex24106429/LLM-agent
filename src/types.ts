import OpenAI from 'openai';

export default interface chatCompletionMessage {
	role: string;
	content: string | null;
	reasoning_content?: string;
}

export interface tool {
	definition: OpenAI.ChatCompletionTool;
	execute: (args: any) => Promise<string> | string;
}
