import { Badge, Table, Text } from "@mantine/core";

export interface PartData {
	type: string;
	color: string;
	name: string;
	price: string;
}

export default function PartTableRow({ type, color, name, price }: PartData) {
	return (
		<Table.Tr>
			<Table.Td>
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
