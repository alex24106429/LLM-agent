import { Button, Paper, Stack, Textarea } from "@mantine/core";
import { IconCoins } from "@tabler/icons-react";
import { useState } from "react";
import SectionTitle from "./SectionTitle";

interface UserRequirementsCardProps {
	onSubmit: (prompt: string) => void;
}

export default function UserRequirementsCard({ onSubmit }: UserRequirementsCardProps) {
	const [prompt, setPrompt] = useState("");

	return (
		<Paper withBorder p="md" radius="md">
			<SectionTitle icon={<IconCoins size={20} color="gray" />}>Gebruikerswensen</SectionTitle>
			<Stack gap="sm">
				<Textarea label="Doelstelling / Prompt" placeholder="Ik wil een stille PC om Cyberpunk te spelen op 1440p..." value={prompt} onChange={(e) => setPrompt(e.currentTarget.value)} />
				<Button onClick={() => onSubmit(prompt)}>Start Agent</Button>
			</Stack>
		</Paper>
	);
}
