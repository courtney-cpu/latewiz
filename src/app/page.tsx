"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/stores";
import { Logo } from "@/components/shared/logo";
import { Suspense } from "react";

function PortalEntry() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setDefaultProfileId } = useAppStore();

  useEffect(() => {
    const profileId = searchParams.get("profile");
    if (profileId) {
      setDefaultProfileId(profileId);
      router.push("/dashboard");
    }
  }, [searchParams, setDefaultProfileId, router]);

  const hasProfileId = !!searchParams.get("profile");

  if (hasProfileId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Logo size="md" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-4">
      <Logo size="lg" />
      <p className="text-muted-foreground mt-4">
        Please use the link provided by Just An Agent to access your portal.
      </p>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Logo size="md" /></div>}>
      <PortalEntry />
    </Suspense>
  );
}
