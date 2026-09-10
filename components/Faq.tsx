import { faqs } from "@/lib/faq";

export default function Faq() {
  return (
    <section className="section" id="faq" aria-labelledby="faq-heading">
      <div className="wrap">
        <div className="sectionhead">
          <div>
            <div className="kicker">COMMON QUESTIONS</div>
            <h2 id="faq-heading">The things people ask before they call.</h2>
          </div>
        </div>
        <div className="faqlist">
          {faqs.map(({ q, a }) => (
            <details className="faqitem" key={q}>
              <summary>
                <h3>{q}</h3>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
