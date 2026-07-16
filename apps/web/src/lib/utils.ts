import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Keep graph bubbles visually consistent; importance is shown in detail panels,
 * not by changing node size.
 */
export function getBubbleRadius(_importance: number): number {
  return 38;
}
type BubblePalette = {
  surface: string;
  stroke: string;
  text: string;
};

/** Returns the flower-inspired visual palette for a memory node. */
function getBubblePalette(
  type: "semantic" | "bubble",
  _createdAt?: string,
  _useConstantColor: boolean = false
): BubblePalette {
  if (type === "semantic") {
    return { surface: "#82dd9a", stroke: "#43ac62", text: "#17331f" };
  }

  return { surface: "#7057c7", stroke: "#46358a", text: "#ffffff" };
}

export function getBubbleColor(
  type: "semantic" | "bubble",
  createdAt?: string,
  useConstantColor: boolean = false
): string {
  return getBubblePalette(type, createdAt, useConstantColor).surface;
}

export function getBubbleStrokeColor(
  type: "semantic" | "bubble",
  createdAt?: string,
  useConstantColor: boolean = false
): string {
  return getBubblePalette(type, createdAt, useConstantColor).stroke;
}

export function getBubbleTextColor(type: "semantic" | "bubble"): string {
  return getBubblePalette(type).text;
}

/**
 * Calculate connection opacity based on strength
 */
export function getConnectionOpacity(strength: number): number {
  const minOpacity = 0.05;
  const maxOpacity = 0.35;
  const clampedStrength = Math.max(0, Math.min(1, strength));
  return minOpacity + clampedStrength * (maxOpacity - minOpacity);
}

/**
 * Calculate connection line thickness based on strength
 */
export function getConnectionThickness(strength: number): number {
  const minThickness = 1;
  const maxThickness = 4;
  const clampedStrength = Math.max(0, Math.min(1, strength));
  return minThickness + clampedStrength * (maxThickness - minThickness);
}

/**
 * Format timestamp to relative time
 */
export function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const date = new Date(timestamp).getTime();
  const diff = now - date;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}
