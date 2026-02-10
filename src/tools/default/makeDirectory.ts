import { tool } from "../../types.ts";
import { mkdir } from "fs/promises";

export default {
	definition: {
		type: 'function',
		function: {
			name: 'make_directory',
			description: 'Create a new directory (and any necessary parent directories).',
			parameters: {
				type: 'object',
				properties: {
					path: {
						type: 'string',
						description: 'The path of the directory to create.',
					}
				},
				required: ['path'],
				additionalProperties: false,
			},
			strict: true
		},
	},
	execute: async (args: { path: string }) => {
		console.log(`\n[System] Creating directory: ${args.path}`);

		try {
			await mkdir(args.path, { recursive: true });
			return `Successfully created directory "${args.path}".`;
		} catch (error) {
			return `Error creating directory: ${error instanceof Error ? error.message : String(error)}`;
		}
	}
} satisfies tool;
