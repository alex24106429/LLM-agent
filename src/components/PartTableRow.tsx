import { Badge, Table, Text } from "@mantine/core";

export interface PartData {
	type: string;
	color: string;
	name: string;
	price: string;
	url?: string | null;
}

export default function PartTableRow({ type, color, name, price, url }: PartData) {
	return (
		<Table.Tr
			style={{
				position: "relative",
				cursor: url ? "pointer" : "default",
			}}
		>
			<Table.Td>
				{/* Stretched Link overlay covering the entire row */}
				{url ? (
					// biome-ignore lint/a11y/useAnchorContent: we're already using aria-label
					<a
						href={url}
						target="_blank"
						rel="noopener noreferrer"
						style={{
							position: "absolute",
							inset: 0,
							zIndex: 1,
						}}
						aria-label={`Open link voor ${name}`}
					/>
				) : null}

				<Badge variant="outline" color={color} size="xs">
					{type}
				</Badge>
			</Table.Td>
			<Table.Td>
				<Text size="xs" fw={500}>
					{name}
				</Text>
			</Table.Td>
			<Table.Td style={{ textAlign: "right" }}>
				<Text size="xs">{price}</Text>
			</Table.Td>
		</Table.Tr>
	);
}
