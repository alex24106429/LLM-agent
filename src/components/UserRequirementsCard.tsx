import { Button, Paper, Stack, Textarea } from "@mantine/core";
import { IconCoins } from "@tabler/icons-react";
import { useState } from "react";
import SectionTitle from "./SectionTitle";

interface UserRequirementsCardProps {
	onSubmit: (prompt: string) => void;
	isLoading?: boolean;
}

export default function UserRequirementsCard({ onSubmit, isLoading = false }: UserRequirementsCardProps) {
	const [prompt, setPrompt] = useState("");

	return (
		<Paper withBorder>
			<SectionTitle icon={<IconCoins size={20} />}>Gebruikerswensen</SectionTitle>
			<Stack gap="sm">
				<Textarea
					label="Doelstelling / Prompt"
					placeholder="Ik wil een stille PC om Cyberpunk te spelen op 1440p..."
					value={prompt}
					onChange={(e) => setPrompt(e.currentTarget.value)}
					disabled={isLoading}
					maxLength={250}
				/>
				<Button onClick={() => onSubmit(prompt)} loading={isLoading} disabled={!prompt.trim()} variant="filled">
					{isLoading ? "Agent Bezig..." : "Start Agent"}
				</Button>
			</Stack>
		</Paper>
	);
}
