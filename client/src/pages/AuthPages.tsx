/* Login and Register screens.
   Prototype behaviour: any valid-looking username works. The ASP.NET backend will replace the
   body of submit() with a call to POST /api/auth/login and /api/auth/register. */
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Screen } from "../components/Screen";
import { useGame } from "../state/GameContext";

const USERNAME = /^\w{2,20}$/;

export function LoginPage() {
  const { update } = useGame();
  const nav = useNavigate();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [badUser, setBadUser] = useState(false);
  const [badPass, setBadPass] = useState(false);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const n = user.trim();
    setBadUser(!USERNAME.test(n));
    if (!USERNAME.test(n)) return setErr("Username: 2–20 letters, numbers or _.");
    setBadPass(!pass);
    if (!pass) return setErr("Enter your password.");
    update((s) => ({ ...s, name: n }));
    nav("/menu");
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
          <button type="submit" className="primary" id="lgo">
            Log in
          </button>
          <Link className="btn" to="/">
            Back
          </Link>
        </div>
        <p className="hint" style={{ marginTop: 12 }}>
          Prototype: any username and password works. Real game locks login for 30 s after 3 wrong tries.
        </p>
      </form>
    </Screen>
  );
}

export function RegisterPage() {
  const { update } = useGame();
  const nav = useNavigate();
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [bad, setBad] = useState<"user" | "email" | "pass" | "">("");

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
    const n = user.trim();
    if (!USERNAME.test(n)) {
      setBad("user");
      return setErr("Username: 2–20 letters, numbers or _.");
    }
    update((s) => ({ ...s, name: n }));
    nav("/menu");
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
          <button type="submit" className="primary" id="rgo">
            Create account
          </button>
          <Link className="btn" to="/">
            Back
          </Link>
        </div>
      </form>
    </Screen>
  );
}
