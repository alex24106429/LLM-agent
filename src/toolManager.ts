import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type OpenAI from "openai";

export interface tool {
	definition: OpenAI.ChatCompletionTool;
	// biome-ignore lint/suspicious/noExplicitAny: different functions have different args
	execute: (args: any) => Promise<string> | string;
}

export class toolManager {
	private tools = new Map<string, tool>();

	async loadTools() {
		const baseDir = dirname(fileURLToPath(import.meta.url));
		const folders = ["tools/"].map((p) => join(baseDir, p));
		const loaded: string[] = [];

		for (const folder of folders) {
			const files = await readdir(folder, { withFileTypes: true }).catch(
				() => [],
			);

			for (const file of files) {
				if (!file.isFile() || !file.name.endsWith("")) continue;

				try {
					const url = pathToFileURL(join(folder, file.name)).href;
					const { default: tool } = await import(url);

					if (tool?.definition?.type === "function") {
						const name = tool.definition.function.name;
						this.tools.set(name, tool);
						loaded.push(name);
					} else {
						console.warn(
							`[System] Skipped non-function tool in ${file.name}`,
						);
					}
				} catch (error) {
					console.error(
						`Error loading tool from ${file.name}:`,
						error,
					);
				}
			}
		}

		if (loaded.length) {
			console.log(`\x1b[90mLoaded tools: ${loaded.join(", ")}\x1b[39m`);
		}
	}

	getToolDefinitions() {
		return Array.from(this.tools.values()).map((t) => t.definition);
	}
	getTool(name: string) {
		return this.tools.get(name);
	}
	hasTools() {
		return this.tools.size > 0;
	}
}
