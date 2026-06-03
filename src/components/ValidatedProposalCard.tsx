import { Badge, Group, Paper, Progress, Table, Text } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import PartTableRow, { type PartData } from "./PartTableRow";
import SectionTitle from "./SectionTitle";

export interface ValidatedProposalData {
	partsList: PartData[];
	totalPrice: string;
	budgetPercentage: number;
	budgetRemaining: string;
}

export default function ValidatedProposalCard({ data }: { data: ValidatedProposalData }) {
	const { partsList, totalPrice, budgetPercentage, budgetRemaining } = data;

	return (
		<Paper withBorder p="md" radius="md">
			<Group justify="space-between" mb="xs">
				<SectionTitle mb="0" icon={<IconCheck size={20} color="green" />}>
					Gevalideerd Voorstel
				</SectionTitle>
				<Badge color="green">Gevalideerd & Binnen Budget</Badge>
			</Group>

			<Group mb="md" grow>
				<div>
					<Text size="xs" c="dimmed">
						Totaal Prijs (Laagste Retailers)
					</Text>
					<Text size="lg" fw={700}>
						{totalPrice}
					</Text>
				</div>
				<div>
					<Text size="xs" c="dimmed">
						Budget Marge
					</Text>
					<Progress value={budgetPercentage} color="teal" size="sm" mt={5} />
					<Text size="xs" ta="right" mt={2}>
						{budgetRemaining} over
					</Text>
				</div>
			</Group>

			<Table verticalSpacing="xs" striped>
				<Table.Thead>
					<Table.Tr>
						<Table.Th>Type</Table.Th>
						<Table.Th>Onderdeel</Table.Th>
						<Table.Th style={{ textAlign: "right" }}>Prijs</Table.Th>
						<Table.Th style={{ textAlign: "right" }}>Winkel</Table.Th>
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
