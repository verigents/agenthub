import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const IDENTITY_REGISTRY_ADDRESS =
  process.env.NEXT_PUBLIC_IDENTITY_REGISTRY_ADDRESS ||
  "0x8004a6090Cd10A7288092483047B097295Fb8847";

export const REPUTATION_REGISTRY_ADDRESS =
  process.env.NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS ||
  "0x8004B8FD1A363aa02fDC07635C0c5F94f6Af5B7E";

export const VALIDATION_REGISTRY_ADDRESS =
  process.env.NEXT_PUBLIC_VALIDATION_REGISTRY_ADDRESS ||
  "0x8004CB39f29c09145F24Ad9dDe2A108C1A2cdfC5";
