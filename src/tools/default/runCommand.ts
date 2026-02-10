import { tool } from "../../types.ts";
import { spawn } from "child_process";

export default {
	definition: {
		type: 'function',
		function: {
			name: 'run_command',
			description: 'Execute a system command in the shell. Use this to run scripts, install dependencies, or use git. Prioritize commands that do not ask for user input.',
			parameters: {
				type: 'object',
				properties: {
					command: {
						type: 'string',
						description: 'The command to run (e.g., "ls -la", "npm install", "git status").',
					},
					cwd: {
						type: 'string',
						description: 'Optional: The current working directory to run the command in.',
					}
				},
				required: ['command'],
				additionalProperties: false,
			},
			strict: true
		},
	},
	execute: async (args: { command: string, cwd?: string }) => {
		console.log(`\n[System] Running command: ${args.command}`);

		try {
			const cwd = args.cwd || process.cwd();

			const child = spawn(args.command, {
				shell: true,
				cwd,
			});

			let outputBuffer = "";

			const handleStream = (stream: NodeJS.ReadableStream, dest: NodeJS.WritableStream) => {
				return new Promise<void>((resolve) => {
					stream.on('data', (chunk) => {
						dest.write(chunk);
						outputBuffer += chunk.toString();
					});
					stream.on('end', () => resolve());
				});
			};

			process.stdin.pipe(child.stdin);

			await Promise.all([
				handleStream(child.stdout, process.stdout),
				handleStream(child.stderr, process.stderr),
				new Promise<void>((resolve) => {
					child.on('close', () => {
						resolve();
					});
					child.on('error', () => {
						resolve();
					});
				})
			]);

			process.stdin.unpipe(child.stdin);

			if (!outputBuffer.trim()) {
				return "Command executed successfully with no output.";
			}

			return outputBuffer;
		} catch (error) {
			return `Error running command: ${error instanceof Error ? error.message : String(error)}`;
		}
	}
} satisfies tool;
