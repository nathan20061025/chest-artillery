import { HubCard } from "../components/Screen";
import { ITEMS } from "../game/data";
import { sfx } from "../game/sound";
import { useGame } from "../state/GameContext";

export default function ShopPage() {
  const { S, update, toast } = useGame();

  function buy(id: string) {
    const item = ITEMS.find((i) => i.id === id)!;
    if (S.items[id] || S.coins < item.price) return;
    update((s) => ({ ...s, coins: s.coins - item.price, items: { ...s.items, [id]: 1 } }));
    sfx.coin();
    toast(item.name + " bought!");
  }

  return (
    <HubCard id="shop" title="Arsenal" sub="Spend your coins on upgrades.">
      <p>
        <span className="chip">🪙 {S.coins}</span>
      </p>
      <div className="tiles">
        {ITEMS.map((i) => {
          const owned = !!S.items[i.id];
          return (
            <div key={i.id} className="btn tile" style={{ cursor: "default" }}>
              <span className="ic">{i.icon}</span>
              {i.name}
              <small>{i.desc}</small>
              <button style={{ marginTop: 10 }} disabled={owned || S.coins < i.price} onClick={() => buy(i.id)}>
                {owned ? "Owned ✓" : `Buy · ${i.price} 🪙`}
              </button>
            </div>
          );
        })}
      </div>
    </HubCard>
  );
}
