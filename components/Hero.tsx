import StartButton from "./StartButton";

const disciplines = ["Discovery", "Design", "Engineering", "Launch", "Growth", "Intelligence"];

export default function Hero() {
  return (
    <section className="wrap hero" aria-labelledby="hero-heading">
      <div>
        <div className="kicker kicker-row">DISCOVER → DESIGN → BUILD → LAUNCH → GROW</div>
        <h1 id="hero-heading">You paid for a website. What you wanted was customers.</h1>
        <p className="lead">
          One team for the whole chain — web development, custom software, design, SEO and market
          intelligence.
          <span className="desk-only-i"> Most agencies do one link and hand you the rest.</span>
        </p>
        <div className="actions">
          <StartButton>Start a project →</StartButton>
          <a className="pill ghost" href="#services">
            See what we build ↓
          </a>
        </div>
      </div>
      <div className="hero-box">
        <div>
          <div className="kicker" style={{ color: "#a9a99f" }}>
            HOW WE WORK
          </div>
          <p className="hero-big">Start wherever you are. Buy only what you need.</p>
        </div>
        <div className="hero-tags">
          {disciplines.map((d) => (
            <span className="hero-tag" key={d}>
              {d}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
