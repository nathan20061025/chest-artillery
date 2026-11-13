import { Link } from "react-router";
import { HubCard } from "../components/Screen";

const STEPS = [
  ["🎚", "1. Power", "Type the cannon power, a number from 30 to 100."],
  ["📐", "2. Angle", "Type the angle in degrees, from 10 to 80."],
  ["🌐", "3. Count", "Before the shot the game calls the fish API. Count the fish and press that digit."],
  ["🔥", "4. Fire", "Press Fire. A wrong count makes the shot wobble."],
  ["💨", "5. Wind and combo", "Wind pushes the ball. Correct counts in a row build a combo up to x3."],
  ["🏆", "6. Win", "Sink the rival ship before it sinks you."],
];

export default function HowPage() {
  return (
    <HubCard id="how" title="How to play" sub="Learn the game in 30 seconds.">
      <div className="tiles">
        {STEPS.map((x) => (
          <div key={x[1]} className="stat">
            <span style={{ fontSize: 28 }}>{x[0]}</span>
            <br />
            <b style={{ fontSize: 18 }}>{x[1]}</b>
            {x[2]}
          </div>
        ))}
      </div>
      <div className="row">
        <Link className="btn primary" to="/levels">
          Play now
        </Link>
      </div>
    </HubCard>
  );
}
