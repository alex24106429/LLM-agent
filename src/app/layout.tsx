import "@mantine/core/styles.css";

export const metadata = {
	title: "CHASSIS",
	description: "LLM Agent building your dream PC precisely to your needs and preferences.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="nl">
			<meta name="color-scheme" content="light dark" />
			<link rel="shortcut icon" href="/favicon.svg" />
			<body>{children}</body>
		</html>
	);
}
