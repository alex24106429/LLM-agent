import resources from "@/resources";
import config from "../config";
import type { HardwareSelection, PerformanceEstimates, PriceQuote, ReviewSummary } from "../schemas";
import { BudgetExtractionSchema, HardwareSelectionSchema, PerformanceEstimatesSchema, PriceQuoteSchema, ReviewSummarySchema } from "../schemas/index";
import { hardwareToSummaryText, structuredOutputFormat } from "./helpers";
import { getOpenAI } from "./openai";

export async function extractBudget(prompt: string): Promise<number> {
	const response = await getOpenAI().chat.completions.create({
		model: config.OPENAI_MODEL,
		messages: [
			{
				role: "system",
				content:
					"Je bent een PC-builder assistent. Extraheer alleen het budget uit de wensen van de gebruiker. " +
					"Als de gebruiker geen expliciet budget noemt, schat dan een redelijk budget op basis van de games en resolutie die genoemd worden.",
			},
			{ role: "user", content: prompt },
		],
		response_format: structuredOutputFormat("budget_extraction", BudgetExtractionSchema),
		temperature: 0.1,
	});

	const content = response.choices[0].message.content;
	if (!content) throw new Error("Geen response van LLM bij budget extractie");
	const parsed = JSON.parse(content) as { budget: number };
	return parsed.budget;
}

export async function selectCoreHardware(prompt: string): Promise<HardwareSelection> {
	const response = await getOpenAI().chat.completions.create({
		model: config.OPENAI_MODEL,
		messages: [
			{
				role: "system",
				content:
					"Je bent een PC-builder expert. Selecteer ALLE componenten voor een complete PC op basis van de wensen van de gebruiker. " +
					`Datum: ${new Date().toString()}\n` +
					"Regels:\n" +
					"- Kies een CPU en GPU die goed bij de gewenste games en resolutie passen.\n" +
					"- De GPU mag maximaal 45% van het totale budget kosten.\n" +
					"- Kies een compatibel moederbord (juiste socket voor de CPU).\n" +
					"- Kies voldoende en snel RAM (32GB DDR5 aanbevolen voor gaming).\n" +
					"- Kies een snelle M.2 NVMe SSD (minimaal 1TB).\n" +
					"- Kies een betrouwbare voeding met voldoende wattage (CPU TDP + GPU TDP + 100W marge).\n" +
					"- Kies een behuizing die past bij het moederbord form-factor en de GPU-lengte.\n" +
					"- Kies een goede luchtkoeler of AIO die past bij de CPU.\n" +
					"- Gebruik actuele, realistische onderdelen uit 2025-2026.\n" +
					"- Vul voor elk onderdeel zoveel mogelijk velden in (socket, tdp, formFactor, wattage, type, capacity).\n\n" +
					resources,
			},
			{
				role: "user",
				content: `Gebruikerswensen:\n${prompt}`,
			},
		],
		response_format: structuredOutputFormat("hardware_selection", HardwareSelectionSchema),
		reasoning_effort: "high",
		temperature: 0.4,
	});

	const content = response.choices[0].message.content;
	if (!content) throw new Error("Geen response van LLM bij hardware selectie");
	return JSON.parse(content) as HardwareSelection;
}

export async function selectCheaperHardware(budget: number, currentHw: HardwareSelection, overshoot: number): Promise<HardwareSelection> {
	const response = await getOpenAI().chat.completions.create({
		model: config.OPENAI_MODEL,
		messages: [
			{
				role: "system",
				content:
					"Je bent een PC-builder expert. Het huidige ontwerp is te duur. Selecteer goedkopere alternatieven om binnen het budget te blijven. " +
					`Datum: ${new Date().toString()}\n` +
					"Probeer de GPU of het moederbord te downgraden, of kies een goedkopere behuizing/voeding. " +
					"Behoud dezelfde CPU-socket voor compatibiliteit tenzij je ook de CPU wijzigt.\n" +
					resources,
			},
			{
				role: "user",
				content: `Budget: €${budget}, Overschrijding: €${overshoot}\n` + `Huidige selectie:\n${hardwareToSummaryText(currentHw)}`,
			},
		],
		response_format: structuredOutputFormat("hardware_selection", HardwareSelectionSchema),
		reasoning_effort: "medium",
		temperature: 0.3,
	});

	const content = response.choices[0].message.content;
	if (!content) throw new Error("Geen response van LLM bij goedkopere hardware selectie");
	return JSON.parse(content) as HardwareSelection;
}

export async function fixCompatibilityHw(currentHw: HardwareSelection, issues: string[]): Promise<HardwareSelection> {
	const response = await getOpenAI().chat.completions.create({
		model: config.OPENAI_MODEL,
		messages: [
			{
				role: "system",
				content:
					"Je bent een PC-builder expert. Er zijn compatibiliteitsproblemen met het huidige ontwerp. " +
					"Los deze op door incompatibele onderdelen te vervangen. Behoud zoveel mogelijk van de oorspronkelijke selectie.",
			},
			{
				role: "user",
				content: `Compatibiliteitsproblemen:\n${issues.join("\n")}\n\n` + `Huidige selectie:\n${hardwareToSummaryText(currentHw)}`,
			},
		],
		response_format: structuredOutputFormat("hardware_selection", HardwareSelectionSchema),
		temperature: 0.3,
	});

	const content = response.choices[0].message.content;
	if (!content) throw new Error("Geen response van LLM bij compatibiliteit fix");
	return JSON.parse(content) as HardwareSelection;
}

export async function extractPricesFromSearch(hardware: HardwareSelection, searchResults: string): Promise<PriceQuote> {
	const response = await getOpenAI().chat.completions.create({
		model: config.OPENAI_MODEL,
		messages: [
			{
				role: "system",
				content:
					"Je bent een prijsanalist. Uit de volgende zoekresultaten, extraheer je de laagste prijs voor elk PC-onderdeel. " +
					"Als je geen prijs voor een onderdeel kunt vinden, schat dan een realistische marktprijs op basis van je kennis. " +
					`Datum: ${new Date().toString()}\n` +
					"Geef voor elk onderdeel een aparte prijsopgave.\n" +
					resources,
			},
			{
				role: "user",
				content: `Te zoeken onderdelen:\n${hardwareToSummaryText(hardware)}\n\n` + `Zoekresultaten:\n${searchResults}`,
			},
		],
		response_format: structuredOutputFormat("price_quote", PriceQuoteSchema),
		reasoning_effort: "medium",
		temperature: 0.2,
	});

	const content = response.choices[0].message.content;
	if (!content) throw new Error("Geen response van LLM bij prijs extractie");
	return JSON.parse(content) as PriceQuote;
}

export async function estimatePerformance(hardware: HardwareSelection, userPrompt: string): Promise<PerformanceEstimates> {
	const response = await getOpenAI().chat.completions.create({
		model: config.OPENAI_MODEL,
		messages: [
			{
				role: "system",
				content:
					"Je bent een hardware benchmark expert. Schat de gemiddelde FPS voor de opgegeven games met de geselecteerde hardware. " +
					"Baseer je schattingen op realistische benchmark data. Geef voor elke game de verwachte FPS en de gebruikte settings (resolutie + quality preset). " +
					"Haal de lijst met games en de gewenste resolutie uit de gebruikerswensen.",
			},
			{
				role: "user",
				content: `Hardware:\n${hardwareToSummaryText(hardware)}\n\n` + `Gebruikerswensen:\n${userPrompt}`,
			},
		],
		response_format: structuredOutputFormat("performance_estimates", PerformanceEstimatesSchema),
		temperature: 0.3,
	});

	const content = response.choices[0].message.content;
	if (!content) throw new Error("Geen response van LLM bij performance schatting");
	return JSON.parse(content) as PerformanceEstimates;
}

export async function analyzeReviews(hardware: HardwareSelection, searchResults: string): Promise<ReviewSummary> {
	const response = await getOpenAI().chat.completions.create({
		model: config.OPENAI_MODEL,
		messages: [
			{
				role: "system",
				content:
					"Je bent een hardware reviewer. Vat de expert- en gebruikersreviews van de belangrijkste componenten (CPU en GPU) samen. " +
					"Geef een sentiment (bijv. 'Overwegend Positief', 'Gemengd', 'Zeer Positief') en een korte samenvatting van de belangrijkste punten.",
			},
			{
				role: "user",
				content: `Hardware:\nCPU: ${hardware.cpu.name}\nGPU: ${hardware.gpu.name}\n\n` + `Recente reviews en ervaringen:\n${searchResults}`,
			},
		],
		response_format: structuredOutputFormat("review_summary", ReviewSummarySchema),
		temperature: 0.4,
	});

	const content = response.choices[0].message.content;
	if (!content) throw new Error("Geen response van LLM bij review analyse");
	return JSON.parse(content) as ReviewSummary;
}
