"use client";

import { Alert, Container, Grid, MantineProvider, Stack, Text, Title } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { Anta } from "next/font/google";
import { useCallback, useState } from "react";
import { cssVariablesResolver, theme } from "../theme";

const antaFont = Anta({ weight: "400", display: "swap", subsets: ["latin"] });

import AgentReasoningCard, { type TimelineStep } from "@/components/AgentReasoningCard";
import type { GamePerformanceData } from "@/components/GamePerformanceBar";
import PerformanceReportCard, { type ExpertReview } from "@/components/PerformanceReportCard";
import UserRequirementsCard from "@/components/UserRequirementsCard";
import ValidatedProposalCard, { type ValidatedProposalData } from "@/components/ValidatedProposalCard";
import type { AgentEvent } from "@/schemas";

export default function PCBuilderAgentUI() {
	const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([]);
	const [isRunning, setIsRunning] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [validatedProposal, setValidatedProposal] = useState<ValidatedProposalData | null>(null);
	const [gamePerformanceData, setGamePerformanceData] = useState<GamePerformanceData[]>([]);
	const [expertReview, setExpertReview] = useState<ExpertReview | null>(null);

	const handleEvent = useCallback((event: AgentEvent) => {
		switch (event.type) {
			case "step":
				setTimelineSteps((prev) => {
					// Replace step at the same index if title matches, otherwise append
					const existingIdx = prev.findIndex((s) => s.title === event.step.title);
					if (existingIdx >= 0) {
						const updated = [...prev];
						updated[existingIdx] = event.step;
						return updated;
					}
					return [...prev, event.step];
				});
				break;
			case "proposal":
				setValidatedProposal(event.data);
				break;
			case "performance":
				setGamePerformanceData(event.games);
				break;
			case "review":
				setExpertReview(event.review);
				break;
			case "error":
				setError(event.message);
				setIsRunning(false);
				break;
			case "complete":
				setIsRunning(false);
				break;
		}
	}, []);

	const handleSubmit = useCallback(
		async (prompt: string) => {
			if (!prompt.trim() || isRunning) return;

			// Reset state
			setTimelineSteps([]);
			setValidatedProposal(null);
			setGamePerformanceData([]);
			setExpertReview(null);
			setError(null);
			setIsRunning(true);

			try {
				const response = await fetch("/api/agent/run", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ prompt }),
				});

				if (!response.ok) {
					const errBody = await response.json().catch(() => ({ error: "Onbekende fout" }));
					setError(errBody.error ?? `HTTP ${response.status}`);
					setIsRunning(false);
					return;
				}

				const reader = response.body?.getReader();
				if (!reader) {
					setError("Geen response body ontvangen");
					setIsRunning(false);
					return;
				}

				const decoder = new TextDecoder();
				let buffer = "";

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n");
					buffer = lines.pop() ?? "";

					for (const line of lines) {
						if (line.startsWith("data: ")) {
							try {
								const event = JSON.parse(line.slice(6)) as AgentEvent;
								handleEvent(event);
							} catch {
								// Skip malformed JSON lines
							}
						}
					}
				}

				// Process remaining buffer
				if (buffer.startsWith("data: ")) {
					try {
						const event = JSON.parse(buffer.slice(6)) as AgentEvent;
						handleEvent(event);
					} catch {
						// Skip
					}
				}

				// Ensure running state is cleared
				setIsRunning(false);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Onbekende netwerkfout");
				setIsRunning(false);
			}
		},
		[isRunning, handleEvent],
	);

	return (
		<MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} defaultColorScheme="auto">
			<Container size="xl" py="lg">
				<Title className={antaFont.className} size={48}>
					CHASSIS
				</Title>
				<Text mb={20}>Computer Hardware Agent for System Selection & Integration Service</Text>

				{error && (
					<Alert icon={<IconAlertCircle size="1rem" />} color="red" variant="light" mb="md" withCloseButton onClose={() => setError(null)}>
						{error}
					</Alert>
				)}

				<Grid>
					<Grid.Col span={{ base: 12, md: 5 }}>
						<Stack gap="md">
							<UserRequirementsCard onSubmit={handleSubmit} isLoading={isRunning} />
							<AgentReasoningCard steps={timelineSteps} isRunning={isRunning} />
						</Stack>
					</Grid.Col>

					<Grid.Col span={{ base: 12, md: 7 }}>
						<Stack gap="md">
							<ValidatedProposalCard data={validatedProposal} isLoading={isRunning} />
							{gamePerformanceData.length > 0 || expertReview ? <PerformanceReportCard games={gamePerformanceData} expertReview={expertReview ?? { sentiment: "", text: "" }} /> : null}
						</Stack>
					</Grid.Col>
				</Grid>
			</Container>
		</MantineProvider>
	);
}
