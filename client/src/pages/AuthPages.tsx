/* Login and Register screens. They call the ASP.NET API; the server enforces the rules
   (BCrypt passwords, 30 s lockout after 3 wrong tries). */
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { authApi, type AuthResponse } from "../api/server";
import { Screen } from "../components/Screen";
import { useGame } from "../state/GameContext";

const USERNAME = /^\w{2,20}$/;

function useSubmit(call: () => Promise<AuthResponse>, setErr: (m: string) => void) {
  const { signIn } = useGame();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  return {
    busy,
    run: async () => {
      setBusy(true);
      try {
        await signIn(await call());
        nav("/menu");
      } catch (e) {
        setErr((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
  };
}

export function LoginPage() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [badUser, setBadUser] = useState(false);
  const [badPass, setBadPass] = useState(false);
  const { busy, run } = useSubmit(() => authApi.login(user.trim(), pass), setErr);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    setBadUser(!USERNAME.test(user.trim()));
    if (!USERNAME.test(user.trim())) return setErr("Username: 2–20 letters, numbers or _.");
    setBadPass(!pass);
    if (!pass) return setErr("Enter your password.");
    setErr("");
    void run();
  }

  return (
    <Screen id="login">
      <form className="card auth" onSubmit={submit} noValidate>
        <h2>Log in</h2>
        <p className="sub">Welcome back, Captain.</p>
        <label htmlFor="lu">Username</label>
        <input id="lu" className={badUser ? "bad" : ""} autoComplete="username" value={user} onChange={(e) => setUser(e.target.value)} />
        <label htmlFor="lp">Password</label>
        <input id="lp" className={badPass ? "bad" : ""} type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} />
        <div className="err" id="lerr" role="alert">
          {err}
        </div>
        <div className="row" style={{ marginTop: 6 }}>
          <button type="submit" className="primary" id="lgo" disabled={busy}>
            {busy ? "Logging in…" : "Log in"}
          </button>
          <Link className="btn" to="/">
            Back
          </Link>
        </div>
        <p className="hint" style={{ marginTop: 12 }}>
          Three wrong passwords lock login for 30 seconds.
        </p>
      </form>
    </Screen>
  );
}

export function RegisterPage() {
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [bad, setBad] = useState<"user" | "email" | "pass" | "">("");
  const { busy, run } = useSubmit(() => authApi.register(user.trim(), email.trim(), pass), setErr);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setBad("email");
      return setErr("Enter a valid email.");
    }
    if (pass.length < 6) {
      setBad("pass");
      return setErr("Password needs at least 6 characters.");
    }
    if (!USERNAME.test(user.trim())) {
      setBad("user");
      return setErr("Username: 2–20 letters, numbers or _.");
    }
    setBad("");
    setErr("");
    void run();
  }

  return (
    <Screen id="register">
      <form className="card auth" onSubmit={submit} noValidate>
        <h2>Create account</h2>
        <p className="sub">Your progress is saved to your profile.</p>
        <label htmlFor="ru">Username</label>
        <input id="ru" className={bad === "user" ? "bad" : ""} autoComplete="username" value={user} onChange={(e) => setUser(e.target.value)} />
        <label htmlFor="re">Email</label>
        <input id="re" className={bad === "email" ? "bad" : ""} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="rp">Password</label>
        <input id="rp" className={bad === "pass" ? "bad" : ""} type="password" autoComplete="new-password" value={pass} onChange={(e) => setPass(e.target.value)} />
        <div className="err" id="rerr" role="alert">
          {err}
        </div>
        <div className="row" style={{ marginTop: 6 }}>
          <button type="submit" className="primary" id="rgo" disabled={busy}>
            {busy ? "Creating…" : "Create account"}
          </button>
          <Link className="btn" to="/">
            Back
          </Link>
        </div>
      </form>
    </Screen>
  );
}
