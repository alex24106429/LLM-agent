"use client";

import {
	Alert,
	Badge,
	Button,
	Container,
	Divider,
	Grid,
	Group,
	MantineProvider,
	MultiSelect,
	NumberInput,
	Paper,
	Progress,
	Stack,
	Table,
	Text,
	TextInput,
	Timeline,
	Title,
} from "@mantine/core";
import {
	IconAlertCircle,
	IconCheck,
	IconCoins,
	IconCpu,
	IconDeviceGamepad2,
	IconExternalLink,
	IconRotateDot,
	IconScale,
} from "@tabler/icons-react";
import { useState } from "react";

export default function PCBuilderAgentUI() {
	const [activeTab, setActiveTab] = useState<"analyzing" | "loop" | "final">(
		"final",
	);

	return (
		<MantineProvider>
			<Container size="xl" py="lg">
				{/* Header */}
				<Group justify="space-between" mb="lg">
					<div>
						<Title order={1} mt="xs">
							PC Builder LLM Agent
						</Title>
						<Text size="sm" c="dimmed">
							Single-Agent workflow met actieve budgetcorrectie,
							prestatieschatting en fysieke compatibiliteitstests.
						</Text>
					</div>
					<Group>
						<Text size="xs" fw={700} c="dimmed">
							WORKFLOW STATUS:
						</Text>
						<Button.Group>
							<Button
								variant={
									activeTab === "analyzing"
										? "filled"
										: "light"
								}
								color="blue"
								size="xs"
								onClick={() => setActiveTab("analyzing")}
							>
								1. Analyse & Selectie
							</Button>
							<Button
								variant={
									activeTab === "loop" ? "filled" : "light"
								}
								color="orange"
								size="xs"
								onClick={() => setActiveTab("loop")}
							>
								2. Herstelactie (Loop)
							</Button>
							<Button
								variant={
									activeTab === "final" ? "filled" : "light"
								}
								color="green"
								size="xs"
								onClick={() => setActiveTab("final")}
							>
								3. Gevalideerd Eindresultaat
							</Button>
						</Button.Group>
					</Group>
				</Group>

				<Grid>
					{/* Linker kolom: Gebruikerswensen & Agent Inner Monologue */}
					<Grid.Col span={{ base: 12, md: 5 }}>
						<Stack gap="md">
							{/* Gebruikerswensen Card */}
							<Paper withBorder p="md" radius="md">
								<Title
									order={3}
									size="h4"
									mb="md"
									style={{
										display: "flex",
										alignItems: "center",
										gap: "8px",
									}}
								>
									<IconCoins size={20} color="gray" />{" "}
									Gebruikerswensen
								</Title>
								<Stack gap="sm">
									<TextInput
										label="Doelstelling / Prompt"
										placeholder="Ik wil een stille PC om Cyberpunk te spelen op 1440p..."
										defaultValue="Ik wil een compacte PC om hoofdzakelijk Cyberpunk 2077 en CS2 op 1440p te spelen."
										disabled
									/>
									<Group grow>
										<NumberInput
											label="Budget (€)"
											defaultValue={1200}
											disabled
										/>
										<TextInput
											label="Behuizing Form Factor"
											defaultValue="Micro-ATX (Compact)"
											disabled
										/>
									</Group>
									<MultiSelect
										label="Doelgames"
										data={[
											"Cyberpunk 2077",
											"Counter-Strike 2",
											"Valorant",
											"GTA V",
										]}
										defaultValue={[
											"Cyberpunk 2077",
											"Counter-Strike 2",
										]}
										disabled
									/>
								</Stack>
							</Paper>

							{/* Agent Inner Monologue / Execution Trace */}
							<Paper withBorder p="md" radius="md">
								<Title
									order={3}
									size="h4"
									mb="md"
									style={{
										display: "flex",
										alignItems: "center",
										gap: "8px",
									}}
								>
									<IconRotateDot size={20} color="purple" />{" "}
									Agent Redeneerproces
								</Title>

								<Timeline
									active={
										activeTab === "analyzing"
											? 1
											: activeTab === "loop"
												? 3
												: 5
									}
									bulletSize={24}
									lineWidth={2}
								>
									<Timeline.Item
										bullet={<IconCheck size={12} />}
										title="Stap 1: Wensen Parsen"
									>
										<Text size="xs" c="dimmed">
											Geparseerd naar: Budget: €1200,
											Resolutie: 1440p, Games: CP2077
											(Zwaar), CS2 (Licht).
										</Text>
									</Timeline.Item>

									<Timeline.Item
										bullet={<IconCpu size={12} />}
										title="Stap 2 & 3: Core Hardware Concept"
									>
										<Text size="xs" c="dimmed">
											Geselecteerd: AMD Ryzen 5 7600 +
											Nvidia RTX 4070. Conceptonderdelen
											toegevoegd (32GB DDR5, B650M, 650W
											PSU).
										</Text>
									</Timeline.Item>

									<Timeline.Item
										bullet={
											activeTab === "analyzing" ? (
												<IconRotateDot size={12} />
											) : (
												<IconAlertCircle size={12} />
											)
										}
										title="Stap 4 & 7: Prijs & Budgetcontrole"
										lineVariant={
											activeTab === "analyzing"
												? "dashed"
												: "solid"
										}
									>
										<Text
											size="xs"
											fw={
												activeTab === "loop"
													? "bold"
													: "normal"
											}
											c={
												activeTab === "loop"
													? "orange.8"
													: "dimmed"
											}
										>
											{activeTab === "analyzing"
												? "Prijzen ophalen van retailers..."
												: "Systeemwaarde: €1258. Overschrijding budget (€1200) gedetecteerd met €58."}
										</Text>
										{activeTab !== "analyzing" && (
											<Badge color="red" size="xs" mt={4}>
												Fout herstellen via
												feedbackloop...
											</Badge>
										)}
									</Timeline.Item>

									<Timeline.Item
										bullet={<IconRotateDot size={12} />}
										title="Stap 7: Herstelactie Loop (Zelfcorrectie)"
										style={{
											display:
												activeTab === "analyzing"
													? "none"
													: "block",
										}}
									>
										<Text size="xs" c="dimmed">
											GPU heroverwogen. RTX 4070 (€589)
											vervangen door RX 7800 XT (€509).
											Nieuwe som: €1165.
										</Text>
										<Badge color="green" size="xs" mt={4}>
											Budget status: OK (€1165 / €1200)
										</Badge>
									</Timeline.Item>

									<Timeline.Item
										bullet={<IconCheck size={12} />}
										title="Stap 8: Fysieke Compatibiliteitstest"
										style={{
											display:
												activeTab === "final"
													? "block"
													: "none",
										}}
									>
										<Text size="xs" c="dimmed">
											TDP check (430W vs 650W PSU): OK.
											Case-vrijgave (310mm GPU vs 350mm
											Case): OK. Socket AM5: OK.
										</Text>
									</Timeline.Item>
								</Timeline>
							</Paper>
						</Stack>
					</Grid.Col>

					{/* Rechter kolom: Resultaten & Valideringsrapport */}
					<Grid.Col span={{ base: 12, md: 7 }}>
						{activeTab !== "final" ? (
							<Paper
								withBorder
								p="xl"
								radius="md"
								h="100%"
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Stack align="center" gap="xs">
									<IconRotateDot size={40} color="purple" />
									<Text size="sm" fw={700}>
										Agent is momentef aan het
										optimaliseren...
									</Text>
									<Text size="xs" c="dimmed">
										Klik hierboven op "3. Gevalideerd
										Eindresultaat" om het resultaat te
										bekijken.
									</Text>
								</Stack>
							</Paper>
						) : (
							<Stack gap="md">
								{/* Gevalideerde Onderdelenlijst */}
								<Paper withBorder p="md" radius="md">
									<Group justify="space-between" mb="xs">
										<Title
											order={3}
											size="h4"
											style={{
												display: "flex",
												alignItems: "center",
												gap: "8px",
											}}
										>
											<IconCheck
												size={20}
												color="green"
											/>{" "}
											Gevalideerd Voorstel
										</Title>
										<Badge color="green">
											Gevalideerd & Binnen Budget
										</Badge>
									</Group>

									<Group mb="md" grow>
										<div>
											<Text size="xs" c="dimmed">
												Totaal Prijs (Laagste Retailers)
											</Text>
											<Text size="lg" fw={700}>
												€1.165,12
											</Text>
										</div>
										<div>
											<Text size="xs" c="dimmed">
												Budget Marge
											</Text>
											<Progress
												value={97}
												color="teal"
												size="sm"
												mt={5}
											/>
											<Text size="xs" ta="right" mt={2}>
												€34,88 over
											</Text>
										</div>
									</Group>

									<Table verticalSpacing="xs" striped>
										<Table.Thead>
											<Table.Tr>
												<Table.Th>Type</Table.Th>
												<Table.Th>Onderdeel</Table.Th>
												<Table.Th
													style={{
														textAlign: "right",
													}}
												>
													Prijs
												</Table.Th>
												<Table.Th
													style={{
														textAlign: "right",
													}}
												>
													Winkel
												</Table.Th>
											</Table.Tr>
										</Table.Thead>
										<Table.Tbody>
											<Table.Tr>
												<Table.Td>
													<Badge
														variant="outline"
														color="blue"
														size="xs"
													>
														CPU
													</Badge>
												</Table.Td>
												<Table.Td>
													<Text size="xs" fw={500}>
														AMD Ryzen 5 7600 (AM5)
													</Text>
												</Table.Td>
												<Table.Td
													style={{
														textAlign: "right",
													}}
												>
													<Text size="xs">
														€194,00
													</Text>
												</Table.Td>
												<Table.Td
													style={{
														textAlign: "right",
													}}
												>
													<Text
														size="xs"
														c="blue"
														style={{
															cursor: "pointer",
														}}
													>
														Megekko{" "}
														<IconExternalLink
															size={10}
														/>
													</Text>
												</Table.Td>
											</Table.Tr>
											<Table.Tr>
												<Table.Td>
													<Badge
														variant="outline"
														color="grape"
														size="xs"
													>
														GPU
													</Badge>
												</Table.Td>
												<Table.Td>
													<Text size="xs" fw={500}>
														Sapphire Pulse RX 7800
														XT 16GB
													</Text>
												</Table.Td>
												<Table.Td
													style={{
														textAlign: "right",
													}}
												>
													<Text size="xs">
														€509,00
													</Text>
												</Table.Td>
												<Table.Td
													style={{
														textAlign: "right",
													}}
												>
													<Text
														size="xs"
														c="blue"
														style={{
															cursor: "pointer",
														}}
													>
														Azerty{" "}
														<IconExternalLink
															size={10}
														/>
													</Text>
												</Table.Td>
											</Table.Tr>
											<Table.Tr>
												<Table.Td>
													<Badge
														variant="outline"
														color="gray"
														size="xs"
													>
														MOBO
													</Badge>
												</Table.Td>
												<Table.Td>
													<Text size="xs" fw={500}>
														Gigabyte B650M DS3H
														(mATX)
													</Text>
												</Table.Td>
												<Table.Td
													style={{
														textAlign: "right",
													}}
												>
													<Text size="xs">
														€132,50
													</Text>
												</Table.Td>
												<Table.Td
													style={{
														textAlign: "right",
													}}
												>
													<Text
														size="xs"
														c="blue"
														style={{
															cursor: "pointer",
														}}
													>
														Amazon.nl{" "}
														<IconExternalLink
															size={10}
														/>
													</Text>
												</Table.Td>
											</Table.Tr>
											<Table.Tr>
												<Table.Td>
													<Badge
														variant="outline"
														color="gray"
														size="xs"
													>
														RAM
													</Badge>
												</Table.Td>
												<Table.Td>
													<Text size="xs" fw={500}>
														Corsair Vengeance 32GB
														DDR5-6000
													</Text>
												</Table.Td>
												<Table.Td
													style={{
														textAlign: "right",
													}}
												>
													<Text size="xs">
														€104,90
													</Text>
												</Table.Td>
												<Table.Td
													style={{
														textAlign: "right",
													}}
												>
													<Text
														size="xs"
														c="blue"
														style={{
															cursor: "pointer",
														}}
													>
														Alternate{" "}
														<IconExternalLink
															size={10}
														/>
													</Text>
												</Table.Td>
											</Table.Tr>
											<Table.Tr>
												<Table.Td>
													<Badge
														variant="outline"
														color="gray"
														size="xs"
													>
														PSU
													</Badge>
												</Table.Td>
												<Table.Td>
													<Text size="xs" fw={500}>
														Corsair RM650 (650W,
														Gold)
													</Text>
												</Table.Td>
												<Table.Td
													style={{
														textAlign: "right",
													}}
												>
													<Text size="xs">
														€84,90
													</Text>
												</Table.Td>
												<Table.Td
													style={{
														textAlign: "right",
													}}
												>
													<Text
														size="xs"
														c="blue"
														style={{
															cursor: "pointer",
														}}
													>
														Megekko{" "}
														<IconExternalLink
															size={10}
														/>
													</Text>
												</Table.Td>
											</Table.Tr>
											<Table.Tr>
												<Table.Td>
													<Badge
														variant="outline"
														color="gray"
														size="xs"
													>
														CASE
													</Badge>
												</Table.Td>
												<Table.Td>
													<Text size="xs" fw={500}>
														Fractal Design Pop Mini
														Silent
													</Text>
												</Table.Td>
												<Table.Td
													style={{
														textAlign: "right",
													}}
												>
													<Text size="xs">
														€79,82
													</Text>
												</Table.Td>
												<Table.Td
													style={{
														textAlign: "right",
													}}
												>
													<Text
														size="xs"
														c="blue"
														style={{
															cursor: "pointer",
														}}
													>
														Amazon.nl{" "}
														<IconExternalLink
															size={10}
														/>
													</Text>
												</Table.Td>
											</Table.Tr>
										</Table.Tbody>
									</Table>
								</Paper>

								{/* Prestatie- & Reviewrapport */}
								<Paper withBorder p="md" radius="md">
									<Title
										order={3}
										size="h4"
										mb="sm"
										style={{
											display: "flex",
											alignItems: "center",
											gap: "8px",
										}}
									>
										<IconDeviceGamepad2
											size={20}
											color="teal"
										/>{" "}
										Performance Schatting
									</Title>
									<Text size="xs" c="dimmed" mb="md">
										Geschat op basis van hardware-matching
										en recente benchmarks op 1440p (High
										settings).
									</Text>

									<Stack gap="xs">
										<div>
											<Group
												justify="space-between"
												mb={2}
											>
												<Text size="xs" fw={500}>
													Cyberpunk 2077 (1440p High,
													FSR Off)
												</Text>
												<Text
													size="xs"
													fw={700}
													c="green"
												>
													~ 72 FPS
												</Text>
											</Group>
											<Progress
												value={72}
												color="green"
												size="xs"
											/>
										</div>

										<div>
											<Group
												justify="space-between"
												mb={2}
											>
												<Text size="xs" fw={500}>
													Counter-Strike 2 (1440p
													High)
												</Text>
												<Text
													size="xs"
													fw={700}
													c="teal"
												>
													~ 280 FPS
												</Text>
											</Group>
											<Progress
												value={100}
												color="teal"
												size="xs"
											/>
										</div>
									</Stack>

									<Divider my="md" />

									<Title
										order={4}
										size="h5"
										mb="xs"
										style={{
											display: "flex",
											alignItems: "center",
											gap: "8px",
										}}
									>
										<IconScale size={16} /> Expert Review
										Samenvatting
									</Title>
									<Alert
										variant="light"
										color="blue"
										title="Expert Sentiment"
										icon={<IconAlertCircle size={16} />}
									>
										<Text size="xs">
											"De Sapphire Pulse RX 7800 XT wordt
											geprezen om de uitstekende koeling
											en stille werking. De behuizing (Pop
											Mini Silent) sluit goed aan bij de
											wens voor een compact en stil
											systeem."
										</Text>
									</Alert>
								</Paper>
							</Stack>
						)}
					</Grid.Col>
				</Grid>
			</Container>
		</MantineProvider>
	);
}
