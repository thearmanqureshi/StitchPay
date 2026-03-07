"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setReady(true);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const updatePassword = async () => {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      alert("Password update failed");
      return;
    }

    alert("Password updated successfully");
    router.push("/login");
  };

  if (!ready) {
    return <p>Validating reset link...</p>;
  }

  return (
    <div style={{ padding: 40, maxWidth: 400, margin: "auto" }}>
      <h2>Set a new password</h2>

      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={updatePassword}>
        Update Password
      </button>
    </div>
  );
}