import { describe, it, expect } from "bun:test";
import { resolveToggle, countActiveSaves } from "../src/services/saved-posts.service.js";

describe("resolveToggle (pure business logic)", () => {
  describe("save action", () => {
    it("returns 'create' when no existing record", () => {
      expect(resolveToggle(undefined, "save")).toBe("create");
    });

    it("returns 'activate' when existing record is inactive (re-save)", () => {
      expect(resolveToggle({ active: false }, "save")).toBe("activate");
    });

    it("returns 'noop' when already saved (idempotent)", () => {
      expect(resolveToggle({ active: true }, "save")).toBe("noop");
    });
  });

  describe("unsave action", () => {
    it("returns 'deactivate' when record is active", () => {
      expect(resolveToggle({ active: true }, "unsave")).toBe("deactivate");
    });

    it("returns 'noop' when record is already inactive", () => {
      expect(resolveToggle({ active: false }, "unsave")).toBe("noop");
    });

    it("returns 'noop' when no record exists", () => {
      expect(resolveToggle(undefined, "unsave")).toBe("noop");
    });
  });
});

describe("countActiveSaves", () => {
  it("counts only active saves", () => {
    const records = [
      { active: true },
      { active: false },
      { active: true },
      { active: false },
      { active: true },
    ];
    expect(countActiveSaves(records)).toBe(3);
  });

  it("returns 0 for empty array", () => {
    expect(countActiveSaves([])).toBe(0);
  });

  it("returns 0 when all are inactive", () => {
    expect(countActiveSaves([{ active: false }, { active: false }])).toBe(0);
  });
});
