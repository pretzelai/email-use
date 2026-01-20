import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

// Gmail accepted label colors: background -> text color
export const GMAIL_LABEL_COLORS: Record<string, string> = {
  "#000000": "#ffffff", "#434343": "#ffffff", "#464646": "#ffffff", "#666666": "#ffffff",
  "#999999": "#000000", "#c2c2c2": "#000000", "#cccccc": "#000000", "#e7e7e7": "#000000",
  "#efefef": "#000000", "#f3f3f3": "#000000", "#ffffff": "#000000",
  "#fb4c2f": "#ffffff", "#e66550": "#ffffff", "#cc3a21": "#ffffff", "#ac2b16": "#ffffff",
  "#822111": "#ffffff", "#8a1c0a": "#ffffff", "#efa093": "#000000", "#f6c5be": "#000000",
  "#f2b2a8": "#000000", "#ffad47": "#000000", "#ffad46": "#000000", "#ffbc6b": "#000000",
  "#eaa041": "#000000", "#ff7537": "#000000", "#ffd6a2": "#000000", "#ffe6c7": "#000000",
  "#ffc8af": "#000000", "#ffdeb5": "#000000", "#7a2e0b": "#ffffff", "#cf8933": "#000000",
  "#a46a21": "#ffffff", "#7a4706": "#ffffff", "#fad165": "#000000", "#fcda83": "#000000",
  "#f2c960": "#000000", "#fce8b3": "#000000", "#fef1d1": "#000000", "#fbe983": "#000000",
  "#fdedc1": "#000000", "#d5ae49": "#000000", "#aa8831": "#ffffff", "#594c05": "#ffffff",
  "#684e07": "#ffffff", "#16a766": "#ffffff", "#16a765": "#ffffff", "#43d692": "#000000",
  "#42d692": "#000000", "#44b984": "#ffffff", "#68dfa9": "#000000", "#149e60": "#ffffff",
  "#3dc789": "#000000", "#0b804b": "#ffffff", "#2a9c68": "#ffffff", "#076239": "#ffffff",
  "#1a764d": "#ffffff", "#0b4f30": "#ffffff", "#04502e": "#ffffff", "#094228": "#ffffff",
  "#89d3b2": "#000000", "#a0eac9": "#000000", "#b9e4d0": "#000000", "#c6f3de": "#000000",
  "#b3efd3": "#000000", "#a2dcc1": "#000000", "#2da2bb": "#ffffff", "#0d3b44": "#ffffff",
  "#98d7e4": "#000000", "#4a86e8": "#ffffff", "#4986e7": "#ffffff", "#6d9eeb": "#ffffff",
  "#3c78d8": "#ffffff", "#285bac": "#ffffff", "#1c4587": "#ffffff", "#0d3472": "#ffffff",
  "#a4c2f4": "#000000", "#c9daf8": "#000000", "#b6cff5": "#000000", "#a479e2": "#ffffff",
  "#b694e8": "#ffffff", "#8e63ce": "#ffffff", "#653e9b": "#ffffff", "#41236d": "#ffffff",
  "#3d188e": "#ffffff", "#b99aff": "#000000", "#d0bcf1": "#000000", "#e4d7f5": "#000000",
  "#e3d7ff": "#000000", "#f691b3": "#000000", "#f691b2": "#000000", "#f7a7c0": "#000000",
  "#e07798": "#ffffff", "#b65775": "#ffffff", "#83334c": "#ffffff", "#994a64": "#ffffff",
  "#711a36": "#ffffff", "#662e37": "#ffffff", "#fbc8d9": "#000000", "#fcdee8": "#000000",
  "#fbd3e0": "#000000", "#ebdbde": "#000000", "#cca6ac": "#000000",
};