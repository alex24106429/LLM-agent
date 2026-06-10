// logger
export const logger = {
	info: (...msg: unknown[]) => console.log("[INFO]", ...msg),
	error: (...msg: unknown[]) => console.error("[ERROR]", ...msg),
	debug: (...msg: unknown[]) => console.debug("[DEBUG]", ...msg),
};
