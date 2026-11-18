import React, { useEffect, useRef, useState } from 'react';
import EmailSignIn from './EmailSignIn';
import { getMode, WORST_COPY } from '../lib/fixture';
import './LandingPage.css';

const DEMO_COPY = {
  heroTitle: 'Code anywhere.\nSet up nowhere.',
  heroLead: 'A full editor in your browser, with local Python, JavaScript and HTML preview, plus cloud runners ready.',
  runnersTitle: 'Two ways to run.',
  runnersLead: 'Python runs in this tab. Compiled languages run in a cloud sandbox.',
  rows: [
    ['Monaco editor', 'Syntax highlighting, completions and a command palette from VS Code.'],
    ['Tabs and folders', 'Open several files, create folders, rename and delete from the tree.'],
    ['Search across files', 'Find a line in your open tabs, or across the whole workspace.'],
    ['Integrated terminal', 'Run commands, inspect output and answer program input in the page.'],
    ['Email code sign in', 'A six digit code arrives by email. There is no password to remember.'],
  ],
  tagline: 'One tab for the code, the files and the run.',
  closeTitle: 'Start with an empty file.',
  closeLead: 'Sign in with your email and the editor is ready.',
  table: [
    ['Local runtimes', 'In this browser tab — Pyodide, Web Worker and sandboxed preview', 'Python, JavaScript, HTML'],
    ['JDoodle', 'Cloud sandbox', 'Python, JavaScript, Java, C, C++'],
    ['OnlineCompiler.io', 'Cloud sandbox', 'Python, TypeScript, Java, C, C++, SQL'],
  ],
};

function Tagline({ text }) {
  const wrapRef = useRef(null);
  const words = text.split(' ');

  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    root.classList.add('js');

    const spans = Array.from(root.querySelectorAll('.glp-word'));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('on');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    spans.forEach(span => observer.observe(span));
    return () => observer.disconnect();
  }, [text]);

  return (
    <p className="glp-tagline" ref={wrapRef}>
      {words.map((word, i) => (
        <React.Fragment key={i}>
          <span className="glp-word">{word}</span>{i < words.length - 1 ? ' ' : ''}
        </React.Fragment>
      ))}
    </p>
  );
}

export default function LandingPage({ onSignIn, onSendCode, onVerify }) {
  const [emailOpen, setEmailOpen] = useState(false);
  const copy = import.meta.env.DEV && getMode() === 'worst' ? WORST_COPY : DEMO_COPY;

  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') setEmailOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="glp">
      <a className="glp-skip" href="#main">Skip to content</a>

      <header className="glp-nav">
        <div className="container glp-nav-inner">
          <a className="glp-wordmark" href="#top" aria-label="GlobEditor, back to top">GlobEditor</a>
          <nav className="glp-navlinks" aria-label="Main">
            <a href="#runners">Runners</a>
            <a href="#workspace">Workspace</a>
          </nav>
          <button type="button" className="glp-nav-signin" onClick={() => setEmailOpen(true)}>Sign in with email</button>
        </div>
      </header>

      <main id="main">
        <section className="glp-hero" id="top">
          <div className="container glp-hero-grid">
            <div className="glp-hero-copy">
              <h1>{copy.heroTitle.split('\n').map((line, i) => (
                <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>
              ))}</h1>
              <p className="lead">{copy.heroLead}</p>
              <div className="glp-actions">
                <button type="button" className="glp-btn glp-btn-primary" onClick={() => setEmailOpen(true)}>Open the editor</button>
                <a className="glp-btn glp-btn-quiet" href="#runners">See how it runs</a>
              </div>
            </div>
            <div className="glp-hero-stage">
              <div className="glp-stage-card glp-stage-card-back" aria-hidden="true" />
              <div className="glp-stage-card glp-stage-card-front" aria-hidden="true" />
              <figure className="glp-shot">
                <img
                  src="/globeditor-ide.jpg"
                  alt="GlobEditor running in a browser tab with a Python file open and the integrated terminal showing its commands"
                  width={1296}
                  height={1006}
                  fetchPriority="high"
                />
                <figcaption>The editor, open in a browser tab</figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className="glp-runners" id="runners">
          <div className="container">
            <div className="glp-headsplit">
              <h2>{copy.runnersTitle}</h2>
              <p className="lead">{copy.runnersLead}</p>
            </div>
            <table className="glp-table">
              <caption className="visually-hidden">Where each language runs in GlobEditor</caption>
              <thead>
                <tr>
                  <th scope="col">Runner</th>
                  <th scope="col">Where it runs</th>
                  <th scope="col">Languages</th>
                </tr>
              </thead>
              <tbody>
                {copy.table.map(([name, where, languages], i) => (
                  <tr key={i}>
                    <th scope="row">{name}</th>
                    <td>{where}</td>
                    <td className="num">{languages}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="glp-workspace" id="workspace">
          <div className="container glp-rows-layout">
            <div className="glp-rows-head">
              <h2>Everything in one tab.</h2>
              <p className="lead">The editor keeps the files, the run and the output together.</p>
            </div>
            <div className="glp-rows">
              {copy.rows.map(([title, description], i) => (
                <div className="glp-row" key={i}>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="glp-tagline-section" id="about">
          <div className="container"><Tagline text={copy.tagline} /></div>
        </section>

        <section className="glp-close">
          <div className="container glp-close-inner">
            <h2>{copy.closeTitle}</h2>
            <p className="lead">{copy.closeLead}</p>
            <button type="button" className="glp-btn glp-btn-primary" onClick={() => setEmailOpen(true)}>Open the editor</button>
          </div>
        </section>
      </main>

      <footer className="glp-footer">
        <div className="container glp-footer-inner">
          <p className="glp-mast">GlobEditor</p>
          <nav className="glp-footer-links" aria-label="Footer">
            <a href="#runners">Runners</a>
            <a href="#workspace">Workspace</a>
            <a href="#about">About</a>
          </nav>
          <p className="glp-legal">A browser IDE for code, files and runs.</p>
        </div>
      </footer>

      {emailOpen && (
        <EmailSignIn
          onSendCode={onSendCode}
          onVerify={onVerify}
          onGoogle={onSignIn}
          onClose={() => setEmailOpen(false)}
        />
      )}
    </div>
  );
}
