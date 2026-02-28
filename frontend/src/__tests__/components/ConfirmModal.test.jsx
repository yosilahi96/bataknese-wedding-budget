import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmModal from "../../components/ConfirmModal";

describe("ConfirmModal", () => {
  it("should render title, message, and confirm label", () => {
    render(
      <ConfirmModal
        title="Confirm Delete"
        message="Are you sure?"
        confirmLabel="Delete"
        onConfirm={() => {}}
        onClose={() => {}}
      />
    );

    expect(screen.getByText("Confirm Delete")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("should call onConfirm when confirm button is clicked", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <ConfirmModal
        title="Confirm"
        message="Sure?"
        confirmLabel="Yes"
        onConfirm={onConfirm}
        onClose={() => {}}
      />
    );

    await user.click(screen.getByText("Yes"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when cancel button is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmModal
        title="Confirm"
        message="Sure?"
        onConfirm={() => {}}
        onClose={onClose}
      />
    );

    await user.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should show loading state during async confirm", async () => {
    let resolveConfirm;
    const onConfirm = vi.fn(() => new Promise((resolve) => { resolveConfirm = resolve; }));
    const user = userEvent.setup();

    render(
      <ConfirmModal
        title="Confirm"
        message="Sure?"
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onClose={() => {}}
      />
    );

    await user.click(screen.getByText("Delete"));
    expect(screen.getByText("Please wait...")).toBeInTheDocument();

    resolveConfirm();
    await waitFor(() => {
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });
  });

  it("should use default confirm label when not provided", () => {
    render(
      <ConfirmModal
        title="Action"
        message="Sure?"
        onConfirm={() => {}}
        onClose={() => {}}
      />
    );

    // Default label is "Confirm"
    const buttons = screen.getAllByRole("button");
    const confirmBtn = buttons.find((b) => b.textContent === "Confirm");
    expect(confirmBtn).toBeTruthy();
  });

  it("should apply danger style when confirmStyle is danger", () => {
    render(
      <ConfirmModal
        title="Warning"
        message="Sure?"
        confirmLabel="Delete"
        confirmStyle="danger"
        onConfirm={() => {}}
        onClose={() => {}}
      />
    );

    const deleteBtn = screen.getByText("Delete");
    expect(deleteBtn.className).toContain("btn-danger");
  });
});
