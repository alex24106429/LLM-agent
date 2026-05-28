import config from "../config";
import type { tool } from "../toolManager";

// --- Types ---

type BraveResult = {
	title: string;
	url: string;
	age?: string;
	description?: string;
	extra_snippets?: string[];
};

type BraveResponse = {
	web?: { results?: BraveResult[] };
};

// --- Configuration Defaults ---

const BRAVE_BASE_URL = "https://api.search.brave.com/res/v1/web/search";
const MAX_TOTAL_RESULTS = 10;
const REQUEST_DELAY = 500; // ms

// --- Helper Functions ---

function formatSearchResultsForLLM(searchResults: BraveResult[]) {
	return searchResults
		.map((res, i) => {
			let markdown = `# ${i + 1}. ${res.title}\n\n${res.url}\n\n${res.age || ""}\n\n---\n`;
			markdown += `${(res.description || "").replace(/<\/?strong>/g, "**")}`;
			if (res.extra_snippets?.length)
				markdown += `\n\n${res.extra_snippets.join("\n")}`;
			return markdown;
		})
		.join("\n\n");
}

function delay(ms: number) {
	return new Promise((r) => setTimeout(r, ms));
}

async function performSingleSearch(
	query: string,
	resultsPerQuery: number,
	apiKey: string,
) {
	console.log(`[System] Searching for: "${query}"...`);

	const params = new URLSearchParams({
		q: query,
		safesearch: "off",
		spellcheck: "false",
		result_filter: "web",
		units: "metric",
		extra_snippets: "true",
		count: String(resultsPerQuery),
	});

	const url = `${BRAVE_BASE_URL}?${params.toString()}`;

	try {
		const response = await fetch(url, {
			method: "GET",
			headers: {
				Accept: "application/json",
				"Accept-Encoding": "gzip",
				"X-Subscription-Token": apiKey,
			},
		});

		if (!response.ok) {
			console.error(
				`[System] Brave API error for query "${query}": ${response.status} ${response.statusText}`,
			);
			return null;
		}

		return (await response.json()) as BraveResponse;
	} catch (err) {
		console.error(`[System] Fetch failed for query "${query}":`, err);
		return null;
	}
}

// --- Tool Export ---

export default {
	definition: {
		type: "function",
		function: {
			name: "search_web",
			description:
				"Search the internet for up-to-date information. Accepts a list of queries to perform parallel searches if necessary.",
			parameters: {
				type: "object",
				properties: {
					queries: {
						type: "array",
						items: {
							type: "string",
						},
						description:
							'An array of search queries to execute (e.g. ["current weather in Tokyo", "Tokyo time zone"]).',
					},
				},
				required: ["queries"],
				additionalProperties: false,
			},
			strict: true,
		},
	},
	execute: async (args: { queries: string[] }) => {
		// Access config safely
		const apiKey = config.BRAVE_API_KEY || process.env.BRAVE_API_KEY;

		if (!apiKey) {
			return "Error: BRAVE_API_KEY is missing in config.json or environment variables. Tell the user to configure it.";
		}

		const queries = args.queries;
		const resultsPerQuery = Math.max(
			1,
			Math.floor(MAX_TOTAL_RESULTS / queries.length),
		);

		try {
			const bodies: BraveResponse[] = [];

			for (const [index, q] of queries.entries()) {
				const result = await performSingleSearch(
					q,
					resultsPerQuery,
					apiKey,
				);
				if (result) bodies.push(result);

				// Respect rate limits between calls
				if (index < queries.length - 1) await delay(REQUEST_DELAY);
			}

			const allResults: BraveResult[] = [];
			for (const body of bodies) {
				if (body?.web?.results) {
					allResults.push(...body.web.results);
				}
			}

			if (allResults.length > 0) {
				const formattedContent = formatSearchResultsForLLM(allResults);
				return formattedContent;
			}

			return "No search results found or the API response was malformed.";
			// biome-ignore lint/suspicious/noExplicitAny: any error can occour
		} catch (e: any) {
			console.error("[System] Failed to fetch from Brave Search API:", e);
			return `Error: Failed to fetch search results. Details: ${e.message}`;
		}
	},
} satisfies tool;
