"use server";

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import config from "./config";
import searchWebTool from "./tools/searchWeb";

const openai = new OpenAI({
	baseURL: config.OPENAI_BASE_URL,
	apiKey: config.OPENAI_API_KEY,
});

const PriceSchema = z.object({
	price: z.number().describe("The typical retail price in EUR. Use the median of credible listings."),
	currency: z.literal("EUR").describe("Always normalize to EUR."),
	confidence: z.enum(["high", "medium", "low"]).describe("How confident you are based on the number and agreement of sources."),
});

export type ComponentPrice = z.infer<typeof PriceSchema>;

const COMPONENT_CATEGORIES = ["CPU", "GPU", "Motherboard", "RAM", "Storage", "PSU", "Case", "Cooler"] as const;

type ComponentCategory = (typeof COMPONENT_CATEGORIES)[number];

const FALLBACK_PRICES: Record<ComponentCategory, number> = {
	CPU: 250,
	GPU: 500,
	Motherboard: 150,
	RAM: 100,
	Storage: 90,
	PSU: 90,
	Case: 80,
	Cooler: 50,
};

const PRICE_RANGES: Record<ComponentCategory, [number, number]> = {
	CPU: [50, 2000],
	GPU: [100, 5000],
	Motherboard: [50, 1500],
	RAM: [20, 1000],
	Storage: [20, 1500],
	PSU: [30, 600],
	Case: [30, 700],
	Cooler: [10, 500],
};

// --- HELPER: RETRY API CALLS (EXPONENTIAL BACKOFF) ---
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 10, baseDelayMs = 10000): Promise<T> {
	let attempt = 0;
	while (attempt < maxRetries) {
		try {
			return await fn();
		} catch (error: unknown) {
			attempt++;
			const err = error as { status?: number; message?: string };
			const isRateLimit = err.status === 429 || err.message?.includes("429");
			if (isRateLimit && attempt < maxRetries) {
				const delay = baseDelayMs * 2 ** (attempt - 1);
				console.warn(`[API] 429 Rate limit hit, retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`);
				await new Promise((resolve) => setTimeout(resolve, delay));
			} else {
				throw error;
			}
		}
	}
	throw new Error("Max retries reached");
}
// -----------------------------------------------------

// --- RATE LIMITER FOR WEB SEARCHES ---
// ⚡ FIX: Voorkom dat de hele Promise Queue vastloopt als er eentje faalt
let searchQueue: Promise<unknown> = Promise.resolve(null);
let lastSearchTime = 0;
const SEARCH_DELAY_MS = 1500;

async function rateLimitedSearchWebToolExecute(params: { queries: string[] }): Promise<string> {
	const task = async () => {
		const now = Date.now();
		const timeToWait = Math.max(0, SEARCH_DELAY_MS - (now - lastSearchTime));

		if (timeToWait > 0) {
			await new Promise((r) => setTimeout(r, timeToWait));
		}

		try {
			return await searchWebTool.execute(params);
		} finally {
			// ⚡ FIX: Zet de tijd pas NADAT de search is afgerond
			// Hierdoor conflicteert de wachttijd niet meer met interne Brave wachttijden.
			lastSearchTime = Date.now();
		}
	};

	// Voeg taak toe en vang de error af op queue-niveau zodat latere API calls blijven doorwerken
	const resultPromise = searchQueue.then(task, task);
	searchQueue = resultPromise.catch(() => {});

	return resultPromise;
}
// -------------------------------------
export async function getComponentPrice(componentName: string, category: ComponentCategory = "GPU"): Promise<number> {
	const fallback = FALLBACK_PRICES[category];
	const [minPrice, maxPrice] = PRICE_RANGES[category];

	try {
		const result = await rateLimitedSearchWebToolExecute({
			queries: [`${componentName} ${category} price EUR`, `${componentName} prijs kopen nederland`],
		});

		if (typeof result !== "string" || result.startsWith("Error")) {
			return fallback;
		}

		// Omwikkeld in een withRetry voor de parse rate limits
		const completion = await withRetry(() =>
			openai.chat.completions.parse({
				model: config.OPENAI_MODEL,
				messages: [
					{
						role: "system",
						content:
							"You extract the typical current retail price of a PC component from raw web search results. " +
							"Ignore shipping fees, accessories, used/refurbished listings, and obvious outliers. " +
							"Convert USD/GBP to EUR with a reasonable approximation if no EUR prices are available.",
					},
					{
						role: "user",
						content: `Component category: ${category}\nComponent: ${componentName}\n\nSearch results:\n${result}\n\nReturn the typical retail price in EUR.`,
					},
				],
				response_format: zodResponseFormat(PriceSchema, "price"),
			}),
		);

		const object = completion.choices[0].message.parsed;
		if (!object) return fallback;

		if (object.price < minPrice || object.price > maxPrice) return fallback;

		return object.price;
	} catch (e) {
		console.error("[getComponentPrice] failed:", e);
		return fallback;
	}
}

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
	{
		type: "function",
		function: {
			name: "get_component_price",
			description:
				"Haal de actuele marktprijs op van een specifiek PC-component in Euro's. " +
				"Roep deze tool aan voor ELK component in de build (CPU, GPU, moederbord, RAM, opslag, PSU, behuizing, cooler).",
			parameters: {
				type: "object",
				properties: {
					componentName: {
						type: "string",
						description: "Specifieke productnaam, bijv: 'AMD Ryzen 7 7700X', 'RTX 4070 Super', 'Corsair Vengeance 32GB DDR5-6000'.",
					},
					category: {
						type: "string",
						enum: [...COMPONENT_CATEGORIES],
						description: "De categorie van het component.",
					},
				},
				required: ["componentName", "category"],
			},
		},
	},
];

export async function buildPcWithBudgetCheck(userPrompt: string) {
	const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
		{
			role: "system",
			content:
				`Je bent een ervaren PC-builder. Lees de wensen en het budget van de gebruiker en stel een COMPLETE build samen ` +
				`met alle onderstaande componenten: ${COMPONENT_CATEGORIES.join(", ")}.\n\n` +
				`WERKWIJZE:\n` +
				`1. Kies voor ELK component een specifiek model.\n` +
				`2. Roep voor ELK component de tool 'get_component_price' aan om de actuele prijs op te halen.\n` +
				`3. Tel alle prijzen op en controleer of het totaal binnen het budget van de gebruiker valt.\n` +
				`4. Als het totaal te hoog is: vervang één of meer componenten door goedkopere alternatieven en roep de tool opnieuw aan voor die componenten.\n` +
				`5. Als het totaal te laag is (veel ruimte over): overweeg betere componenten waar dat zinvol is.\n\n` +
				`HARDE EIS: De GPU mag maximaal 45% van het totale budget innemen.\n\n` +
				`Wanneer je tevreden bent, geef dan een nette samenvatting met per component: naam, prijs, en het totaal.`,
		},
		{ role: "user", content: userPrompt },
	];

	let attempts = 0;
	const maxAttempts = 10;
	console.log(`\n[Start Loop] Complete PC build samenstellen en budget controleren...`);

	while (attempts < maxAttempts) {
		attempts++;
		console.log(`\n--- Iteratie ${attempts} ---`);

		let response: OpenAI.Chat.Completions.ChatCompletion;
		try {
			// Ook omwikkeld in de retry en try...catch
			response = await withRetry(() =>
				openai.chat.completions.create({
					model: config.OPENAI_MODEL,
					messages: messages,
					tools: tools,
					tool_choice: "auto",
				}),
			);
		} catch (error: unknown) {
			console.error("[buildPcWithBudgetCheck] Error in OpenAI loop:", error);
			// Netjes falen in plaats van de server action te laten crashen
			return "Er is een serverfout opgetreden met de AI (bijv. 429 Too Many Requests). Probeer het later nog eens.";
		}

		const responseMessage = response.choices[0].message;
		messages.push(responseMessage);

		if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
			// Belangrijk! Vervang `Promise.all` door sequentieel oplossen met een for...of loop
			// Dit voorkomt dat je 8 simultane verbindingen opent naar OpenAI
			const toolResults = [];
			for (const toolCall of responseMessage.tool_calls) {
				if (toolCall.type === "function" && toolCall.function.name === "get_component_price") {
					const args = JSON.parse(toolCall.function.arguments) as {
						componentName: string;
						category?: ComponentCategory;
					};
					const category = (args.category ?? "GPU") as ComponentCategory;
					const price = await getComponentPrice(args.componentName, category);
					console.log(`>> [${category}] '${args.componentName}' → €${price}`);
					toolResults.push({
						role: "tool" as const,
						tool_call_id: toolCall.id,
						content: price.toString(),
					});
				} else {
					toolResults.push({
						role: "tool" as const,
						tool_call_id: toolCall.id,
						content: "Error: unknown tool",
					});
				}
			}

			for (const tr of toolResults) messages.push(tr);
		} else {
			console.log("LLM is tevreden: complete build past binnen het budget!");
			return responseMessage.content;
		}
	}

	return "Kon geen geschikte build samenstellen binnen de toegestane pogingen.";
}
