import * as cheerio from "cheerio";

type MegekkoProduct = {
	title: string;
	url: string;
	price?: string;
};

type MegekkoSearchResult = {
	products: MegekkoProduct[];
};

// --- Configuration Defaults ---

const MEGEKKO_SEARCH_URL = "https://www.megekko.nl/pages/zoeken/v5/v5.php";
const MEGEKKO_BASE_URL = "https://www.megekko.nl";

// --- Helper Functions ---

/**
 * Parses the raw HTML response from Megekko's v5 API
 * into structured data containing products using Cheerio for robust parsing.
 */
function parseMegekkoHTML(html: string): MegekkoSearchResult {
	const products: MegekkoProduct[] = [];
	const $ = cheerio.load(html);

	$(".prdContainer").each((_, element) => {
		const el = $(element);

		const titleTag = el.find("h2.prdTitle").first();
		const linkTag = el.find("a.prdImg").first();
		const priceEuroTag = el.find(".prsEuro").first();
		const priceCentTag = el.find(".prsCent").first();

		const title = titleTag.text().trim();
		const urlPath = linkTag.attr("href");

		if (title && urlPath) {
			let price: string | undefined;
			if (priceEuroTag.length) {
				const euros = priceEuroTag.text().trim();
				const cents = priceCentTag.length ? priceCentTag.text().trim() : "";

				// Formats price cleanly (e.g. "4099,-" becomes "€4099" and "6949," + "70" becomes "€6949,70")
				price = `€${euros}${cents}`.replace(/,-$/, "");
			}

			products.push({
				title,
				url: `${MEGEKKO_BASE_URL}${urlPath}`,
				price,
			});
		}
	});

	return { products };
}

function formatResultsForLLM(query: string, results: MegekkoSearchResult): string {
	if (results.products.length === 0) {
		return `No products found for "${query}" on Megekko.`;
	}

	let markdown = `### Megekko Search Results for "${query}"\n\n`;

	if (results.products.length > 0) {
		markdown += `**Found Products:**\n`;
		for (const p of results.products) {
			const priceStr = p.price ? ` - **${p.price}**` : "";
			markdown += `- [${p.title}](${p.url})${priceStr}\n`;
		}
		markdown += `\n`;
	}
	console.log(markdown.trim());
	return markdown.trim();
}

// --- Tool Export ---

export default {
	definition: {
		type: "function",
		function: {
			name: "search_megekko",
			description: "Search for PC hardware and electronics on Megekko.nl (Dutch webshop) using their internal search API. Returns product links and prices.",
			parameters: {
				type: "object",
				properties: {
					query: {
						type: "string",
						description: "The search term to look up (e.g., 'RTX 5090', 'Ryzen 7800X3D', '32GB DDR5').",
					},
				},
				required: ["query"],
				additionalProperties: false,
			},
			strict: true,
		},
	},
	execute: async (args: { query: string }) => {
		const { query } = args;
		console.log(`[System] Searching Megekko for: "${query}"...`);

		const body = new URLSearchParams({
			zoek: query,
			cache: "0",
			pageuri: "/home/",
			filter: "",
			pagemutate: "force",
			output: "html",
			moreopen: "",
			calltype: "zoek",
		});

		try {
			const response = await fetch(MEGEKKO_SEARCH_URL, {
				method: "POST",
				headers: {
					"User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0",
					Accept: "*/*",
					"Accept-Language": "en-US,en;q=0.9",
					"Content-type": "application/x-www-form-urlencoded",
					"Sec-Fetch-Dest": "empty",
					"Sec-Fetch-Mode": "cors",
					"Sec-Fetch-Site": "same-origin",
				},
				referrer: "https://www.megekko.nl/home/",
				body: body.toString(),
			});

			if (!response.ok) {
				console.error(`[System] Megekko API error for query "${query}": ${response.status} ${response.statusText}`);
				return `Error: Megekko API returned status ${response.status}`;
			}

			// API returns JSON, with the UI populated in the 'html' property
			const jsonResponse = await response.json();
			const htmlText = jsonResponse.html;

			if (!htmlText) {
				return `Error: Megekko API did not return HTML content.`;
			}

			const parsedData = parseMegekkoHTML(htmlText);

			return formatResultsForLLM(query, parsedData);

			// biome-ignore lint/suspicious/noExplicitAny: catch any fetch/parsing errors
		} catch (e: any) {
			console.error("[System] Failed to fetch from Megekko API:", e);
			return `Error: Failed to fetch Megekko search results. Details: ${e.message}`;
		}
	},
};
