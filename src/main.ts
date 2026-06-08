import OpenAI from "openai";
import config from "./config";

const openai = new OpenAI({
	baseURL: config.OPENAI_BASE_URL,
	apiKey: config.OPENAI_API_KEY,
});

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

		if (responseMessage.tool_calls) {
			for (const toolCall of responseMessage.tool_calls) {
				if (toolCall.type === "function" && toolCall.function.name === "get_component_price") {
					const args = JSON.parse(toolCall.function.arguments);

					const price = getComponentPrice(args.componentName);
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

	const prompt = "Ik wil graag een PC bouwen om Cyberpunk 2077 en Starfield op te spelen in 4K. Mijn totale budget is 1500 euro.";
	console.log("\n[Gebruiker input]:", prompt);

	console.log("\n[Stap 1] Hardware selecteren, prijs API bellen & budget loop draaien...");
	const result = await selectGpuWithBudgetCheck(prompt);

	console.log(`\nRESULTAAT:\n${result}`);
}

runExperiment().catch(console.error);
