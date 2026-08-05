import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "../button";

describe("Button", () => {
  it("renders with default variant", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-[var(--erp-primary)]");
  });

  it("renders with secondary variant", () => {
    render(<Button variant="secondary">Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("border-[var(--erp-border)]");
  });

  it("renders with destructive variant", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole("button", { name: /delete/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-red-600");
  });

  it("renders with custom className", () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole("button", { name: /custom/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("custom-class");
  });

  it("renders with disabled state", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button", { name: /disabled/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:pointer-events-none disabled:opacity-50");
  });

  it("forwards ref to button element", () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button ref={ref}>Test</Button>);
    expect(ref.current).toBeInTheDocument();
  });

  it("renders with icon size", () => {
    render(<Button size="icon">+</Button>);
    const button = screen.getByRole("button", { name: /\+/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("h-8 w-8");
  });
});