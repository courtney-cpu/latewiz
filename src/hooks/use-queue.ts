import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentProfileId } from "./use-profiles";

export const queueKeys = {
  all: ["queue"] as const,
  queues: (profileId: string) => ["queue", "queues", profileId] as const,
  slots: (profileId: string) => ["queue", "slots", profileId] as const,
  preview: (profileId: string, count: number) =>
    ["queue", "preview", profileId, count] as const,
  nextSlot: (profileId: string) => ["queue", "nextSlot", profileId] as const,
};

export interface QueueSlot {
  dayOfWeek: number;
  time?: string;
  hour?: number;
  minute?: number;
}

export interface QueueSchedule {
  _id?: string;
  profileId?: string;
  name?: string;
  timezone?: string;
  slots?: QueueSlot[];
  active?: boolean;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
  nextSlots?: string[];
}

export function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

export function parseTime(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(":").map(Number);
  return { hour: hour || 0, minute: minute || 0 };
}

export function getSlotTime(slot: QueueSlot): string {
  if (slot.time) return slot.time;
  if (typeof slot.hour === "number" && typeof slot.minute === "number") {
    return formatTime(slot.hour, slot.minute);
  }
  return "00:00";
}

export function normalizeSlot(slot: QueueSlot): QueueSlot {
  return { dayOfWeek: slot.dayOfWeek, time: getSlotTime(slot) };
}

export function useQueues(profileId?: string) {
  const currentProfileId = useCurrentProfileId();
  const targetProfileId = profileId || currentProfileId;

  return useQuery({
    queryKey: queueKeys.queues(targetProfileId || ""),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (targetProfileId) params.set("profileId", targetProfileId);
      params.set("all", "true");
      const res = await fetch(`/api/zernio/queue?${params}`);
      if (!res.ok) throw new Error("Failed to fetch queues");
      return res.json() as Promise<{ queues?: QueueSchedule[]; count?: number }>;
    },
    enabled: !!targetProfileId,
  });
}

export function useQueueSlots(profileId?: string, queueId?: string) {
  const currentProfileId = useCurrentProfileId();
  const targetProfileId = profileId || currentProfileId;

  return useQuery({
    queryKey: queueKeys.slots(targetProfileId || ""),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (targetProfileId) params.set("profileId", targetProfileId);
      if (queueId) params.set("queueId", queueId);
      const res = await fetch(`/api/zernio/queue?${params}`);
      if (!res.ok) throw new Error("Failed to fetch queue slots");
      return res.json() as Promise<{
        exists?: boolean;
        schedule?: QueueSchedule;
        nextSlots?: string[];
      }>;
    },
    enabled: !!targetProfileId,
  });
}

export function useQueuePreview(count = 10, profileId?: string) {
  const currentProfileId = useCurrentProfileId();
  const targetProfileId = profileId || currentProfileId;

  return useQuery({
    queryKey: queueKeys.preview(targetProfileId || "", count),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (targetProfileId) params.set("profileId", targetProfileId);
      params.set("count", String(count));
      const res = await fetch(`/api/zernio/queue/preview?${params}`);
      if (!res.ok) throw new Error("Failed to preview queue");
      return res.json() as Promise<{
        profileId?: string;
        count?: number;
        slots?: string[];
      }>;
    },
    enabled: !!targetProfileId,
  });
}

export function useNextQueueSlot(profileId?: string, queueId?: string) {
  const currentProfileId = useCurrentProfileId();
  const targetProfileId = profileId || currentProfileId;

  return useQuery({
    queryKey: queueKeys.nextSlot(targetProfileId || ""),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (targetProfileId) params.set("profileId", targetProfileId);
      if (queueId) params.set("queueId", queueId);
      const res = await fetch(`/api/zernio/queue/next?${params}`);
      if (!res.ok) throw new Error("Failed to get next queue slot");
      return res.json() as Promise<{
        profileId?: string;
        nextSlot?: string;
        timezone?: string;
        queueId?: string;
        queueName?: string;
      }>;
    },
    enabled: !!targetProfileId,
  });
}

export function useCreateQueue() {
  const queryClient = useQueryClient();
  const currentProfileId = useCurrentProfileId();

  return useMutation({
    mutationFn: async ({
      name,
      timezone,
      slots,
      active = true,
      profileId,
    }: {
      name: string;
      timezone: string;
      slots: QueueSlot[];
      active?: boolean;
      profileId?: string;
    }) => {
      const targetProfileId = profileId || currentProfileId;
      if (!targetProfileId) throw new Error("No profile selected");
      const res = await fetch("/api/zernio/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: targetProfileId, name, timezone, slots, active }),
      });
      if (!res.ok) throw new Error("Failed to create queue");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.all });
    },
  });
}

export function useUpdateQueueSlots() {
  const queryClient = useQueryClient();
  const currentProfileId = useCurrentProfileId();

  return useMutation({
    mutationFn: async ({
      slots,
      profileId,
      queueId,
      name,
      timezone,
      active,
      setAsDefault,
      reshuffleExisting,
    }: {
      slots: QueueSlot[];
      profileId?: string;
      queueId?: string;
      name?: string;
      timezone?: string;
      active?: boolean;
      setAsDefault?: boolean;
      reshuffleExisting?: boolean;
    }) => {
      const targetProfileId = profileId || currentProfileId;
      if (!targetProfileId) throw new Error("No profile selected");
      const res = await fetch("/api/zernio/queue", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: targetProfileId,
          queueId,
          name,
          timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          slots,
          active,
          setAsDefault,
          reshuffleExisting,
        }),
      });
      if (!res.ok) throw new Error("Failed to update queue slots");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.all });
    },
  });
}

export function useUpdateQueue() {
  const queryClient = useQueryClient();
  const currentProfileId = useCurrentProfileId();

  return useMutation({
    mutationFn: async ({
      queueId,
      name,
      timezone,
      slots,
      active,
      setAsDefault,
      profileId,
    }: {
      queueId: string;
      name?: string;
      timezone?: string;
      slots?: QueueSlot[];
      active?: boolean;
      setAsDefault?: boolean;
      profileId?: string;
    }) => {
      const targetProfileId = profileId || currentProfileId;
      if (!targetProfileId) throw new Error("No profile selected");

      // Fetch current queue to preserve existing values
      const params = new URLSearchParams();
      params.set("profileId", targetProfileId);
      params.set("queueId", queueId);
      const getRes = await fetch(`/api/zernio/queue?${params}`);
      const current = await getRes.json();
      const currentSchedule = (current as { schedule?: QueueSchedule })?.schedule;

      const res = await fetch("/api/zernio/queue", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: targetProfileId,
          queueId,
          name: name ?? currentSchedule?.name,
          timezone:
            timezone ??
            currentSchedule?.timezone ??
            Intl.DateTimeFormat().resolvedOptions().timeZone,
          slots: slots ?? currentSchedule?.slots ?? [],
          active,
          setAsDefault,
        }),
      });
      if (!res.ok) throw new Error("Failed to update queue");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.all });
    },
  });
}

export function useDeleteQueue() {
  const queryClient = useQueryClient();
  const currentProfileId = useCurrentProfileId();

  return useMutation({
    mutationFn: async ({ queueId, profileId }: { queueId: string; profileId?: string }) => {
      const targetProfileId = profileId || currentProfileId;
      if (!targetProfileId) throw new Error("No profile selected");
      const params = new URLSearchParams();
      params.set("profileId", targetProfileId);
      params.set("queueId", queueId);
      const res = await fetch(`/api/zernio/queue?${params}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete queue");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.all });
    },
  });
}

export function useToggleQueueActive() {
  const updateQueue = useUpdateQueue();
  return useMutation({
    mutationFn: async ({
      queueId,
      active,
      profileId,
    }: {
      queueId: string;
      active: boolean;
      profileId?: string;
    }) => updateQueue.mutateAsync({ queueId, active, profileId }),
  });
}

export function useSetDefaultQueue() {
  const updateQueue = useUpdateQueue();
  return useMutation({
    mutationFn: async ({ queueId, profileId }: { queueId: string; profileId?: string }) =>
      updateQueue.mutateAsync({ queueId, setAsDefault: true, profileId }),
  });
}

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const DAYS_OF_WEEK_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function formatQueueSlot(slot: QueueSlot): string {
  const day = DAYS_OF_WEEK[slot.dayOfWeek];
  return `${day} at ${slot.time}`;
}

export {
  COMMON_TIMEZONES,
  getUserTimezone,
  getTimezoneOptions,
  formatTimezoneDisplay,
} from "@/lib/timezones";
