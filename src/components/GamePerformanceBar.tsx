import { Group, Progress, Text } from "@mantine/core";

export interface GamePerformanceData {
	name: string;
	fps: string;
	value: number;
	color: string;
	fpsColor: string;
}

export default function GamePerformanceBar({ name, fps, value, color, fpsColor }: GamePerformanceData) {
	return (
		<div>
			<Group justify="space-between" mb={2}>
				<Text size="xs" fw={500}>
					{name}
				</Text>
				<Text size="xs" fw={700} c={fpsColor}>
					{fps}
				</Text>
			</Group>
			<Progress value={value} color={color} size="xs" />
		</div>
	);
}
