import { tool } from "../../types.ts";
import { writeFile } from "fs/promises";

export default {
	definition: {
		type: 'function',
		function: {
			name: 'write_file',
			description: 'Write text content to a specific file. This will overwrite the entire file if it exists, or create it if it does not.',
			parameters: {
				type: 'object',
				properties: {
					path: {
						type: 'string',
						description: 'The relative path to the file to write.',
					},
					content: {
						type: 'string',
						description: 'The full text content to write to the file.',
					}
				},
				required: ['path', 'content'],
				additionalProperties: false,
			},
			strict: true
		},
	},
	execute: async (args: { path: string; content: unknown }) => {
		console.log(`\n[System] Writing file: ${args.path}`);

		let contentToWrite: string;

		if (typeof args.content === 'string') {
			contentToWrite = args.content;
		} else {
			// If the LLM sent an object/array instead of a string,
			// JSON stringify it so we actually see the data instead of [object Object]
			console.warn(`[System] Warning: LLM sent ${typeof args.content} instead of string for file content. Auto-fixing.`);
			if (typeof args.content === 'object' && args.content !== null) {
				contentToWrite = JSON.stringify(args.content, null, 2);
			} else {
				contentToWrite = String(args.content);
			}
		}

		// Log a preview of what we are writing
		console.log(contentToWrite.slice(0, 100) + (contentToWrite.length > 100 ? "..." : ""));

		try {
			await writeFile(args.path, contentToWrite, "utf8");
			return `Successfully wrote content to "${args.path}".`;
		} catch (error) {
			return `Error writing file: ${error instanceof Error ? error.message : String(error)}`;
		}
	}
} satisfies tool;
