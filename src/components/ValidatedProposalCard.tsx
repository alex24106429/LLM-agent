import { Badge, Group, Loader, Paper, Progress, Skeleton, Table, Text } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import PartTableRow, { type PartData } from "./PartTableRow";
import SectionTitle from "./SectionTitle";

export interface ValidatedProposalData {
	partsList: PartData[];
	totalPrice: string;
	budgetPercentage: number;
	budgetRemaining: string;
}

export default function ValidatedProposalCard({ data, isLoading = false }: { data: ValidatedProposalData | null; isLoading?: boolean }) {
	// Loading state: show skeleton
	if (isLoading && !data) {
		return (
			<Paper withBorder>
				<Group justify="space-between" mb="xs">
					<SectionTitle mb="0" icon={<Loader size={18} />}>
						Gevalideerd Voorstel
					</SectionTitle>
				</Group>
				<Skeleton height={20} mb="md" />
				<Skeleton height={20} mb="md" />
				<Skeleton height={120} />
			</Paper>
		);
	}

	// Empty state: no data yet
	if (!data) {
		return (
			<Paper withBorder>
				<Group justify="space-between" mb="xs">
					<SectionTitle mb="0" icon={<IconCheck size={20} />}>
						Gevalideerd Voorstel
					</SectionTitle>
				</Group>
				<Text size="sm" c="dimmed" ta="center" py="xl">
					Start de agent om een hardwarevoorstel te genereren.
				</Text>
			</Paper>
		);
	}

	const { partsList, totalPrice, budgetPercentage, budgetRemaining } = data;
	const isOverBudget = budgetRemaining.includes("tekort");

	return (
		<Paper withBorder>
			<Group justify="space-between" mb="xs">
				<SectionTitle mb="0" icon={<IconCheck size={20} />}>
					Gevalideerd Voorstel
				</SectionTitle>
				<Badge color={isOverBudget ? "red" : "green"}>{isOverBudget ? "Over Budget" : "Gevalideerd & Binnen Budget"}</Badge>
			</Group>

			<Group mb="md" grow>
				<div>
					<Text size="xs" c="dimmed">
						Totaal Prijs
					</Text>
					<Text size="xl" fw={400}>
						{totalPrice}
					</Text>
				</div>
				<div>
					<Text size="xs" c="dimmed">
						Budget Marge
					</Text>
					<Progress value={Math.min(budgetPercentage, 100)} color={isOverBudget ? "red" : "teal"} size="sm" mt={5} />
					<Text size="xs" ta="right" mt={2}>
						{budgetRemaining}
					</Text>
				</div>
			</Group>

			<Table verticalSpacing="xs" striped highlightOnHover>
				<Table.Thead>
					<Table.Tr>
						<Table.Th>Type</Table.Th>
						<Table.Th>Onderdeel</Table.Th>
						<Table.Th style={{ textAlign: "right" }}>Prijs</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{partsList.map((part, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: no index needed yet
						<PartTableRow key={index} {...part} />
					))}
				</Table.Tbody>
			</Table>
		</Paper>
	);
}
