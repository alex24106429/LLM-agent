import { tool } from "../../types.ts";
import { rm } from "fs/promises";

export default {
	definition: {
		type: 'function',
		function: {
			name: 'delete_file',
			description: 'Delete a specific file permanently. This action cannot be undone.',
			parameters: {
				type: 'object',
				properties: {
					path: {
						type: 'string',
						description: 'The relative path to the file to delete.',
					}
				},
				required: ['path'],
				additionalProperties: false,
			},
			strict: true
		},
	},
	execute: async (args: { path: string }) => {
		console.log(`\n[System] Deleting file: ${args.path}`);

		try {
			await rm(args.path);
			return `Successfully deleted "${args.path}".`;
		} catch (error) {
			return `Error deleting file: ${error instanceof Error ? error.message : String(error)}`;
		}
	}
} satisfies tool;
