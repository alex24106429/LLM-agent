import { Badge, Loader, Paper, Text, Timeline } from "@mantine/core";
import { IconAlertCircle, IconCheck, IconCpu, IconRotateDot } from "@tabler/icons-react";
import SectionTitle from "./SectionTitle";

export interface TimelineStep {
	icon: "check" | "cpu" | "alert" | "rotate";
	title: string;
	text: string;
	badge?: { color: string; text: string };
	lineVariant?: "solid";
}

const iconMap = {
	check: IconCheck,
	cpu: IconCpu,
	alert: IconAlertCircle,
	rotate: IconRotateDot,
};

export default function AgentReasoningCard({ steps, isRunning = false }: { steps: TimelineStep[]; isRunning?: boolean }) {
	return (
		<Paper withBorder>
			<SectionTitle icon={isRunning ? <Loader size={18} /> : <IconRotateDot size={20} />}>Agent Redeneerproces</SectionTitle>

			<Timeline active={steps.length} bulletSize={24} lineWidth={2}>
				{steps.map((step, index) => {
					const IconComponent = iconMap[step.icon];
					return (
						// biome-ignore lint/suspicious/noArrayIndexKey: static list
						<Timeline.Item key={index} bullet={<IconComponent size={12} />} title={step.title} lineVariant={step.lineVariant as "solid" | undefined}>
							<Text size="xs" c="dimmed">
								{step.text}
							</Text>
							{step.badge && (
								<Badge color={step.badge.color} size="xs" mt={4}>
									{step.badge.text}
								</Badge>
							)}
						</Timeline.Item>
					);
				})}
			</Timeline>
		</Paper>
	);
}
