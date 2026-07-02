"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function YogaRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/routine");
  }, [router]);

  return <div className="page" />;
}
