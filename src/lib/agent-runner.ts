import type { AgentEvent, HardwareSelection, PerformanceEstimates, ReviewSummary } from "../schemas";
import searchWeb from "../tools/searchWeb";
import { runSelfCorrectionLoop } from "./correction-loop";
import { buildGamePerformanceData, buildValidatedProposal } from "./helpers";
import { analyzeReviews, estimatePerformance, extractBudget, selectCoreHardware } from "./llm-calls";
import { logger } from "./logger";

export async function runAgent(userPrompt: string, onEvent: (event: AgentEvent) => void): Promise<void> {
	function emit(event: AgentEvent) {
		logger.info("Emitting event:", event);
		onEvent(event);
	}

	logger.info("Agent started with prompt:", userPrompt);

	const stepCounter = { current: 0 };

	emit({
		type: "step",
		step: { icon: "check", title: `Stap ${++stepCounter.current}: Wensen Analyseren`, text: "Bezig met het analyseren van jouw budget..." },
	});
	logger.debug("Budget analysis started.");

	let budget: number;
	try {
		budget = await extractBudget(userPrompt);
		logger.info("Budget extracted:", budget);
	} catch (err) {
		logger.error("Error occurred while extracting budget:", err);
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

	logger.debug("Hardware selection started.");

	emit({
		type: "step",
		step: { icon: "cpu", title: `Stap ${++stepCounter.current}: Core Hardware`, text: "Bezig met selecteren van CPU en GPU..." },
	});

	logger.debug("Selecting core hardware.");

	let hardware: HardwareSelection;
	try {
		hardware = await selectCoreHardware(userPrompt, budget);
		logger.info("Hardware selected:", hardware);
	} catch (err) {
		logger.error("Error occurred while selecting core hardware:", err);
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


	logger.debug("Entering self-correction loop.");
	const loopResult = await runSelfCorrectionLoop(hardware, budget, emit, stepCounter);
	if (loopResult === null) {
		logger.error("Self-correction loop did not return a result, proceeding with existing hardware and budget.");
		return
	};
	hardware = loopResult.hardware;
	const finalPriceQuote = loopResult.priceQuote; // Retrieved directly from the loop

	logger.info("Self-correction loop completed. Final hardware:", hardware, "Final price quote:", finalPriceQuote);
	logger.info("Final price quote:", finalPriceQuote);


	emit({
		type: "step",
		step: { icon: "rotate", title: `Stap ${++stepCounter.current}: Reviews Analyseren`, text: "Bezig met analyse van expert- en gebruikersreviews..." },
	});

	let reviewSummary: ReviewSummary;
	try {
		logger.debug("Starting review search and analysis.");
		const reviewSearch = await searchWeb.execute({
			queries: [`${hardware.cpu.name} review`, `${hardware.gpu.name} review ervaringen`],
		});
		reviewSummary = await analyzeReviews(hardware, reviewSearch);
		logger.info("Review analysis completed:", reviewSummary);
	} catch (err) {
		logger.error("Error occurred while analyzing reviews:", err);
		reviewSummary = await analyzeReviews(hardware, "Geen zoekresultaten beschikbaar. Gebruik je kennis van hardware reviews.");
	}

	emit({ type: "review", review: { sentiment: reviewSummary.sentiment, text: reviewSummary.summary } });

	emit({
		type: "step",
		step: { icon: "cpu", title: `Stap ${++stepCounter.current}: Prestaties Schatten`, text: "Bezig met schatten van game prestaties..." },
	});

	let performanceEstimates: PerformanceEstimates;
	try {
		logger.debug("Starting performance estimation.");
		performanceEstimates = await estimatePerformance(hardware, userPrompt);
		logger.info("Performance estimates calculated:", performanceEstimates);
	} catch (err) {
		logger.error("Error occurred while estimating performance:", err);
		emit({ type: "error", message: `Fout bij performance schatting: ${err instanceof Error ? err.message : String(err)}` });
		return;
	}

	const gamePerformanceData = buildGamePerformanceData(performanceEstimates);
	emit({ type: "performance", games: gamePerformanceData });

	// No more redundant searching here!
	const validatedProposal = buildValidatedProposal(hardware, finalPriceQuote, budget);
	logger.info("Validated proposal built:", validatedProposal);
	emit({ type: "proposal", data: validatedProposal });

	emit({ type: "complete" });
	logger.info("Agent run completed successfully.");
}
