import { tool } from "../../types.ts";
import { stat as fsStat, readFile } from "fs/promises";

export default {
	definition: {
		type: 'function',
		function: {
			name: 'read_file',
			description: 'Read the full text content of a specific file.',
			parameters: {
				type: 'object',
				properties: {
					path: {
						type: 'string',
						description: 'The relative path to the file to read.',
					}
				},
				required: ['path'],
				additionalProperties: false,
			},
			strict: true
		},
	},
	execute: async (args: { path: string }) => {
		console.log(`\n[System] Reading file: ${args.path}`);

		try {
			// Check if it's a file before reading
			const stat = await fsStat(args.path);
			if (!stat.isFile()) {
				return `Error: "${args.path}" is not a file.`;
			}

			const content = await readFile(args.path, "utf8");
			return content;
		} catch (error) {
			return `Error reading file: ${error instanceof Error ? error.message : String(error)}`;
		}
	}
} satisfies tool;
