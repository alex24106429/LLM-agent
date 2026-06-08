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
	price: z
		.number()
		.describe("The typical retail price in EUR. Use the median of credible listings."),
	currency: z.literal("EUR").describe("Always normalize to EUR."),
	confidence: z
		.enum(["high", "medium", "low"])
		.describe("How confident you are based on the number and agreement of sources."),
});

export type ComponentPrice = z.infer<typeof PriceSchema>;

/**
 * Look up a component's price by searching the web and letting an LLM
 * extract a structured, validated result via a Zod schema.
 */
export async function getComponentPrice(
	componentName: string,
	fallback = 400,
): Promise<number> {
	try {
		const result = await searchWebTool.execute({
			queries: [
				`${componentName} price EUR`,
				`${componentName} prijs kopen nederland`,
			],
		});

		if (typeof result !== "string" || result.startsWith("Error")) {
			return fallback;
		}

		// Use OpenAI's native structured outputs with a Zod schema.
		const completion = await openai.chat.completions.parse({
			model: "gpt-4o-mini",
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
					content:
						`Component: ${componentName}\n\n` +
						`Search results:\n${result}\n\n` +
						`Return the typical retail price in EUR.`,
				},
			],
			response_format: zodResponseFormat(PriceSchema, "price"),
		});

		const object = completion.choices[0].message.parsed;
		if (!object) return fallback;

		// Sanity-check the range.
		if (object.price < 50 || object.price > 10000) return fallback;

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
			description: "Haal de actuele marktprijs op van een PC component in Euros.",
			parameters: {
				type: "object",
				properties: {
					componentName: {
						type: "string",
						description: "Bijv: 'RTX 4090' of 'RX 7800 XT'",
					},
				},
				required: ["componentName"],
			},
		},
	},
];

async function selectGpuWithBudgetCheck(userPrompt: string) {
	const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
		{
			role: "system",
			content: `Je bent een PC-builder. Lees de wensen en het budget van de gebruiker. Kies een geschikte videokaart (GPU).
            BELANGRIJK: Een GPU mag maximaal 45% van het totale budget innemen. Bereken dit bedrag zelf op basis van het budget van de gebruiker.
            Roep ALTIJD de tool 'get_component_price' aan om de prijs te controleren. Als de prijs te hoog is, roep de tool dan opnieuw aan voor een goedkoper alternatief.`,
		},
		{ role: "user", content: userPrompt },
	];

	let attempts = 0;
	console.log(`\n[Start Loop] GPU selecteren en budget controleren...`);

	while (attempts < 5) {
		attempts++;
		console.log(`\n--- Iteratie ${attempts} ---`);

		const response = await openai.chat.completions.create({
			model: config.OPENAI_MODEL,
			messages: messages,
			tools: tools,
			tool_choice: "auto",
		});

		const responseMessage = response.choices[0].message;
		messages.push(responseMessage);

		if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
			for (const toolCall of responseMessage.tool_calls) {
				if (toolCall.type === "function" && toolCall.function.name === "get_component_price") {
					const args = JSON.parse(toolCall.function.arguments);

					// FIX: await the async price lookup.
					const price = await getComponentPrice(args.componentName);
					console.log(`>> LLM koos GPU: '${args.componentName}'. API checkt prijs: €${price}`);

					messages.push({
						role: "tool",
						tool_call_id: toolCall.id,
						content: price.toString(),
					});
				}
			}
		} else {
			console.log("LLM is tevreden met de keuze en past binnen het budget!");
			return responseMessage.content;
		}
	}

	return "Kon geen geschikte GPU vinden binnen de toegestane pogingen.";
}

async function runExperiment() {
	console.log("Start PC-Builder Agent Onderzoek (OpenAI SDK + TS)");

	const prompt =
		"Ik wil graag een PC bouwen om Cyberpunk 2077 en Starfield op te spelen in 4K. Mijn totale budget is 1500 euro.";
	console.log("\n[Gebruiker input]:", prompt);

	console.log("\n[Stap 1] Hardware selecteren, prijs API bellen & budget loop draaien...");
	const result = await selectGpuWithBudgetCheck(prompt);

	console.log(`\nRESULTAAT:\n${result}`);
}

runExperiment().catch(console.error);
