import type { ReactNode } from "react";
import { Link } from "react-router";

/** One full-page view. The prototype's `.screen.on` class gives it the fade-in animation. */
export function Screen({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section className="screen on" id={id}>
      {children}
    </section>
  );
}

/** Card used by the menu sub-pages (levels, shop, profile, ...) with a "Back to menu" button. */
export function HubCard({
  id,
  title,
  sub,
  children,
}: {
  id: string;
  title: string;
  sub?: string;
  children: ReactNode;
}) {
  return (
    <Screen id={id}>
      <div className="card">
        <h2>{title}</h2>
        <p className="sub">{sub}</p>
        <div id={id + "B"}>{children}</div>
        <div className="row">
          <Link className="btn" to="/menu">
            Back to menu
          </Link>
        </div>
      </div>
    </Screen>
  );
}
