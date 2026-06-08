import { z } from "zod";

export const BadgeSchema = z.object({
	color: z.string(),
	text: z.string(),
});
export type Badge = z.infer<typeof BadgeSchema>;

export const TimelineStepSchema = z.object({
	icon: z.enum(["check", "cpu", "alert", "rotate"]),
	title: z.string(),
	text: z.string(),
	badge: BadgeSchema.optional(),
	lineVariant: z.enum(["solid"]).optional(),
});
export type TimelineStep = z.infer<typeof TimelineStepSchema>;

export const GamePerformanceDataSchema = z.object({
	name: z.string(),
	fps: z.string(),
	value: z.number(),
	color: z.string(),
	fpsColor: z.string(),
});
export type GamePerformanceData = z.infer<typeof GamePerformanceDataSchema>;

export const ExpertReviewSchema = z.object({
	sentiment: z.string(),
	text: z.string(),
});
export type ExpertReview = z.infer<typeof ExpertReviewSchema>;

export const PartDataSchema = z.object({
	type: z.string(),
	color: z.string(),
	name: z.string(),
	price: z.string(),
	shop: z.string(),
});
export type PartData = z.infer<typeof PartDataSchema>;

export const ValidatedProposalDataSchema = z.object({
	partsList: z.array(PartDataSchema),
	totalPrice: z.string(),
	budgetPercentage: z.number(),
	budgetRemaining: z.string(),
});
export type ValidatedProposalData = z.infer<typeof ValidatedProposalDataSchema>;

export const PageDataSchema = z.object({
	timelineSteps: z.array(TimelineStepSchema),
	gamePerformanceData: z.array(GamePerformanceDataSchema),
	expertReview: ExpertReviewSchema,
	validatedProposal: ValidatedProposalDataSchema,
});
export type PageData = z.infer<typeof PageDataSchema>;
