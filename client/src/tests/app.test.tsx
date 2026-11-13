import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import App from "../App";
import { GameProvider } from "../state/GameContext";

HTMLCanvasElement.prototype.getContext = (() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <GameProvider>
        <App />
      </GameProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => localStorage.clear());

describe("app", () => {
  it("shows the start screen with the three entry buttons", () => {
    renderAt("/");
    expect(screen.getByRole("heading", { name: /count the fish/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /play as guest/i })).toBeInTheDocument();
  });

  it("guest login lands on the menu with 7 tiles", async () => {
    renderAt("/");
    await userEvent.click(screen.getByRole("button", { name: /play as guest/i }));
    expect(await screen.findByText(/welcome, guest/i)).toBeInTheDocument();
    expect(document.querySelectorAll("#mt .tile")).toHaveLength(7);
  });

  it("login validates the username", async () => {
    renderAt("/login");
    await userEvent.click(screen.getByRole("button", { name: /^log in$/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/username/i);
  });

  it("only level 1 is unlocked at the start", () => {
    renderAt("/levels");
    const tiles = document.querySelectorAll<HTMLButtonElement>("#levelsB .tile");
    expect(tiles).toHaveLength(5);
    expect(tiles[0].disabled).toBe(false);
    expect(tiles[1].disabled).toBe(true);
  });

  it("the end screen redirects to the menu when there is no result", () => {
    renderAt("/end");
    expect(screen.getByText(/choose your next move/i)).toBeInTheDocument();
  });
});
