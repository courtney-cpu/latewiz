import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  timezone: string;
  defaultProfileId: string | null;
  sidebarOpen: boolean;
  hasHydrated: boolean;

  setTimezone: (timezone: string) => void;
  setDefaultProfileId: (profileId: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setHasHydrated: (hydrated: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      defaultProfileId: null,
      sidebarOpen: true,
      hasHydrated: false,

      setTimezone: (timezone) => set({ timezone }),
      setDefaultProfileId: (profileId) => set({ defaultProfileId: profileId }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
    }),
    {
      name: "jaa-app",
      partialize: (state) => ({
        timezone: state.timezone,
        defaultProfileId: state.defaultProfileId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHasHydrated(true);
      },
    }
  )
);
