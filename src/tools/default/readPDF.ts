import { tool } from "../../types.ts";
import { PDFParse } from 'pdf-parse';
import { resolve } from "path";
import { pathToFileURL } from "url";
import { stat as fsStat } from "fs/promises";

export default {
	definition: {
		type: 'function',
		function: {
			name: 'read_pdf',
			description: 'Extract text content from a PDF file. Supports local file paths and HTTP/HTTPS URLs.',
			parameters: {
				type: 'object',
				properties: {
					path: {
						type: 'string',
						description: 'The local file path or URL of the PDF to read.',
					}
				},
				required: ['path'],
				additionalProperties: false,
			},
			strict: true
		},
	},
	execute: async (args: { path: string }) => {
		console.log(`\n[System] Reading PDF: ${args.path}`);

		try {
			let urlToLoad = args.path;
			const isWebUrl = args.path.startsWith('http://') || args.path.startsWith('https://');

			if (!isWebUrl) {
				// Resolve local path to absolute path
				const absolutePath = resolve(process.cwd(), args.path);

				// Verify file exists
				try {
					const stat = await fsStat(absolutePath);
					if (!stat.isFile()) {
						return `Error: "${args.path}" is not a file.`;
					}
				} catch {
					return `Error: File "${args.path}" not found.`;
				}

				// Convert to file:// URL for the library
				urlToLoad = pathToFileURL(absolutePath).href;
			}

			// Initialize parser with the URL (local or remote)
			const parser = new PDFParse({ url: urlToLoad });
			const result = await parser.getText();

			return result.text;
		} catch (error) {
			return `Error reading PDF: ${error instanceof Error ? error.message : String(error)}`;
		}
	}
} satisfies tool;
