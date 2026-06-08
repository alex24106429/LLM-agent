"use client";

import { Container, Grid, Group, MantineProvider, Stack, Title } from "@mantine/core";
import AgentReasoningCard, { type TimelineStep } from "@/components/AgentReasoningCard";
import type { GamePerformanceData } from "@/components/GamePerformanceBar";
import PerformanceReportCard, { type ExpertReview } from "@/components/PerformanceReportCard";
import UserRequirementsCard from "@/components/UserRequirementsCard";
import ValidatedProposalCard, { type ValidatedProposalData } from "@/components/ValidatedProposalCard";

const timelineSteps: TimelineStep[] = [
	{
		icon: "check",
		title: "Stap 1: Wensen Analyzeren",
		text: "Wensen: Budget: €1200, Resolutie: 1440p, Games: CP2077 (Zwaar), CS2 (Licht).",
	},
	{
		icon: "cpu",
		title: "Stap 2 & 3: Core Hardware Concept",
		text: "Geselecteerd: AMD Ryzen 5 7600 + Nvidia RTX 4070. Conceptonderdelen toegevoegd (32GB DDR5, B650M, 650W PSU).",
	},
	{
		icon: "alert",
		title: "Stap 4 & 7: Prijs & Budgetcontrole",
		text: '"Systeemwaarde: €1258. Overschrijding budget (€1200) gedetecteerd met €58."',
		badge: { color: "red", text: "Fout herstellen via feedbackloop..." },
		lineVariant: "solid",
	},
	{
		icon: "rotate",
		title: "Stap 7: Herstelactie Loop (Zelfcorrectie)",
		text: "GPU heroverwogen. RTX 4070 (€589) vervangen door RX 7800 XT (€509). Nieuwe som: €1165.",
		badge: { color: "green", text: "Budget status: OK (€1165 / €1200)" },
	},
	{
		icon: "check",
		title: "Stap 8: Fysieke Compatibiliteitstest",
		text: "TDP check (430W vs 650W PSU): OK. Case-vrijgave (310mm GPU vs 350mm Case): OK. Socket AM5: OK.",
	},
];

const gamePerformanceData: GamePerformanceData[] = [
	{ name: "Cyberpunk 2077 (1440p High, FSR Off)", fps: "~ 72 FPS", value: 72, color: "green", fpsColor: "green" },
	{ name: "Counter-Strike 2 (1440p High)", fps: "~ 280 FPS", value: 100, color: "teal", fpsColor: "teal" },
];

const expertReview: ExpertReview = {
	sentiment: "Expert Sentiment",
	text: '"De Sapphire Pulse RX 7800 XT wordt geprezen om de uitstekende koeling en stille werking. De behuizing (Pop Mini Silent) sluit goed aan bij de wens voor een compact en stil systeem."',
};

const validatedProposal: ValidatedProposalData = {
	partsList: [
		{ type: "CPU", color: "red", name: "AMD Ryzen 5 7600 (AM5)", price: "€194,00", shop: "Megekko" },
		{ type: "GPU", color: "orange", name: "Sapphire Pulse RX 7800 XT 16GB", price: "€509,00", shop: "Azerty" },
		{ type: "MOBO", color: "yellow", name: "Gigabyte B650M DS3H (mATX)", price: "€132,50", shop: "Amazon.nl" },
		{ type: "RAM", color: "green", name: "Corsair Vengeance 32GB DDR5-6000", price: "€104,90", shop: "Alternate" },
		{ type: "PSU", color: "blue", name: "Corsair RM650 (650W, Gold)", price: "€84,90", shop: "Megekko" },
		{ type: "CASE", color: "grape", name: "Fractal Design Pop Mini Silent", price: "€79,82", shop: "Amazon.nl" },
	],
	totalPrice: "€1.165,12",
	budgetPercentage: 97,
	budgetRemaining: "€34,88",
};

export default function PCBuilderAgentUI() {
	return (
		<MantineProvider>
			<Container size="xl" py="lg">
				<Group justify="space-between" mb="lg">
					<Title>CHASSIS</Title>
				</Group>

				<Grid>
					<Grid.Col span={{ base: 12, md: 5 }}>
						<Stack gap="md">
							<UserRequirementsCard />
							<AgentReasoningCard steps={timelineSteps} activeStep={5} />
						</Stack>
					</Grid.Col>

					<Grid.Col span={{ base: 12, md: 7 }}>
						<Stack gap="md">
							<ValidatedProposalCard data={validatedProposal} />
							<PerformanceReportCard games={gamePerformanceData} expertReview={expertReview} />
						</Stack>
					</Grid.Col>
				</Grid>
			</Container>
		</MantineProvider>
	);
}
