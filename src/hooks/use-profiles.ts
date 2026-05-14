import { useAppStore } from "@/stores";

export const profileKeys = {
  all: ["profiles"] as const,
};

/**
 * Returns the profile ID locked in from the URL on app entry.
 * No API call needed — profileId is set once via the entry page.
 */
export function useCurrentProfileId(): string | undefined {
  const { defaultProfileId } = useAppStore();
  return defaultProfileId ?? undefined;
}
