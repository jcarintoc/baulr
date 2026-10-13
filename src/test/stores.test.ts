import { describe, it, expect, beforeEach } from "vitest";
import { useViewStore } from "@/store/useViewStore";
import { useTransferStore } from "@/store/useTransferStore";
import { useRemoteFilesStore } from "@/store/useRemoteFilesStore";
import { useThemeStore } from "@/store/useThemeStore";

describe("useViewStore", () => {
  beforeEach(() => {
    useViewStore.setState({ activeView: "dashboard" });
  });

  it("defaults to dashboard view and updates view", () => {
    expect(useViewStore.getState().activeView).toBe("dashboard");
    useViewStore.getState().setActiveView("files");
    expect(useViewStore.getState().activeView).toBe("files");
  });
});

describe("useTransferStore", () => {
  beforeEach(() => {
    useTransferStore.getState().clearCompleted();
  });

  it("enqueues a transfer item with calculating telemetry", () => {
    useTransferStore.getState().enqueueTransfer("Holiday_Photos", 1024 * 1024 * 100);
    const items = useTransferStore.getState().items;
    expect(items.length).toBe(1);
    expect(items[0].name).toBe("Holiday_Photos");
    expect(items[0].status).toBe("uploading");
    expect(useTransferStore.getState().isTransferring).toBe(true);
  });

  it("updates progress and marks verified", () => {
    useTransferStore.getState().enqueueTransfer("Doc_Backup.tar", 1000);
    const id = useTransferStore.getState().items[0].id;

    useTransferStore.getState().updateItemProgress(id, 1000, 500, 0);
    expect(useTransferStore.getState().items[0].status).toBe("verifying");

    useTransferStore.getState().markItemVerified(id);
    expect(useTransferStore.getState().items[0].status).toBe("verified");
    expect(useTransferStore.getState().isVerified).toBe(true);
    expect(useTransferStore.getState().isTransferring).toBe(false);
  });
});

describe("useRemoteFilesStore", () => {
  it("filters search queries and deletes files to cloud trash", () => {
    const initialCount = useRemoteFilesStore.getState().files.length;
    const fileId = useRemoteFilesStore.getState().files[0].id;

    useRemoteFilesStore.getState().deleteToCloudTrash(fileId);
    expect(useRemoteFilesStore.getState().files.length).toBe(initialCount - 1);
    expect(useRemoteFilesStore.getState().files.some((f) => f.id === fileId)).toBe(false);
  });
});

describe("useThemeStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.getState().setTheme("obsidian");
  });

  it("defaults to obsidian theme and syncs html attribute", () => {
    expect(useThemeStore.getState().theme).toBe("obsidian");
    expect(document.documentElement.getAttribute("data-theme")).toBe("obsidian");
  });

  it("switches theme to titanium and persists to localStorage", () => {
    useThemeStore.getState().setTheme("titanium");
    expect(useThemeStore.getState().theme).toBe("titanium");
    expect(localStorage.getItem("baulr-theme")).toBe("titanium");
    expect(document.documentElement.getAttribute("data-theme")).toBe("titanium");
  });

  it("switches theme to bronze and persists to localStorage", () => {
    useThemeStore.getState().setTheme("bronze");
    expect(useThemeStore.getState().theme).toBe("bronze");
    expect(localStorage.getItem("baulr-theme")).toBe("bronze");
    expect(document.documentElement.getAttribute("data-theme")).toBe("bronze");
  });
});

