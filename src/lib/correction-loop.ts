import type { AgentEvent, HardwareSelection, PriceQuote } from "../schemas";
import searchMegekko from "../tools/searchMegekko";
import { calculateTotalPrice, checkCompatibility, isWithinBudget } from "./compatibility";
import { buildSearchQueries, formatPrice } from "./helpers";
import { extractPricesFromSearch, fixCompatibilityHw, selectCheaperHardware } from "./llm-calls";

const MAX_LOOP_ATTEMPTS = 3;
const MIN_PRICE_REDUCTION_RATIO = 0.1;

export async function runSelfCorrectionLoop(
	hardware: HardwareSelection,
	budget: number,
	emit: (event: AgentEvent) => void,
	stepCounter: { current: number },
): Promise<{ hardware: HardwareSelection; priceQuote: PriceQuote } | null> {
	let priceQuote: PriceQuote | null = null;
	let previousTotalPrice = Infinity;

	for (let attempt = 0; attempt < MAX_LOOP_ATTEMPTS; attempt++) {
		const priceStepTitle = `Stap ${++stepCounter.current}: Prijzen Zoeken`;
		emit({
			type: "step",
			step: { icon: "rotate", title: priceStepTitle, text: "Bezig met zoeken naar de beste prijzen..." },
		});

		try {
			const searchQueries = buildSearchQueries(hardware);

			const searchPromises = searchQueries.map((query) => searchMegekko.execute({ query }));
			const searchResults = await Promise.all(searchPromises);

			const searchResultStr = searchResults.join("\n\n");

			priceQuote = await extractPricesFromSearch(hardware, searchResultStr);
		} catch (err) {
			console.error("[Agent] Zoekopdracht mislukt, gebruik LLM-kennis voor prijzen:", err);
			priceQuote = await extractPricesFromSearch(hardware, "Geen zoekresultaten beschikbaar. Gebruik je kennis van marktprijzen.");
		}

		const totalPrice = calculateTotalPrice(priceQuote.parts);
		const withinBudget = isWithinBudget(totalPrice, budget);
		const budgetOvershoot = totalPrice - budget;

		// Update the price search step with results (same title, no increment)
		emit({
			type: "step",
			step: {
				icon: "rotate",
				title: priceStepTitle,
				text: `Prijzen opgezocht. Totale systeemwaarde: ${formatPrice(totalPrice)}.`,
			},
		});

		// Check if we're making meaningful progress
		const priceReduction = previousTotalPrice - totalPrice;
		const reductionRatio = previousTotalPrice === Infinity ? 1 : priceReduction / previousTotalPrice;
		const progressIsStalling = attempt > 0 && reductionRatio < MIN_PRICE_REDUCTION_RATIO && !withinBudget;

		if (!withinBudget && attempt < MAX_LOOP_ATTEMPTS - 1 && !progressIsStalling) {
			emit({
				type: "step",
				step: {
					icon: "alert",
					title: `Stap ${++stepCounter.current}: Budgetcontrole`,
					text: `Overschrijding budget (€${budget}) gedetecteerd met ${formatPrice(budgetOvershoot)}.`,
					badge: { color: "red", text: "Fout herstellen via feedbackloop..." },
					lineVariant: "solid",
				},
			});

			emit({
				type: "step",
				step: {
					icon: "rotate",
					title: `Stap ${++stepCounter.current}: Herstelactie Loop`,
					text: "Hardware heroverwogen. Goedkopere alternatieven worden geselecteerd...",
					badge: { color: "orange", text: "Budget herstel actief..." },
				},
			});

			try {
				hardware = await selectCheaperHardware(budget, hardware, budgetOvershoot);
			} catch (err) {
				emit({ type: "error", message: `Fout bij budget herstel: ${err instanceof Error ? err.message : String(err)}` });
				return null;
			}
			previousTotalPrice = totalPrice;
			continue;
		}

		// If progress is stalling and still over budget, emit a warning but try one last compatibility check
		if (progressIsStalling) {
			emit({
				type: "step",
				step: {
					icon: "alert",
					title: `Stap ${++stepCounter.current}: Budgetlimiet`,
					text: `Het budget (€${budget}) is te laag voor de gewenste prestaties. Laagst haalbare prijs: ${formatPrice(totalPrice)}. Hardware wordt toch voorgesteld.`,
					badge: { color: "yellow", text: "Budget te laag — beste poging" },
					lineVariant: "solid",
				},
			});
			// Fall through to compatibility check and return best-effort result
		}

		const compatResult = checkCompatibility(hardware);

		if (!compatResult.compatible && attempt < MAX_LOOP_ATTEMPTS - 1) {
			emit({
				type: "step",
				step: {
					icon: "alert",
					title: `Stap ${++stepCounter.current}: Compatibiliteitsprobleem`,
					text: compatResult.issues.map((i) => `${i.component}: ${i.message}`).join("\n"),
					badge: { color: "red", text: "Herstellen..." },
					lineVariant: "solid",
				},
			});

			try {
				hardware = await fixCompatibilityHw(
					hardware,
					compatResult.issues.map((i) => i.message),
				);
			} catch (err) {
				emit({ type: "error", message: `Fout bij compatibiliteit herstel: ${err instanceof Error ? err.message : String(err)}` });
				return null;
			}
			continue;
		}

		emit({
			type: "step",
			step: {
				icon: "check",
				title: `Stap ${++stepCounter.current}: Compatibiliteitstest`,
				text: compatResult.compatible
					? `TDP check (${(hardware.cpu.tdp ?? 0) + (hardware.gpu.tdp ?? 0)}W + 100W marge vs ${hardware.psu.wattage ?? "?"}W PSU): OK. Socket ${hardware.cpu.socket ?? "?"}: OK. Form-factor: OK.`
					: `Niet alle compatibiliteitschecks konden worden opgelost, maar we gaan door met de beste selectie.`,
			},
		});

		if (withinBudget) {
			emit({
				type: "step",
				step: {
					icon: "check",
					title: `Stap ${++stepCounter.current}: Budget Check`,
					text: `Budget status: OK (${formatPrice(totalPrice)} / €${budget})`,
					badge: { color: "green", text: "Binnen budget" },
				},
			});
		}
		break;
	}

	return priceQuote ? { hardware, priceQuote } : null;
}
