import type { HardwareSelection } from "../schemas";

export interface CompatibilityIssue {
	component: string;
	message: string;
}

export interface CompatibilityResult {
	compatible: boolean;
	issues: CompatibilityIssue[];
}

export function checkCompatibility(hardware: HardwareSelection): CompatibilityResult {
	const issues: CompatibilityIssue[] = [];

	const cpuTdp = hardware.cpu.tdp ?? 0;
	const gpuTdp = hardware.gpu.tdp ?? 0;
	const psuWattage = hardware.psu.wattage ?? 0;
	const requiredWattage = cpuTdp + gpuTdp + 100;

	if (psuWattage > 0 && requiredWattage > psuWattage) {
		issues.push({
			component: "PSU",
			message: `TDP-overschrijding: CPU (${cpuTdp}W) + GPU (${gpuTdp}W) + 100W marge = ${requiredWattage}W, maar PSU levert slechts ${psuWattage}W.`,
		});
	}

	const cpuSocket = hardware.cpu.socket;
	const moboSocket = hardware.motherboard.socket;
	if (cpuSocket && moboSocket && cpuSocket !== moboSocket) {
		issues.push({
			component: "CPU/MoBo",
			message: `Socket-mismatch: CPU gebruikt ${cpuSocket}, maar moederbord heeft ${moboSocket}.`,
		});
	}

	const moboFormFactor = hardware.motherboard.formFactor?.toUpperCase();
	const caseFormFactor = hardware.case.formFactor?.toUpperCase();

	if (moboFormFactor && caseFormFactor) {
		if (!formFactorFits(moboFormFactor, caseFormFactor)) {
			issues.push({
				component: "MoBo/Case",
				message: `Form-factor mismatch: ${moboFormFactor} moederbord past niet in ${caseFormFactor} behuizing.`,
			});
		}
	}

	const gpuLength = extractGpuLength(hardware.gpu.name);
	const caseMaxGpu = hardware.case.maxGpuLength;
	if (gpuLength && caseMaxGpu && gpuLength > caseMaxGpu) {
		issues.push({
			component: "GPU/Case",
			message: `GPU-lengte (${gpuLength}mm) past niet in behuizing (max ${caseMaxGpu}mm).`,
		});
	}

	const ramType = hardware.ram.type?.toUpperCase();
	const moboName = hardware.motherboard.name.toUpperCase();
	if (ramType === "DDR4" && moboName.includes("DDR5")) {
		issues.push({
			component: "RAM/MoBo",
			message: `RAM-type ${ramType} wordt niet ondersteund door dit DDR5-moederbord.`,
		});
	}
	if (ramType === "DDR5" && moboName.includes("DDR4") && !moboName.includes("DDR5")) {
		issues.push({
			component: "RAM/MoBo",
			message: `RAM-type ${ramType} wordt niet ondersteund door dit DDR4-moederbord.`,
		});
	}

	return {
		compatible: issues.length === 0,
		issues,
	};
}

function formFactorFits(mobo: string, caseFf: string): boolean {
	const hierarchy: Record<string, number> = {
		"MINI-ITX": 1,
		"MINI ITX": 1,
		MINI_ITX: 1,
		MATX: 2,
		"MICRO-ATX": 2,
		"MICRO ATX": 2,
		ATX: 3,
		"E-ATX": 4,
	};

	const moboRank = hierarchy[mobo] ?? 3;
	const caseRank = hierarchy[caseFf] ?? 3;

	return moboRank <= caseRank;
}

function extractGpuLength(gpuName: string): number | null {
	const name = gpuName.toLowerCase();

	if (name.includes("4090")) return 304;
	if (name.includes("4080")) return 310;
	if (name.includes("4070 ti") || name.includes("4070ti")) return 305;
	if (name.includes("4070")) return 267;
	if (name.includes("4060 ti") || name.includes("4060ti")) return 250;
	if (name.includes("4060")) return 244;
	if (name.includes("7900 xtx") || name.includes("7900xtx")) return 287;
	if (name.includes("7900 xt") || name.includes("7900xt")) return 276;
	if (name.includes("7800 xt") || name.includes("7800xt")) return 267;
	if (name.includes("7700 xt") || name.includes("7700xt")) return 280;
	if (name.includes("7600")) return 240;

	if (name.includes("triple") || name.includes("gaming oc")) return 300;

	return null;
}

export function calculateTotalPrice(prices: { price: number }[]): number {
	return prices.reduce((sum, p) => sum + p.price, 0);
}

export function calculateBudgetMetrics(totalPrice: number, budget: number) {
	const percentage = Math.round((totalPrice / budget) * 100);
	const remaining = budget - totalPrice;
	return { percentage, remaining };
}

export function isWithinBudget(totalPrice: number, budget: number): boolean {
	return totalPrice <= budget * 1.05;
}
