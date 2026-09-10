const today = [
  "Directory leads that go cold in a day",
  "Quotations typed by hand into WhatsApp",
  "No idea which designs actually sell",
  "Every showroom on its own spreadsheet",
];

const withUs = [
  "A catalogue that qualifies leads before anyone calls",
  "Quotations generated from the CRM in two minutes",
  "One dashboard: what sells, by design and by branch",
  "One system every showroom logs into",
];

const promises = [
  "We scope what solves the problem — not inflated to match a budget you mentioned, not shrunk to win the deal.",
  "Your domain, hosting, ad accounts and data stay in your name, from day one.",
  "Ad spend, hosting and licences go on your card at cost. No markup.",
  "No guaranteed rankings or lead numbers. We'll tell you what's realistic before you pay.",
];

export default function ExampleAndTrust() {
  return (
    <section className="section" aria-labelledby="example-heading">
      <div className="wrap split">
        <div className="example" id="example">
          <div className="kicker">EXAMPLE: A MODULAR KITCHEN BUSINESS</div>
          <h2 id="example-heading">Don&apos;t buy a website. Buy a faster sales cycle.</h2>
          <div className="ba">
            <div>
              <b>TODAY</b>
              {today.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
            <div>
              <b>WITH US</b>
              {withUs.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
          </div>
        </div>
        <div className="panel" id="trust">
          <div className="kicker">WHAT YOU PAY FOR</div>
          <h2>And what you don&apos;t.</h2>
          {promises.map((p) => (
            <div className="check" key={p}>
              <i>✓</i>
              <span>{p}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
