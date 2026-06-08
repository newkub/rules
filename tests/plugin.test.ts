import { describe, expect, test } from "bun:test";
import { agentRules } from "../src/plugin.ts";

describe("agentRules plugin", () => {
	test("returns a Vite plugin with the expected name", () => {
		const plugin = agentRules();
		expect(plugin.name).toBe("rules");
		expect(typeof plugin.configResolved).toBe("function");
	});

	test("disabled by config is a no-op", async () => {
		const plugin = agentRules({ enabled: false });
		const ctx = { root: import.meta.dir, command: "build" as const };
		await plugin.configResolved?.(ctx);
	});

	test("skips when runOnDev is false on serve", async () => {
		const plugin = agentRules({ runOnDev: false });
		const ctx = { root: import.meta.dir, command: "serve" as const };
		// Should not throw — just returns without scanning.
		await plugin.configResolved?.(ctx);
	});
});
