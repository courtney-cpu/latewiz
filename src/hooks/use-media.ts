import { useMutation } from "@tanstack/react-query";

export interface UploadedMedia {
  url: string;
  type: "image" | "video";
  filename: string;
  contentType: string;
}

export function useMediaPresign() {
  return useMutation({
    mutationFn: async ({
      filename,
      contentType,
    }: {
      filename: string;
      contentType: string;
    }) => {
      const res = await fetch("/api/zernio/media/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, contentType }),
      });
      if (!res.ok) throw new Error("Failed to get upload URL");
      return res.json();
    },
  });
}

export function useUploadMedia() {
  const presignMutation = useMediaPresign();

  return useMutation({
    mutationFn: async (file: File): Promise<UploadedMedia> => {
      const presignData = await presignMutation.mutateAsync({
        filename: file.name,
        contentType: file.type,
      });

      if (!presignData?.uploadUrl || !presignData?.publicUrl) {
        throw new Error("Failed to get upload URL");
      }

      const uploadResponse = await fetch(presignData.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) throw new Error("Failed to upload file");

      return {
        url: presignData.publicUrl,
        type: file.type.startsWith("video/") ? "video" : "image",
        filename: file.name,
        contentType: file.type,
      };
    },
  });
}

export function useUploadMultipleMedia() {
  const uploadMutation = useUploadMedia();

  return useMutation({
    mutationFn: async (files: File[]): Promise<UploadedMedia[]> =>
      Promise.all(files.map((file) => uploadMutation.mutateAsync(file))),
  });
}

export function getMediaType(mimeType: string): "image" | "video" {
  return mimeType.startsWith("video/") ? "video" : "image";
}

export function isValidMediaType(file: File): boolean {
  const validTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
  ];
  return validTypes.includes(file.type);
}

export function getMaxFileSize(type: "image" | "video"): number {
  return type === "video" ? 5 * 1024 * 1024 * 1024 : 10 * 1024 * 1024;
}
