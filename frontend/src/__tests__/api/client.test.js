import { describe, it, expect, vi, beforeEach } from "vitest";

// We need to test the internal `request` function via the exported `api` object
// Mock localStorage and fetch globally
const localStorageMock = {
  store: {},
  getItem: vi.fn((key) => localStorageMock.store[key] || null),
  setItem: vi.fn((key, value) => { localStorageMock.store[key] = value; }),
  removeItem: vi.fn((key) => { delete localStorageMock.store[key]; }),
  clear: vi.fn(() => { localStorageMock.store = {}; }),
};

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

// Mock window.location
delete window.location;
window.location = { href: "" };

beforeEach(() => {
  localStorageMock.store = {};
  localStorageMock.getItem.mockClear();
  localStorageMock.removeItem.mockClear();
  window.location.href = "";
  vi.restoreAllMocks();
});

describe("API Client", () => {
  it("should add auth token to requests", async () => {
    localStorageMock.store.token = "my-token";

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({ data: "test" }),
    });

    // Re-import to get fresh module
    const { api } = await import("../../api/client.js");
    await api.listProjects();

    expect(fetch).toHaveBeenCalledWith(
      "/api/projects",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer my-token",
        }),
      })
    );
  });

  it("should redirect to login on 401 for non-auth routes", async () => {
    localStorageMock.store.token = "expired-token";

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({ error: "Unauthorized" }),
    });

    const { api } = await import("../../api/client.js");

    await expect(api.listProjects()).rejects.toThrow("Unauthorized");
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("token");
    expect(window.location.href).toBe("/login");
  });

  it("should throw error with message from response body", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({ error: "Bad request" }),
    });

    const { api } = await import("../../api/client.js");

    await expect(api.listProjects()).rejects.toThrow("Bad request");
  });

  it("should return blob for PDF content type", async () => {
    localStorageMock.store.token = "my-token";
    const mockBlob = new Blob(["pdf-data"]);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/pdf" }),
      blob: () => Promise.resolve(mockBlob),
    });

    const { api } = await import("../../api/client.js");
    const result = await api.exportPDF("project-1");

    expect(result).toBeInstanceOf(Blob);
  });

  it("should return blob for Excel content type", async () => {
    localStorageMock.store.token = "my-token";
    const mockBlob = new Blob(["excel-data"]);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      blob: () => Promise.resolve(mockBlob),
    });

    const { api } = await import("../../api/client.js");
    const result = await api.exportExcel("project-1");

    expect(result).toBeInstanceOf(Blob);
  });

  it("should return JSON for normal responses", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({ projects: [] }),
    });

    const { api } = await import("../../api/client.js");
    const result = await api.listProjects();

    expect(result).toEqual({ projects: [] });
  });
});
