import { Badge, Table, Text } from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";

export interface PartData {
	type: string;
	color: string;
	name: string;
	price: string;
	shop: string;
}

export default function PartTableRow({ type, color, name, price, shop }: PartData) {
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
			<Table.Td style={{ textAlign: "right" }}>
				<Text size="xs" c="blue" style={{ cursor: "pointer" }}>
					{shop} <IconExternalLink size={10} />
				</Text>
			</Table.Td>
		</Table.Tr>
	);
}
