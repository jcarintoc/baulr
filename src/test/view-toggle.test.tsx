import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ViewToggle } from "@/components/common/ViewToggle";
import { useRemoteFilesStore } from "@/store/useRemoteFilesStore";

describe("ViewToggle hover prefetch", () => {
  it("triggers prefetchFiles when user hovers on Vault Files tab", () => {
    const prefetchSpy = vi.fn();
    useRemoteFilesStore.setState({ prefetchFiles: prefetchSpy });

    render(<ViewToggle />);
    const vaultTab = screen.getByRole("tab", { name: /Vault Files/i });
    fireEvent.pointerEnter(vaultTab);

    expect(prefetchSpy).toHaveBeenCalledTimes(1);
  });
});
