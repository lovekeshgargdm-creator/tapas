"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  currentStoredAppData,
  prepareSignedInUser,
  saveCloudUserState,
} from "@/lib/supabaseSync";
import { selectStoredAppData, useStore } from "@/lib/store";
import { resetInstallCardsForNextLogin } from "@/lib/install";

export function SupabaseBridge() {
  const hydrated = useStore((s) => s.hydrated);
  const snapshotKey = useStore((s) => JSON.stringify(selectStoredAppData(s)));
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [readyToSync, setReadyToSync] = useState(false);

  useEffect(() => {
    if (!hydrated) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let active = true;

    const applyUser = async (userId?: string | null) => {
      if (!userId) {
        setActiveUserId(null);
        setReadyToSync(false);
        return;
      }

      setReadyToSync(false);
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user || !active) return;

      try {
        await prepareSignedInUser(data.user);
        if (!active) return;
        setActiveUserId(data.user.id);
        setReadyToSync(true);
      } catch (err) {
        console.error("Supabase state load failed", err);
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      void applyUser(data.session?.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setActiveUserId(null);
        setReadyToSync(false);
        resetInstallCardsForNextLogin();
        useStore.getState().logout();
        return;
      }
      void applyUser(session?.user.id);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [hydrated]);

  useEffect(() => {
    if (!activeUserId || !readyToSync) return;

    const timer = window.setTimeout(() => {
      saveCloudUserState(activeUserId, currentStoredAppData()).catch((err) => {
        console.error("Supabase state save failed", err);
      });
    }, 700);

    return () => window.clearTimeout(timer);
  }, [activeUserId, readyToSync, snapshotKey]);

  return null;
}
