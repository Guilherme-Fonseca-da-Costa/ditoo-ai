import { useEffect, useState } from "react";
import { api } from "../services/api";

interface CurrentUser {
  email: string;
  username: string;
  role: string;
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMe().then((me) => {
      setUser(me);
      setLoading(false);
    });
  }, []);

  return { user, loading };
}