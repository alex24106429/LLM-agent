import { Title, type TitleOrder } from "@mantine/core";

export default function SectionTitle({ icon, children, mb = "md", order = 3, size = "h4" }: { icon: React.ReactNode; children: React.ReactNode; mb?: string; order?: number; size?: string }) {
	return (
		<Title
			order={order as TitleOrder}
			size={size}
			mb={mb}
			style={{
				display: "flex",
				alignItems: "center",
				gap: "8px",
				fontWeight: 400
			}}
		>
			{icon} {children}
		</Title>
	);
}
