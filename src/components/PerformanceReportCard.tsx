import { Alert, Divider, Paper, Stack, Text } from "@mantine/core";
import { IconAlertCircle, IconDeviceGamepad2, IconScale } from "@tabler/icons-react";
import GamePerformanceBar, { type GamePerformanceData } from "./GamePerformanceBar";
import SectionTitle from "./SectionTitle";

export interface ExpertReview {
	sentiment: string;
	text: string;
}

export default function PerformanceReportCard({ games, expertReview }: { games: GamePerformanceData[]; expertReview: ExpertReview }) {
	return (
		<Paper withBorder p="md" radius="md">
			<SectionTitle mb="sm" icon={<IconDeviceGamepad2 size={20} color="teal" />}>
				Performance Schatting
			</SectionTitle>
			<Text size="xs" c="dimmed" mb="md">
				Geschat op basis van hardware-matching en recente benchmarks op 1440p (High settings).
			</Text>

			<Stack gap="xs">
				{games.map((game, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static list
					<GamePerformanceBar key={index} {...game} />
				))}
			</Stack>

			<Divider my="md" />

			<SectionTitle order={4} size="h5" mb="xs" icon={<IconScale size={16} />}>
				Expert Review Samenvatting
			</SectionTitle>
			<Alert variant="light" color="blue" title={`Expert Sentiment: ${expertReview.sentiment}`} icon={<IconAlertCircle size={16} />}>
				<Text size="xs">{expertReview.text}</Text>
			</Alert>
		</Paper>
	);
}
