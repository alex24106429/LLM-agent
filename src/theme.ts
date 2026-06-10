"use client";

import { type CSSVariablesResolver, createTheme } from "@mantine/core";

export const theme = createTheme({
	white: "#ffffff",
	black: "#000000",
	primaryColor: "cyan",
	fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji",
	defaultRadius: 15,
	colors: {
		dark: ["#ffffff", "#f5f5f5", "#e5e5e5", "#d4d4d4", "#333333", "#262626", "#171717", "#000000", "#000000", "#000000"],
	},
	components: {
		Button: {
			defaultProps: {
				variant: "default",
				radius: "md",
			},
			vars: (_theme: Record<string, unknown>, props: { variant: string }) => {
				if (props.variant === "default" || !props.variant) {
					return {
						root: {
							"--button-bg": "color-mix(in srgb, var(--mantine-color-default), transparent 33%)",
							"--button-hover": "var(--mantine-color-default)",
						},
					};
				}
				if (props.variant === "filled") {
					return {
						root: {
							"--button-bg": "var(--mantine-color-text)",
							"--button-color": "var(--mantine-color-body)",
							"--button-hover": "light-dark(#333333, #cccccc)",
						},
					};
				}
				if (props.variant === "light") {
					return {
						root: {
							"--button-bd": "1px solid",
						},
					};
				}
				if (props.variant === "outline") {
					return {
						root: {
							"--button-color": "var(--mantine-color-text)",
							"--button-bd": "1px solid var(--mantine-color-text)",
							"--button-hover": "light-dark(rgba(0,0,0,0.05), rgba(255,255,255,0.1))",
						},
					};
				}
				return { root: {} };
			},
		},
		Alert: {
			defaultProps: {
				variant: "default",
			},
		},
		Paper: {
			defaultProps: {
				p: "md",
			},
		},
	},
});

export const cssVariablesResolver: CSSVariablesResolver = (_theme) => ({
	variables: {},
	light: {
		"--mantine-color-dimmed": "color-mix(in srgb, var(--mantine-color-text) 50%, transparent)",
	},
	dark: {
		"--mantine-color-dimmed": "color-mix(in srgb, var(--mantine-color-text) 80%, transparent)",
	},
});
