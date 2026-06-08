// page.tsx
"use client";

import { Card, Center, Container, Grid, Group, Loader, MantineProvider, Stack, Text, Title } from "@mantine/core";
import { useState, useTransition } from "react";
import UserRequirementsCard from "@/components/UserRequirementsCard";

// 1. DIRECTLY IMPORT THE SERVER ACTION FROM YOUR MAIN.TS!
import { buildPcWithBudgetCheck } from "../main";

export default function PCBuilderAgentUI() {
	// useTransition helps us manage loading states for Server Actions
	const [isPending, startTransition] = useTransition();
	const [buildResult, setBuildResult] = useState<string | null>(null);

	const handleGenerateBuild = (prompt: string) => {
		// 2. Wrap the backend call in startTransition
		startTransition(async () => {
			try {
				// 3. Call the function as if it were a normal local function.
				// Next.js securely runs this on the server!
				const result = await buildPcWithBudgetCheck(prompt);
				setBuildResult(result);
			} catch (error) {
				console.error("Agent failed:", error);
				setBuildResult("Er is een fout opgetreden bij het samenstellen van de PC.");
			}
		});
	};

	return (
		<MantineProvider>
			<Container size="xl" py="lg">
				<Group justify="space-between" mb="lg">
					<Title>CHASSIS PC BUILDER</Title>
				</Group>

				<Grid>
					<Grid.Col span={{ base: 12, md: 5 }}>
						<Stack gap="md">
							<UserRequirementsCard onSubmit={handleGenerateBuild} />

							{isPending && (
								<Card shadow="sm" padding="lg" radius="md" withBorder>
									<Center p="xl">
										<Stack align="center" gap="sm">
											<Loader color="blue" type="bars" />
											<Text c="dimmed" size="sm">
												Agent is marktprijzen aan het ophalen en budget aan het berekenen...
											</Text>
										</Stack>
									</Center>
								</Card>
							)}
						</Stack>
					</Grid.Col>

					<Grid.Col span={{ base: 12, md: 7 }}>
						{buildResult && !isPending && (
							<Card shadow="sm" padding="lg" radius="md" withBorder>
								<Title order={3} mb="md">
									Gevalideerd Voorstel
								</Title>

								{/*
								  Since main.ts returns a plain string/markdown,
								  we render it inside a pre-formatted text block so
								  newlines and spacing are preserved.
								*/}
								<Text
									component="pre"
									style={{
										whiteSpace: "pre-wrap",
										fontFamily: "inherit",
										lineHeight: 1.6,
									}}
								>
									{buildResult}
								</Text>
							</Card>
						)}
					</Grid.Col>
				</Grid>
			</Container>
		</MantineProvider>
	);
}
