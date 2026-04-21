import React, { useEffect, useRef } from 'react';
import {
  Code, Zap, Cloud, Layers,
  ArrowRight, Check, Sparkles, Rocket, Globe
} from 'lucide-react';
import './LandingPage.css';

// ─────────────────────────────────────────────────────
//  Google "G" mark
// ─────────────────────────────────────────────────────
function GoogleMark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────
//  Brand / Language icons (simple recognizable glyphs)
// ─────────────────────────────────────────────────────
function PythonIcon() {
  return (
    <svg viewBox="0 0 48 48" className="lp-tech-icon" aria-hidden="true">
      <defs>
        <linearGradient id="py-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5A9FD4"/><stop offset="1" stopColor="#306998"/>
        </linearGradient>
        <linearGradient id="py-yellow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFE873"/><stop offset="1" stopColor="#FFD43B"/>
        </linearGradient>
      </defs>
      <path fill="url(#py-blue)" d="M24 4c-5 0-9 .8-9 5v6h10v2H11c-4 0-7 2.5-7 8s3 8 7 8h3v-6c0-4 3-7 7-7h10c3 0 5-2 5-5V9c0-3-3-5-7-5h-5zm-5 3a2 2 0 110 4 2 2 0 010-4z"/>
      <path fill="url(#py-yellow)" d="M24 44c5 0 9-.8 9-5v-6H23v-2h14c4 0 7-2.5 7-8s-3-8-7-8h-3v6c0 4-3 7-7 7H17c-3 0-5 2-5 5v9c0 3 3 5 7 5h5zm5-3a2 2 0 110-4 2 2 0 010 4z"/>
    </svg>
  );
}
function JavaIcon() {
  return (
    <svg viewBox="0 0 48 48" className="lp-tech-icon" aria-hidden="true">
      <path fill="#E76F00" d="M17.2 30.6c-1.7 1 .7 1.7 7.3 2.1 6.6.4 13.5-.1 18.3-.7 0 0-1.9 1.3-5.1 2-9.4 1.9-27.6 1.2-22.8-1.4 1-.6 2.3-.8 2.3-.8z"/>
      <path fill="#E76F00" d="M15.7 23.5c-2 1.4.9 2.1 7 2.7 6.1.6 13.9.4 20-.4 0 0-1.6 1.4-5 1.9-11 1.7-25 .9-22-.1 1-.3 2-.5 2-.5z"/>
      <path fill="#5382A1" d="M30 11c3.6 4.2-.9 8-0.9 8s9.1-4.7 4.9-10.5c-3.9-5.4-6.9-8-9.4-3 0 0 4 3 5.4 5.5zM35.6 36s1.7 1.4-1.9 2.5c-6.8 2.1-28.2 2.7-34.2.1-2.2-.9 1.9-2.3 3.2-2.5 1.3-.3 2-.2 2-.2-2.4-1.7-15.6 3.4-6.7 4.9 24.1 3.9 44-1.8 37.6-4.8zM18 19c-2 1.4-12.3 6.6-5 7.4 3 .4 9.2.3 14.9-.2 4.7-.4 9.4-1.2 9.4-1.2s-1.7.8-2.9 1.6c-12.5 3.3-36.7 1.8-29.7-1.6 5.9-2.8 8.3-2.6 8.3-2.6"/>
      <path fill="#E76F00" d="M21 41c-8 .6-16-0-16-.9 0-.9 4.2-1.9 9.5-2 3.1 0 6.1.4 6.1.4s-3 1.9-3.5 2.1c-1.6.6 1.6.5 3.9.4z"/>
    </svg>
  );
}
function CppIcon() {
  return (
    <svg viewBox="0 0 48 48" className="lp-tech-icon" aria-hidden="true">
      <path fill="#00599C" d="M24 4L6 14.5v19L24 44l18-10.5v-19L24 4z"/>
      <path fill="#004482" d="M24 4v40l18-10.5v-19L24 4z"/>
      <path fill="#fff" d="M24 34c-5.5 0-10-4.5-10-10s4.5-10 10-10c3.6 0 6.8 1.9 8.6 4.8l-4.3 2.5c-.9-1.5-2.5-2.5-4.3-2.5-2.8 0-5 2.2-5 5s2.2 5 5 5c1.8 0 3.4-1 4.3-2.5l4.3 2.5c-1.8 2.9-5 4.8-8.6 4.8z"/>
      <path fill="#fff" d="M34 22h-2v-2h-2v2h-2v2h2v2h2v-2h2zM40 22h-2v-2h-2v2h-2v2h2v2h2v-2h2z"/>
    </svg>
  );
}
function JSIcon() {
  return (
    <svg viewBox="0 0 48 48" className="lp-tech-icon" aria-hidden="true">
      <rect width="48" height="48" rx="6" fill="#F7DF1E"/>
      <path fill="#000" d="M28 38.5c1 1.6 2.3 2.8 4.6 2.8 1.9 0 3-.9 3-2.3 0-1.6-1.2-2.1-3.4-3.1l-1.2-.5c-3.5-1.5-5.8-3.4-5.8-7.3 0-3.6 2.7-6.3 7-6.3 3 0 5.2 1.1 6.8 3.9l-3.7 2.4c-.8-1.5-1.7-2.1-3.1-2.1-1.4 0-2.3.9-2.3 2.1 0 1.4.9 2 2.9 2.9l1.2.5c4.1 1.8 6.4 3.6 6.4 7.6 0 4.3-3.4 6.7-7.9 6.7-4.4 0-7.3-2.1-8.7-4.9l4.2-2.4zM13.4 39c.8 1.3 1.5 2.4 3.2 2.4 1.6 0 2.6-.6 2.6-3V22h4.8v16.5c0 4.9-2.9 7.1-7.1 7.1-3.8 0-6-2-7.1-4.3l3.6-2.3z"/>
    </svg>
  );
}
function HtmlIcon() {
  return (
    <svg viewBox="0 0 48 48" className="lp-tech-icon" aria-hidden="true">
      <path fill="#E44D26" d="M6 4l3.3 38L24 46l14.7-4L42 4H6z"/>
      <path fill="#F16529" d="M24 43.1V7H38.3L35.5 38.5 24 43.1z"/>
      <path fill="#EBEBEB" d="M24 20.2H17.9l-.4-4.6H24v-4.5H12.5l.1 1.3 1.2 13.6H24v-5.8zm0 11.8l-5.1-1.4-.3-3.6h-4.5l.6 7.1 9.3 2.6V32z"/>
      <path fill="#fff" d="M23.9 20.2v5.8h5.4l-.5 5.7L24 33v4.7l9.4-2.6.1-.8 1.1-12h-5.2l.2-2.1h5.4l.2-1.8.4-2.7H23.9v4.5h5.9l-.4 4.6h-5.5z"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────
//  Hero editor mockup
// ─────────────────────────────────────────────────────
function EditorMockup() {
  return (
    <div className="lp-screenshot">
      <div className="lp-ss-titlebar">
        <span className="lp-ss-dot r" />
        <span className="lp-ss-dot y" />
        <span className="lp-ss-dot g" />
        <span className="lp-ss-title">globeditor — main.py</span>
      </div>
      <div className="lp-ss-body">
        <aside className="lp-ss-sidebar">
          <div className="lp-ss-side-head">Workspace</div>
          <div className="lp-ss-file">
            <span className="lp-ss-file-dot" style={{ background: '#f59e0b' }} />
            index.js
          </div>
          <div className="lp-ss-file active">
            <span className="lp-ss-file-dot" style={{ background: '#3b82f6' }} />
            main.py
          </div>
          <div className="lp-ss-file">
            <span className="lp-ss-file-dot" style={{ background: '#f43f5e' }} />
            index.html
          </div>
          <div className="lp-ss-file">
            <span className="lp-ss-file-dot" style={{ background: '#8b5cf6' }} />
            styles.css
          </div>
          <div className="lp-ss-file">
            <span className="lp-ss-file-dot" style={{ background: '#06b6d4' }} />
            solver.cpp
          </div>
          <div className="lp-ss-file">
            <span className="lp-ss-file-dot" style={{ background: '#f97316' }} />
            App.java
          </div>
        </aside>
        <div className="lp-ss-main">
          <div className="lp-ss-tabs">
            <div className="lp-ss-tab active">main.py</div>
            <div className="lp-ss-tab">index.html</div>
            <div className="lp-ss-tab">styles.css</div>
          </div>
          <div className="lp-ss-code">
            <div className="lp-ss-lineno">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <div>
              <div className="lp-ss-line"><span className="tok-com"># GlobEditor — run Python right in your browser</span></div>
              <div className="lp-ss-line"><span className="tok-kw">from</span> <span className="tok-var">dataclasses</span> <span className="tok-kw">import</span> <span className="tok-var">dataclass</span></div>
              <div className="lp-ss-line"> </div>
              <div className="lp-ss-line"><span className="tok-kw">@</span><span className="tok-var">dataclass</span></div>
              <div className="lp-ss-line"><span className="tok-kw">class</span> <span className="tok-fn">Editor</span>:</div>
              <div className="lp-ss-line">    name: <span className="tok-var">str</span> <span className="tok-op">=</span> <span className="tok-str">"GlobEditor"</span></div>
              <div className="lp-ss-line">    languages: <span className="tok-var">int</span> <span className="tok-op">=</span> <span className="tok-num">10</span></div>
              <div className="lp-ss-line"> </div>
              <div className="lp-ss-line">    <span className="tok-kw">def</span> <span className="tok-fn">greet</span>(self) <span className="tok-op">-&gt;</span> <span className="tok-var">str</span>:</div>
              <div className="lp-ss-line">        <span className="tok-kw">return</span> <span className="tok-str">f"Hello from &#123;self.name&#125;"</span></div>
              <div className="lp-ss-line"> </div>
              <div className="lp-ss-line"><span className="tok-fn">print</span>(<span className="tok-fn">Editor</span>().<span className="tok-fn">greet</span>())  <span className="tok-com"># =&gt; Hello from GlobEditor</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
//  Feature card with subtle cursor tracking glow
// ─────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, body, span, children }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    ref.current.style.setProperty('--mx', `${e.clientX - r.left}px`);
    ref.current.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <div ref={ref} onMouseMove={onMove} className={`lp-card ${span || ''}`}>
      <div>
        <div className="lp-card-icon"><Icon size={22} /></div>
        <h3 className="lp-card-title">{title}</h3>
        <p className="lp-card-body">{body}</p>
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────
//  Landing page
// ─────────────────────────────────────────────────────
export default function LandingPage({ onSignIn }) {
  useEffect(() => {
    document.body.classList.add('lp-active');
    return () => document.body.classList.remove('lp-active');
  }, []);

  const handleSignIn = () => {
    if (typeof onSignIn === 'function') onSignIn();
  };

  return (
    <div className="lp-root">
      {/* Background layers */}
      <div className="lp-mesh">
        <span className="lp-mesh-c" />
      </div>
      <div className="lp-grid" />

      {/* Nav */}
      <nav className="lp-nav">
        <div className="lp-nav-brand">
          <div className="lp-logo"><Code size={15} color="white" /></div>
          GlobEditor
        </div>
        <div className="lp-nav-links">
          <a href="#features">Features</a>
          <a href="#languages">Languages</a>
          <a href="#speed">Speed</a>
        </div>
        <button className="lp-nav-btn" onClick={handleSignIn}>Sign in</button>
      </nav>

      {/* Hero */}
      <section className="lp-section lp-hero">
        <div className="lp-hero-pill">
          <span className="lp-hero-pill-dot" />
          Now with in-browser Python runtime
        </div>
        <h1 className="lp-hero-title text-balance">
          Code without limits,<br />anywhere.
        </h1>
        <p className="lp-hero-sub text-pretty">
          GlobEditor is a professional IDE that runs in your browser. No installs,
          no configuration &mdash; just open a tab and start building.
        </p>
        <div className="lp-hero-actions">
          <button className="lp-btn-google" onClick={handleSignIn}>
            <GoogleMark size={18} />
            Get Started for Free
          </button>
          <a className="lp-btn-ghost" href="#features">
            See what&apos;s inside
            <ArrowRight size={16} />
          </a>
        </div>

        <div className="lp-screenshot-wrap">
          <div className="lp-screenshot-glow" aria-hidden="true" />
          <EditorMockup />
        </div>
      </section>

      {/* Features bento */}
      <section className="lp-section" id="features">
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <span className="lp-section-tag">Features</span>
        </div>
        <h2 className="lp-section-title text-balance" style={{ textAlign: 'center' }}>
          Everything a developer needs.<br />Nothing they don&apos;t.
        </h2>
        <p className="lp-section-sub" style={{ textAlign: 'center', margin: '0 auto' }}>
          A focused set of tools, tuned for speed and built to feel native on every platform.
        </p>

        <div className="lp-bento">
          <FeatureCard
            icon={Sparkles}
            title="Intelligent Editor"
            body="Powered by the VS Code engine. Syntax highlighting, IntelliSense, and multi-cursor editing work out of the box — no setup required."
            span="span-4"
          >
            <div className="lp-mini-editor">
              <div><span className="tok-com">{'// autocomplete, diagnostics, refactors'}</span></div>
              <div><span className="tok-kw">const</span> <span className="tok-var">ide</span> <span className="tok-op">=</span> <span className="tok-fn">createEditor</span>(&#123;</div>
              <div>{'  '}language: <span className="tok-str">&apos;typescript&apos;</span>,</div>
              <div>{'  '}theme: <span className="tok-str">&apos;vs-dark&apos;</span>,</div>
              <div>{'  '}minimap: <span className="tok-kw">true</span>,</div>
              <div>&#125;);</div>
            </div>
          </FeatureCard>

          <FeatureCard
            icon={Zap}
            title="Instant Execution"
            body="Run Python directly in your browser via Pyodide. Stream stdout, handle input, and iterate without leaving the page."
            span="span-2"
          />

          <FeatureCard
            icon={Cloud}
            title="Cloud Sync"
            body="Every file auto-saves to the cloud. Sign in once and your workspace follows you across devices."
            span="span-2"
          />

          <FeatureCard
            icon={Layers}
            title="Multi-language, Multi-tab"
            body="Python, JavaScript, TypeScript, Java, C, C++, HTML, CSS, JSON, SQL, Markdown — switch between them in seamless tabs."
            span="span-4"
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
              {['Python', 'JavaScript', 'TypeScript', 'Java', 'C', 'C++', 'HTML', 'CSS', 'JSON', 'SQL'].map((l) => (
                <span key={l} style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  background: 'rgba(10,132,255,0.1)',
                  border: '1px solid rgba(10,132,255,0.25)',
                  color: '#8ab4f8',
                }}>{l}</span>
              ))}
            </div>
          </FeatureCard>
        </div>
      </section>

      {/* Tech showcase */}
      <section className="lp-section lp-tech" id="languages">
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <span className="lp-section-tag">Languages</span>
        </div>
        <h2 className="lp-section-title text-balance">Write in the language you love.</h2>
        <p className="lp-section-sub" style={{ margin: '0 auto' }}>
          Full syntax support for 10+ languages with first-class runners for the most popular ones.
        </p>

        <div className="lp-tech-grid">
          <div className="lp-tech-card"><PythonIcon /><div className="lp-tech-name">Python</div></div>
          <div className="lp-tech-card"><JavaIcon />  <div className="lp-tech-name">Java</div></div>
          <div className="lp-tech-card"><CppIcon />   <div className="lp-tech-name">C / C++</div></div>
          <div className="lp-tech-card"><JSIcon />    <div className="lp-tech-name">JavaScript</div></div>
          <div className="lp-tech-card"><HtmlIcon /> <div className="lp-tech-name">HTML / CSS</div></div>
        </div>
      </section>

      {/* Built for speed */}
      <section className="lp-section" id="speed">
        <div className="lp-split">
          <div>
            <span className="lp-section-tag">Built for speed</span>
            <h2 className="lp-section-title text-balance">
              A workflow that keeps up with you.
            </h2>
            <p className="lp-section-sub">
              An integrated terminal, multi-tab editing, and instant file switching — engineered
              to remove the friction between thinking and shipping.
            </p>
            <ul className="lp-split-list">
              <li>
                <span className="lp-check"><Check size={14} /></span>
                <span><strong>Integrated terminal.</strong> Run scripts, inspect output, and pipe commands without leaving your editor.</span>
              </li>
              <li>
                <span className="lp-check"><Check size={14} /></span>
                <span><strong>Multi-tab editing.</strong> Jump between files with keyboard shortcuts — just like your desktop IDE.</span>
              </li>
              <li>
                <span className="lp-check"><Check size={14} /></span>
                <span><strong>Zero cold starts.</strong> Open a tab and start typing. No containers to wake up.</span>
              </li>
            </ul>
          </div>

          <div className="lp-term-mock">
            <div className="lp-term-head">
              <span className="lp-ss-dot r" />
              <span className="lp-ss-dot y" />
              <span className="lp-ss-dot g" />
              <div className="lp-term-tabs">
                <span className="lp-term-tab active">terminal</span>
                <span className="lp-term-tab">output</span>
                <span className="lp-term-tab">problems</span>
              </div>
            </div>
            <div className="lp-term-body">
              <div><span className="prompt">workspace</span> <span className="path">~/main.py</span> $ run main.py</div>
              <div className="out">→ Starting Python runtime…</div>
              <div className="out">→ Ready in 42ms</div>
              <div className="out">Hello from GlobEditor</div>
              <div><span className="prompt">workspace</span> <span className="path">~/main.py</span> $ ls</div>
              <div className="out">index.js  main.py  index.html  styles.css  solver.cpp</div>
              <div><span className="prompt">workspace</span> <span className="path">~/main.py</span> $ <span className="lp-term-cursor" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="lp-cta">
        <div className="lp-cta-card">
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #0a84ff, #0071e3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 0 40px rgba(10,132,255,0.45)',
          }}>
            <Rocket size={26} color="white" />
          </div>
          <h2 className="lp-cta-title text-balance">Start coding in seconds.</h2>
          <p className="lp-cta-sub text-pretty">
            Sign in with Google and your workspace is ready &mdash; no setup, no credit card.
          </p>
          <button className="lp-btn-google" onClick={handleSignIn}>
            <GoogleMark size={18} />
            Sign in with Google
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="lp-logo" style={{ width: 22, height: 22, borderRadius: 6 }}>
            <Code size={12} color="white" />
          </div>
          <span>GlobEditor</span>
          <span style={{ color: 'var(--lp-text-dim)' }}>· The cloud IDE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Globe size={13} />
          Built for the web
        </div>
      </footer>
    </div>
  );
}
