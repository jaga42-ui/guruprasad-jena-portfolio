'use client';
import React from 'react';
import Starfield from '@/components/Starfield';

const CMDS = {
  help: "available: whoami · about · skills · projects · stack · socials · contact · resume · joke · sudo · clear\n(arrow keys walk your history)",
  whoami: "> fullstack developer & problem solver",
  about: "> Guruprasad Jena — builder of things.\n  I like software that people actually use.",
  skills: "[ React ] [ Node.js ] [ MongoDB ] [ Express.js ] [ Tailwind ]\n[ Docker ] [ Git ] [ Linux ] [ Vite ] [ Framer Motion ]",
  projects: "> 4 shipped, live right now. see the Projects tab",
  stack: "> MERN + TypeScript, deployed on anything that will hold still",
  socials: "> github.com/jaga42-ui\n> linkedin.com/in/guruprasad-jena\n> guruprasadjena989@gmail.com",
  contact: "> guruprasadjena989@gmail.com — replies within a day",
  resume: "> resume.pdf — one page, no buzzwords",
  currently: "> Building cool stuff & shipping ideas",
  joke: "> there are 2 hard things in CS: cache invalidation, naming things, and off-by-one errors",
  sudo: "> nice try. you are not in the sudoers file. this incident has been reported.",
  ls: "> about  skills  projects  contact",
  date: "> " + new Date().toDateString(),
  echo: "> ...echo what?",
};
const BOOT = [
  ["whoami", CMDS.whoami],
  ["skills --list", CMDS.skills],
  ["currently", "> Building cool stuff & shipping ideas 🚀"],
];

class Page extends React.Component {
  state = { lines: [], value: "", booting: true, typed: "", history: [], hIdx: -1, deploy: 0 };

  componentDidMount() {
    this.timers = [];
    this.runBoot(0);
    this.runDeploy();
  }

  /* stuttering deploy cadence: quick bursts, a stall near the end, then 100% */
  runDeploy() {
    const steps = [8, 19, 27, 41, 44, 58, 71, 74, 88, 93, 96, 100];
    let i = 0;
    const tick = () => {
      this.setState({ deploy: steps[i] });
      i++;
      if (i < steps.length) this.wait(steps[i - 1] > 90 ? 700 : 200 + Math.random() * 420, tick);
      else this.wait(2600, () => { this.setState({ deploy: 0 }); this.wait(700, () => { i = 0; tick(); }); });
    };
    this.wait(900, tick);
  }
  componentWillUnmount() { (this.timers || []).forEach(clearTimeout); }

  wait(ms, fn) { this.timers.push(setTimeout(fn, ms)); }

  /* types a command char-by-char, then prints its output */
  runBoot(i) {
    if (i >= BOOT.length) { this.setState({ booting: false }); return; }
    const [cmd, out] = BOOT[i];
    let n = 0;
    const tick = () => {
      n++;
      this.setState({ typed: cmd.slice(0, n) });
      if (n < cmd.length) this.wait(45 + Math.random() * 55, tick);
      else this.wait(320, () => {
        this.setState((s) => ({ lines: s.lines.concat([{ cmd: cmd, out: out }]), typed: "" }));
        this.wait(420, () => this.runBoot(i + 1));
      });
    };
    this.wait(i === 0 ? 700 : 260, tick);
  }

  run(raw) {
    const cmd = raw.trim();
    if (!cmd) return;
    if (cmd === "clear") { this.setState({ lines: [], value: "", history: [], hIdx: -1 }); return; }
    const key = cmd.split(" ")[0].toLowerCase();
    const out = CMDS[key] || 'command not found: ' + key + ' — try "help"';
    this.setState((s) => ({
      lines: s.lines.concat([{ cmd: cmd, out: out }]),
      value: "",
      history: [cmd].concat(s.history).slice(0, 30),
      hIdx: -1,
    }));
  }

  termLine(l, i) {
    return React.createElement(
      "div",
      { key: "l" + i, style: { marginTop: "0.6rem" } },
      React.createElement("p", { style: { margin: 0, color: "#7daa76" } },
        React.createElement("span", { style: { color: "#6fa8ea" } }, "\u279c"), " " + l.cmd),
      React.createElement("p", { style: { margin: 0, color: "#ded4bd", whiteSpace: "pre-wrap" } }, l.out)
    );
  }

  starfield() {
    // 120 animated spans → one canvas; identical field, one paint.
    if (this.props.starfield === false) return null;
    return React.createElement(Starfield);
  }
  renderVals() {
    const out = this.state.lines.map((l, i) => this.termLine(l, i));
    if (this.state.booting) {
      out.push(React.createElement("p", { key: "typing", style: { margin: "0.6rem 0 0", color: "#7daa76" } },
        React.createElement("span", { style: { color: "#6fa8ea" } }, "\u279c"), " " + this.state.typed,
        React.createElement("span", {
          style: { display: "inline-block", width: "0.5rem", height: "0.9rem", verticalAlign: "-2px",
            marginLeft: "2px", background: "#7daa76", animation: "blink 1.1s steps(1,end) infinite" },
        })
      ));
    }
    return {
      stars: this.starfield(),
      deployFill: this.state.deploy + "%",
      deployLabel: this.state.deploy + "%",
      termOutput: React.createElement(React.Fragment, null, out),
      termValue: this.state.value,
      termInput: (el) => { this.input = el; },
      focusTerm: () => { if (this.input) this.input.focus(); },
      onTermChange: (e) => this.setState({ value: e.target.value }),
      onTermKey: (e) => {
        if (e.key === "Enter") { this.run(this.state.value); return; }
        const h = this.state.history;
        if (e.key === "ArrowUp" && h.length) {
          e.preventDefault();
          const i = Math.min(this.state.hIdx + 1, h.length - 1);
          this.setState({ hIdx: i, value: h[i] });
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          const i = this.state.hIdx - 1;
          this.setState({ hIdx: i, value: i < 0 ? "" : h[i] });
        }
      },
    };
  }

  render() {
    const V = this.renderVals();
    return (
      <>


<svg aria-hidden="true" focusable="false" style={{ position: 'absolute', width: '0', height: '0', overflow: 'hidden' }}>
  <defs>
    <filter id="torn-edge-1" x="-12%" y="-12%" width="124%" height="124%"><feTurbulence type="fractalNoise" baseFrequency="0.016 0.022" numOctaves="2" seed="7" result="n"></feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="5"></feDisplacementMap></filter>
    <filter id="torn-edge-2" x="-12%" y="-12%" width="124%" height="124%"><feTurbulence type="fractalNoise" baseFrequency="0.021 0.014" numOctaves="2" seed="41" result="n"></feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="6"></feDisplacementMap></filter>
    <filter id="torn-edge-3" x="-12%" y="-12%" width="124%" height="124%"><feTurbulence type="fractalNoise" baseFrequency="0.013 0.026" numOctaves="2" seed="89" result="n"></feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="7"></feDisplacementMap></filter>
    <filter id="rough-tape" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency="0.06 0.16" numOctaves="2" seed="15" result="n"></feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="2.6"></feDisplacementMap></filter>
    <filter id="sketch-edge" x="-18%" y="-18%" width="136%" height="136%"><feTurbulence type="fractalNoise" baseFrequency="0.05 0.09" numOctaves="2" seed="23" result="n"></feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="3.4"></feDisplacementMap></filter>
  </defs>
</svg>

<div data-screen-label="Home" style={{ position: 'relative', minHeight: '100dvh', color: '#ede4d8', background: 'transparent' }}>

  <span aria-hidden="true" data-r="foil" style={{ position: 'fixed', inset: '0', zIndex: '0', pointerEvents: 'none', padding: '9px', background: 'linear-gradient(135deg,#3f4e58,#26323a 40%,#35454f 70%,#212b33) border-box', WebkitMask: 'linear-gradient(#000 0 0) padding-box exclude, linear-gradient(#000 0 0)', mask: 'linear-gradient(#000 0 0) padding-box exclude, linear-gradient(#000 0 0)', opacity: '0.9', filter: 'url(#torn-edge-2)' }}></span>


  <span aria-hidden="true" data-r="spiral" style={{ position: 'fixed', top: '0', bottom: '0', left: '-16px', width: '64px', zIndex: '5', pointerEvents: 'none', backgroundRepeat: 'repeat-y', backgroundPosition: 'center top', backgroundSize: '64px 46px', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'34\' viewBox=\'0 0 48 34\'%3E%3Cpath d=\'M18 10 C 5 10 2 13.5 2 17 C 2 20.5 5 24 18 24\' fill=\'none\' stroke=\'rgba(0,0,0,0.6)\' stroke-width=\'6\' stroke-linecap=\'round\' transform=\'translate(1.8 2.6)\'/%3E%3Cpath d=\'M18 10 C 5 10 2 13.5 2 17 C 2 20.5 5 24 18 24\' fill=\'none\' stroke=\'%230d0d0f\' stroke-width=\'8.6\' stroke-linecap=\'round\'/%3E%3Cpath d=\'M18 10 C 5 10 2 13.5 2 17 C 2 20.5 5 24 18 24\' fill=\'none\' stroke=\'%231b1b1e\' stroke-width=\'5.4\' stroke-linecap=\'round\'/%3E%3Cpath d=\'M18 10 C 5 10 2 13.5 2 17 C 2 20.5 5 24 18 24\' fill=\'none\' stroke=\'%23303035\' stroke-width=\'2.4\' stroke-linecap=\'round\' opacity=\'0.85\'/%3E%3Cpath d=\'M15 10.6 C 7 11 3.6 13.6 2.7 16.4\' fill=\'none\' stroke=\'%239aa0aa\' stroke-width=\'1.6\' stroke-linecap=\'round\' opacity=\'0.8\'/%3E%3Cellipse cx=\'18.5\' cy=\'10\' rx=\'2.3\' ry=\'2.7\' fill=\'%23020202\'/%3E%3Cellipse cx=\'18.5\' cy=\'24\' rx=\'2.3\' ry=\'2.7\' fill=\'%23020202\'/%3E%3C/svg%3E' }}></span>

      <div aria-hidden="true" style={{ position: 'absolute', inset: '0', zIndex: '0', pointerEvents: 'none', overflow: 'hidden' }} data-motion-deco="">
    <svg aria-hidden="true" viewBox="0 0 32 32" style={{ position: 'absolute', top: '5.78%', left: '91.07%', width: '2.20rem', height: '2.2rem', overflow: 'visible', opacity: '0.75', transform: 'rotate(-8deg)', animation: 'tk 3.40s ease-in-out 1.20s infinite' }}><defs><linearGradient id="dg-sk-0" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#e58d55"></stop><stop offset="100%" stopColor="#d080cc"></stop></linearGradient></defs><path d="M16 2 C17.5 12 20 14.5 30 16 C20 17.5 17.5 20 16 30 C14.5 20 12 17.5 2 16 C12 14.5 14.5 12 16 2 Z" fill="none" stroke="url(#dg-sk-0)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" style={{ '--L': '1', strokeDasharray: '1', strokeDashoffset: '0', animation: 'dw 1.15s ease-in-out 0.25s forwards' }}></path></svg>
    <svg aria-hidden="true" viewBox="0 0 36 36" style={{ position: 'absolute', top: '31.98%', left: '89.71%', width: '1.90rem', height: '1.9rem', overflow: 'visible', opacity: '0.75', transform: 'rotate(10deg)', animation: 'tk 3.71s ease-in-out 1.44s infinite' }}><path d="M18 3 22 14 33 14 24 21 27 32 18 25 9 32 12 21 3 14 14 14 Z" fill="none" stroke="#e8b64a" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" style={{ '--L': '1', strokeDasharray: '1', strokeDashoffset: '0', animation: 'dw 1.15s ease-in-out 0.43s forwards' }}></path></svg>
    <svg aria-hidden="true" viewBox="0 0 60 24" style={{ position: 'absolute', top: '86.1%', left: '78.73%', width: '3.75rem', height: '1.5rem', overflow: 'visible', opacity: '0.62', transform: 'rotate(-4deg)', animation: 'sw 7.68s ease-in-out -1.40s infinite, rk 10.0s ease-in-out infinite' }}><defs><linearGradient id="dg-sk-2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6fb8ae"></stop><stop offset="100%" stopColor="#9a6be0"></stop></linearGradient></defs><path d="M2 18 C8 4 14 4 18 12 C22 20 28 20 32 12 C36 4 42 4 46 12 C50 20 56 18 58 10" fill="none" stroke="url(#dg-sk-2)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" style={{ '--L': '1', strokeDasharray: '1', strokeDashoffset: '0', animation: 'dw 1.15s ease-in-out 0.61s forwards' }}></path></svg>
    <svg aria-hidden="true" viewBox="0 0 36 32" style={{ position: 'absolute', top: '19.28%', left: '78.27%', width: '2.14rem', height: '1.9rem', overflow: 'visible', opacity: '0.62', transform: 'rotate(7deg)', animation: 'hb 3.02s ease-in-out 2.00s infinite' }}><defs><linearGradient id="dg-sk-3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ce72c0"></stop><stop offset="100%" stopColor="#e58d55"></stop></linearGradient></defs><path d="M18 28 C 4 18 2 8 9 5 C 14 3 18 7 18 10 C 18 7 22 3 27 5 C 34 8 32 18 18 28 Z" fill="none" stroke="url(#dg-sk-3)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" style={{ '--L': '1', strokeDasharray: '1', strokeDashoffset: '0', animation: 'dw 1.15s ease-in-out 0.79s forwards' }}></path></svg>
    <svg aria-hidden="true" viewBox="0 0 80 26" style={{ position: 'absolute', top: '69.51%', left: '70%', width: '4.92rem', height: '1.6rem', overflow: 'visible', opacity: '0.62', transform: 'rotate(5deg)', animation: 'sw 8.56s ease-in-out -2.80s infinite, rk 11.0s ease-in-out infinite' }}><defs><linearGradient id="dg-sk-4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#7daa76"></stop><stop offset="100%" stopColor="#6fb8ae"></stop></linearGradient></defs><path d="M3 20 12 6 21 20 30 6 39 20 48 6 57 20 66 6 76 18" fill="none" stroke="url(#dg-sk-4)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" style={{ '--L': '1', strokeDasharray: '1', strokeDashoffset: '0', animation: 'dw 1.15s ease-in-out 0.97s forwards' }}></path></svg>
    <svg aria-hidden="true" viewBox="0 0 36 36" style={{ position: 'absolute', top: '82.08%', left: '33.51%', width: '1.50rem', height: '1.5rem', overflow: 'visible', opacity: '0.75', transform: 'rotate(-12deg)', animation: 'tk 4.95s ease-in-out 2.40s infinite' }}><path d="M18 3 22 14 33 14 24 21 27 32 18 25 9 32 12 21 3 14 14 14 Z" fill="none" stroke="#d080cc" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" style={{ '--L': '1', strokeDasharray: '1', strokeDashoffset: '0', animation: 'dw 1.15s ease-in-out 1.15s forwards' }}></path></svg>
    <svg aria-hidden="true" viewBox="0 0 110 50" style={{ position: 'absolute', top: '68.55%', left: '54.33%', width: '4.84rem', height: '2.2rem', overflow: 'visible', opacity: '0.62', transform: 'rotate(-3deg)', animation: 'sw 9.44s ease-in-out -4.20s infinite, rk 12.0s ease-in-out infinite' }}><defs><linearGradient id="dg-sk-6" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#b58ce8"></stop><stop offset="100%" stopColor="#e58d55"></stop></linearGradient></defs><path d="M6 40 C30 10 52 6 60 20 C66 31 52 38 46 30 C40 20 62 8 100 14" fill="none" stroke="url(#dg-sk-6)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" style={{ '--L': '1', strokeDasharray: '1', strokeDashoffset: '0', animation: 'dw 1.15s ease-in-out 1.33s forwards' }}></path></svg>
    <svg aria-hidden="true" viewBox="0 0 120 20" style={{ position: 'absolute', top: '76.69%', left: '48.34%', width: '6.60rem', height: '1.1rem', overflow: 'visible', opacity: '0.62', transform: 'rotate(4deg)', animation: 'sw 9.88s ease-in-out -4.90s infinite, rk 12.5s ease-in-out infinite' }}><defs><linearGradient id="dg-sk-7" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#e58d55"></stop><stop offset="100%" stopColor="#d080cc"></stop></linearGradient></defs><path d="M4 12 C30 4 60 16 116 7" fill="none" stroke="url(#dg-sk-7)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" style={{ '--L': '1', strokeDasharray: '1', strokeDashoffset: '0', animation: 'dw 1.15s ease-in-out 1.51s forwards' }}></path><path d="M8 17 C34 10 62 20 112 13" fill="none" stroke="url(#dg-sk-7)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" style={{ '--L': '1', strokeDasharray: '1', strokeDashoffset: '0', animation: 'dw 1.15s ease-in-out 1.73s forwards' }}></path></svg>
    <svg aria-hidden="true" viewBox="0 0 32 32" style={{ position: 'absolute', top: '38.96%', left: '92.31%', width: '1.80rem', height: '1.8rem', overflow: 'visible', opacity: '0.75', transform: 'rotate(12deg)', animation: 'tk 5.88s ease-in-out 3.12s infinite' }}><defs><linearGradient id="dg-sk-8" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6fb8ae"></stop><stop offset="100%" stopColor="#9a6be0"></stop></linearGradient></defs><path d="M16 2 C17.5 12 20 14.5 30 16 C20 17.5 17.5 20 16 30 C14.5 20 12 17.5 2 16 C12 14.5 14.5 12 16 2 Z" fill="none" stroke="url(#dg-sk-8)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" style={{ '--L': '1', strokeDasharray: '1', strokeDashoffset: '0', animation: 'dw 1.15s ease-in-out 1.69s forwards' }}></path></svg>
    <svg aria-hidden="true" viewBox="0 0 40 30" style={{ position: 'absolute', top: '46.64%', left: '85.79%', width: '2.00rem', height: '1.5rem', overflow: 'visible', opacity: '0.62', transform: 'rotate(-6deg)', animation: 'sw 10.76s ease-in-out -6.30s infinite, rk 13.5s ease-in-out infinite' }}><path d="M4 22 C14 8 22 6 34 10" fill="none" stroke="#7daa76" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" style={{ '--L': '1', strokeDasharray: '1', strokeDashoffset: '0', animation: 'dw 1.15s ease-in-out 1.87s forwards' }}></path><path d="M6 26 C16 12 24 10 36 14" fill="none" stroke="#7daa76" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" style={{ '--L': '1', strokeDasharray: '1', strokeDashoffset: '0', animation: 'dw 1.15s ease-in-out 2.09s forwards' }}></path></svg>
    <svg aria-hidden="true" viewBox="0 0 36 32" style={{ position: 'absolute', top: '88.35%', left: '68.51%', width: '1.69rem', height: '1.5rem', overflow: 'visible', opacity: '0.62', transform: 'rotate(-5deg)', animation: 'hb 4.00s ease-in-out 3.40s infinite' }}><path d="M18 28 C 4 18 2 8 9 5 C 14 3 18 7 18 10 C 18 7 22 3 27 5 C 34 8 32 18 18 28 Z" fill="none" stroke="#ce72c0" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" style={{ '--L': '1', strokeDasharray: '1', strokeDashoffset: '0', animation: 'dw 1.15s ease-in-out 2.05s forwards' }}></path></svg>
    <svg aria-hidden="true" viewBox="0 0 36 36" style={{ position: 'absolute', top: '77.01%', left: '84.3%', width: '1.60rem', height: '1.6rem', overflow: 'visible', opacity: '0.75', transform: 'rotate(14deg)', animation: 'tk 6.81s ease-in-out 3.84s infinite' }}><path d="M18 3 22 14 33 14 24 21 27 32 18 25 9 32 12 21 3 14 14 14 Z" fill="none" stroke="#e8b64a" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" style={{ '--L': '1', strokeDasharray: '1', strokeDashoffset: '0', animation: 'dw 1.15s ease-in-out 2.23s forwards' }}></path></svg>
    <svg aria-hidden="true" viewBox="0 0 30 30" style={{ position: 'absolute', top: '2.18%', left: '2.14%', width: '1.30rem', height: '1.3rem', overflow: 'visible', opacity: '0.7', transform: 'rotate(8deg)', animation: 'sw 12.08s ease-in-out -8.40s infinite, rk 15.0s ease-in-out infinite' }}><path d="M15 3 L18.4 11.4 L27.5 12 L20.5 17.8 L23 26.5 L15 21.6 L7 26.5 L9.5 17.8 L2.5 12 L11.6 11.4 Z" fill="none" stroke="#b58ce8" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" style={{ '--L': '1', strokeDasharray: '1', strokeDashoffset: '0', animation: 'dw 1.4s ease-in-out 2.41s forwards' }}></path></svg>
    <span aria-hidden="true" style={{ position: 'absolute', top: '32.98%', left: '80.86%', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '1.05rem', lineHeight: '1', color: '#e58d55', animation: 'tk 3.0s ease-in-out 0.0s infinite' }}>✦</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '27.98%', left: '48.84%', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.8rem', lineHeight: '1', color: '#d080cc', animation: 'tk 3.8s ease-in-out 0.7s infinite' }}>✧</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '59.19%', left: '90.01%', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.75rem', lineHeight: '1', color: '#7daa76', animation: 'tk 4.6s ease-in-out 1.4s infinite' }}>✦</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '50.29%', left: '87.43%', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.9rem', lineHeight: '1', color: '#b58ce8', animation: 'tk 5.4s ease-in-out 2.1s infinite' }}>✧</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '67.13%', left: '16.16%', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.85rem', lineHeight: '1', color: '#6fb8ae', animation: 'tk 3.0s ease-in-out 2.8s infinite' }}>✦</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '38.59%', left: '81.87%', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.95rem', lineHeight: '1', color: '#d080cc', animation: 'tk 3.8s ease-in-out 0.0s infinite' }}>✧</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '30.84%', left: '91.19%', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.8rem', lineHeight: '1', color: '#6fb8ae', animation: 'tk 4.6s ease-in-out 0.7s infinite' }}>✦</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '82.08%', left: '93.82%', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.9rem', lineHeight: '1', color: '#e58d55', animation: 'tk 5.4s ease-in-out 1.4s infinite' }}>✧</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '48.14%', left: '55.49%', fontFamily: 'Caveat,cursive', fontSize: '0.95rem', lineHeight: '1', color: '#9a6be0', rotate: '3deg', textShadow: '0 0 7px #9a6be066', animation: 'tk 4.45s ease-in-out 2.60s infinite' }}>✦</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '5.96%', left: '72.32%', fontFamily: 'Caveat,cursive', fontSize: '0.95rem', lineHeight: '1', color: '#b58ce8', rotate: '-2deg', textShadow: '0 0 7px #b58ce866', animation: 'tk 5.85s ease-in-out 1.12s infinite' }}>✧</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '94.41%', left: '55.28%', fontFamily: 'Caveat,cursive', fontSize: '1.1rem', lineHeight: '1', color: '#b58ce8', rotate: '-6deg', textShadow: '0 0 7px #b58ce866', animation: 'tk 4.77s ease-in-out 3.33s infinite' }}>✦</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '73.54%', left: '3.53%', fontFamily: 'Caveat,cursive', fontSize: '0.95rem', lineHeight: '1', color: '#9a6be0', rotate: '0deg', textShadow: '0 0 7px #9a6be066', animation: 'tk 3.01s ease-in-out 0.83s infinite' }}>✚</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '66.09%', left: '28.21%', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '1.28rem', lineHeight: '1', color: '#e58d55', rotate: '1deg', textShadow: '0 0 7px #e58d5566', animation: 'tk 4.90s ease-in-out 2.26s infinite' }}>✦</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '37.97%', left: '37.91%', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '1.1rem', lineHeight: '1', color: '#7daa76', rotate: '2deg', textShadow: '0 0 7px #7daa7666', animation: 'tk 4.62s ease-in-out 0.44s infinite' }}>✦</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '56.78%', left: '85.14%', fontFamily: 'Caveat,cursive', fontSize: '0.85rem', lineHeight: '1', color: '#6fb8ae', rotate: '0deg', textShadow: '0 0 7px #6fb8ae66', animation: 'tk 5.97s ease-in-out 1.09s infinite' }}>✦</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '63.08%', left: '77.69%', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '1.28rem', lineHeight: '1', color: '#7daa76', rotate: '8deg', textShadow: '0 0 7px #7daa7666', animation: 'tk 3.01s ease-in-out 1.17s infinite' }}>✦</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '42.45%', left: '10.06%', fontFamily: 'Caveat,cursive', fontSize: '0.72rem', lineHeight: '1', color: '#e58d55', rotate: '-6deg', textShadow: '0 0 7px #e58d5566', animation: 'tk 5.82s ease-in-out 2.22s infinite' }}>✧</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '19.05%', left: '92.1%', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.95rem', lineHeight: '1', color: '#e58d55', rotate: '2deg', textShadow: '0 0 7px #e58d5566', animation: 'tk 4.46s ease-in-out 2.65s infinite' }}>✧</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '11.36%', left: '74.12%', fontFamily: 'Caveat,cursive', fontSize: '0.72rem', lineHeight: '1', color: '#9a6be0', rotate: '-6deg', textShadow: '0 0 7px #9a6be066', animation: 'tk 3.08s ease-in-out 0.70s infinite' }}>✧</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '18.75%', left: '43.07%', fontFamily: 'Caveat,cursive', fontSize: '0.85rem', lineHeight: '1', color: '#7daa76', rotate: '-14deg', textShadow: '0 0 7px #7daa7666', animation: 'tk 5.76s ease-in-out 2.38s infinite' }}>✚</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '56.43%', left: '66.41%', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.95rem', lineHeight: '1', color: '#b58ce8', rotate: '-6deg', textShadow: '0 0 7px #b58ce866', animation: 'tk 5.35s ease-in-out 2.33s infinite' }}>✦</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '61.81%', left: '25.20%', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.85rem', lineHeight: '1', color: '#9a6be0', rotate: '-1deg', textShadow: '0 0 7px #9a6be066', animation: 'tk 4.60s ease-in-out 1.96s infinite' }}>✦</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '48.21%', left: '24.93%', fontFamily: 'Caveat,cursive', fontSize: '0.72rem', lineHeight: '1', color: '#9a6be0', rotate: '-1deg', textShadow: '0 0 7px #9a6be066', animation: 'tk 4.40s ease-in-out 2.99s infinite' }}>✦</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '9.94%', left: '50.81%', width: '4.0px', height: '4.0px', borderRadius: '999px', background: 'radial-gradient(circle,#ffc0e0,transparent 70%)', boxShadow: '0 0 8.8px #ffc0e0', animation: 'tw 3.37s ease-in-out 1.01s infinite' }}></span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '21.29%', left: '44.72%', width: '6.0px', height: '6.0px', borderRadius: '999px', background: 'radial-gradient(circle,#a8e6d8,transparent 70%)', boxShadow: '0 0 13.2px #a8e6d8', animation: 'tw 3.51s ease-in-out 1.20s infinite' }}></span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '31.60%', left: '29.58%', width: '4.4px', height: '4.4px', borderRadius: '999px', background: 'radial-gradient(circle,#cdbcff,transparent 70%)', boxShadow: '0 0 9.7px #cdbcff', animation: 'tw 3.07s ease-in-out 1.81s infinite' }}></span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '61.06%', left: '34.90%', width: '4.7px', height: '4.7px', borderRadius: '999px', background: 'radial-gradient(circle,#ffc0e0,transparent 70%)', boxShadow: '0 0 10.3px #ffc0e0', animation: 'tw 3.82s ease-in-out 4.32s infinite' }}></span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '75.60%', left: '91.07%', width: '4.2px', height: '4.2px', borderRadius: '999px', background: 'radial-gradient(circle,#ffd9a8,transparent 70%)', boxShadow: '0 0 9.2px #ffd9a8', animation: 'tw 5.29s ease-in-out 4.41s infinite' }}></span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '60.22%', left: '78.15%', width: '5.0px', height: '5.0px', borderRadius: '999px', background: 'radial-gradient(circle,#a8e6d8,transparent 70%)', boxShadow: '0 0 11.0px #a8e6d8', animation: 'tw 4.44s ease-in-out 3.37s infinite' }}></span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '16.80%', left: '79.57%', width: '3.4px', height: '3.4px', borderRadius: '999px', background: 'radial-gradient(circle,#ffc0e0,transparent 70%)', boxShadow: '0 0 7.5px #ffc0e0', animation: 'tw 4.19s ease-in-out 3.33s infinite' }}></span>
  </div>

  <div aria-hidden="true" style={{ position: 'absolute', inset: '0', zIndex: '0', pointerEvents: 'none', overflow: 'hidden' }} data-motion-deco="">
    <span aria-hidden="true" style={{ position: 'absolute', top: '36.5%', left: '72.5%', width: '10rem', fontFamily: 'Caveat,cursive', fontSize: '0.98rem', lineHeight: '1.25', letterSpacing: '0.01em', color: '#7e9c8a', textShadow: '0 1px 1px rgba(0,0,0,0.7)', transform: 'rotate(4deg)' }}>renamed the variable for the ninth time</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '68.23%', left: '32.89%', width: '10rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.66rem', lineHeight: '1.25', letterSpacing: '0.01em', color: '#9c8f7c', transform: 'rotate(-3deg)' }}>it's called flow now. final answer</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '87.11%', left: '44.75%', width: '10rem', fontFamily: 'Caveat,cursive', fontSize: '0.98rem', lineHeight: '1.25', letterSpacing: '0.01em', color: '#a89070', textShadow: '0 1px 1px rgba(0,0,0,0.7)', transform: 'rotate(5deg)' }}>three hours for one margin</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '64.05%', left: '34.52%', width: '10rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.66rem', lineHeight: '1.25', letterSpacing: '0.01em', color: '#9c8f7c', transform: 'rotate(-2deg)' }}>i talk to the compiler now — it doesn't answer</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '73.9%', left: '26.09%', width: '10rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.66rem', lineHeight: '1.25', letterSpacing: '0.01em', color: '#9c8f7c', transform: 'rotate(3deg)' }}>still faster than my last portfolio</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '9.2%', left: '66.5%', width: '9rem', fontFamily: 'Caveat,cursive', fontSize: '0.98rem', lineHeight: '1.25', letterSpacing: '0.01em', color: '#7e9c8a', textShadow: '0 1px 1px rgba(0,0,0,0.7)', transform: 'rotate(-4deg)' }}>i almost had it working yesterday</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '55.53%', left: '21.24%', width: '10rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.66rem', lineHeight: '1.25', letterSpacing: '0.01em', color: '#9c8f7c', transform: 'rotate(6deg)' }}>yesterday me was overconfident</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '47.2%', left: '60.5%', width: '10rem', fontFamily: 'Caveat,cursive', fontSize: '0.98rem', lineHeight: '1.25', letterSpacing: '0.01em', color: '#9a90b4', textShadow: '0 1px 1px rgba(0,0,0,0.7)', transform: 'rotate(-1deg)' }}>deleted 200 lines felt amazing</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '62.88%', left: '12.93%', width: '10rem', fontFamily: 'Caveat,cursive', fontSize: '0.98rem', lineHeight: '1.25', letterSpacing: '0.01em', color: '#a89070', textShadow: '0 1px 1px rgba(0,0,0,0.7)', transform: 'rotate(2deg)' }}>added them back felt worse</span>
    <span aria-hidden="true" style={{ position: 'absolute', top: '55.79%', left: '2.02%', width: '10rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.66rem', lineHeight: '1.25', letterSpacing: '0.01em', color: '#9c8f7c', transform: 'rotate(-5deg)' }}>learned it the slow way</span>
  </div>

  <div style={{ position: 'absolute', inset: '0', pointerEvents: 'none', zIndex: '0' }} data-motion-deco="">{V.stars}</div>

  <nav aria-label="Sections" data-r="nav" style={{ position: 'fixed', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', zIndex: '20', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
    <span aria-hidden="true" data-r="thread" style={{ position: 'absolute', right: '1.3rem', marginRight: '-0.5px', top: '1.7rem', bottom: '-1.1rem', width: '1px', background: 'linear-gradient(180deg,transparent,rgba(180,168,140,0.55) 8%,rgba(180,168,140,0.55) 92%,transparent)', transformOrigin: 'top', animation: 'navthread .9s cubic-bezier(.2,.8,.25,1) both' }}></span>
    <span aria-hidden="true" data-r="shine" style={{ position: 'absolute', right: '1.3rem', marginRight: '-0.5px', top: '1.7rem', bottom: '-1.1rem', width: '1px', overflow: 'hidden' }}><span style={{ position: 'absolute', left: '0', top: '-2.6rem', width: '1px', height: '2.6rem', background: 'linear-gradient(180deg,transparent,rgba(255,240,205,0.95),transparent)', animation: 'threadshine 9.5s ease-in-out 2.2s infinite' }}></span></span>
    <span aria-hidden="true" data-r="index" style={{ paddingRight: '0.45rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.6rem', letterSpacing: '0.22em', color: '#a89e8d', animation: 'navfade .7s ease .42s both' }}>INDEX</span>
    <a href="/" data-r="beadlink" aria-current="page" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.6rem', height: '2.75rem', paddingRight: '0.85rem', transition: 'transform .3s cubic-bezier(.2,.8,.25,1)' }} className="hhv1">
      <span style={{ fontFamily: '\'Playfair Display\',serif', fontSize: '0.74rem', fontWeight: '700', letterSpacing: '0.2em', textTransform: 'uppercase', whiteSpace: 'nowrap', color: '#f0dda6', animation: 'navlabel .6s cubic-bezier(.2,.8,.25,1) 0.58s both' }}>Home</span>
      <span aria-hidden="true" style={{ flex: '0 0 auto', display: 'grid', placeItems: 'center', width: '0.9rem', height: '0.9rem', animation: 'navbead .55s cubic-bezier(.2,.8,.25,1) 0.50s both' }}><span style={{ width: '0.72rem', height: '0.72rem', borderRadius: '50%', background: 'radial-gradient(circle at 32% 26%, #f0dda6, #9c8149 62%, #4e3d1a)', boxShadow: '0 0 11px rgba(240,221,166,0.42), 0 1px 3px rgba(0,0,0,0.65)', animation: 'beadbreathe 4.6s ease-in-out 1.7s infinite' }}></span></span>
    </a>
    <a href="/about" data-r="beadlink" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.6rem', height: '2.75rem', paddingRight: '0.85rem', transition: 'transform .3s cubic-bezier(.2,.8,.25,1)' }} className="hhv1">
      <span style={{ fontFamily: '\'Playfair Display\',serif', fontSize: '0.68rem', fontWeight: '500', letterSpacing: '0.2em', textTransform: 'uppercase', whiteSpace: 'nowrap', color: '#b3a894', animation: 'navlabel .6s cubic-bezier(.2,.8,.25,1) 0.69s both' }}>About</span>
      <span aria-hidden="true" style={{ flex: '0 0 auto', display: 'grid', placeItems: 'center', width: '0.9rem', height: '0.9rem', animation: 'navbead .55s cubic-bezier(.2,.8,.25,1) 0.61s both' }}><span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'radial-gradient(circle at 30% 24%, #ffffff, #e9e0cb 38%, #b8ac93 70%, #6f6650)', boxShadow: '0 1px 2px rgba(0,0,0,0.65)' }}></span></span>
    </a>
    <a href="/skills" data-r="beadlink" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.6rem', height: '2.75rem', paddingRight: '0.85rem', transition: 'transform .3s cubic-bezier(.2,.8,.25,1)' }} className="hhv1">
      <span style={{ fontFamily: '\'Playfair Display\',serif', fontSize: '0.68rem', fontWeight: '500', letterSpacing: '0.2em', textTransform: 'uppercase', whiteSpace: 'nowrap', color: '#b3a894', animation: 'navlabel .6s cubic-bezier(.2,.8,.25,1) 0.80s both' }}>Skills</span>
      <span aria-hidden="true" style={{ flex: '0 0 auto', display: 'grid', placeItems: 'center', width: '0.9rem', height: '0.9rem', animation: 'navbead .55s cubic-bezier(.2,.8,.25,1) 0.72s both' }}><span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'radial-gradient(circle at 32% 26%, #b6d4c2, #5d8a70 58%, #223c2c)', boxShadow: '0 1px 2px rgba(0,0,0,0.65)' }}></span></span>
    </a>
    <a href="/projects" data-r="beadlink" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.6rem', height: '2.75rem', paddingRight: '0.85rem', transition: 'transform .3s cubic-bezier(.2,.8,.25,1)' }} className="hhv1">
      <span style={{ fontFamily: '\'Playfair Display\',serif', fontSize: '0.68rem', fontWeight: '500', letterSpacing: '0.2em', textTransform: 'uppercase', whiteSpace: 'nowrap', color: '#b3a894', animation: 'navlabel .6s cubic-bezier(.2,.8,.25,1) 0.91s both' }}>Projects</span>
      <span aria-hidden="true" style={{ flex: '0 0 auto', display: 'grid', placeItems: 'center', width: '0.9rem', height: '0.9rem', animation: 'navbead .55s cubic-bezier(.2,.8,.25,1) 0.83s both' }}><span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'radial-gradient(circle at 32% 26%, #e2909a, #a33f4a 56%, #3d1016)', boxShadow: '0 1px 2px rgba(0,0,0,0.65)' }}></span></span>
    </a>
    <a href="/contact" data-r="beadlink" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.6rem', height: '2.75rem', paddingRight: '0.85rem', transition: 'transform .3s cubic-bezier(.2,.8,.25,1)' }} className="hhv1">
      <span style={{ fontFamily: '\'Playfair Display\',serif', fontSize: '0.68rem', fontWeight: '500', letterSpacing: '0.2em', textTransform: 'uppercase', whiteSpace: 'nowrap', color: '#b3a894', animation: 'navlabel .6s cubic-bezier(.2,.8,.25,1) 1.02s both' }}>Contact</span>
      <span aria-hidden="true" style={{ flex: '0 0 auto', display: 'grid', placeItems: 'center', width: '0.9rem', height: '0.9rem', animation: 'navbead .55s cubic-bezier(.2,.8,.25,1) 0.94s both' }}><span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'radial-gradient(circle at 28% 22%, #ffffff, #f2ece0 40%, #c4bcaa 74%, #7d7666)', boxShadow: '0 1px 2px rgba(0,0,0,0.65)' }}></span></span>
    </a>
  </nav>

  <div style={{ position: 'relative', zIndex: '1', padding: 'clamp(1.4rem,3.2vw,2.5rem) clamp(9.25rem,6.6vw,10rem) clamp(3.5rem,6vw,5rem) clamp(4rem,4.4vw,5.5rem)', maxWidth: '96rem' }} data-r="page">
    <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '3rem' }}>

      <aside style={{ position: 'relative', flex: '0 0 19rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        <span aria-hidden="true" style={{ position: 'absolute', left: '-3.25rem', top: '44%', zIndex: '2', writingMode: 'vertical-rl', transform: 'translateY(-50%) rotate(180deg)', fontFamily: 'Caveat,cursive', fontSize: '1.15rem', letterSpacing: '0.04em', color: '#c79246', textShadow: '0 0 3px rgba(214,120,50,0.35), 0 1px 1px rgba(0,0,0,0.75), 0 -0.5px 0.5px rgba(0,0,0,0.4)', pointerEvents: 'none', userSelect: 'none' }}>It's Not Over Until I Win.</span>
        <div style={{ position: 'relative', alignSelf: 'flex-start', transform: 'rotate(-8deg)', transition: 'transform .26s cubic-bezier(.2,.8,.25,1)' }} data-motion="tag" className="hhv2"><span aria-hidden="true" style={{ position: 'absolute', top: '-0.35rem', left: '50%', marginLeft: '-5px', zIndex: '16', width: '10px', height: '10px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%,#f0876a,#b23b2c)', boxShadow: '0 2px 3px rgba(0,0,0,0.6)' }}></span><div style={{ position: 'relative', padding: '0.6rem 0.9rem', background: 'radial-gradient(84px 34px at 6% 0%, rgba(24,11,4,0.55), transparent 72%), radial-gradient(74px 30px at 94% 3%, rgba(24,11,4,0.5), transparent 74%), radial-gradient(70px 30px at 2% 90%, rgba(24,11,4,0.52), transparent 74%), radial-gradient(88px 34px at 97% 97%, rgba(24,11,4,0.55), transparent 72%), radial-gradient(64px 24px at 50% 100%, rgba(24,11,4,0.42), transparent 76%), radial-gradient(116% 126% at 50% 46%, transparent 44%, rgba(128,74,30,0.36) 70%, rgba(88,46,18,0.62) 86%, rgba(46,22,9,0.82) 95%, rgba(20,10,4,0.92) 100%), linear-gradient(180deg,#e2d5b8,#d1c09a)', clipPath: 'polygon(1% 5%, 8% 1%, 17% 4%, 29% 1%, 41% 4%, 54% 1%, 65% 4%, 78% 1%, 90% 3%, 99% 2%, 99% 12%, 100% 27%, 98% 42%, 100% 58%, 99% 74%, 100% 89%, 97% 99%, 85% 97%, 71% 100%, 56% 97%, 42% 100%, 28% 97%, 14% 100%, 4% 98%, 1% 91%, 2% 75%, 0% 58%, 1% 41%, 0% 24%)', filter: 'drop-shadow(0 1px 0.5px rgba(0,0,0,0.55)) drop-shadow(0 4px 4px rgba(0,0,0,0.3)) drop-shadow(0 10px 12px rgba(0,0,0,0.2))' }}><span aria-hidden="true" style={{ position: 'absolute', inset: '0', zIndex: '3', borderRadius: 'inherit', padding: '1.5px', background: 'linear-gradient(135deg,#c06a24,#8f4a20 52%,#5a3113)', WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', filter: 'url(#sketch-edge)', opacity: '0.8', pointerEvents: 'none' }} data-ring="1"></span>
          <p style={{ margin: '0', fontFamily: 'Caveat,cursive', fontSize: '1.15rem', lineHeight: '1.15', color: '#3a2f1e' }}>still figuring<br />things out ☆</p>
        </div></div>

        <div style={{ position: 'relative', padding: '2.25rem 1.25rem 1.5rem', transform: 'rotate(-2deg)', textAlign: 'center', background: 'radial-gradient(120% 100% at 50% 0%, #1e2020, #151616 58%, #101111)', border: '1px solid rgba(255,255,255,0.07)', filter: 'drop-shadow(0 1px 0.5px rgba(0,0,0,0.55)) drop-shadow(0 4px 4px rgba(0,0,0,0.3)) drop-shadow(0 10px 12px rgba(0,0,0,0.2))', transition: 'transform .26s cubic-bezier(.2,.8,.25,1)' }} data-motion="scrap" className="hhv3"><span aria-hidden="true" style={{ position: 'absolute', inset: '0', zIndex: '3', borderRadius: 'inherit', padding: '1.5px', background: 'linear-gradient(135deg,#e58d55 0%,#d080cc 34%,#7daa76 68%,#6fb8ae 100%)', WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', filter: 'url(#sketch-edge)', opacity: '0.85', pointerEvents: 'none' }} data-ring="1"></span>
          <span aria-hidden="true" style={{ position: 'absolute', top: '-0.8rem', left: '50%', marginLeft: '-3rem', width: '6rem', height: '1.5rem', transform: 'rotate(-2deg)', zIndex: '16', pointerEvents: 'none', background: 'linear-gradient(178deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.05) 26%, rgba(255,255,255,0.02) 74%, rgba(255,255,255,0.22) 100%), repeating-linear-gradient(94deg, rgba(255,255,255,0.14) 0 2px, transparent 2px 7px), rgba(214,168,96,0.48)', clipPath: 'polygon(3% 0%, 97% 5%, 100% 34%, 97% 63%, 100% 95%, 4% 100%, 0% 66%, 2% 32%)', filter: 'url(#rough-tape) drop-shadow(0 1px 1px rgba(0,0,0,0.45)) drop-shadow(0 3px 4px rgba(0,0,0,0.28))' }} data-motion="tape"></span>
          <span aria-hidden="true" style={{ position: 'absolute', left: '0.5rem', top: '3.6rem', zIndex: '8', transform: 'rotate(-6deg)', fontFamily: 'Caveat,cursive', fontSize: '0.95rem', lineHeight: '1.15', color: '#e0ae81', pointerEvents: 'none' }}>coding<br />with<br />purpose. <span style={{ color: '#e0654a' }}>↗</span></span><svg aria-hidden="true" viewBox="0 0 40 26" style={{ position: 'absolute', right: '1.1rem', top: '2.9rem', zIndex: '8', width: '2.4rem', height: '1.55rem', overflow: 'visible', transform: 'rotate(12deg)', pointerEvents: 'none' }}><path d="M3 22 L6 6 L13 15 L20 4 L27 15 L34 6 L37 22 Z" fill="none" stroke="#ce72c0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" pathLength="1" style={{ strokeDasharray: '1', strokeDashoffset: '0', animation: 'dw 1.5s ease-in-out 1.2s forwards' }}></path></svg><span aria-hidden="true" style={{ position: 'absolute', right: '1.6rem', top: '6.4rem', zIndex: '8', fontFamily: 'Caveat,cursive', fontSize: '1rem', color: '#e8b64a', pointerEvents: 'none', animation: 'tk 3.4s ease-in-out .4s infinite' }}>✦</span><span aria-hidden="true" style={{ position: 'absolute', right: '0.9rem', top: '8.6rem', zIndex: '8', fontFamily: 'Caveat,cursive', fontSize: '0.8rem', color: '#6fb8ae', pointerEvents: 'none', animation: 'tk 4.2s ease-in-out 1.1s infinite' }}>✧</span><span aria-hidden="true" style={{ position: 'absolute', left: '1.4rem', top: '8.2rem', zIndex: '8', fontFamily: 'Caveat,cursive', fontSize: '0.85rem', color: '#d080cc', pointerEvents: 'none', animation: 'tk 3.8s ease-in-out .8s infinite' }}>✦</span><span aria-hidden="true" style={{ position: 'absolute', left: '0.9rem', top: '1.9rem', zIndex: '8', width: '5px', height: '5px', borderRadius: '50%', background: 'radial-gradient(circle,#ffd9a8,transparent 70%)', boxShadow: '0 0 6px #ffd9a8', pointerEvents: 'none', animation: 'tk 5s ease-in-out .2s infinite' }}></span><span aria-hidden="true" style={{ position: 'absolute', right: '2.6rem', top: '1.6rem', zIndex: '8', width: '4px', height: '4px', borderRadius: '50%', background: 'radial-gradient(circle,#cdbcff,transparent 70%)', boxShadow: '0 0 6px #cdbcff', pointerEvents: 'none', animation: 'tk 4.6s ease-in-out 1.4s infinite' }}></span><div style={{ position: 'relative', display: 'inline-grid', placeItems: 'center', width: '8.5rem', height: '8.5rem', borderRadius: '50%', padding: '3px', background: 'conic-gradient(from 210deg,#9a6be0,#ce72c0,#e58d55,#9a6be0)', boxShadow: '0 0 22px rgba(160,102,232,0.5)', animation: 'ringspin 14s linear infinite', transition: 'box-shadow .3s ease' }} className="hhv4">
            <img src="/photos/profile.webp" alt="Portrait of Guruprasad Jena" style={{ width: '100%', height: 'auto', aspectRatio: '1', objectFit: 'cover', objectPosition: '50% 22%', borderRadius: '50%', border: '2px solid #14100b', animation: 'ringspin-rev 14s linear infinite' }} /><span aria-hidden="true" style={{ position: 'absolute', inset: '-0.55rem', borderRadius: '50%', border: '1px dashed rgba(224,167,99,0.28)', animation: 'ringspin 40s linear infinite', pointerEvents: 'none' }}></span>
          </div>
          <h2 style={{ margin: '0.9rem 0 0', fontFamily: '\'Playfair Display\',serif', fontSize: '1.5rem', fontWeight: '600', letterSpacing: '-0.01em', color: '#f5efe7' }}>Guruprasad Jena</h2>
          <p style={{ margin: '0.3rem 0 0', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.56rem', letterSpacing: '0.28em', color: '#e58d55' }}>FULL-STACK DEVELOPER</p>
                    <p style={{ margin: '0.75rem auto 0', maxWidth: '13rem', fontFamily: 'Caveat,cursive', fontSize: '1.25rem', lineHeight: '1.25', color: '#c8b7a5' }}>“Building thoughtful software, <span style={{ textDecoration: 'underline', textDecorationColor: '#e8b64a', textDecorationThickness: '2px', textUnderlineOffset: '2px' }}>one project</span> at a time.”</p>
          <div style={{ position: 'relative', margin: '1rem auto 0', maxWidth: '13rem', transform: 'rotate(-3deg)' }}><span aria-hidden="true" style={{ position: 'absolute', top: '-0.6rem', left: '50%', marginLeft: '-1.3rem', width: '2.6rem', height: '1rem', transform: 'rotate(-3deg)', zIndex: '16', pointerEvents: 'none', background: 'linear-gradient(178deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.05) 26%, rgba(255,255,255,0.02) 74%, rgba(255,255,255,0.22) 100%), repeating-linear-gradient(94deg, rgba(255,255,255,0.14) 0 2px, transparent 2px 7px), rgba(244,240,232,0.5)', clipPath: 'polygon(3% 0%, 97% 5%, 100% 34%, 97% 63%, 100% 95%, 4% 100%, 0% 66%, 2% 32%)', filter: 'url(#rough-tape) drop-shadow(0 1px 1px rgba(0,0,0,0.45)) drop-shadow(0 3px 4px rgba(0,0,0,0.28))' }} data-motion="tape"></span><div style={{ position: 'relative', padding: '0.75rem 0.9rem', background: 'radial-gradient(84px 34px at 6% 0%, rgba(24,11,4,0.55), transparent 72%), radial-gradient(74px 30px at 94% 3%, rgba(24,11,4,0.5), transparent 74%), radial-gradient(70px 30px at 2% 90%, rgba(24,11,4,0.52), transparent 74%), radial-gradient(88px 34px at 97% 97%, rgba(24,11,4,0.55), transparent 72%), radial-gradient(64px 24px at 50% 100%, rgba(24,11,4,0.42), transparent 76%), radial-gradient(116% 126% at 50% 46%, transparent 44%, rgba(128,74,30,0.36) 70%, rgba(88,46,18,0.62) 86%, rgba(46,22,9,0.82) 95%, rgba(20,10,4,0.92) 100%), linear-gradient(180deg,#e2d5b8,#d1c09a)', clipPath: 'polygon(1% 5%, 8% 1%, 17% 4%, 29% 1%, 41% 4%, 54% 1%, 65% 4%, 78% 1%, 90% 3%, 99% 2%, 99% 12%, 100% 27%, 98% 42%, 100% 58%, 99% 74%, 100% 89%, 97% 99%, 85% 97%, 71% 100%, 56% 97%, 42% 100%, 28% 97%, 14% 100%, 4% 98%, 1% 91%, 2% 75%, 0% 58%, 1% 41%, 0% 24%)', filter: 'drop-shadow(0 1px 0.5px rgba(0,0,0,0.55)) drop-shadow(0 4px 4px rgba(0,0,0,0.3)) drop-shadow(0 10px 12px rgba(0,0,0,0.2))' }}><span aria-hidden="true" style={{ position: 'absolute', inset: '0', zIndex: '3', borderRadius: 'inherit', padding: '1.5px', background: 'linear-gradient(135deg,#c06a24,#8f4a20 52%,#5a3113)', WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', filter: 'url(#sketch-edge)', opacity: '0.8', pointerEvents: 'none' }} data-ring="1"></span>
            <p style={{ margin: '0', fontFamily: 'Caveat,cursive', fontSize: '1.15rem', lineHeight: '1.2', color: '#34291a' }}>I like building things people <mark style={{ background: 'rgba(232,194,106,0.7)', color: '#34291a', padding: '0 2px' }}>actually use</mark>, not just things that look impressive. <span style={{ color: '#c14a2f' }}>♥</span></p>
          </div></div>
          <ul aria-label="Social links" style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', margin: '1.1rem 0 0', padding: '0', listStyle: 'none' }}>
            <li><a href="https://github.com/jaga42-ui" target="_blank" rel="noopener" aria-label="GitHub" style={{ display: 'grid', placeItems: 'center', width: '2.4rem', height: '2.4rem', borderRadius: '50%', color: 'rgba(255,255,255,0.9)', background: 'linear-gradient(145deg,#3a3a3a,#1a1a1a)', boxShadow: '0 3px 8px rgba(0,0,0,0.5)', fontFamily: '\'Playfair Display\',serif', fontSize: '0.95rem', transition: 'transform .2s ease' }} className="hhv5">◧</a></li>
            <li><a href="https://www.linkedin.com/in/guruprasad-jena" target="_blank" rel="noopener" aria-label="LinkedIn" style={{ display: 'grid', placeItems: 'center', width: '2.4rem', height: '2.4rem', borderRadius: '50%', color: 'rgba(255,255,255,0.9)', background: 'linear-gradient(145deg,#2f7bd1,#1c4f8a)', boxShadow: '0 3px 8px rgba(0,0,0,0.5)', fontFamily: '\'Playfair Display\',serif', fontSize: '0.85rem', transition: 'transform .2s ease' }} className="hhv5">in</a></li>
            <li><a href="/guruprasad-jena-resume.pdf" download="Guruprasad-Jena-Resume.pdf" type="application/pdf" title="Download résumé (PDF)" aria-label="Download résumé (PDF)" style={{ display: 'grid', placeItems: 'center', width: '2.4rem', height: '2.4rem', borderRadius: '50%', color: 'rgba(28,20,6,0.92)', background: 'linear-gradient(145deg,#e8b64a,#a8792a)', boxShadow: '0 3px 8px rgba(0,0,0,0.5)', fontFamily: '\'Playfair Display\',serif', fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.02em', transition: 'transform .2s ease' }} className="hhv5">CV</a></li>
            <li><a href="mailto:guruprasadjena989@gmail.com" aria-label="Email" style={{ display: 'grid', placeItems: 'center', width: '2.4rem', height: '2.4rem', borderRadius: '50%', color: 'rgba(255,255,255,0.9)', background: 'linear-gradient(145deg,#e0654a,#b23b2c)', boxShadow: '0 3px 8px rgba(0,0,0,0.5)', fontSize: '0.95rem', transition: 'transform .2s ease' }} className="hhv5">✉</a></li>
          </ul>
        </div>

        <div style={{ position: 'relative', transform: 'rotate(2deg)', transition: 'transform .26s cubic-bezier(.2,.8,.25,1)' }} data-motion="scrap" className="hhv6">
          <span aria-hidden="true" style={{ position: 'absolute', top: '-0.8rem', right: '1.5rem', width: '4rem', height: '1.4rem', transform: 'rotate(6deg)', zIndex: '16', pointerEvents: 'none', background: 'linear-gradient(178deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.05) 26%, rgba(255,255,255,0.02) 74%, rgba(255,255,255,0.22) 100%), repeating-linear-gradient(94deg, rgba(255,255,255,0.14) 0 2px, transparent 2px 7px), rgba(214,168,96,0.48)', clipPath: 'polygon(3% 0%, 97% 5%, 100% 34%, 97% 63%, 100% 95%, 4% 100%, 0% 66%, 2% 32%)', filter: 'url(#rough-tape) drop-shadow(0 1px 1px rgba(0,0,0,0.45)) drop-shadow(0 3px 4px rgba(0,0,0,0.28))' }} data-motion="tape"></span>
          <div style={{ position: 'relative', background: 'linear-gradient(180deg,#1c1e1f,#121313)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '6px', filter: 'drop-shadow(0 1px 0.5px rgba(0,0,0,0.55)) drop-shadow(0 4px 4px rgba(0,0,0,0.3)) drop-shadow(0 10px 12px rgba(0,0,0,0.2))' }}><span aria-hidden="true" style={{ position: 'absolute', inset: '0', zIndex: '3', borderRadius: 'inherit', padding: '1.5px', background: 'linear-gradient(135deg,#e58d55 0%,#d080cc 34%,#7daa76 68%,#6fb8ae 100%)', WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', filter: 'url(#sketch-edge)', opacity: '0.85', pointerEvents: 'none' }} data-ring="1"></span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.7rem', borderBottom: '1px solid rgba(255,255,255,0.08)', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.58rem', letterSpacing: '0.14em', color: '#a9c58a' }}><span>TODOS.EXE</span><span aria-hidden="true">▢ ◦ ✕</span></div>
            <ul style={{ margin: '0', padding: '0.75rem 1rem', listStyle: 'none', display: 'grid', gap: '0.5rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.66rem' }}>
              <li style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', color: '#8fb57a' }}>{'>'} ship meaningful products<span aria-hidden="true" style={{ color: '#7daa76' }}>✓</span></li>
              <li style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', color: '#8fb57a' }}>{'>'} learn something new<span aria-hidden="true" style={{ color: '#7daa76' }}>✓</span></li>
              <li style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', color: '#cdd7bf' }}>{'>'} impact millions<span aria-hidden="true" style={{ display: 'inline-block', width: '0.8rem', height: '0.8rem', border: '1px solid #5c6b4e' }}></span></li>
            </ul>
          </div>
        </div>
      </aside>

      <div style={{ position: 'relative', flex: '1 1 min(100%,28rem)', minWidth: '0' }}>
        <div style={{ position: 'absolute', right: '6rem', top: '-1.25rem', zIndex: '6', transform: 'rotate(-3deg)', padding: '0.7rem 1rem', background: 'linear-gradient(180deg,#8a63c6,#6b4a9e)', boxShadow: '0 2px 3px rgba(0,0,0,0.6), 0 10px 16px -4px rgba(0,0,0,0.55)', transition: 'transform .26s cubic-bezier(.2,.8,.25,1)' }} data-motion="tag" className="hhv7">
              <span aria-hidden="true" style={{ position: 'absolute', top: '-0.5rem', left: '50%', width: '10px', height: '10px', marginLeft: '-5px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%,#f0876a,#b23b2c)', boxShadow: '0 2px 3px rgba(0,0,0,0.6)' }}></span>
              <span aria-hidden="true" style={{ position: 'absolute', bottom: '-0.6rem', right: '-0.9rem', width: '2.6rem', height: '1.1rem', transform: 'rotate(-38deg)', zIndex: '16', pointerEvents: 'none', background: 'linear-gradient(178deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.05) 26%, rgba(255,255,255,0.02) 74%, rgba(255,255,255,0.22) 100%), repeating-linear-gradient(94deg, rgba(255,255,255,0.14) 0 2px, transparent 2px 7px), rgba(244,240,232,0.55)', clipPath: 'polygon(3% 0%, 97% 5%, 100% 34%, 97% 63%, 100% 95%, 4% 100%, 0% 66%, 2% 32%)', filter: 'url(#rough-tape) drop-shadow(0 1px 1px rgba(0,0,0,0.45)) drop-shadow(0 3px 4px rgba(0,0,0,0.28))' }}></span><p style={{ margin: '0', textAlign: 'center', fontFamily: 'Caveat,cursive', fontSize: '1.2rem', lineHeight: '1.15', color: '#fff' }}>open<br />to work ☀</p>
            </div>
        <p style={{ margin: '0', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.72rem', color: '#da8b52' }} data-motion="kicker"><span style={{ color: '#7daa76' }}>//</span> get to know the person behind the code <span aria-hidden="true">↓</span></p>
        <h1 style={{ margin: '0.5rem 0 0', fontFamily: '\'Playfair Display\',serif', fontSize: 'clamp(2.6rem,4.8vw,3.7rem)', fontWeight: '600', lineHeight: '1.05', letterSpacing: '-0.02em', color: '#f5efe7' }} data-motion="head">Hello, I'm<br /><span style={{ background: 'linear-gradient(92deg,#e58d55,#d080cc 55%,#b58ce8)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Guruprasad Jena</span></h1>

        <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '2rem', marginTop: '1.5rem' }}>
          <div style={{ maxWidth: '26rem' }}>
            <p style={{ margin: '0', fontFamily: '\'Special Elite\',monospace', fontSize: '0.62rem', letterSpacing: '0.4em', color: '#b4a48f' }}>PAGE 01</p>
            <div style={{ marginTop: '0.75rem', fontFamily: '\'Playfair Display\',serif', fontStyle: 'italic', fontSize: '1.3rem', lineHeight: '1.55', color: '#ccbba8' }}>
              <p style={{ margin: '0' }}>I keep telling myself I'll <span style={{ textDecoration: 'line-through', textDecorationColor: '#c2492a' }}>organize</span> <em data-mark style={{ fontWeight: '600', fontStyle: 'normal', color: '#e58d55' }}>finish</em> this notebook someday.</p>
              <p style={{ margin: '0.4rem 0 0', color: '#baa792' }}>Until then…</p>
              <p style={{ margin: '0.4rem 0 0' }}>I guess you'll have to read it <span style={{ color: '#e58d55' }}>the way it was written</span>.</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem', transform: 'rotate(-8deg)', width: 'fit-content' }} data-motion="tag">
            <span style={{ fontFamily: 'Caveat,cursive', fontSize: '1.15rem', color: '#7daa76' }}>Deploying ideas…</span>
            <span aria-hidden="true" style={{ position: 'relative', width: '7rem', height: '0.55rem', borderRadius: '2px', background: 'repeating-linear-gradient(90deg, rgba(125,170,118,0.18) 0 9px, transparent 9px 12px)' }}><i style={{ position: 'absolute', left: '0', top: '0', bottom: '0', width: `${V.deployFill}`, borderRadius: '2px', background: 'repeating-linear-gradient(90deg,#7daa76 0 9px, transparent 9px 12px)', transition: 'width .45s cubic-bezier(.3,.9,.4,1)' }}></i></span>
            <span style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.7rem', color: '#7daa76' }}>{V.deployLabel}</span>
          </div>


        </div>


        <div style={{ position: 'absolute', right: '0.5rem', top: '41rem', zIndex: '4', width: '14rem', transform: 'rotate(-7deg)', pointerEvents: 'none' }} data-motion="line">
          <span aria-hidden="true" style={{ position: 'absolute', top: '-1.4rem', left: '1.5rem', transform: 'rotate(14deg)', fontFamily: 'Caveat,cursive', fontSize: '1.1rem', color: '#e8b64a' }}>✦</span>
          <span aria-hidden="true" style={{ position: 'absolute', top: '-0.6rem', right: '1rem', transform: 'rotate(-6deg)', fontFamily: 'Caveat,cursive', fontSize: '0.9rem', color: '#d080cc' }}>✧</span>
          <p style={{ margin: '0', fontFamily: 'Caveat,cursive', fontSize: '1.15rem', lineHeight: '1.3', color: '#9fd6cb', textShadow: '0 0 9px rgba(111,196,184,0.35), 0 1px 1px rgba(0,0,0,0.7)' }}>Future HR,</p>
          <p style={{ margin: '0.65rem 0 0', fontFamily: 'Caveat,cursive', fontSize: '1.15rem', lineHeight: '1.3', color: '#ecdfc4', textShadow: '0 1px 1px rgba(0,0,0,0.7)' }}>please act<br />like discovering me<br />was entirely <span style={{ padding: '0 4px', borderRadius: '3px', fontWeight: '600', color: '#211a0c', background: 'linear-gradient(100deg, transparent 2%, #ecc35a 8%, #e0a445 92%, transparent 98%)' }}>your idea</span>.</p>
        </div>
        <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '1.75rem', marginTop: '2.25rem' }}>
          <div style={{ position: 'relative', width: '15rem', transform: 'rotate(2deg)', transition: 'transform .26s cubic-bezier(.2,.8,.25,1)' }} data-motion="scrap" className="hhv6">
              <span aria-hidden="true" style={{ position: 'absolute', top: '-0.8rem', right: '1.5rem', width: '4rem', height: '1.4rem', transform: 'rotate(6deg)', zIndex: '16', pointerEvents: 'none', background: 'linear-gradient(178deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.05) 26%, rgba(255,255,255,0.02) 74%, rgba(255,255,255,0.22) 100%), repeating-linear-gradient(94deg, rgba(255,255,255,0.14) 0 2px, transparent 2px 7px), rgba(168,216,234,0.5)', clipPath: 'polygon(3% 0%, 97% 5%, 100% 34%, 97% 63%, 100% 95%, 4% 100%, 0% 66%, 2% 32%)', filter: 'url(#rough-tape) drop-shadow(0 1px 1px rgba(0,0,0,0.45)) drop-shadow(0 3px 4px rgba(0,0,0,0.28))' }} data-motion="tape"></span>
              <div style={{ position: 'relative', background: 'linear-gradient(180deg,#1c1e1f,#121313)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '6px', filter: 'drop-shadow(0 1px 0.5px rgba(0,0,0,0.55)) drop-shadow(0 4px 4px rgba(0,0,0,0.3)) drop-shadow(0 10px 12px rgba(0,0,0,0.2))' }}><span aria-hidden="true" style={{ position: 'absolute', inset: '0', zIndex: '3', borderRadius: 'inherit', padding: '1.5px', background: 'linear-gradient(135deg,#e58d55 0%,#d080cc 34%,#7daa76 68%,#6fb8ae 100%)', WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', filter: 'url(#sketch-edge)', opacity: '0.85', pointerEvents: 'none' }} data-ring="1"></span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.7rem', borderBottom: '1px solid rgba(255,255,255,0.08)', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.58rem', letterSpacing: '0.14em', color: '#b4a48f' }}><span>SYSTEM.LOG</span><span aria-hidden="true">▢ ◦ ✕</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.66rem', color: '#7daa76' }}>
                  <div style={{ display: 'grid', gap: '0.15rem' }}><p style={{ margin: '0' }}>{'>'} Build.</p><p style={{ margin: '0' }}>{'>'} Learn.</p><p style={{ margin: '0' }}>{'>'} Deploy.</p><p style={{ margin: '0' }}>{'>'} Repeat.</p></div>
                  <span aria-hidden="true" style={{ fontSize: '1.4rem' }}>♥</span>
                </div>
              </div>
            </div>

          <div style={{ position: 'relative', width: '14rem', transform: 'rotate(-3deg)', transition: 'transform .26s cubic-bezier(.2,.8,.25,1)' }} data-motion="scrap" className="hhv8">
            <span aria-hidden="true" style={{ position: 'absolute', top: '0.4rem', left: '1.6rem', zIndex: '14', width: '10px', height: '10px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%,#c8a2f0,#7a48b8)', boxShadow: '0 2px 3px rgba(0,0,0,0.6)' }}></span>
            <span aria-hidden="true" style={{ position: 'absolute', bottom: '-0.65rem', left: '50%', marginLeft: '-1.8rem', width: '3.6rem', height: '1.25rem', transform: 'rotate(2deg)', zIndex: '16', pointerEvents: 'none', background: 'linear-gradient(178deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.05) 26%, rgba(255,255,255,0.02) 74%, rgba(255,255,255,0.22) 100%), repeating-linear-gradient(94deg, rgba(255,255,255,0.14) 0 2px, transparent 2px 7px), rgba(168,216,234,0.5)', clipPath: 'polygon(3% 0%, 97% 5%, 100% 34%, 97% 63%, 100% 95%, 4% 100%, 0% 66%, 2% 32%)', filter: 'url(#rough-tape) drop-shadow(0 1px 1px rgba(0,0,0,0.45)) drop-shadow(0 3px 4px rgba(0,0,0,0.28))' }}></span><div style={{ position: 'relative', padding: '0.9rem 1.1rem 1.1rem', background: 'radial-gradient(84px 34px at 6% 0%, rgba(24,11,4,0.55), transparent 72%), radial-gradient(74px 30px at 94% 3%, rgba(24,11,4,0.5), transparent 74%), radial-gradient(70px 30px at 2% 90%, rgba(24,11,4,0.52), transparent 74%), radial-gradient(88px 34px at 97% 97%, rgba(24,11,4,0.55), transparent 72%), radial-gradient(64px 24px at 50% 100%, rgba(24,11,4,0.42), transparent 76%), radial-gradient(116% 126% at 50% 46%, transparent 44%, rgba(128,74,30,0.36) 70%, rgba(88,46,18,0.62) 86%, rgba(46,22,9,0.82) 95%, rgba(20,10,4,0.92) 100%), linear-gradient(180deg,#e2d5b8,#d1c09a)', clipPath: 'polygon(1% 5%, 8% 1%, 17% 4%, 29% 1%, 41% 4%, 54% 1%, 65% 4%, 78% 1%, 90% 3%, 99% 2%, 99% 12%, 100% 27%, 98% 42%, 100% 58%, 99% 74%, 100% 89%, 97% 99%, 85% 97%, 71% 100%, 56% 97%, 42% 100%, 28% 97%, 14% 100%, 4% 98%, 1% 91%, 2% 75%, 0% 58%, 1% 41%, 0% 24%)', filter: 'drop-shadow(0 1px 0.5px rgba(0,0,0,0.55)) drop-shadow(0 4px 4px rgba(0,0,0,0.3)) drop-shadow(0 10px 12px rgba(0,0,0,0.2))' }}><span aria-hidden="true" style={{ position: 'absolute', inset: '0', zIndex: '3', borderRadius: 'inherit', padding: '1.5px', background: 'linear-gradient(135deg,#c06a24,#8f4a20 52%,#5a3113)', WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', filter: 'url(#sketch-edge)', opacity: '0.8', pointerEvents: 'none' }} data-ring="1"></span>
              <h2 style={{ margin: '0', fontFamily: 'Caveat,cursive', fontSize: '1.5rem', color: '#2c2113' }}>What drives me</h2>
              <hr style={{ margin: '0.4rem 0', border: '0', borderTop: '2px dashed #a99772' }} />
              <ul style={{ margin: '0', padding: '0', listStyle: 'none', display: 'grid', gap: '0.2rem', fontFamily: 'Caveat,cursive', fontSize: '1.15rem', color: '#3d3220' }}>
                <li><span style={{ color: '#5a7042' }}>✓</span> Curiosity</li>
                <li><span style={{ color: '#5a7042' }}>✓</span> Impactful ideas</li>
                <li><span style={{ color: '#5a7042' }}>✓</span> Continuous growth</li>
                <li><span style={{ color: '#5a7042' }}>✓</span> Clean architecture</li>
              </ul>
            </div>
          </div>

          <div style={{ position: 'relative', width: '17rem', transform: 'rotate(2deg)', transition: 'transform .26s cubic-bezier(.2,.8,.25,1)' }} data-motion="scrap" className="hhv9">
            <span aria-hidden="true" style={{ position: 'absolute', top: '-0.8rem', right: '2rem', width: '4.5rem', height: '1.4rem', transform: 'rotate(6deg)', zIndex: '16', pointerEvents: 'none', background: 'linear-gradient(178deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.05) 26%, rgba(255,255,255,0.02) 74%, rgba(255,255,255,0.22) 100%), repeating-linear-gradient(94deg, rgba(255,255,255,0.14) 0 2px, transparent 2px 7px), rgba(214,168,96,0.48)', clipPath: 'polygon(3% 0%, 97% 5%, 100% 34%, 97% 63%, 100% 95%, 4% 100%, 0% 66%, 2% 32%)', filter: 'url(#rough-tape) drop-shadow(0 1px 1px rgba(0,0,0,0.45)) drop-shadow(0 3px 4px rgba(0,0,0,0.28))' }} data-motion="tape"></span>
            <blockquote style={{ position: 'relative', margin: '0', padding: '0.9rem 1.1rem 1rem', background: 'linear-gradient(180deg,#1c1e1f,#121313)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '6px', filter: 'drop-shadow(0 1px 0.5px rgba(0,0,0,0.55)) drop-shadow(0 4px 4px rgba(0,0,0,0.3)) drop-shadow(0 10px 12px rgba(0,0,0,0.2))' }}><span aria-hidden="true" style={{ position: 'absolute', inset: '0', zIndex: '3', borderRadius: 'inherit', padding: '1.5px', background: 'linear-gradient(135deg,#e58d55 0%,#d080cc 34%,#7daa76 68%,#6fb8ae 100%)', WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', filter: 'url(#sketch-edge)', opacity: '0.85', pointerEvents: 'none' }} data-ring="1"></span>
              <span style={{ display: 'flex', gap: '0.35rem' }} aria-hidden="true"><i style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#e0654a' }}></i><i style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#d9a441' }}></i><i style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#7daa76' }}></i></span>
              <p style={{ margin: '0.7rem 0 0', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.78rem', lineHeight: '1.45', color: '#ece4d2' }}><span style={{ color: '#e58d55' }}>“</span> Code is not just what I write, it's how I solve problems.</p>
              <footer style={{ marginTop: '0.6rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.6rem', color: '#da8b52' }}>— me, to myself, at 2am</footer>
            </blockquote>
          </div>

          <div style={{ position: 'relative', width: '13.5rem', transform: 'rotate(6deg)', transition: 'transform .26s cubic-bezier(.2,.8,.25,1)' }} data-motion="scrap" className="hhv10">
            <span aria-hidden="true" style={{ position: 'absolute', top: '-0.7rem', left: '50%', marginLeft: '-1.6rem', width: '3.2rem', height: '1.3rem', transform: 'rotate(-2deg)', zIndex: '16', pointerEvents: 'none', background: 'linear-gradient(178deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.05) 26%, rgba(255,255,255,0.02) 74%, rgba(255,255,255,0.22) 100%), repeating-linear-gradient(94deg, rgba(255,255,255,0.14) 0 2px, transparent 2px 7px), rgba(244,240,232,0.6)', clipPath: 'polygon(3% 0%, 97% 5%, 100% 34%, 97% 63%, 100% 95%, 4% 100%, 0% 66%, 2% 32%)', filter: 'url(#rough-tape) drop-shadow(0 1px 1px rgba(0,0,0,0.45)) drop-shadow(0 3px 4px rgba(0,0,0,0.28))' }} data-motion="tape"></span>
            <div style={{ position: 'relative', padding: '0.6rem 0.6rem 2.4rem', background: 'radial-gradient(56px 22px at 4% 2%, rgba(30,14,5,0.34), transparent 74%), radial-gradient(50px 20px at 97% 96%, rgba(30,14,5,0.36), transparent 74%), linear-gradient(180deg,#f2e9d8,#e4d8c2)', filter: 'drop-shadow(0 1px 0.5px rgba(0,0,0,0.55)) drop-shadow(0 4px 4px rgba(0,0,0,0.3)) drop-shadow(0 10px 12px rgba(0,0,0,0.2))' }}><span aria-hidden="true" style={{ position: 'absolute', inset: '0', zIndex: '3', borderRadius: 'inherit', padding: '3px', background: 'linear-gradient(135deg,#e58d55 0%,#d080cc 34%,#7daa76 68%,#6fb8ae 100%)', WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', filter: 'url(#sketch-edge)', opacity: '1', pointerEvents: 'none' }} data-ring="1"></span>
              <img loading="lazy" decoding="async" src="/photos/polaroid.webp" alt="Guruprasad as the Pirate King — Monkey D. Luffy tribute" style={{ display: 'block', width: '100%', aspectRatio: '4/5', objectFit: 'cover', objectPosition: 'top', background: '#0d0a06' }} />
              <p style={{ position: 'absolute', left: '0', right: '0', bottom: '0.4rem', margin: '0', textAlign: 'center', fontFamily: 'Caveat,cursive', fontSize: '1.3rem', color: '#3d3220' }}>the pirate king ♛</p>
            </div>
            <span aria-hidden="true" style={{ position: 'absolute', bottom: '-2rem', left: '1.75rem', transform: 'rotate(18deg)', fontFamily: 'Caveat,cursive', fontSize: '0.9rem', color: '#d080cc', pointerEvents: 'none' }}>✦</span><span aria-hidden="true" style={{ position: 'absolute', bottom: '-7.5rem', left: '3rem', transform: 'rotate(-6deg)', fontFamily: 'Caveat,cursive', fontSize: '0.78rem', color: '#6fb8ae', pointerEvents: 'none' }}>✧</span><span aria-hidden="true" style={{ position: 'absolute', bottom: '-4rem', left: '-0.25rem', transform: 'rotate(6deg)', fontFamily: 'Caveat,cursive', fontSize: '1rem', color: '#e58d55', pointerEvents: 'none' }}>✦</span><span aria-hidden="true" style={{ position: 'absolute', bottom: '-6rem', right: '1.25rem', transform: 'rotate(-12deg)', fontFamily: 'Caveat,cursive', fontSize: '0.9rem', color: '#9a6be0', pointerEvents: 'none' }}>✧</span><span aria-hidden="true" style={{ position: 'absolute', bottom: '-2.25rem', right: '2.25rem', fontFamily: 'Caveat,cursive', fontSize: '0.78rem', color: '#e8b64a', pointerEvents: 'none' }}>✦</span><span aria-hidden="true" style={{ position: 'absolute', bottom: '-3.5rem', right: '0.25rem', width: '6px', height: '6px', borderRadius: '50%', background: 'radial-gradient(circle,#ffd9a8,transparent 70%)', boxShadow: '0 0 5px #ffd9a8', pointerEvents: 'none' }}></span><span aria-hidden="true" style={{ position: 'absolute', bottom: '-6.5rem', left: '1rem', width: '4px', height: '4px', borderRadius: '50%', background: 'radial-gradient(circle,#cdbcff,transparent 70%)', boxShadow: '0 0 5px #cdbcff', pointerEvents: 'none' }}></span>
          </div>
        </div>

        <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '2rem', marginTop: '4.5rem' }}>
          <div style={{ position: 'relative', flex: '0 1 auto', maxWidth: '100%', transform: 'rotate(-3deg)', transition: 'transform .26s cubic-bezier(.2,.8,.25,1)' }} data-motion="scrap" className="hhv8">
            <span style={{ position: 'absolute', top: '-0.8rem', left: '1.25rem', zIndex: '15', transform: 'rotate(-3deg)', padding: '0.15rem 0.65rem', fontFamily: 'Caveat,cursive', fontSize: '1.05rem', color: '#fff', background: 'linear-gradient(90deg,#ce72c0,#e0654a)', boxShadow: '0 2px 4px rgba(0,0,0,0.45)' }}>Fun facts</span>
            <span aria-hidden="true" style={{ position: 'absolute', top: '-0.7rem', right: '2rem', width: '4rem', height: '1.3rem', transform: 'rotate(3deg)', zIndex: '16', pointerEvents: 'none', background: 'linear-gradient(178deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.05) 26%, rgba(255,255,255,0.02) 74%, rgba(255,255,255,0.22) 100%), repeating-linear-gradient(94deg, rgba(255,255,255,0.14) 0 2px, transparent 2px 7px), rgba(214,168,96,0.48)', clipPath: 'polygon(3% 0%, 97% 5%, 100% 34%, 97% 63%, 100% 95%, 4% 100%, 0% 66%, 2% 32%)', filter: 'url(#rough-tape) drop-shadow(0 1px 1px rgba(0,0,0,0.45)) drop-shadow(0 3px 4px rgba(0,0,0,0.28))' }} data-motion="tape"></span>
            <ul style={{ position: 'relative', margin: '0', padding: '1.25rem 1.25rem 1rem', listStyle: 'none', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.25rem', background: 'radial-gradient(84px 34px at 6% 0%, rgba(24,11,4,0.55), transparent 72%), radial-gradient(74px 30px at 94% 3%, rgba(24,11,4,0.5), transparent 74%), radial-gradient(70px 30px at 2% 90%, rgba(24,11,4,0.52), transparent 74%), radial-gradient(88px 34px at 97% 97%, rgba(24,11,4,0.55), transparent 72%), radial-gradient(64px 24px at 50% 100%, rgba(24,11,4,0.42), transparent 76%), radial-gradient(116% 126% at 50% 46%, transparent 44%, rgba(128,74,30,0.36) 70%, rgba(88,46,18,0.62) 86%, rgba(46,22,9,0.82) 95%, rgba(20,10,4,0.92) 100%), linear-gradient(180deg,#e2d5b8,#d1c09a)', clipPath: 'polygon(1% 5%, 8% 1%, 17% 4%, 29% 1%, 41% 4%, 54% 1%, 65% 4%, 78% 1%, 90% 3%, 99% 2%, 99% 12%, 100% 27%, 98% 42%, 100% 58%, 99% 74%, 100% 89%, 97% 99%, 85% 97%, 71% 100%, 56% 97%, 42% 100%, 28% 97%, 14% 100%, 4% 98%, 1% 91%, 2% 75%, 0% 58%, 1% 41%, 0% 24%)', filter: 'drop-shadow(0 1px 0.5px rgba(0,0,0,0.55)) drop-shadow(0 4px 4px rgba(0,0,0,0.3)) drop-shadow(0 10px 12px rgba(0,0,0,0.2))' }}><span aria-hidden="true" style={{ position: 'absolute', inset: '0', zIndex: '3', borderRadius: 'inherit', padding: '1.5px', background: 'linear-gradient(135deg,#c06a24,#8f4a20 52%,#5a3113)', WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', filter: 'url(#sketch-edge)', opacity: '0.8', pointerEvents: 'none' }} data-ring="1"></span>
              <li style={{ display: 'grid', justifyItems: 'center', gap: '0.2rem', maxWidth: '6rem', textAlign: 'center', fontFamily: 'Caveat,cursive', fontSize: '1.05rem', fontWeight: '700', color: '#2b2213' }}><span aria-hidden="true" style={{ fontSize: '1.4rem', lineHeight: '1' }}>ツ</span>Anime enthusiast</li>
              <li style={{ display: 'grid', justifyItems: 'center', gap: '0.2rem', maxWidth: '6rem', textAlign: 'center', fontFamily: 'Caveat,cursive', fontSize: '1.05rem', fontWeight: '700', color: '#2b2213' }}><span aria-hidden="true" style={{ fontSize: '1.4rem', lineHeight: '1' }}>☾</span>Night-owl developer</li>
              <li style={{ display: 'grid', justifyItems: 'center', gap: '0.2rem', maxWidth: '6rem', textAlign: 'center', fontFamily: 'Caveat,cursive', fontSize: '1.05rem', fontWeight: '700', color: '#2b2213' }}><span aria-hidden="true" style={{ fontSize: '1.4rem', lineHeight: '1' }}>♫</span>Music heals</li>
              <li style={{ display: 'grid', justifyItems: 'center', gap: '0.2rem', maxWidth: '6rem', textAlign: 'center', fontFamily: 'Caveat,cursive', fontSize: '1.05rem', fontWeight: '700', color: '#2b2213' }}><span aria-hidden="true" style={{ fontSize: '1.4rem', lineHeight: '1' }}>☁</span>Overthinker by default</li>
            </ul>
          </div>

          <div style={{ position: 'relative', width: '13rem', transform: 'rotate(5deg)', transition: 'transform .26s cubic-bezier(.2,.8,.25,1)' }} data-motion="scrap" className="hhv11">
            <span aria-hidden="true" style={{ position: 'absolute', top: '-0.7rem', right: '-0.8rem', width: '3.5rem', height: '1.3rem', transform: 'rotate(12deg)', zIndex: '16', pointerEvents: 'none', background: 'linear-gradient(178deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.05) 26%, rgba(255,255,255,0.02) 74%, rgba(255,255,255,0.22) 100%), repeating-linear-gradient(94deg, rgba(255,255,255,0.14) 0 2px, transparent 2px 7px), rgba(217,162,74,0.5)', clipPath: 'polygon(3% 0%, 97% 5%, 100% 34%, 97% 63%, 100% 95%, 4% 100%, 0% 66%, 2% 32%)', filter: 'url(#rough-tape) drop-shadow(0 1px 1px rgba(0,0,0,0.45)) drop-shadow(0 3px 4px rgba(0,0,0,0.28))' }} data-motion="tape"></span>
            <div style={{ position: 'relative', padding: '1rem 1.4rem 1.2rem', color: '#e6ddc8', background: 'radial-gradient(120% 130% at 50% 40%, transparent 48%, rgba(0,0,0,0.4) 88%, rgba(0,0,0,0.6) 100%), linear-gradient(180deg,#1a1c1b,#101110)', clipPath: 'polygon(1% 5%, 8% 1%, 17% 4%, 29% 1%, 41% 4%, 54% 1%, 65% 4%, 78% 1%, 90% 3%, 99% 2%, 99% 12%, 100% 27%, 98% 42%, 100% 58%, 99% 74%, 100% 89%, 97% 99%, 85% 97%, 71% 100%, 56% 97%, 42% 100%, 28% 97%, 14% 100%, 4% 98%, 1% 91%, 2% 75%, 0% 58%, 1% 41%, 0% 24%)', filter: 'drop-shadow(0 1px 0.5px rgba(0,0,0,0.55)) drop-shadow(0 4px 4px rgba(0,0,0,0.3)) drop-shadow(0 10px 12px rgba(0,0,0,0.2))' }}><span aria-hidden="true" style={{ position: 'absolute', inset: '0', zIndex: '3', borderRadius: 'inherit', padding: '3px', background: 'linear-gradient(135deg,#e58d55 0%,#d080cc 34%,#7daa76 68%,#6fb8ae 100%)', WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', filter: 'url(#sketch-edge)', opacity: '1', pointerEvents: 'none' }} data-ring="1"></span>
              <p style={{ margin: '0', fontFamily: 'Caveat,cursive', fontSize: '1.45rem', letterSpacing: '0.04em', color: '#ec6a4a' }}>BUILT WITH ♥</p>
              <ul style={{ margin: '0.6rem 0 0', padding: '0', listStyle: 'none', display: 'grid', gap: '0.35rem', fontFamily: 'Caveat,cursive', fontSize: '1.15rem' }}>
                <li><span style={{ color: '#61dafb' }}>◉</span> React</li>
                <li><span style={{ color: '#8cc84b' }}>⬢</span> Node.js</li>
                <li><span style={{ color: '#4faa41' }}>✿</span> MongoDB</li>
                <li><span style={{ color: '#38bdf8' }}>≈</span> Tailwind CSS</li>
                <li><span style={{ color: '#c4a2ea' }}>⚡</span> Vite</li>
              </ul>
              <p style={{ margin: '0.6rem 0 0', fontFamily: 'Caveat,cursive', fontSize: '1.1rem', color: '#c2b79f' }}>… and lots of ☕</p>
            </div>
          </div>

          <div style={{ position: 'relative', alignSelf: 'center', transform: 'rotate(-14deg)', textAlign: 'center', fontFamily: 'Caveat,cursive' }}><span aria-hidden="true" style={{ position: 'absolute', top: '-1.1rem', left: '50%', marginLeft: '-1.4rem', width: '2.8rem', height: '1.1rem', transform: 'rotate(-4deg)', zIndex: '16', pointerEvents: 'none', background: 'linear-gradient(178deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.05) 26%, rgba(255,255,255,0.02) 74%, rgba(255,255,255,0.22) 100%), repeating-linear-gradient(94deg, rgba(255,255,255,0.14) 0 2px, transparent 2px 7px), rgba(214,168,96,0.42)', clipPath: 'polygon(3% 0%, 97% 5%, 100% 34%, 97% 63%, 100% 95%, 4% 100%, 0% 66%, 2% 32%)', filter: 'url(#rough-tape) drop-shadow(0 1px 1px rgba(0,0,0,0.45)) drop-shadow(0 3px 4px rgba(0,0,0,0.28))' }}></span>
            <p style={{ margin: '0', fontSize: '1.2rem', letterSpacing: '0.03em', color: '#a2977c' }}>Relationship Status</p>
            <p style={{ margin: '0.15rem 0 0', fontSize: '2rem', lineHeight: '1', color: '#b7a888' }}>Committed…</p>
            <p style={{ margin: '0.15rem 0 0', fontSize: '2rem', lineHeight: '1', color: '#c2543a', textShadow: '0 0 10px rgba(194,75,41,0.3)' }}>to Git ♡</p>
          </div>
        </div>


        <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '1.5rem', marginTop: '3rem' }}>
          <div style={{ position: 'absolute', top: '-3rem', right: '6rem', zIndex: '20', transform: 'rotate(-6deg)', padding: '0.5rem 0.75rem', background: 'linear-gradient(180deg,#e8b64a,#cf9a2e)', boxShadow: '0 2px 3px rgba(0,0,0,0.6), 0 10px 16px -4px rgba(0,0,0,0.55)', transition: 'transform .26s cubic-bezier(.2,.8,.25,1)' }} data-motion="tag" className="hhv12">
            <span aria-hidden="true" style={{ position: 'absolute', top: '-0.4rem', left: '50%', marginLeft: '-5px', width: '10px', height: '10px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%,#f0876a,#b23b2c)', boxShadow: '0 2px 3px rgba(0,0,0,0.6)' }}></span>
            <p style={{ margin: '0', textAlign: 'center', fontFamily: 'Caveat,cursive', fontSize: '1.05rem', lineHeight: '1.15', color: '#3a2c0e' }}>One commit<br />at a time. ♛</p>
          </div>

          <p style={{ position: 'absolute', right: '2rem', bottom: '1rem', zIndex: '4', margin: '0', width: '16rem', textAlign: 'center', transform: 'rotate(-4deg)', fontFamily: 'Caveat,cursive', fontSize: '1.5rem', fontWeight: '600', lineHeight: '1.25', color: '#e6cd93', textShadow: '0 0 6px rgba(224,120,50,0.35), 0 1px 1px rgba(0,0,0,0.7)', pointerEvents: 'none' }} data-motion="line">“The world owes you nothing.<br />Build anyway.”</p>
          <div style={{ position: 'relative', flex: '1 1 min(100%,22rem)', maxWidth: 'min(100%,32rem)', transform: 'rotate(-1deg)', transition: 'transform .26s cubic-bezier(.2,.8,.25,1)' }} data-motion="scrap" className="hhv13">
            <span aria-hidden="true" style={{ position: 'absolute', top: '-0.8rem', left: '3rem', width: '4rem', height: '1.4rem', transform: 'rotate(-3deg)', zIndex: '16', pointerEvents: 'none', background: 'linear-gradient(178deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.05) 26%, rgba(255,255,255,0.02) 74%, rgba(255,255,255,0.22) 100%), repeating-linear-gradient(94deg, rgba(255,255,255,0.14) 0 2px, transparent 2px 7px), rgba(214,168,96,0.48)', clipPath: 'polygon(3% 0%, 97% 5%, 100% 34%, 97% 63%, 100% 95%, 4% 100%, 0% 66%, 2% 32%)', filter: 'url(#rough-tape) drop-shadow(0 1px 1px rgba(0,0,0,0.45)) drop-shadow(0 3px 4px rgba(0,0,0,0.28))' }} data-motion="tape"></span>
            <span aria-hidden="true" style={{ position: 'absolute', top: '-0.8rem', right: '3rem', width: '4rem', height: '1.4rem', transform: 'rotate(3deg)', zIndex: '16', pointerEvents: 'none', background: 'linear-gradient(178deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.05) 26%, rgba(255,255,255,0.02) 74%, rgba(255,255,255,0.22) 100%), repeating-linear-gradient(94deg, rgba(255,255,255,0.14) 0 2px, transparent 2px 7px), rgba(214,168,96,0.48)', clipPath: 'polygon(3% 0%, 97% 5%, 100% 34%, 97% 63%, 100% 95%, 4% 100%, 0% 66%, 2% 32%)', filter: 'url(#rough-tape) drop-shadow(0 1px 1px rgba(0,0,0,0.45)) drop-shadow(0 3px 4px rgba(0,0,0,0.28))' }} data-motion="tape"></span>
            <div style={{ position: 'relative', background: 'linear-gradient(180deg,#1a1c1c,#111212)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '6px', filter: 'drop-shadow(0 1px 0.5px rgba(0,0,0,0.55)) drop-shadow(0 4px 4px rgba(0,0,0,0.3)) drop-shadow(0 10px 12px rgba(0,0,0,0.2))' }}><span aria-hidden="true" style={{ position: 'absolute', inset: '0', zIndex: '3', borderRadius: 'inherit', padding: '1.5px', background: 'linear-gradient(135deg,#e58d55 0%,#d080cc 34%,#7daa76 68%,#6fb8ae 100%)', WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', filter: 'url(#sketch-edge)', opacity: '0.85', pointerEvents: 'none' }}></span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.7rem', borderBottom: '1px solid rgba(255,255,255,0.08)', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.58rem', letterSpacing: '0.14em', color: '#b4a48f' }}><span>guru@notebook:~</span><span aria-hidden="true">▢ ◦ ✕</span></div>
              <div onClick={V.focusTerm} style={{ padding: '0.9rem 1.1rem 1.1rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.7rem', lineHeight: '1.75', minHeight: '12.5rem', maxHeight: '16rem', overflowY: 'auto', cursor: 'text' }}>
                <p style={{ margin: '0', color: '#7f8f6e' }}>guru-os 1.0.1 — type <span style={{ color: '#e8b64a' }}>help</span> to see what I left lying around.</p>
                {V.termOutput}
                <p style={{ margin: '0.35rem 0 0', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#7daa76' }}><span style={{ color: '#6fa8ea' }}>➜</span><input type="text" ref={V.termInput} onKeyDown={V.onTermKey} onChange={V.onTermChange} value={V.termValue} spellCheck="false" autoComplete="off" aria-label="Terminal input" style={{ flex: '1', minWidth: '0', border: '0', outline: 'none', background: 'transparent', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.7rem', color: '#ded4bd', caretColor: '#7daa76' }} /></p>
              </div>
            </div>
            <span aria-hidden="true" style={{ position: 'absolute', bottom: '-1.4rem', left: '0.5rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.62rem', color: '#a2977c' }}>↑ it actually works, try “help”</span>
            <span aria-hidden="true" style={{ position: 'absolute', bottom: '-1.4rem', right: '0.5rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.62rem', color: '#9c8f7c' }}>418: I'm a teapot</span>
          </div>
        </div>

        <span aria-hidden="true" style={{ position: 'absolute', bottom: '-1.5rem', right: '1rem', fontFamily: 'Caveat,cursive', fontSize: '1.05rem', color: '#9a6be0', pointerEvents: 'none' }}>stay curious. <span style={{ color: '#e0654a' }}>↺</span></span>
        <p style={{ margin: '3.5rem 0 0', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.66rem', color: '#9c8f7c' }} data-motion="line">// TODO: sleep earlier    // TODO: touch grass</p>
      </div>
    </div>
  </div>

  <div aria-hidden="true" style={{ position: 'absolute', bottom: '1.55rem', left: '6rem', right: '2rem', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(224,214,188,0.16) 12%,rgba(224,214,188,0.16) 88%,transparent)', pointerEvents: 'none' }}></div>
  <div aria-hidden="true" style={{ position: 'absolute', bottom: '0.625rem', left: '6rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.6rem', letterSpacing: '0.08em', color: 'rgba(224,214,188,0.45)' }}>NO. 01</div>
  <div aria-hidden="true" style={{ position: 'absolute', bottom: '0.625rem', right: '2rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.6rem', letterSpacing: '0.08em', color: 'rgba(224,214,188,0.45)' }}>REV 1.01 · 4f2a9c1</div>
</div>
</>
    );
  }
}

Page.defaultProps = {
  starfield: true,
};

export default function HomeScreen() {
  return <Page />;
}
