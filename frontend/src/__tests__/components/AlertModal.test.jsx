import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AlertModal from "../../components/AlertModal";

describe("AlertModal", () => {
  it("should render title and message", () => {
    render(
      <AlertModal title="Test Title" message="Test message" type="success" onClose={() => {}} />
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("should render OK button", () => {
    render(
      <AlertModal title="Title" message="Message" type="success" onClose={() => {}} />
    );

    expect(screen.getByText("OK")).toBeInTheDocument();
  });

  it("should call onClose when OK is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <AlertModal title="Title" message="Message" type="success" onClose={onClose} />
    );

    await user.click(screen.getByText("OK"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when overlay is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <AlertModal title="Title" message="Message" type="success" onClose={onClose} />
    );

    const overlay = document.body.querySelector(".modal-overlay");
    await user.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it("should render with different types", () => {
    const { rerender } = render(
      <AlertModal title="Error" message="Error message" type="error" onClose={() => {}} />
    );
    expect(screen.getByText("Error")).toBeInTheDocument();

    rerender(
      <AlertModal title="Warning" message="Warning message" type="warning" onClose={() => {}} />
    );
    expect(screen.getByText("Warning")).toBeInTheDocument();
  });
});
