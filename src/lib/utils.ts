import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function randomPlayerName(): string {
  const names = [
    "Alex", "Jordan", "Casey", "Riley", "Morgan", "Avery",
    "Quinn", "Taylor", "Drew", "Blake", "Cameron", "Hayden",
    "Reese", "Skyler", "Dakota", "Emerson"
  ]
  return names[Math.floor(Math.random() * names.length)] + " (Auto)"
}

export function generateTeamName(player1: string, player2: string): string {
  return `${player1} & ${player2}`
}
