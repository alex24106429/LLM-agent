import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import config from "./config.json" with { type: "json" };

const openai = new OpenAI({
	baseURL: config.OPENAI_BASE_URL,
	apiKey: config.OPENAI_API_KEY,
});

const UserWishesSchema = z.object({
	budget: z
		.number()
		.describe("Het maximale budget van de gebruiker in Euros (als getal)"),
	games: z
		.array(z.string())
		.describe("Lijst met games die de gebruiker wil spelen"),
	resolution: z
		.enum(["1080p", "1440p", "4K"])
		.describe("De gewenste doelresolutie"),
});

type UserWishes = z.infer<typeof UserWishesSchema>;

async function parseUserWishes(prompt: string): Promise<UserWishes> {
	const response = await openai.chat.completions.parse({
		model: config.OPENAI_MODEL,
		messages: [
			{
				role: "system",
				content:
					"Jij bent een assistent die wensen voor een PC-build extracteert naar JSON.",
			},
			{ role: "user", content: prompt },
		],
		response_format: zodResponseFormat(UserWishesSchema, "user_wishes"),
	});

	return response.choices[0].message.parsed as UserWishes;
}

function getComponentPrice(componentName: string): number {
	const nameLower = componentName.toLowerCase();
	if (nameLower.includes("4090")) return 2000;
	if (nameLower.includes("4080")) return 1100;
	if (nameLower.includes("4070")) return 600;
	if (nameLower.includes("4060")) return 300;
	return 400;
}

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
	{
		type: "function",
		function: {
			name: "get_component_price",
			description:
				"Haal de actuele marktprijs op van een PC component in Euros.",
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

async function selectGpuWithBudgetCheck(wishes: UserWishes) {
	const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
		{
			role: "system",
			content: `Je bent een PC-builder. Kies een geschikte videokaart (GPU) voor de games: ${wishes.games.join(", ")} op ${wishes.resolution}.
            BELANGRIJK: Een GPU mag maximaal 45% van het totale budget (€${wishes.budget}) innemen.
            Roep ALTIJD de tool 'get_component_price' aan om de prijs te controleren.`,
		},
		{ role: "user", content: "Kies een GPU en check de prijs." },
	];

	let isBudgetOk = false;
	let finalGPU = "";
	let attempts = 0;
	const maxGpuBudget = wishes.budget * 0.45;

	console.log(
		`\n[Start Loop] Doel GPU budget is max €${maxGpuBudget} (45% van €${wishes.budget})`,
	);

	while (!isBudgetOk && attempts < 3) {
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

		if (responseMessage.tool_calls) {
			for (const toolCall of responseMessage.tool_calls) {
				if (
					toolCall.type === "function" &&
					toolCall.function.name === "get_component_price"
				) {
					const args = JSON.parse(toolCall.function.arguments);

					const price = getComponentPrice(args.componentName);
					console.log(
						`>> LLM koos GPU: '${args.componentName}'. API checkt prijs: €${price}`,
					);

					messages.push({
						role: "tool",
						tool_call_id: toolCall.id,
						content: price.toString(),
					});

					if (price <= maxGpuBudget) {
						console.log(
							"Budget check geslaagd! Past binnen budget.",
						);
						isBudgetOk = true;
						finalGPU = args.componentName;
					} else {
						console.log(
							"GPU is te duur. LLM instrueren om een goedkopere te zoeken...",
						);
						messages.push({
							role: "user",
							content: `De prijs is €${price}. Dit is meer dan ons budget van €${maxGpuBudget} voor de GPU. Kies een goedkoper alternatief en check opnieuw de prijs.`,
						});
					}
				}
			}
		}
	}

	return finalGPU;
}

async function runExperiment() {
	console.log("Start PC-Builder Agent Onderzoek (OpenAI SDK + TS)");

	const prompt =
		"Ik wil graag een PC bouwen om Cyberpunk 2077 en Starfield op te spelen in 4K. Mijn totale budget is 1500 euro.";
	console.log("\n[Gebruiker input]:", prompt);

	console.log("\n[Stap 1] Parsen via Structured Outputs & Zod...");
	const wishes = await parseUserWishes(prompt);
	console.log("Parsed JSON (Strict Typings):");
	console.log(JSON.stringify(wishes, null, 2));

	console.log(
		"\n[Stap 2-7] Hardware selecteren, prijs API bellen & budget loop draaien...",
	);
	const selectedGpu = await selectGpuWithBudgetCheck(wishes);

	console.log(
		`\nRESULTAAT: De agent heeft uiteindelijk '${selectedGpu}' geselecteerd.`,
	);
}

runExperiment().catch(console.error);
