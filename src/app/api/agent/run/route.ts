import { type NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agent-runner";
import type { AgentEvent } from "@/schemas";

export const runtime = "edge";

export async function POST(request: NextRequest) {
	let userPrompt: string;
	try {
		const body = await request.json();
		userPrompt = body.prompt;
		if (!userPrompt || typeof userPrompt !== "string" || userPrompt.trim().length === 0) {
			return NextResponse.json({ error: "Prompt is verplicht" }, { status: 400 });
		}
	} catch {
		return NextResponse.json({ error: "Ongeldige JSON body" }, { status: 400 });
	}

	const encoder = new TextEncoder();

	const stream = new ReadableStream({
		async start(controller) {
			let isClosed = false;

			function sendEvent(event: AgentEvent) {
				if (isClosed) return;
				try {
					const data = `data: ${JSON.stringify(event)}\n\n`;
					controller.enqueue(encoder.encode(data));

					// If complete or error, close the stream
					if (event.type === "complete" || event.type === "error") {
						controller.close();
						isClosed = true;
					}
				} catch {
					// Controller may already be closed — silently ignore
					isClosed = true;
				}
			}

			try {
				await runAgent(userPrompt.trim(), sendEvent);
				// Ensure stream is closed even if agent didn't emit complete
				if (!isClosed) {
					sendEvent({ type: "complete" });
				}
			} catch (err) {
				if (!isClosed) {
					sendEvent({
						type: "error",
						message: err instanceof Error ? err.message : "Onbekende fout in agent loop",
					});
				}
			}
		},
		cancel() {
			// Client disconnected — the stream will stop enqueuing
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
			"X-Accel-Buffering": "no",
		},
	});
}
