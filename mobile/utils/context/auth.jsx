import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import getUserAuth, { clearUserAuth, setUserAuth } from "../userAuth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const restore = useCallback(async () => {
    setLoading(true);
    try {
      const saved = await getUserAuth();
      if (!saved?.accessToken) return setSession(null);
      const { data: user } = await api.get("/auth/me");
      const latestSession = await getUserAuth();
      const next = await setUserAuth({ ...latestSession, user, id: user._id || user.id, ...user });
      setSession(next);
    } catch {
      await clearUserAuth();
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { restore(); }, [restore]);

  const login = useCallback(async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    const basicUser = { id: data.id, name: data.name, email: data.email, role: data.role };
    const tokenSession = await setUserAuth({ ...data, accessToken: data.accessToken || data.auth_token, user: basicUser });
    let fullUser = basicUser;
    try { fullUser = (await api.get("/auth/me")).data; } catch { /* The issued session is still valid with basic login data. */ }
    const next = await setUserAuth({ ...tokenSession, ...fullUser, id: fullUser._id || fullUser.id, user: fullUser });
    setSession(next);
    return next;
  }, []);

  const register = useCallback(async (values) => (await api.post("/auth/register", values)).data, []);

  const logout = useCallback(async (allDevices = false) => {
    try {
      if (allDevices) await api.post("/auth/logout-all");
      else if (session?.refreshToken) await api.post("/auth/logout", { refreshToken: session.refreshToken });
    } finally {
      await clearUserAuth();
      setSession(null);
    }
  }, [session?.refreshToken]);

  const value = useMemo(() => ({ session, user: session?.user || session, loading, login, register, logout, restore }), [session, loading, login, register, logout, restore]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
