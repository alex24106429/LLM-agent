import { Alert, Divider, Paper, Stack, Text } from "@mantine/core";
import { IconDeviceGamepad2, IconScale } from "@tabler/icons-react";
import GamePerformanceBar, { type GamePerformanceData } from "./GamePerformanceBar";
import SectionTitle from "./SectionTitle";

export interface ExpertReview {
	sentiment: string;
	text: string;
}

export default function PerformanceReportCard({ games, expertReview }: { games: GamePerformanceData[]; expertReview: ExpertReview }) {
	const hasPerformance = games.length > 0;
	const hasReview = expertReview.text.length > 0;

	return (
		<Paper withBorder>
			<SectionTitle mb="sm" icon={<IconDeviceGamepad2 size={20} />}>
				Performance Schatting
			</SectionTitle>

			{hasPerformance ? (
				<>
					<Text size="xs" c="dimmed" mb="md">
						Geschat op basis van hardware-matching en recente benchmarks.
					</Text>
					<Stack gap="xs">
						{games.map((game, index) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: static list
							<GamePerformanceBar key={index} {...game} />
						))}
					</Stack>
				</>
			) : (
				<Text size="sm" c="dimmed" ta="center" py="md">
					Nog geen performance data beschikbaar.
				</Text>
			)}

			<Divider my="md" />

			<SectionTitle order={4} size="h5" mb="xs" icon={<IconScale size={16} />}>
				Expert Review Samenvatting
			</SectionTitle>

			{hasReview ? (
				<Alert variant="default" title={`Expert Sentiment: ${expertReview.sentiment}`}>
					<Text size="xs">{expertReview.text}</Text>
				</Alert>
			) : (
				<Text size="sm" c="dimmed" ta="center" py="md">
					Nog geen review analyse beschikbaar.
				</Text>
			)}
		</Paper>
	);
}
