import OpenAI from 'openai';
import { toolManager } from "./toolManager.ts";
import config from "./config.ts";
import { marked } from 'marked';
import { markedTerminal } from 'marked-terminal';
import readline from 'node:readline/promises';
import { setTimeout } from 'node:timers/promises';

const c = (code: number) => (s: string) => `\x1b[${code}m${s}\x1b[39m`;
const [blue, gray, red, yellow] = [c(34), c(90), c(31), c(33)];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const client = new OpenAI({ baseURL: config.OPENAI_BASE_URL, apiKey: config.OPENAI_API_KEY });

marked.use(markedTerminal() as any);

const tools = new toolManager();
await tools.loadTools();

const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
	{ role: 'system', content: `You are a helpful assistant.\nCurrent date: ${new Date().toDateString()}` },
];

console.log(red("--- Agent ---"));
console.log(blue(`Model: ${config.OPENAI_MODEL}`));
console.log(gray("Type 'exit' to stop."));

while (true) {
	const userInput = (await rl.question(blue("\n> "))).trim();
	if (!userInput) continue;
	if (userInput.toLowerCase() === "exit") break;

	messages.push({ role: 'user', content: userInput });

	// Agent Reasoning Loop
	while (true) {
		let choices;
		let attempt = 0;

		// API Request with Retry Logic
		while (true) {
			try {
				const response = await client.chat.completions.create({
					model: config.OPENAI_MODEL,
					messages,
					tools: tools.hasTools() ? tools.getToolDefinitions() : undefined
				});
				choices = response.choices;
				break; // Success, exit retry loop
			} catch (error: any) {
				if (error?.status === 429) {
					// Check if API specifies wait time, otherwise fallback to exponential backoff (max 60s)
					const retryAfter = error?.headers?.['retry-after'];
					const delaySeconds = retryAfter
						? parseInt(retryAfter, 10)
						: Math.min(Math.pow(2, attempt), 60);

					console.log(yellow(`Rate limit (429) hit. Waiting ${delaySeconds}s before retrying...`));
					await setTimeout(delaySeconds * 1000);
					attempt++;
				} else {
					// For any other error (500, 400, etc.), print it and abort the current reasoning step
					console.log(red(`API Error: ${error?.message || error}`));
					break;
				}
			}
		}

		// If choices is undefined, it means a non-429 error occurred. Break to ask for user input again.
		if (!choices) break;

		const msg = choices[0].message;
		messages.push(msg);

		// If no tools were called, print the LLMs's response and break out to ask the user
		if (!msg.tool_calls?.length) {
			if (msg.content) {
				const parsed = await marked.parse(msg.content);
				console.log(yellow("Agent:\n") + parsed.trim());
			}
			break;
		}

		// Execute all requested tools in parallel
		const toolResults = await Promise.all(msg.tool_calls.map(async (call) => {
			if (call.type !== "function") {
				return {
					role: 'tool' as const,
					tool_call_id: call.id,
					content: `Error: Unsupported tool type "${call.type}".`
				};
			}

			const toolName = call.function.name;
			const tool = tools.getTool(toolName);
			let content = `Error: Tool ${toolName} not found.`;

			if (tool) {
				try {
					const args = JSON.parse(call.function.arguments);
					content = await tool.execute(args);
				} catch (e) {
					content = `Error executing tool: ${e}`;
				}
			}

			return { role: 'tool' as const, tool_call_id: call.id, content };
		}));

		messages.push(...toolResults);
	}
}

console.log("Goodbye!");
process.exit(0);
