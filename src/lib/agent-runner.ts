import type { AgentEvent, HardwareSelection, PerformanceEstimates, ReviewSummary } from "../schemas";
import searchWeb from "../tools/searchWeb";
import { runSelfCorrectionLoop } from "./correction-loop";
import { buildGamePerformanceData, buildValidatedProposal } from "./helpers";
import { analyzeReviews, estimatePerformance, extractBudget, selectCoreHardware } from "./llm-calls";

export async function runAgent(userPrompt: string, onEvent: (event: AgentEvent) => void): Promise<void> {
	function emit(event: AgentEvent) {
		onEvent(event);
	}

	const stepCounter = { current: 0 };

	emit({
		type: "step",
		step: { icon: "check", title: `Stap ${++stepCounter.current}: Wensen Analyseren`, text: "Bezig met het analyseren van jouw budget..." },
	});

	let budget: number;
	try {
		budget = await extractBudget(userPrompt);
	} catch (err) {
		emit({ type: "error", message: `Fout bij budget analyse: ${err instanceof Error ? err.message : String(err)}` });
		return;
	}

	emit({
		type: "step",
		step: {
			icon: "check",
			title: `Stap ${stepCounter.current}: Wensen Analyseren`,
			text: `Budget vastgesteld: €${budget}.`,
		},
	});

	emit({
		type: "step",
		step: { icon: "cpu", title: `Stap ${++stepCounter.current}: Core Hardware`, text: "Bezig met selecteren van CPU en GPU..." },
	});

	let hardware: HardwareSelection;
	try {
		hardware = await selectCoreHardware(userPrompt);
	} catch (err) {
		emit({ type: "error", message: `Fout bij hardware selectie: ${err instanceof Error ? err.message : String(err)}` });
		return;
	}

	emit({
		type: "step",
		step: {
			icon: "cpu",
			title: `Stap ${stepCounter.current}: Core Hardware`,
			text: `Geselecteerd: ${hardware.cpu.name} + ${hardware.gpu.name}. Conceptonderdelen toegevoegd.`,
		},
	});

	const loopResult = await runSelfCorrectionLoop(hardware, budget, emit, stepCounter);
	if (loopResult === null) return;
	hardware = loopResult.hardware;
	const finalPriceQuote = loopResult.priceQuote; // Retrieved directly from the loop

	emit({
		type: "step",
		step: { icon: "rotate", title: `Stap ${++stepCounter.current}: Reviews Analyseren`, text: "Bezig met analyse van expert- en gebruikersreviews..." },
	});

	let reviewSummary: ReviewSummary;
	try {
		const reviewSearch = await searchWeb.execute({
			queries: [`${hardware.cpu.name} review`, `${hardware.gpu.name} review ervaringen`],
		});
		reviewSummary = await analyzeReviews(hardware, reviewSearch);
	} catch (err) {
		console.error("[Agent] Review search failed, using LLM knowledge:", err);
		reviewSummary = await analyzeReviews(hardware, "Geen zoekresultaten beschikbaar. Gebruik je kennis van hardware reviews.");
	}

	emit({ type: "review", review: { sentiment: reviewSummary.sentiment, text: reviewSummary.summary } });

	emit({
		type: "step",
		step: { icon: "cpu", title: `Stap ${++stepCounter.current}: Prestaties Schatten`, text: "Bezig met schatten van game prestaties..." },
	});

	let performanceEstimates: PerformanceEstimates;
	try {
		performanceEstimates = await estimatePerformance(hardware, userPrompt);
	} catch (err) {
		emit({ type: "error", message: `Fout bij performance schatting: ${err instanceof Error ? err.message : String(err)}` });
		return;
	}

	const gamePerformanceData = buildGamePerformanceData(performanceEstimates);
	emit({ type: "performance", games: gamePerformanceData });

	// No more redundant searching here!
	const validatedProposal = buildValidatedProposal(hardware, finalPriceQuote, budget);
	emit({ type: "proposal", data: validatedProposal });

	emit({ type: "complete" });
}
