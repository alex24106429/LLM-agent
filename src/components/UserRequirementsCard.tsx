import { Button, Paper, Stack, Textarea } from "@mantine/core";
import { IconCoins } from "@tabler/icons-react";
import SectionTitle from "./SectionTitle";

export default function UserRequirementsCard() {
	return (
		<Paper withBorder p="md" radius="md">
			<SectionTitle icon={<IconCoins size={20} color="gray" />}>Gebruikerswensen</SectionTitle>
			<Stack gap="sm">
				<Textarea label="Doelstelling / Prompt" placeholder="Ik wil een stille PC om Cyberpunk te spelen op 1440p..." />
				<Button>Start Agent</Button>
			</Stack>
		</Paper>
	);
}
