import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RupiahInput from "../../components/RupiahInput";

describe("RupiahInput", () => {
  it("should render with formatted value", () => {
    render(<RupiahInput value={1000000} onChange={() => {}} />);

    const input = screen.getByRole("textbox");
    expect(input.value).toBe("1.000.000");
  });

  it("should format number with dot separators on input", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<RupiahInput value="" onChange={onChange} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "50000");

    // onChange should be called with raw numeric values
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall).toMatch(/^\d+$/);
  });

  it("should render '0' for zero value", () => {
    render(<RupiahInput value={0} onChange={() => {}} />);

    const input = screen.getByRole("textbox");
    expect(input.value).toBe("0");
  });

  it("should pass additional props to input", () => {
    render(<RupiahInput value="" onChange={() => {}} placeholder="Enter amount" />);

    const input = screen.getByPlaceholderText("Enter amount");
    expect(input).toBeInTheDocument();
  });

  it("should have numeric input mode", () => {
    render(<RupiahInput value="" onChange={() => {}} />);

    const input = screen.getByRole("textbox");
    expect(input.getAttribute("inputMode")).toBe("numeric");
  });
});
