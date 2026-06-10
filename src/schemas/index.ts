import { z } from "zod";

export const HardwareComponentSchema = z.object({
	name: z.string(),
	socket: z.string().nullable().describe("CPU socket (e.g. AM5, LGA1700) — CPU and motherboard only"),
	tdp: z.number().nullable().describe("Thermal Design Power in watts"),
	formFactor: z.string().nullable().describe("Form factor (e.g. ATX, mATX) — motherboard and case only"),
	maxGpuLength: z.number().nullable().describe("Max GPU clearance in mm — case only"),
	type: z.string().nullable().describe("RAM type (DDR4/DDR5) or storage type (M.2 NVMe, SATA SSD)"),
	capacity: z.string().nullable().describe("Capacity (e.g. 32GB, 2TB) — RAM and storage only"),
	wattage: z.number().nullable().describe("Wattage rating — PSU only"),
});
export type HardwareComponent = z.infer<typeof HardwareComponentSchema>;

export const HardwareSelectionSchema = z.object({
	cpu: HardwareComponentSchema,
	gpu: HardwareComponentSchema,
	motherboard: HardwareComponentSchema,
	ram: HardwareComponentSchema,
	storage: HardwareComponentSchema,
	cooler: HardwareComponentSchema,
	psu: HardwareComponentSchema,
	case: HardwareComponentSchema,
});
export type HardwareSelection = z.infer<typeof HardwareSelectionSchema>;

export const ReviewSummarySchema = z.object({
	sentiment: z.string().describe("Overall expert sentiment, e.g. 'Overwegend Positief'"),
	summary: z.string().describe("Concise summary of expert and user reviews for the selected parts"),
});
export type ReviewSummary = z.infer<typeof ReviewSummarySchema>;

export const GameFpsEstimateSchema = z.object({
	name: z.string(),
	fps: z.number().describe("Estimated average FPS"),
	settings: z.string().describe("Resolution and quality settings used for the estimate"),
});
export type GameFpsEstimate = z.infer<typeof GameFpsEstimateSchema>;

export const PerformanceEstimatesSchema = z.object({
	games: z.array(GameFpsEstimateSchema),
});
export type PerformanceEstimates = z.infer<typeof PerformanceEstimatesSchema>;

export const PriceQuoteSchema = z.object({
	parts: z.array(
		z.object({
			name: z.string().describe("Component name"),
			price: z.number().describe("Price in euros"),
			url: z.string().nullable().describe("Purchase URL if available in the search results"),
		}),
	),
});
export type PriceQuote = z.infer<typeof PriceQuoteSchema>;

export const BudgetExtractionSchema = z.object({
	budget: z.number().describe("Total budget in euros — if the user doesn't specify, estimate a reasonable amount based on the requested games and resolution"),
});

export type AgentEvent =
	| {
			type: "step";
			step: {
				icon: "check" | "cpu" | "alert" | "rotate";
				title: string;
				text: string;
				badge?: { color: string; text: string };
				lineVariant?: "solid";
			};
	  }
	| {
			type: "proposal";
			data: {
				partsList: { type: string; color: string; name: string; price: string; url: string | null }[];
				totalPrice: string;
				budgetPercentage: number;
				budgetRemaining: string;
			};
	  }
	| {
			type: "performance";
			games: { name: string; fps: string; value: number; color: string; fpsColor: string }[];
	  }
	| {
			type: "review";
			review: { sentiment: string; text: string };
	  }
	| { type: "complete" }
	| { type: "error"; message: string };
