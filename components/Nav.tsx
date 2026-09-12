import StartButton from "./StartButton";

export default function Nav() {
  return (
    <nav className="nav" aria-label="Main">
      <div className="navin">
        <a className="logo" href="/" aria-label="Chimpanion home">
          CHIMPANION<b>.</b>
        </a>
        <div className="navlinks">
          <a href="/#services">Services</a>
          <a href="/#team">Team</a>
          <a href="/#faq">FAQ</a>
          <a href="/#contact">Contact</a>
        </div>
        <StartButton variant="dark">Start a project →</StartButton>
      </div>
    </nav>
  );
}
