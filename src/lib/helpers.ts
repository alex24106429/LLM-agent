import { zodResponseFormat } from "openai/helpers/zod";
import type { z } from "zod";
import type { GameFpsEstimate, HardwareSelection, PerformanceEstimates, PriceQuote } from "../schemas";
import { calculateBudgetMetrics, calculateTotalPrice } from "./compatibility";

export function structuredOutputFormat(name: string, zodSchema: z.ZodType) {
	return zodResponseFormat(zodSchema, name);
}

export const PART_TYPE_CONFIG: Record<string, { type: string; color: string }> = {
	cpu: { type: "CPU", color: "red" },
	gpu: { type: "GPU", color: "orange" },
	motherboard: { type: "MOBO", color: "yellow" },
	ram: { type: "RAM", color: "green" },
	storage: { type: "SSD", color: "cyan" },
	cooler: { type: "COOLER", color: "blue" },
	psu: { type: "PSU", color: "violet" },
	case: { type: "CASE", color: "grape" },
};

export function formatPrice(price: number): string {
	return `€${price.toFixed(2).replace(".", ",")}`;
}

export function hardwareToSummaryText(hw: HardwareSelection): string {
	const lines = [
		`CPU: ${hw.cpu.name} (${hw.cpu.socket ?? "?"}, ${hw.cpu.tdp ?? "?"}W)`,
		`GPU: ${hw.gpu.name} (${hw.gpu.tdp ?? "?"}W)`,
		`Moederbord: ${hw.motherboard.name} (${hw.motherboard.socket ?? "?"}, ${hw.motherboard.formFactor ?? "?"})`,
		`RAM: ${hw.ram.name} (${hw.ram.type ?? "?"}, ${hw.ram.capacity ?? "?"})`,
		`Opslag: ${hw.storage.name} (${hw.storage.type ?? "?"}, ${hw.storage.capacity ?? "?"})`,
		`Koeler: ${hw.cooler.name}`,
		`PSU: ${hw.psu.name} (${hw.psu.wattage ?? "?"}W)`,
		`Behuizing: ${hw.case.name} (${hw.case.formFactor ?? "?"})`,
	];
	return lines.join("\n");
}

export function findMatchingHardwareKey(partName: string, hw: HardwareSelection): string {
	const nameLower = partName.toLowerCase();
	for (const [key, comp] of Object.entries(hw)) {
		const compLower = comp.name.toLowerCase();

		if (compLower.includes(nameLower) || nameLower.includes(compLower)) {
			return key;
		}

		if (key === "cpu" && (nameLower.includes("ryzen") || nameLower.includes("core i") || nameLower.includes("intel"))) return key;
		if (key === "gpu" && (nameLower.includes("rtx") || nameLower.includes("rx") || nameLower.includes("geforce") || nameLower.includes("radeon") || nameLower.includes("arc"))) return key;
		if (key === "motherboard" && (nameLower.includes("b650") || nameLower.includes("b760") || nameLower.includes("x670") || nameLower.includes("z790") || nameLower.includes("a620"))) return key;
	}
	return "cpu";
}

export function buildValidatedProposal(hardware: HardwareSelection, priceQuote: PriceQuote, budget: number) {
	const partsList = priceQuote.parts.map((p) => {
		const hwKey = findMatchingHardwareKey(p.name, hardware);
		const config = PART_TYPE_CONFIG[hwKey] ?? { type: "PART", color: "gray" };

		return {
			type: config.type,
			color: config.color,
			name: p.name,
			price: formatPrice(p.price),
		};
	});

	const totalPrice = calculateTotalPrice(priceQuote.parts);
	const { percentage, remaining } = calculateBudgetMetrics(totalPrice, budget);

	return {
		partsList,
		totalPrice: formatPrice(totalPrice),
		budgetPercentage: Math.min(percentage, 100),
		budgetRemaining: remaining >= 0 ? `${formatPrice(remaining)} over` : `${formatPrice(Math.abs(remaining))} tekort`,
	};
}

export function buildGamePerformanceData(estimates: PerformanceEstimates) {
	return estimates.games.map((g: GameFpsEstimate) => ({
		name: `${g.name} (${g.settings})`,
		fps: `~ ${g.fps} FPS`,
		value: Math.min(g.fps, 144),
		color: g.fps >= 60 ? "green" : g.fps >= 30 ? "yellow" : "red",
		fpsColor: g.fps >= 60 ? "green" : g.fps >= 30 ? "yellow" : "red",
	}));
}

export function buildSearchQueries(hardware: HardwareSelection): string[] {
	return [
		`${hardware.cpu.name}`,
		`${hardware.gpu.name}`,
		`${hardware.motherboard.name}`,
		`${hardware.ram.name}`,
		`${hardware.storage.name}`,
		`${hardware.psu.name}`,
		`${hardware.case.name}`,
		`${hardware.cooler.name}`,
	];
}
