import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeSelector } from "@/components/common/ThemeSelector";

describe("ThemeSelector", () => {
  it("renders trigger and opens menu on click without crashing", async () => {
    render(<ThemeSelector />);
    const trigger = screen.getByRole("button", { name: /Change color theme/i });
    expect(trigger).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(await screen.findByText("Vault Palette")).toBeInTheDocument();
    expect(screen.getAllByText("Obsidian").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Titanium")).toBeInTheDocument();
    expect(screen.getByText("Bronze")).toBeInTheDocument();

    const titaniumOption = screen.getByText("Titanium");
    fireEvent.click(titaniumOption);
    expect(document.documentElement.getAttribute("data-theme")).toBe("titanium");
  });
});
