import "@mantine/core/styles.css";

export const metadata = {
	title: "PC Builder Agent",
	description: "PC Builder Agent",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="nl">
			<body>{children}</body>
		</html>
	);
}
