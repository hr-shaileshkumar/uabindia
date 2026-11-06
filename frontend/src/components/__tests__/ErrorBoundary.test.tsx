import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import ErrorBoundary from "../ErrorBoundary";

const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Simulated component explosion");
  }
  return <div>Component is functioning normally</div>;
};

describe("ErrorBoundary", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders children normally when no exception is thrown", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Component is functioning normally")).toBeInTheDocument();
  });

  it("catches errors in children and renders error boundary fallback UI", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary fallbackTitle="Custom Subtree Error Title">
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Custom Subtree Error Title")).toBeInTheDocument();
    expect(screen.getByText("Simulated component explosion")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reload screen/i })).toBeInTheDocument();

    spy.mockRestore();
  });

  it("resets error state when Try Again is clicked", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const onResetMock = vi.fn();

    render(
      <ErrorBoundary onReset={onResetMock}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();

    // Click Try Again button
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(onResetMock).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });
});
