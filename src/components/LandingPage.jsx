import React, { useEffect, useRef, useState } from 'react';
import EmailSignIn from './EmailSignIn';
import './LandingPage.css';

const WORDS = 'One tab for the code, the files and the run.'.split(' ');

function Tagline() {
  const wrapRef = useRef(null);

  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    root.classList.add('js');

    const words = Array.from(root.querySelectorAll('.glp-word'));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('on');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    words.forEach((word) => observer.observe(word));
    return () => observer.disconnect();
  }, []);

  return (
    <p className="glp-tagline" ref={wrapRef}>
      {WORDS.map((word, i) => (
        <React.Fragment key={i}>
          <span className="glp-word">{word}</span>{i < WORDS.length - 1 ? ' ' : ''}
        </React.Fragment>
      ))}
    </p>
  );
}

export default function LandingPage({ onSignIn, onSendCode, onVerify }) {
  const [emailOpen, setEmailOpen] = useState(false);

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
              <h1>Code anywhere.<br />Set up nowhere.</h1>
              <p className="lead">A full editor in your browser, with Python and cloud runners ready.</p>
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
              <h2>Two ways to run.</h2>
              <p className="lead">Python runs in this tab. Compiled languages run in a cloud sandbox.</p>
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
                <tr>
                  <th scope="row">Local Python</th>
                  <td>In this browser tab, with Pyodide</td>
                  <td className="num">Python</td>
                </tr>
                <tr>
                  <th scope="row">JDoodle</th>
                  <td>Cloud sandbox</td>
                  <td className="num">Python, JavaScript, Java, C, C++</td>
                </tr>
                <tr>
                  <th scope="row">OnlineCompiler.io</th>
                  <td>Cloud sandbox</td>
                  <td className="num">Python, TypeScript, Java, C, C++, SQL</td>
                </tr>
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
              <div className="glp-row">
                <h3>Monaco editor</h3>
                <p>Syntax highlighting, completions and a command palette from VS Code.</p>
              </div>
              <div className="glp-row">
                <h3>Tabs and folders</h3>
                <p>Open several files, create folders, rename and delete from the tree.</p>
              </div>
              <div className="glp-row">
                <h3>Search across files</h3>
                <p>Find a line in your open tabs, or across the whole workspace.</p>
              </div>
              <div className="glp-row">
                <h3>Integrated terminal</h3>
                <p>Run commands, inspect output and answer program input in the page.</p>
              </div>
              <div className="glp-row">
                <h3>Email code sign in</h3>
                <p>A six digit code arrives by email. There is no password to remember.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="glp-tagline-section" id="about">
          <div className="container">
            <Tagline />
          </div>
        </section>

        <section className="glp-close">
          <div className="container glp-close-inner">
            <h2>Start with an empty file.</h2>
            <p className="lead">Sign in with your email and the editor is ready.</p>
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
