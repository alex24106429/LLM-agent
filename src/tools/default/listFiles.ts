import { tool } from "../../types.ts";
import { readdir } from "fs/promises";

export default {
	definition: {
		type: 'function',
		function: {
			name: 'list_files',
			description: 'Get a list of files and directories in a specific path.',
			parameters: {
				type: 'object',
				properties: {
					path: {
						type: 'string',
						description: 'The relative path to list files from. Use "." for the current directory.',
					}
				},
				required: ['path'],
				additionalProperties: false,
			},
			strict: true
		},
	},
	execute: async (args: { path: string }) => {
		console.log(`\n[System] Listing files in: ${args.path}`);

		try {
			const dirEntries = await readdir(args.path, { withFileTypes: true });
			const entries = [];

			for (const entry of dirEntries) {
				entries.push({
					name: entry.name,
					type: entry.isDirectory() ? 'directory' : 'file'
				});
			}

			// Sort directories first, then files
			entries.sort((a, b) => {
				if (a.type === b.type) return a.name.localeCompare(b.name);
				return a.type === 'directory' ? -1 : 1;
			});

			return JSON.stringify(entries);
		} catch (error) {
			return `Error listing files: ${error instanceof Error ? error.message : String(error)}`;
		}
	}
} satisfies tool;
