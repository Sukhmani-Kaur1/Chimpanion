const caps: [string, string][] = [
  ["Product", "Discovery · Requirements · Roadmaps"],
  ["Engineering", "Full-stack · Backend · APIs · Infrastructure"],
  ["Design", "UI/UX · Branding · Product design"],
  ["Data", "Pipelines · Market intelligence · Analytics"],
  ["Growth", "Media planning · Lead generation · SEO"],
  ["Sales", "Enablement · Qualification · Conversion"],
];

export default function Team() {
  return (
    <section className="section" id="team" aria-labelledby="team-heading">
      <div className="wrap">
        <div className="sectionhead">
          <div>
            <div className="kicker">THE TEAM</div>
            <h2 id="team-heading">A full team, without six salaries.</h2>
          </div>
          <p>On the stages you need, for the months you need them.</p>
        </div>
        <div className="caps">
          {caps.map(([name, detail]) => (
            <div className="cap" key={name}>
              <b>{name}</b>
              <span>{detail}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
