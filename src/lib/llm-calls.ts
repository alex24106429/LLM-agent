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

export async function selectCoreHardware(prompt: string, budget?: number): Promise<HardwareSelection> {
	const budgetGuidance = budget
		? `\n\nBUDGET: €${budget} — ALLE onderdelen moeten binnen dit budget passen (inclusief verzendkosten).\n` +
			`- Als budget < €500: kies een DDR4-platform (AM4/LGA1700), 8GB DDR4, een goedkope M.2 SSD (<+512GB), en een budget PSU/case.\n` +
			`- Als budget €500-€800: overweeg 16 GB DDR5 maar bezuinig op CPU/GPU.\n` +
			`- Als budget < €400: overweeg een build met tweedehands componenten of een APU (geen losse GPU) om binnen budget te blijven.\n` +
			`- Houd €50-€100 over voor een behuizing, voeding en koeler.\n` +
			`- Het totaal van ALLE componenten mag niet boven €${budget} uitkomen.\n`
		: "\n";

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
					"- Kies voldoende en snel RAM (16GB DDR5 aanbevolen voor gaming), maar voor budget-builds 16GB DDR4.\n" +
					"- Kies een snelle M.2 NVMe SSD (minimaal 1TB), maar voor budget-builds 256-512GB.\n" +
					"- Kies een betrouwbare voeding met voldoende wattage (CPU TDP + GPU TDP + 100W marge).\n" +
					"- Kies een behuizing die past bij het moederbord form-factor en de GPU-lengte.\n" +
					"- Kies een goede luchtkoeler of AIO die past bij de CPU.\n" +
					"- Gebruik actuele, realistische onderdelen uit 2025-2026.\n" +
					"- Vul voor elk onderdeel zoveel mogelijk velden in (socket, tdp, formFactor, wattage, type, capacity).\n" +
					budgetGuidance +
					resources,
			},
			{
				role: "user",
				content: `Gebruikerswensen:\n${prompt}`,
			},
		],
		response_format: structuredOutputFormat("hardware_selection", HardwareSelectionSchema),
		reasoning_effort: "medium",
		temperature: 0.4,
	});

	const content = response.choices[0].message.content;
	if (!content) throw new Error("Geen response van LLM bij hardware selectie");
	return JSON.parse(content) as HardwareSelection;
}

export async function selectCheaperHardware(budget: number, currentHw: HardwareSelection, overshoot: number): Promise<HardwareSelection> {
	const urgencyLevel = overshoot > budget * 0.5 ? "CRITICAL" : overshoot > budget * 0.25 ? "HIGH" : "MODERATE";

	const aggressivePrompt =
		urgencyLevel === "CRITICAL"
			? "Dit ontwerp is VEEL TE DUUR. Je moet drastisch bezuinigen:\n" +
				"- Kies een APU (CPU met ingebouwde grafische chip, zoals AMD Ryzen 5 8600G / Ryzen 5 5600G) — GEEN losse GPU.\n" +
				"- Of kies een goedkope tweedehands GPU (€50-€100) en budget-CPU zoals Intel i3-12100F of AMD Ryzen 5 4500.\n" +
				"- Gebruik DDR4-platform (AM4 of LGA1700) met 16 GB of zelfs 8 GB DDR4.\n" +
				"- Gebruik een 256GB of 512GB M.2 SSD, geen 1TB.\n" +
				"- Kies de goedkoopste compatibele behuizing, voeding (400-500W) en koeler.\n"
			: urgencyLevel === "HIGH"
				? "Dit ontwerp is te duur. Bezuinig substantieel:\n" +
					"- Downgrade de GPU naar een goedkoper model (minstens 2 niveaus lager).\n" +
					"- Als het budget < €500: overweeg DDR4-platform en 8GB DDR4.\n" +
					"- Kies een goedkopere behuizing, 500W-voeding en budget luchtkoeler.\n" +
					"- Verklein SSD naar 256GB of 512GB of 1TB zonder DRAM.\n"
				: "Kies iets goedkopere alternatieven voor de duurste componenten.\n";

	const response = await getOpenAI().chat.completions.create({
		model: config.OPENAI_MODEL,
		messages: [
			{
				role: "system",
				content:
					"Je bent een PC-builder expert. Het huidige ontwerp is te duur. Selecteer goedkopere alternatieven om binnen het budget te blijven. " +
					`Datum: ${new Date().toString()}\n` +
					aggressivePrompt +
					"Behoud dezelfde CPU-socket voor compatibiliteit tenzij je ook de CPU wijzigt.\n" +
					"Het is absoluut noodzakelijk dat het totaal van ALLE componenten onder €" +
					budget +
					" blijft!\n" +
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
