import React, { useState, useRef, useEffect } from "react";


const TOKENS = {
  ink: "#15122B",
  paper: "#FBF7FF",
  violet: "#7C3AED",
  violetDark: "#5B21B6",
  coral: "#FF5470",
  yellow: "#FFD23F",
  green: "#2BD576",
  lilac: "#EDE4FF",
};

const SKILLS = [
  { group: "Testing", tags: ["Manual Testing", "Test Case Design", "API Testing", "Regression Testing", "Defect Tracking"], color: TOKENS.coral },
  { group: "Tools", tags: ["Selenium", "Postman", "Jira", "Redmine", "Git", "GitHub"], color: TOKENS.violet },
  { group: "Development", tags: ["React", "JavaScript", "HTML/CSS", ".NET"], color: TOKENS.green },
  { group: "Process", tags: ["Agile", "Code Review", "CI/CD Basics", "Team Collaboration"], color: TOKENS.yellow },
];

const API_CHECKS = [
  {
    name: "GET /users/1 responds 200",
    run: async () => {
      const t0 = performance.now();
      const r = await fetch("https://jsonplaceholder.typicode.com/users/1");
      const ms = performance.now() - t0;
      return { pass: r.status === 200, detail: `status ${r.status} · ${ms.toFixed(0)}ms` };
    },
  },
  {
    name: "Response body has an 'email' field",
    run: async () => {
      const r = await fetch("https://jsonplaceholder.typicode.com/users/1");
      const j = await r.json();
      return { pass: !!j.email, detail: j.email ? `email: ${j.email}` : "field missing" };
    },
  },
  {
    name: "GET /posts/1 matches expected schema",
    run: async () => {
      const r = await fetch("https://jsonplaceholder.typicode.com/posts/1");
      const j = await r.json();
      const pass = ["id", "title", "body", "userId"].every((k) => k in j);
      return { pass, detail: pass ? "id, title, body, userId present" : "schema mismatch" };
    },
  },
  {
    name: "GET /todos/1 responds under 1000ms",
    run: async () => {
      const t0 = performance.now();
      const r = await fetch("https://jsonplaceholder.typicode.com/todos/1");
      const ms = performance.now() - t0;
      return { pass: ms < 1000 && r.status === 200, detail: `${ms.toFixed(0)}ms` };
    },
  },
];

const CODE_SAMPLES = [
  {
    lang: "Selenium · C#",
    filename: "LoginTests.cs",
    code: `[Test]
public void ValidLogin_RedirectsToDashboard()
{
    driver.Navigate().GoToUrl(baseUrl + "/login");

    driver.FindElement(By.Id("email")).SendKeys("qa.tester@demo.com");
    driver.FindElement(By.Id("password")).SendKeys("Sup3rSecret!");
    driver.FindElement(By.Id("submit")).Click();

    var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(5));
    wait.Until(d => d.Url.Contains("/dashboard"));

    Assert.That(driver.Title, Is.EqualTo("Dashboard"));
    Assert.That(driver.FindElement(By.ClassName("welcome")).Text,
        Does.Contain("Welcome back"));
}`,
  },
  {
    lang: "API Test · Jest",
    filename: "contact.api.test.js",
    code: `describe("POST /api/contact", () => {
  it("accepts a valid submission", async () => {
    const start = Date.now();

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Ada Lovelace",
        email: "ada@example.com",
        message: "Loved the site!",
      }),
    });

    expect(res.status).toBe(200);
    expect(Date.now() - start).toBeLessThan(800);

    const body = await res.json();
    expect(body.status).toBe("PASS");
  });

  it("rejects a missing email", async () => {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "No Email", message: "Hi" }),
    });
    expect(res.status).toBe(400);
  });
});`,
  },
  {
    lang: "Component Test · RTL",
    filename: "RpsButton.test.jsx",
    code: `import { render, screen, fireEvent } from "@testing-library/react";
import RpsButton from "./RpsButton";

test("calls onPlay with the correct choice", () => {
  const onPlay = jest.fn();
  render(<RpsButton choice="rock" onPlay={onPlay} />);

  fireEvent.click(screen.getByRole("button", { name: /rock/i }));

  expect(onPlay).toHaveBeenCalledWith("rock");
  expect(onPlay).toHaveBeenCalledTimes(1);
});`,
  },
];

const INITIAL_TICKETS = [
  { id: "BUG-101", title: "Login button unresponsive on Safari mobile", severity: "Critical", status: "Open" },
  { id: "BUG-102", title: "Contact form allows empty message on double-submit", severity: "High", status: "In Progress" },
  { id: "BUG-103", title: "Score badge misaligned below 360px width", severity: "Low", status: "Fixed" },
  { id: "BUG-104", title: "API returns 500 when email has unicode characters", severity: "Medium", status: "Verified" },
];
const STATUS_FLOW = ["Open", "In Progress", "Fixed", "Verified"];
const SEVERITY_COLOR = { Critical: TOKENS.coral, High: TOKENS.yellow, Medium: TOKENS.violet, Low: TOKENS.green };

function highlightCode(code) {
  const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const pattern = /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(function|const|let|var|return|if|else|public|private|class|void|using|new|async|await|import|from|export|default|static|string|int|bool|true|false|null|this|for|foreach|in|test|describe|it|expect|record)\b|\b(\d+(?:\.\d+)?)\b/g;
  let out = "";
  let last = 0;
  let m;
  while ((m = pattern.exec(code))) {
    out += escape(code.slice(last, m.index));
    if (m[1]) out += `<span class="tok-cm">${escape(m[1])}</span>`;
    else if (m[2]) out += `<span class="tok-st">${escape(m[2])}</span>`;
    else if (m[3]) out += `<span class="tok-kw">${escape(m[3])}</span>`;
    else if (m[4]) out += `<span class="tok-nu">${escape(m[4])}</span>`;
    last = pattern.lastIndex;
  }
  out += escape(code.slice(last));
  return out;
}

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setVisible(true); io.unobserve(e.target); } }),
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, delay = 0 }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={`reveal ${visible ? "in" : ""}`} style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}>
      {children}
    </div>
  );
}

function ApiConsole() {
  const [results, setResults] = useState(API_CHECKS.map((c) => ({ name: c.name, status: "idle", detail: "" })));
  const [running, setRunning] = useState(false);

  const runAll = async () => {
    setRunning(true);
    setResults(API_CHECKS.map((c) => ({ name: c.name, status: "queued", detail: "" })));
    for (let i = 0; i < API_CHECKS.length; i++) {
      setResults((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "running" } : r)));
      try {
        const { pass, detail } = await API_CHECKS[i].run();
        setResults((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: pass ? "pass" : "fail", detail } : r)));
      } catch (err) {
        setResults((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "fail", detail: "network error — request blocked" } : r)));
      }
    }
    setRunning(false);
  };

  const passCount = results.filter((r) => r.status === "pass").length;

  return (
    <div className="console-card">
      <div className="console-head">
        <div>
          <span className="proj-tag" style={{ color: TOKENS.green }}>LIVE — HITS A REAL PUBLIC REST API</span>
          <h3 style={{ margin: "4px 0 0" }}>API Test Console</h3>
        </div>
        <button className="btn-primary" onClick={runAll} disabled={running}>{running ? "Running..." : "Run test suite"}</button>
      </div>
      <div className="console-body">
        {results.map((r, i) => (
          <div className="console-row" key={r.name} style={{ transitionDelay: `${i * 40}ms` }}>
            <span className={`status-dot ${r.status}`} />
            <span className="console-name mono">{r.name}</span>
            <span className={`console-detail mono ${r.status}`}>
              {r.status === "idle" && "waiting"}
              {r.status === "queued" && "queued"}
              {r.status === "running" && "running..."}
              {(r.status === "pass" || r.status === "fail") && (r.status === "pass" ? "PASS · " : "FAIL · ") + r.detail}
            </span>
          </div>
        ))}
      </div>
      <div className="console-foot mono">{passCount}/{API_CHECKS.length} assertions passing</div>
    </div>
  );
}

function CodeSamples() {
  const [tab, setTab] = useState(0);
  const sample = CODE_SAMPLES[tab];
  return (
    <div className="code-card">
      <div className="code-tabs">
        {CODE_SAMPLES.map((s, i) => (
          <button key={s.filename} className={`code-tab ${i === tab ? "active" : ""}`} onClick={() => setTab(i)}>{s.lang}</button>
        ))}
      </div>
      <div className="code-window">
        <div className="code-topbar mono">{sample.filename}</div>
        <pre className="code-pre" key={tab}><code dangerouslySetInnerHTML={{ __html: highlightCode(sample.code) }} /></pre>
      </div>
    </div>
  );
}

function BugTracker() {
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [justMoved, setJustMoved] = useState(null);
  const cycle = (id) => {
    setTickets((prev) => prev.map((t) => {
      if (t.id !== id) return t;
      const next = STATUS_FLOW[(STATUS_FLOW.indexOf(t.status) + 1) % STATUS_FLOW.length];
      return { ...t, status: next };
    }));
    setJustMoved(id);
    window.clearTimeout(cycle._t);
    cycle._t = window.setTimeout(() => setJustMoved(null), 420);
  };
  return (
    <div className="kanban">
      {STATUS_FLOW.map((col) => (
        <div className="kanban-col" key={col}>
          <div className="kanban-col-head mono">{col} <span>{tickets.filter((t) => t.status === col).length}</span></div>
          {tickets.filter((t) => t.status === col).map((t) => (
            <button className={`ticket ${justMoved === t.id ? "ticket-moved" : ""}`} key={t.id} onClick={() => cycle(t.id)} title="Click to advance status">
              <div className="ticket-top">
                <span className="mono" style={{ fontSize: "0.7rem", opacity: 0.6 }}>{t.id}</span>
                <span className="sev-dot" style={{ background: SEVERITY_COLOR[t.severity] }}>{t.severity}</span>
              </div>
              <div className="ticket-title">{t.title}</div>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

const EXPERIENCE = [
  {
    id: "TC-003.1",
    role: "SQA Intern",
    org: "SIPSAP Optimization",
    time: "Jul 2026 — Present",
    status: "RUNNING",
    bullets: [
      "Test the IvyCMS web app end to end: functional, UI, validation, smoke, and regression passes.",
      "Design and run test cases across multiple modules, then log and track every defect found.",
      "Run API tests in Postman, checking requests, responses, and CRUD, search, and filter behavior.",
      "Pair with developers to confirm fixes and sign off new deployments.",
    ],
  },
  {
    id: "TC-003.2",
    role: "SQA & Front-end Developer Intern",
    org: "Airblue — MIS Department",
    time: "Apr 2026 — Jul 2026",
    status: "PASS",
    bullets: [
      "Ran manual and functional testing across web applications.",
      "Documented and tracked bugs, then verified fixes with regression passes.",
      "Built responsive interfaces in React.js for internal tools.",
      "Contributed to the Airblue Lime Survey platform and the Uniform Management System.",
    ],
  },
  {
    id: "TC-003.3",
    role: "Software QA Intern",
    org: "DataViz — Remote",
    time: "Jan 2026 — Mar 2026",
    status: "PASS",
    bullets: [
      "Tested web applications manually for functionality and reliability.",
      "Wrote and executed test cases, then reported bugs with clear tracking notes.",
      "Worked with developers to confirm fixes and raise overall quality.",
    ],
  },
];

const PROJECTS = [
  {
    tag: "ML / Accessibility",
    title: "Sign Language to Text",
    desc: "A real-time recognition interface that converts sign language gestures into text, trained on a custom dataset to help close a communication gap.",
    color: TOKENS.violet,
  },
  {
    tag: "Data Science",
    title: "Cluster Ruler",
    desc: "A clustering tool that organizes raw datasets into meaningful groups, making patterns easier to read and decisions easier to make.",
    color: TOKENS.coral,
  },
];

function useRPS() {
  const [scores, setScores] = useState({ user: 0, computer: 0 });
  const [msg, setMsg] = useState({ text: "Choose your move", tone: "idle" });
  const [bump, setBump] = useState(null);
  const [shake, setShake] = useState(0);
  const play = (userChoice) => {
    const options = ["rock", "paper", "scissors"];
    const compChoice = options[Math.floor(Math.random() * 3)];
    if (userChoice === compChoice) {
      setMsg({ text: "Draw — both picked " + userChoice, tone: "draw" });
      setShake((n) => n + 1);
      return;
    }
    const beats = { rock: "scissors", paper: "rock", scissors: "paper" };
    const userWin = beats[userChoice] === compChoice;
    if (userWin) {
      setScores((s) => ({ ...s, user: s.user + 1 }));
      setMsg({ text: `You win — ${userChoice} beats ${compChoice}`, tone: "win" });
      setBump("user");
    } else {
      setScores((s) => ({ ...s, computer: s.computer + 1 }));
      setMsg({ text: `You lose — ${compChoice} beats ${userChoice}`, tone: "lose" });
      setBump("computer");
    }
    window.setTimeout(() => setBump(null), 400);
  };
  return { scores, msg, play, bump, shake };
}

function Badge({ children, tone = "violet" }) {
  const bg = { violet: TOKENS.violet, coral: TOKENS.coral, green: TOKENS.green, yellow: TOKENS.yellow, ink: TOKENS.ink }[tone];
  const dark = tone === "yellow";
  return (
    <span className="badge" style={{ background: bg, color: dark ? TOKENS.ink : "#fff" }}>
      {children}
    </span>
  );
}

export default function Portfolio() {
  const [navOpen, setNavOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [heroIn, setHeroIn] = useState(false);
  const rps = useRPS();
  const [coverageRef, coverageVisible] = useReveal();
  const sectionRefs = {
    about: useRef(null),
    skills: useRef(null),
    experience: useRef(null),
    education: useRef(null),
    projects: useRef(null),
    testing: useRef(null),
    contact: useRef(null),
  };

  useEffect(() => {
    const t = window.setTimeout(() => setHeroIn(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  const scrollTo = (key) => {
    setNavOpen(false);
    sectionRefs[key]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    const subject = encodeURIComponent("Portfolio contact from " + form.name);
    const body = encodeURIComponent(form.message + "\n\n\u2014 " + form.name + " (" + form.email + ")");
    window.location.href = "mailto:saadkhan.compk786@gmail.com?subject=" + subject + "&body=" + body;
    setSent(true);
  };

  return (
    <div className="wrap">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');

        * { box-sizing: border-box; }
        .wrap {
          --ink: ${TOKENS.ink};
          --paper: ${TOKENS.paper};
          --violet: ${TOKENS.violet};
          --violetDark: ${TOKENS.violetDark};
          --coral: ${TOKENS.coral};
          --yellow: ${TOKENS.yellow};
          --green: ${TOKENS.green};
          --lilac: ${TOKENS.lilac};
          font-family: 'Inter', sans-serif;
          background: var(--paper);
          color: var(--ink);
          overflow-x: hidden;
        }
        .wrap h1, .wrap h2, .wrap h3, .wrap .display {
          font-family: 'Space Grotesk', sans-serif;
        }
        .mono { font-family: 'JetBrains Mono', monospace; }

        /* ---------- NAV ---------- */
          .nav {
            position: fixed; top: 0; left: 0; right: 0; z-index: 50;
            display: flex; align-items: center; justify-content: space-between;
            padding: 18px clamp(20px, 5vw, 64px);
            background: rgba(21,18,43,0.85);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid transparent;
            border-image: linear-gradient(90deg, var(--violet), var(--coral), var(--yellow)) 1;
            animation: navDrop 0.6s cubic-bezier(0.16,1,0.3,1) both;
          }
          .nav-logo { font-weight: 700; font-size: 1.1rem; letter-spacing: -0.02em; display:flex; align-items:center; gap:8px; color:#fff;}
          .nav-logo .dot { width:10px; height:10px; border-radius:50%; background: var(--green); box-shadow: 0 0 0 3px rgba(43,213,118,0.2); animation: pulse 2s infinite;}
          .nav-links { display: flex; gap: 28px; }
          .nav-links button {
            background: none; border: none; cursor: pointer;
            font-family: 'JetBrains Mono', monospace; font-size: 0.8rem;
            color: rgba(255,255,255,0.6); padding: 4px 0; position: relative;
            transition: color 0.15s ease;
          }
          .nav-links button::after {
            content: ""; position: absolute; left: 0; bottom: -4px;
            width: 0; height: 2px; background: var(--yellow);
            transition: width 0.2s ease;
          }
          .nav-links button:hover { color: #fff; }
          .nav-links button:hover::after { width: 100%; }
          .nav-links button:focus-visible, button:focus-visible, a:focus-visible { outline: 2px solid var(--violet); outline-offset: 3px; }
          .nav-cta {
            background: var(--yellow); color: var(--ink); border: none; border-radius: 999px;
            padding: 10px 20px; font-weight: 700; font-size: 0.85rem; cursor: pointer;
            font-family: 'Inter', sans-serif;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }
          .nav-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 20px -8px rgba(255,210,63,0.6); }

        .burger { display: none; background: none; border: none; cursor: pointer; }
        @media (max-width: 780px) {
          .nav-links { display: none; }
          .burger { display: block; }
        }

        /* ---------- HERO ---------- */
        .hero {
          background: var(--ink);
          color: #fff;
          padding: calc(clamp(48px, 8vw, 96px) + 50px) clamp(20px, 6vw, 64px) clamp(64px, 8vw, 96px);         
          display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 48px; align-items: center;
          position: relative;
        }
        .hero::before {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(circle at 85% 15%, rgba(124,58,237,0.35), transparent 45%),
                      radial-gradient(circle at 10% 90%, rgba(255,84,112,0.2), transparent 40%);
          animation: glowShift 10s ease-in-out infinite alternate;
        }
        @media (max-width: 900px) { .hero { grid-template-columns: 1fr; } }
        .hero-copy > * { opacity: 0; transform: translateY(22px); }
        .hero-copy.in > * {
          animation: heroRise 0.75s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        .hero-copy.in > *:nth-child(1) { animation-delay: 0.05s; }
        .hero-copy.in > *:nth-child(2) { animation-delay: 0.16s; }
        .hero-copy.in > *:nth-child(3) { animation-delay: 0.28s; }
        .hero-copy.in > *:nth-child(4) { animation-delay: 0.4s; }
        .hero-art { opacity: 0; transform: translateY(22px) scale(0.98); }
        .hero-art.in { animation: heroRise 0.85s cubic-bezier(0.16,1,0.3,1) 0.3s forwards; }
        @keyframes heroRise { to { opacity: 1; transform: none; } }
        @keyframes navDrop { from { opacity: 0; transform: translateY(-14px); } to { opacity: 1; transform: none; } }
        @keyframes glowShift {
          from { background-position: 0% 0%, 0% 0%; }
          to { background-position: 6% -4%, -4% 6%; }
        }
        .eyebrow {
          font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; color: var(--green);
          letter-spacing: 0.06em; display: flex; align-items: center; gap: 8px; margin-bottom: 18px;
        }
        .eyebrow::before { content: "●"; font-size: 0.6rem; animation: pulse 2s infinite; }
        @media (prefers-reduced-motion: reduce) { .eyebrow::before { animation: none; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        .hero h1 {
          font-size: clamp(2.4rem, 5.5vw, 4rem); line-height: 1.02; font-weight: 700; letter-spacing: -0.03em;
          margin: 0 0 20px;
        }
        .hero h1 span { color: var(--yellow); }
        .hero p.lede { font-size: 1.1rem; color: rgba(255,255,255,0.72); max-width: 46ch; margin-bottom: 32px; }
        .hero-ctas { display: flex; gap: 14px; flex-wrap: wrap; }
        .btn-primary {
          background: var(--yellow); color: var(--ink); border: none; border-radius: 999px;
          padding: 14px 28px; font-weight: 700; cursor: pointer; font-size: 0.95rem;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 22px -10px rgba(255,210,63,0.55); }
        .btn-primary:active { transform: translateY(0) scale(0.97); }
        .btn-ghost {
          background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 999px;
          padding: 14px 28px; font-weight: 600; cursor: pointer; font-size: 0.95rem; text-decoration:none;
          display:inline-flex; align-items:center;
          transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
        }
        .btn-ghost:hover { border-color: #fff; background: rgba(255,255,255,0.06); transform: translateY(-2px); }
        .btn-ghost:active { transform: translateY(0) scale(0.97); }

        .terminal {
          background: #0F0D22; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
          padding: 20px; font-family: 'JetBrains Mono', monospace; font-size: 0.82rem;
          box-shadow: 0 30px 60px -20px rgba(0,0,0,0.6);
        }
        .terminal-bar { display: flex; gap: 6px; margin-bottom: 16px; }
        .terminal-bar span { width: 10px; height: 10px; border-radius: 50%; }
        .terminal-line { color: rgba(255,255,255,0.55); margin-bottom: 6px; opacity: 0; animation: typeIn 0.4s ease forwards; }
        .terminal-line b { color: #fff; font-weight: 500; }
        .terminal-result { color: var(--green); margin-left: 12px; opacity: 0; animation: typeIn 0.4s ease forwards; }
        .terminal-result.run { color: var(--yellow); }
        @keyframes typeIn { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: none; } }
        .hero-art.in .terminal-line:nth-of-type(1), .hero-art.in .terminal-line:nth-child(1) {}
        .terminal-line:nth-child(1) { animation-delay: 0.7s; }
        .terminal-line:nth-child(2) { animation-delay: 0.85s; }
        .terminal-line:nth-child(3) { animation-delay: 1.05s; }
        .terminal-result:nth-child(4) { animation-delay: 1.2s; }
        .terminal-result:nth-child(5) { animation-delay: 1.35s; }
        .terminal-result:nth-child(6) { animation-delay: 1.5s; }
        .terminal-result.run { animation-delay: 1.65s; }
        .cursor { display:inline-block; width: 7px; height: 14px; background: var(--green); margin-left: 4px; animation: blink 1s step-end infinite; vertical-align: middle;}
        @media (prefers-reduced-motion: reduce) { .cursor { animation: none; } }
        @keyframes blink { 50% { opacity: 0; } }

        /* ---------- SECTION SHELL ---------- */
        section.block { padding: clamp(56px, 8vw, 96px) clamp(20px, 6vw, 64px); }
        .kicker {
          display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
        }
        .kicker .id { font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; color: #fff; background: var(--ink); padding: 4px 10px; border-radius: 6px; }
        .kicker .rule { flex: 1; height: 1px; background: rgba(21,18,43,0.15); position: relative; overflow: hidden; }
        .kicker .rule::after {
          content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, var(--violet), transparent);
          transform: translateX(-100%); animation: sweep 5s ease-in-out infinite;
        }
        @keyframes sweep { 0% { transform: translateX(-100%); } 50% { transform: translateX(100%); } 100% { transform: translateX(100%); } }
        @media (prefers-reduced-motion: reduce) { .kicker .rule::after { animation: none; display: none; } }
        .block h2 { font-size: clamp(1.7rem, 3.5vw, 2.4rem); margin: 0 0 28px; letter-spacing: -0.02em; }

        /* ---------- ABOUT ---------- */
        .about-grid { display: grid; grid-template-columns: 220px 1fr; gap: 40px; align-items: start; }
        @media (max-width: 780px) { .about-grid { grid-template-columns: 1fr; } }
        .photo-frame {
          position: relative; border-radius: 20px; overflow: hidden; border: 3px solid var(--ink);
          box-shadow: 8px 8px 0 var(--yellow);
          transition: box-shadow 0.25s ease, transform 0.25s ease;
        }
        .photo-frame:hover { transform: translate(-2px,-2px); box-shadow: 10px 10px 0 var(--yellow); }
        .photo-frame img {
        width: 100%;
          display: block;
        transition: transform 0.3s ease;
        }

          .photo-frame:hover img {
            transform: scale(1.4);
       }
        .photo-stamp {
          position: absolute; bottom: 10px; left: 10px; background: var(--green); color: var(--ink);
          font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; font-weight: 700;
          padding: 4px 8px; border-radius: 6px; transform: rotate(-4deg);
        }
        .about-card {
          background: #fff; border: 1px solid rgba(21,18,43,0.08); border-radius: 18px; padding: 28px;
          box-shadow: 0 20px 40px -30px rgba(21,18,43,0.4);
        }
        .about-card p { line-height: 1.7; color: rgba(21,18,43,0.8); margin: 0 0 14px; }
        .meta-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }

        /* ---------- SKILLS ---------- */
        .skills-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 20px; }
        .skill-card { background: #fff; border-radius: 16px; padding: 22px; border: 1px solid rgba(21,18,43,0.08); transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .skill-card:hover { transform: translateY(-4px); box-shadow: 0 20px 34px -24px rgba(21,18,43,0.45); }
        .skill-card .group-name { font-weight: 700; margin-bottom: 14px; display:flex; align-items:center; gap:8px; }
        .skill-card .swatch { width: 10px; height: 10px; border-radius: 3px; }
        .tag-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .badge { font-size: 0.75rem; font-weight: 600; padding: 6px 12px; border-radius: 999px; font-family: 'Inter', sans-serif; transition: transform 0.15s ease; }
        .tag-row .badge:hover { transform: translateY(-2px); }

        /* ---------- EXPERIENCE ---------- */
        .exp-list { display: flex; flex-direction: column; gap: 18px; }
        .exp-card {
          background: #fff; border-radius: 18px; border: 1px solid rgba(21,18,43,0.08);
          padding: 26px 28px; display: grid; grid-template-columns: 140px 1fr; gap: 24px;
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }
        .exp-card:hover { box-shadow: 0 24px 40px -28px rgba(21,18,43,0.5); transform: translateY(-2px); }
        @media (max-width: 700px) { .exp-card { grid-template-columns: 1fr; } }
        .exp-id { font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; color: var(--violet); font-weight: 700; }
        .exp-head { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;}
        .exp-head h3 { margin: 0; font-size: 1.15rem; }
        .exp-org { color: var(--violet); font-weight: 600; font-size: 0.92rem; }
        .exp-time { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: rgba(21,18,43,0.5); }
        .exp-card ul { margin: 10px 0 0; padding-left: 18px; color: rgba(21,18,43,0.78); line-height: 1.65; }
        .exp-card li { margin-bottom: 4px; }

        /* ---------- EDUCATION ---------- */
        .edu-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
        .edu-card { background: var(--lilac); border-radius: 18px; padding: 26px; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .edu-card:hover { transform: translateY(-4px); box-shadow: 0 20px 34px -26px rgba(21,18,43,0.35); }
        .edu-card h3 { margin: 0 0 6px; font-size: 1.1rem; }
        .edu-card .sub { color: var(--violetDark); font-weight: 600; font-size: 0.9rem; margin-bottom: 4px; }
        .edu-card .time { font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; color: rgba(21,18,43,0.55); }

        /* ---------- PROJECTS ---------- */
        .proj-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-bottom: 20px;}
        .proj-card {
          border-radius: 18px; padding: 26px; color: #fff; position: relative; overflow: hidden;
          min-height: 190px; display: flex; flex-direction: column; justify-content: flex-end;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .proj-card:hover { transform: translateY(-6px); box-shadow: 0 26px 40px -22px rgba(21,18,43,0.45); }
        .proj-card .proj-tag { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; opacity: 0.85; margin-bottom: 10px; }
        .proj-card h3 { margin: 0 0 8px; font-size: 1.2rem; }
        .proj-card p { margin: 0; font-size: 0.88rem; opacity: 0.9; line-height: 1.55; }

        .rps-card {
          background: var(--ink); color: #fff; border-radius: 20px; padding: 32px;
          display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: center;
        }
        @media (max-width: 700px) { .rps-card { grid-template-columns: 1fr; } }
        .rps-card.shake { animation: shakeX 0.4s ease; }
        @keyframes shakeX { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
        .rps-card h3 { margin: 0 0 6px; font-size: 1.3rem; }
        .rps-card .proj-tag { font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; color: var(--green); margin-bottom: 10px; display:block;}
        .rps-buttons { display: flex; gap: 12px; margin-top: 16px; }
        .rps-btn {
          width: 56px; height: 56px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.06); color: #fff; font-size: 1.5rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: all 0.15s ease;
        }
        .rps-btn:hover { border-color: var(--yellow); transform: translateY(-3px) rotate(-8deg); }
        .rps-btn:active { transform: translateY(0) scale(0.9); }
        .rps-panel { background: rgba(255,255,255,0.06); border-radius: 16px; padding: 20px; min-width: 220px; text-align: center; }
        .rps-score { display: flex; justify-content: space-around; margin-bottom: 14px; }
        .rps-score div span { display: block; font-family: 'Space Grotesk', sans-serif; font-size: 2rem; font-weight: 700; transition: transform 0.2s ease, color 0.2s ease; }
        .rps-score div span.bump { animation: scorePop 0.4s cubic-bezier(0.34,1.56,0.64,1); color: var(--green); }
        @keyframes scorePop { 0% { transform: scale(1); } 45% { transform: scale(1.4); } 100% { transform: scale(1); } }
        .rps-score div small { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; opacity: 0.6; }
        .rps-msg { font-size: 0.85rem; min-height: 20px; transition: color 0.2s ease; }
        .rps-msg.win { color: var(--green); }
        .rps-msg.lose { color: var(--coral); }
        .rps-msg.draw { color: var(--yellow); }

        /* ---------- CONTACT ---------- */
        .contact-wrap { background: var(--ink); border-radius: 28px; padding: clamp(28px, 5vw, 56px); color: #fff; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
        @media (max-width: 860px) { .contact-wrap { grid-template-columns: 1fr; } }
        .contact-wrap h2 { color: #fff; }
        .contact-links { display: flex; flex-direction: column; gap: 14px; margin-top: 24px; }
        .contact-link {
          display: flex; align-items: center; gap: 12px; color: #fff; text-decoration: none;
          padding: 14px 16px; border-radius: 12px; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08); transition: background 0.15s ease, transform 0.15s ease;
          font-size: 0.92rem;
        }
        .contact-link:hover { background: rgba(255,255,255,0.1); transform: translateX(4px); }
        .contact-link .icon-dot { width: 34px; height: 34px; border-radius: 9px; display:flex; align-items:center; justify-content:center; font-size:1rem; flex-shrink:0;}
        form.contact-form { display: flex; flex-direction: column; gap: 14px; }
        .contact-form input, .contact-form textarea {
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px;
          padding: 14px 16px; color: #fff; font-family: 'Inter', sans-serif; font-size: 0.92rem;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .contact-form input:focus, .contact-form textarea:focus { outline: none; border-color: var(--violet); background: rgba(255,255,255,0.09); }
        .contact-form input::placeholder, .contact-form textarea::placeholder { color: rgba(255,255,255,0.4); }
        .contact-form textarea { min-height: 110px; resize: vertical; }
        .contact-form button { margin-top: 4px; }
        .form-note { font-size: 0.75rem; color: rgba(255,255,255,0.45); margin-top: 4px; font-family: 'JetBrains Mono', monospace; }
        .sent-banner { background: rgba(43,213,118,0.15); border: 1px solid var(--green); color: var(--green); padding: 14px 16px; border-radius: 12px; font-size: 0.85rem; font-family: 'JetBrains Mono', monospace; animation: sentIn 0.4s cubic-bezier(0.16,1,0.3,1); }
        @keyframes sentIn { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: none; } }

        footer { text-align: center; padding: 32px 20px; font-size: 0.78rem; color: rgba(21,18,43,0.45); font-family: 'JetBrains Mono', monospace; }

        /* ---------- REVEAL ---------- */
        .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .reveal.in { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: reduce) { .reveal { opacity: 1; transform: none; transition: none; } }

        /* ---------- MARQUEE ---------- */
        .pipeline-strip {
          background: var(--violet); overflow: hidden; white-space: nowrap; padding: 12px 0;
          border-top: 1px solid rgba(255,255,255,0.15); border-bottom: 1px solid rgba(255,255,255,0.15);
        }
        .pipeline-track {
          display: inline-block; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem;
          font-weight: 700; color: #fff; letter-spacing: 0.04em;
          animation: marquee 22s linear infinite;
        }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }
        @media (prefers-reduced-motion: reduce) { .pipeline-track { animation: none; } }

        /* ---------- COVERAGE BAR ---------- */
        .coverage-line { display: flex; align-items: center; gap: 14px; margin: -14px 0 28px; flex-wrap: wrap; }
        .coverage-bar { width: 180px; height: 8px; border-radius: 999px; background: rgba(21,18,43,0.1); overflow: hidden; }
        .coverage-fill { width: 0%; height: 100%; background: linear-gradient(90deg, var(--green), var(--violet)); border-radius: 999px; transition: width 1.1s cubic-bezier(0.16,1,0.3,1); }
        .coverage-fill.filled { width: 92%; }
        .coverage-line span { font-size: 0.78rem; color: rgba(21,18,43,0.55); }

        /* ---------- API CONSOLE ---------- */
        .console-card { background: var(--ink); border-radius: 20px; padding: 26px 28px; color: #fff; }
        .console-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
        .console-head h3 { font-size: 1.2rem; }
        .console-head button:disabled { opacity: 0.6; cursor: default; }
        .console-body { display: flex; flex-direction: column; gap: 10px; }
        .console-row {
          display: grid; grid-template-columns: 16px 1fr auto; align-items: center; gap: 12px;
          background: rgba(255,255,255,0.05); border-radius: 10px; padding: 12px 14px;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .console-name { font-size: 0.82rem; }
        .console-detail { font-size: 0.75rem; opacity: 0.6; text-align: right; transition: color 0.2s ease, opacity 0.2s ease; }
        .console-detail.pass { color: var(--green); opacity: 1; }
        .console-detail.fail { color: var(--coral); opacity: 1; }
        .status-dot { width: 9px; height: 9px; border-radius: 50%; background: rgba(255,255,255,0.25); transition: background 0.2s ease, transform 0.2s ease; }
        .status-dot.running { background: var(--yellow); animation: pulse 1s infinite; }
        .status-dot.pass { background: var(--green); animation: dotPop 0.3s ease; }
        .status-dot.fail { background: var(--coral); animation: dotPop 0.3s ease; }
        @keyframes dotPop { 0% { transform: scale(0.4); } 70% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .console-foot { margin-top: 18px; font-size: 0.75rem; opacity: 0.6; text-align: right; }

        /* ---------- CODE SAMPLES ---------- */
        .code-card { border-radius: 20px; overflow: hidden; border: 1px solid rgba(21,18,43,0.1); }
        .code-tabs { display: flex; background: var(--lilac); }
        .code-tab {
          flex: 1; padding: 14px 10px; background: none; border: none; cursor: pointer;
          font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; color: rgba(21,18,43,0.55);
          border-bottom: 2px solid transparent; transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
        }
        .code-tab.active { color: var(--violetDark); border-bottom-color: var(--violet); background: #fff; font-weight: 700; }
        .code-window { background: #0F0D22; }
        .code-topbar { padding: 10px 20px; color: rgba(255,255,255,0.4); font-size: 0.72rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .code-pre { margin: 0; padding: 22px 24px; overflow-x: auto; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; line-height: 1.7; color: rgba(255,255,255,0.85); animation: fadeSwap 0.3s ease; }
        @keyframes fadeSwap { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .tok-kw { color: #FF9F6B; }
        .tok-st { color: var(--green); }
        .tok-cm { color: rgba(255,255,255,0.35); font-style: italic; }
        .tok-nu { color: var(--yellow); }

        /* ---------- KANBAN ---------- */
        .kanban { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 900px) { .kanban { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 560px) { .kanban { grid-template-columns: 1fr; } }
        .kanban-col { background: var(--lilac); border-radius: 16px; padding: 14px; min-height: 120px; }
        .kanban-col-head { font-size: 0.72rem; font-weight: 700; color: var(--violetDark); display: flex; justify-content: space-between; margin-bottom: 10px; padding: 0 4px; }
        .ticket {
          display: block; width: 100%; text-align: left; background: #fff; border: none; border-radius: 12px;
          padding: 12px 14px; margin-bottom: 10px; cursor: pointer; box-shadow: 0 8px 18px -14px rgba(21,18,43,0.5);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .ticket:hover { transform: translateY(-2px); box-shadow: 0 14px 24px -16px rgba(21,18,43,0.55); }
        .ticket-moved { animation: ticketMoved 0.42s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes ticketMoved { 0% { transform: scale(1) translateY(0); } 40% { transform: scale(1.04) translateY(-6px); } 100% { transform: scale(1) translateY(0); } }
        .ticket-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .sev-dot { font-size: 0.65rem; font-weight: 700; color: #fff; padding: 2px 8px; border-radius: 999px; }
        .ticket-title { font-size: 0.82rem; line-height: 1.4; color: rgba(21,18,43,0.85); }
        @media (prefers-reduced-motion: reduce) {
          .hero-copy > *, .hero-art, .terminal-line, .terminal-result { animation: none !important; opacity: 1 !important; transform: none !important; }
          .nav, .kicker .rule::after { animation: none !important; }
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo"><span className="dot" />Saad Ur Rehman</div>
        <div className="nav-links">
          <button onClick={() => scrollTo("about")}>about</button>
          <button onClick={() => scrollTo("skills")}>skills</button>
          <button onClick={() => scrollTo("experience")}>experience</button>
          <button onClick={() => scrollTo("projects")}>projects</button>
          <button onClick={() => scrollTo("testing")}>testing lab</button>
          <button onClick={() => scrollTo("contact")}>contact</button>
        </div>
        <button className="nav-cta" onClick={() => scrollTo("contact")}>Hire me</button>
        <button className="burger" aria-label="Menu" onClick={() => setNavOpen((v) => !v)}>
         <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
        </button>
        {navOpen && (
          <div style={{ position: "absolute", top: 62, right: 20, background: "#fff", borderRadius: 14, boxShadow: "0 20px 40px -20px rgba(0,0,0,0.3)", padding: 16, display: "flex", flexDirection: "column", gap: 10, border: "1px solid rgba(21,18,43,0.08)" }}>
            {["about", "skills", "experience", "projects", "testing", "contact"].map((k) => (
              <button key={k} onClick={() => scrollTo(k)} style={{ textAlign: "left", background: "none", border: "none", fontFamily: "JetBrains Mono, monospace", fontSize: "0.85rem", cursor: "pointer" }}>{k}</button>
            ))}
          </div>
        )}
      </nav>

      {/* HERO */}
      <header className="hero">
        <div className={`hero-copy ${heroIn ? "in" : ""}`} style={{ position: "relative" }}>
          <div className="eyebrow">status: open to work</div>
          <h1>QA engineer by trade.<br/>React developer by <span>habit</span>.</h1>
          <p className="lede">I find what's broken before your users do, then I go build the thing that doesn't break. Based in Islamabad, Pakistan.</p>
          <div className="hero-ctas">
            <button className="btn-primary" onClick={() => scrollTo("contact")}>Start a conversation</button>
            <a className="btn-ghost" href="https://wa.me/923122800592" target="_blank" rel="noreferrer">Chat on WhatsApp</a>
          </div>
        </div>
        <div className={`hero-art ${heroIn ? "in" : ""}`} style={{ position: "relative" }}>
          <div className="terminal">
            <div className="terminal-bar">
              <span style={{ background: "#FF5F57" }} />
              <span style={{ background: "#FEBC2E" }} />
              <span style={{ background: "#28C840" }} />
            </div>
            <div className="terminal-line">$ <b>whoami</b></div>
            <div className="terminal-line" style={{ marginLeft: 12 }}>Saad Ur Rehman — SQA + React, Islamabad</div>
            <div className="terminal-line">$ <b>run test-suite --profile</b></div>
            <div className="terminal-result">[PASS] Manual &amp; regression testing</div>
            <div className="terminal-result">[PASS] React.js development</div>
            <div className="terminal-result">[PASS] API testing — Postman</div>
            <div className="terminal-result run">[ RUN ] Looking for the next role<span className="cursor" /></div>
          </div>
        </div>
      </header>

      {/* PIPELINE MARQUEE */}
      <div className="pipeline-strip" aria-hidden="true">
        <div className="pipeline-track">
          {Array(3).fill("BUILD → UNIT TEST → API TEST → REGRESSION → CODE REVIEW → DEPLOY   ").join("")}
        </div>
      </div>

      {/* ABOUT */}
      <section className="block" ref={sectionRefs.about}>
        <div className="kicker"><span className="id mono">TC-001</span><div className="rule" /><span className="mono" style={{ fontSize: "0.78rem", opacity: 0.5 }}>ABOUT</span></div>
        <h2>The short version</h2>
        <div className="about-grid">
          <Reveal>
            <div className="photo-frame">
              <img src="/portfolio.jpeg" alt="Saad Ur Rehman" />
              <span className="photo-stamp">✓ VERIFIED</span>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="about-card">
              <p>I'm a detail-oriented SQA engineer and frontend React developer. My day job is manual testing, test case design, and defect tracking — catching what shouldn't ship. My side of the desk is React, where I build the responsive interfaces that then get tested by people like me.</p>
              <p>I've spent the last several months moving between QA and development roles at DataViz, Airblue, and SIPSAP Optimization, picking up API testing, regression workflows, and agile collaboration along the way. I graduated with a BS in Computer Science from Iqra University in July 2025.</p>
              <div className="meta-row">
                <Badge tone="ink">📍 Islamabad, PK</Badge>
                <Badge tone="green">🎓 BS Computer Science</Badge>
                <Badge tone="yellow">🧪 SQA + Frontend</Badge>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* SKILLS */}
      <section className="block" style={{ background: "#fff" }} ref={sectionRefs.skills}>
        <div className="kicker"><span className="id mono">TC-002</span><div className="rule" /><span className="mono" style={{ fontSize: "0.78rem", opacity: 0.5 }}>SKILLS COVERAGE</span></div>
        <h2>What I test with, what I build with</h2>
        <div className="coverage-line" ref={coverageRef}>
          <div className="coverage-bar"><div className={`coverage-fill ${coverageVisible ? "filled" : ""}`} /></div>
          <span className="mono">92% coverage — manual, automation &amp; API testing</span>
        </div>
        <div className="skills-grid">
          {SKILLS.map((s, i) => (
            <Reveal key={s.group} delay={i * 80}>
              <div className="skill-card">
                <div className="group-name"><span className="swatch" style={{ background: s.color }} />{s.group}</div>
                <div className="tag-row">
                  {s.tags.map((t) => <Badge key={t} tone="ink">{t}</Badge>)}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* EXPERIENCE */}
      <section className="block" ref={sectionRefs.experience}>
        <div className="kicker"><span className="id mono">TC-003</span><div className="rule" /><span className="mono" style={{ fontSize: "0.78rem", opacity: 0.5 }}>EXPERIENCE LOG</span></div>
        <h2>Where I've worked</h2>
        <div className="exp-list">
          {EXPERIENCE.map((e, i) => (
            <Reveal key={e.id} delay={i * 100}>
              <div className="exp-card">
                <div>
                  <div className="exp-id">{e.id}</div>
                  <div style={{ marginTop: 8 }}><Badge tone={e.status === "RUNNING" ? "yellow" : "green"}>{e.status}</Badge></div>
                </div>
                <div>
                  <div className="exp-head">
                    <div>
                      <h3>{e.role}</h3>
                      <div className="exp-org">{e.org}</div>
                    </div>
                    <div className="exp-time">{e.time}</div>
                  </div>
                  <ul>{e.bullets.map((b, bi) => <li key={bi}>{b}</li>)}</ul>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* EDUCATION */}
      <section className="block" style={{ background: "#fff" }} ref={sectionRefs.education}>
        <div className="kicker"><span className="id mono">TC-004</span><div className="rule" /><span className="mono" style={{ fontSize: "0.78rem", opacity: 0.5 }}>EDUCATION</span></div>
        <h2>How I got here</h2>
        <div className="edu-grid">
          <Reveal>
            <div className="edu-card">
              <h3>BS Computer Science</h3>
              <div className="sub">Iqra University, H9 Campus, Islamabad</div>
              <div className="time">Graduated — July 2025</div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="edu-card">
              <h3>FSc (Pre-Engineering)</h3>
              <div className="sub">Al Quran Beacon College, Mansehra</div>
              <div className="time">2019 — 2021</div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PROJECTS */}
      <section className="block" ref={sectionRefs.projects}>
        <div className="kicker"><span className="id mono">TC-005</span><div className="rule" /><span className="mono" style={{ fontSize: "0.78rem", opacity: 0.5 }}>PROJECTS</span></div>
        <h2>Things I've built</h2>
        <div className="proj-grid">
          {PROJECTS.map((p, i) => (
            <Reveal key={p.title} delay={i * 100}>
              <div className="proj-card" style={{ background: p.color }}>
                <div className="proj-tag">{p.tag}</div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={150}>
          <div className={`rps-card ${rps.shake ? "shake" : ""}`} key={rps.shake}>
            <div>
              <span className="proj-tag">HTML · CSS · JAVASCRIPT — PLAYABLE</span>
              <h3>Rock, Paper, Scissors</h3>
              <p style={{ opacity: 0.75, fontSize: "0.9rem", maxWidth: "40ch" }}>The exact game logic from my original project, rebuilt here in React. Play a round.</p>
              <div className="rps-buttons">
                <button className="rps-btn" onClick={() => rps.play("rock")} aria-label="Rock">🪨</button>
                <button className="rps-btn" onClick={() => rps.play("paper")} aria-label="Paper">📄</button>
                <button className="rps-btn" onClick={() => rps.play("scissors")} aria-label="Scissors">✂️</button>
              </div>
            </div>
            <div className="rps-panel">
              <div className="rps-score">
                <div><span className={rps.bump === "user" ? "bump" : ""}>{rps.scores.user}</span><small>YOU</small></div>
                <div><span className={rps.bump === "computer" ? "bump" : ""}>{rps.scores.computer}</span><small>COMPUTER</small></div>
              </div>
              <div className={`rps-msg ${rps.msg.tone}`}>{rps.msg.text}</div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* TESTING LAB — API CONSOLE */}
      <section className="block" style={{ background: "#fff" }} ref={sectionRefs.testing}>
        <div className="kicker"><span className="id mono">TC-006</span><div className="rule" /><span className="mono" style={{ fontSize: "0.78rem", opacity: 0.5 }}>TESTING LAB — API</span></div>
        <h2>Watch me test something, live</h2>
        <p style={{ color: "rgba(21,18,43,0.65)", maxWidth: "60ch", marginTop: -14, marginBottom: 28 }}>This isn't a mockup — it runs real assertions against a public REST API from your browser right now.</p>
        <Reveal><ApiConsole /></Reveal>
      </section>

      {/* TESTING LAB — CODE SAMPLES */}
      <section className="block">
        <div className="kicker"><span className="id mono">TC-007</span><div className="rule" /><span className="mono" style={{ fontSize: "0.78rem", opacity: 0.5 }}>TESTING LAB — CODE</span></div>
        <h2>How I write tests</h2>
        <p style={{ color: "rgba(21,18,43,0.65)", maxWidth: "60ch", marginTop: -14, marginBottom: 28 }}>A Selenium UI test, an API test, and a component test — three layers of the testing pyramid I actually use.</p>
        <Reveal><CodeSamples /></Reveal>
      </section>

      {/* TESTING LAB — BUG TRACKER */}
      <section className="block" style={{ background: "#fff" }}>
        <div className="kicker"><span className="id mono">TC-008</span><div className="rule" /><span className="mono" style={{ fontSize: "0.78rem", opacity: 0.5 }}>TESTING LAB — DEFECT LOG</span></div>
        <h2>Bug tracker (click a ticket to advance it)</h2>
        <Reveal><BugTracker /></Reveal>
      </section>

      {/* CONTACT */}
      <section className="block" ref={sectionRefs.contact}>
        <div className="kicker"><span className="id mono">TC-009</span><div className="rule" /><span className="mono" style={{ fontSize: "0.78rem", opacity: 0.5 }}>CONTACT</span></div>
        <Reveal>
        <div className="contact-wrap">
          <div>
            <h2>Let's talk</h2>
            <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.6, maxWidth: "38ch" }}>Open to SQA and frontend React roles, freelance testing work, or just a conversation about quality engineering.</p>
            <div className="contact-links">
              <a className="contact-link" href="https://wa.me/923122800592" target="_blank" rel="noreferrer"><span className="icon-dot" style={{ background: TOKENS.green }}>💬</span>WhatsApp — +923122800592</a>
              <a className="contact-link" href="mailto:saadkhan.compk786@gmail.com"><span className="icon-dot" style={{ background: TOKENS.coral }}>✉️</span>saadkhan.compk786@gmail.com</a>
              <a className="contact-link" href="https://www.linkedin.com/in/saad-ur-rehman-577310245" target="_blank" rel="noreferrer"><span className="icon-dot" style={{ background: TOKENS.violet }}>in</span>LinkedIn — saad-ur-rehman</a>
            </div>
          </div>
          <div>
            {sent ? (
              <div className="sent-banner">[PASS] Your email client should be open now — send it whenever you're ready.</div>
            ) : (
              <form className="contact-form" onSubmit={submit}>
                <input required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input required type="email" placeholder="Your email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <textarea required placeholder="What are you looking for?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                <button type="submit" className="btn-primary" style={{ width: "fit-content" }}>Send message</button>
                <div className="form-note">opens your email client with this message pre-filled, addressed to me</div>
              </form>
            )}
          </div>
        </div>
        </Reveal>
      </section>

      <footer>Built by Saad Ur Rehman — React.js · HTML · CSS · .NET</footer>
    </div>
  );
}