import StartButton from "./StartButton";
import { site, waLink } from "@/lib/site";

export default function Contact() {
  return (
    <section className="section" id="contact" aria-labelledby="contact-heading">
      <div className="wrap">
        <div className="sectionhead">
          <div>
            <div className="kicker">CONTACT</div>
            <h2 id="contact-heading">Talk to the people who&apos;d do the work.</h2>
          </div>
        </div>

        <div className="contactgrid">
          <a className="contactcard" href={`mailto:${site.email}`}>
            <span className="small">EMAIL</span>
            <b>{site.email}</b>
            <span className="cmeta">Detailed requirements. Reply within a working day.</span>
          </a>
          <a className="contactcard" href={waLink} target="_blank" rel="noopener noreferrer">
            <span className="small">WHATSAPP</span>
            <b>{site.whatsappDisplay}</b>
            <span className="cmeta">Quick questions.</span>
          </a>
          <a className="contactcard" href={site.linkedin} target="_blank" rel="noopener noreferrer">
            <span className="small">LINKEDIN</span>
            <b>/chimpanion</b>
            <span className="cmeta">What we publish.</span>
          </a>
        </div>

        <div className="contactnote">
          <p>
            <b>Want a number first?</b> The planner asks nine questions and returns a costed range
            with the hours behind it.
          </p>
          <StartButton>Scope my project →</StartButton>
        </div>
      </div>
    </section>
  );
}
