'use client';
import React from 'react';
import Starfield from '@/components/Starfield';

class Page extends React.Component {
  componentDidMount() {
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.gen = 1;
    clearTimeout(this.__headSettle);
    clearTimeout(this.__headFail);
    /* a remount must retire the previous instance's watcher, not race it */
    window.__plotterGen = (window.__plotterGen || 0) + 1;
    this.mine = window.__plotterGen;
    this.collect();
    this.i = 0;
    import("./projects-plot.js")
      .then((m) => { this.P = m.PROJECTS || m.default; this.start(); })
      .catch(() => { this.P = null; this.showAll(); });
  }

  /* the template can re-render under us — always read the live nodes */
  collect() {
    const root = document.querySelector("[data-plotter]") || (this.el || document);
    this.root = root;
    const q = (s) => [].slice.call(root.querySelectorAll(s));
    this.E = {
      btns: q("[data-btn]"), ticks: q("[data-tick]"),
      rule: root.querySelector("[data-rule] [data-line]"),
      slug: root.querySelector("[data-slug]"), status: root.querySelector("[data-status]"),
      name: root.querySelector("[data-name]"), tag: root.querySelector("[data-tag]"),
      gstops: q("[data-gstop]"),
      nums: q("[data-num]"), labs: q("[data-lab]"),
      sum: root.querySelector("[data-sum]"),
      dots: q("[data-dot]"), nodes: q("[data-node]"), subs: q("[data-sub]"),
      sides: q("[data-side]"), sideSubs: q("[data-sidesub]"), wirelabs: q("[data-wirelab]"),
      archLines: q("[data-arch] [data-line]"), grows: q("[data-grow]"),
      fail: root.querySelector("[data-fail]"), change: root.querySelector("[data-change]"), learn: root.querySelector("[data-learn]"),
      decT: q("[data-dec-t]"), decB: q("[data-dec-b]"),
      stepN: q("[data-step-n]"), stepT: q("[data-step-t]"),
      rebuild: root.querySelector("[data-rebuild]"),
      stack: root.querySelector("[data-stack]"),
      visit: root.querySelector("[data-visit]"), repo: root.querySelector("[data-repo]"),
      sourceNote: root.querySelector("[data-source-note]"),
      sections: q("[data-plot]")
    };
    this.E.btns.forEach((b) => {
      if (b.__wired) return;
      b.__wired = 1;
      b.addEventListener("click", () => this.select(+b.dataset.i));
      const nm = b.querySelector("[data-btn-name]");
      b.addEventListener("mouseenter", () => { if (+b.dataset.i !== this.i) nm.style.color = "#ddd1bd"; });
      b.addEventListener("mouseleave", () => { if (+b.dataset.i !== this.i) nm.style.color = "#b0a08c"; });
    });
  }

  start() {
    if (this.reduced) { this.showAll(); return; }
    try {
      this.collect();
      this.armAll();
      this.fill(this.P[0]);
      this.plotHead(this.P[0], true);
      this.plotAll(2100);
      /* belt and braces: whatever happened above, the masthead is readable after this */
      clearTimeout(this.__headFail);
      this.__headFail = setTimeout(() => this.settleHead(), 4600);
    } catch (e) { this.showAll(); }
  }

  EASE = "cubic-bezier(.16,.84,.24,1)";

  /* the pen follows the reader down the page. every reveal is a CSS
     transition, so a throttled tab can slow it but never strand it */
  /* the pen works down the sheet on one-shot timers and CSS transitions —
     no rAF, no chained timeouts, so a background tab can never strand a band */
  plotAll(from) {
    const base = from || 0;
    this.E.sections.forEach((s, i) => {
      const g = this.gen;
      setTimeout(() => { if (this.gen === g) this.plotBand(s); }, base + i * 240);
    });
  }

  parts(s) {
    return {
      lines: [].slice.call(s.querySelectorAll("[data-line]")),
      glyphs: [].slice.call(s.querySelectorAll("text")),
      dots: [].slice.call(s.querySelectorAll("circle,[data-arrow]")),
      grows: [].slice.call(s.querySelectorAll("[data-grow]")),
      texts: [].slice.call(s.querySelectorAll("p,span[data-dec-t],span[data-dec-b],span[data-lab],span[data-num]")),
      nums: [].slice.call(s.querySelectorAll("[data-num]"))
    };
  }

  len(el) {
    if (el.__len == null) { try { el.__len = el.getTotalLength(); } catch (e) { el.__len = 0; } }
    return el.__len;
  }

  hold(el, css) { el.style.transition = "none"; Object.keys(css).forEach((k) => { el.style[k] = css[k]; }); }

  armAll() {
    this.E.sections.forEach((s) => this.arm(s));
  }

  /* everything the pen has not reached yet is held blank */
  arm(s) {
    const p = this.parts(s);
    p.lines.forEach((l) => { l.__len = null; const n = this.len(l); if (n) this.hold(l, { strokeDasharray: n, strokeDashoffset: n }); });
    p.glyphs.concat(p.dots).forEach((g) => this.hold(g, { opacity: "0" }));
    p.grows.forEach((g) => this.hold(g, { transform: g.style.transformOrigin.indexOf("top") === 0 ? "scaleY(0)" : "scaleX(0)" }));
    p.texts.forEach((t) => this.hold(t, { clipPath: "inset(0 100% 0 0)" }));
    s.__armed = 1;
    if (s.offsetWidth) { /* flush the held state before anything transitions */ }
  }

  plotBand(s) {
    if (!s.__armed) return;
    s.__armed = 0;
    if (this.reduced) return this.settle(s);
    const fig = [].slice.call(s.querySelectorAll("[data-arch2],[data-arch3],[data-arch4],[data-arch5]")).filter((f) => f.style.display !== "none")[0];
    if (fig) return this.plotFigure(s, fig);
    const p = this.parts(s);
    const E = this.EASE;
    let d = 0;
    p.grows.forEach((g, i) => {
      const vert = g.style.transformOrigin.indexOf("top") === 0;
      g.style.transition = "transform .44s " + E + " " + (d + i * 90) + "ms";
      g.style.transform = vert ? "scaleY(1)" : "scaleX(1)";
    });
    d += p.grows.length ? 240 : 0;
    p.lines.forEach((l, i) => {
      l.style.transition = "stroke-dashoffset .46s cubic-bezier(.3,.7,.3,1) " + (d + i * 70) + "ms";
      l.style.strokeDashoffset = "0";
    });
    d += p.lines.length ? 300 : 0;
    p.texts.forEach((t, i) => {
      t.style.transition = "clip-path .54s " + E + " " + (d + i * 62) + "ms";
      t.style.clipPath = "inset(0 0 0 0)";
    });
    const gd = d + p.texts.length * 62;
    p.dots.concat(p.glyphs).forEach((g, i) => {
      g.style.transition = "opacity .34s ease " + (gd + i * 40) + "ms";
      g.style.opacity = "1";
    });
    p.nums.forEach((n) => setTimeout(() => this.roll(n), d));
    const total = gd + p.dots.length * 40 + p.glyphs.length * 40 + 800;
    clearTimeout(s.__settle);
    s.__settle = setTimeout(() => this.settle(s), total);
  }

  /* the schematic draws the way a plotter would: enclosures first, then each
     plate traced and captioned, then the wiring with its arrowheads */
  plotFigure(s, fig) {
    const EA = this.EASE;
    const g = this.gen;
    const list = (sel, root) => [].slice.call((root || fig).querySelectorAll(sel));
    /* One pen, one speed. Every stroke used to take a fixed time regardless of how far it
       had to travel, so a 1000px frame raced along at 1.4px/ms while a 44px wire crawled at
       0.26 — the giveaway that these are transitions rather than a plotter. Duration now
       comes from the path's own length, floored so a stub still registers and capped so the
       outer frames do not drag. Returns the duration, so the caller can lay the next stroke
       against this one instead of on a fixed metronome. */
    const SPEED = 1.5;            // px per ms
    const traceMs = (el) => {
      const n = el && this.len ? this.len(el) : 0;
      return Math.max(190, Math.min(880, Math.round((n || 260) / SPEED)));
    };
    const trace = (el, ms, dur) => {
      if (!el) return 0;
      const d = dur || traceMs(el);
      el.style.transition = "stroke-dashoffset " + d + "ms cubic-bezier(.32,.72,.28,1) " + ms + "ms";
      el.style.strokeDashoffset = "0";
      return d;
    };
    const show = (els, ms) => els.forEach((el, i) => {
      el.style.transition = "opacity .34s ease " + (ms + i * 60) + "ms";
      el.style.opacity = "1";
    });
    [].slice.call(s.querySelectorAll("p")).forEach((t, i) => {
      t.style.transition = "clip-path .5s " + EA + " " + (i * 90) + "ms";
      t.style.clipPath = "inset(0 0 0 0)";
    });
    /* The pen does not restart for every stroke: the next one begins partway through the
       last, so the figure reads as one continuous hand rather than a row of timers firing.
       `lead` is how far into a stroke the next one starts — larger for the outer frames,
       tighter for the wires, which is the rhythm of someone drawing a schematic. */
    let t = 240;
    const run = (groups, lead, minGap, after) => {
      groups.forEach((el) => {
        const dur = trace(el.querySelector("[data-line]"), t);
        after(el, t, dur);
        t += Math.max(minGap, Math.round(dur * lead));
      });
    };

    run(list("[data-frame]"), 0.52, 120, (f, ms, dur) => show(list("text", f), ms + dur * 0.55));
    t += 260;
    run(list("[data-plate]"), 0.46, 96, (pl, ms, dur) => show(list("text", pl), ms + dur * 0.6));
    t += 200;
    run(list("[data-wire]"), 0.58, 70, (w, ms, dur) => {
      /* the arrowhead lands as the wire reaches it, not on a fixed offset */
      show(list("[data-arrow]", w), ms + dur * 0.82);
      show(list("text", w), ms + dur * 0.9);
    });
    const total = t + 1000;
    clearTimeout(s.__settle);
    s.__settle = setTimeout(() => { if (this.gen === g) this.settle(s); }, total);
  }

  /* drop every holding style so a band is readable no matter what */
  settle(s) {
    const p = this.parts(s);
    p.lines.forEach((l) => { l.style.transition = ""; l.style.strokeDasharray = ""; l.style.strokeDashoffset = ""; });
    p.glyphs.concat(p.dots).forEach((g) => { g.style.transition = ""; g.style.opacity = ""; });
    p.grows.forEach((g) => { g.style.transition = ""; g.style.transform = ""; });
    p.texts.forEach((t) => { t.style.transition = ""; t.style.clipPath = ""; });
    p.nums.forEach((n) => { if (n.dataset.v) n.textContent = n.dataset.v; });
    s.__armed = 0;
  }

  showAll() {
    (this.E.sections || []).forEach((s) => this.settle(s));
    this.settleHead();
  }

  /* numbers count up on their own clock, and land on the real figure */
  roll(el) {
    const raw = el.dataset.v || el.textContent;
    el.dataset.v = raw;
    const num = parseInt(String(raw).replace(/\D/g, ""), 10);
    if (isNaN(num) || this.reduced) { el.textContent = raw; return; }
    const gen = this.gen, t0 = performance.now(), ms = 880;
    const step = () => {
      if (this.gen !== gen) { el.textContent = raw; return; }
      const q = Math.min(1, (performance.now() - t0) / ms);
      el.textContent = String(Math.round(num * (1 - Math.pow(1 - q, 3))));
      if (q < 1) requestAnimationFrame(step); else el.textContent = raw;
    };
    requestAnimationFrame(step);
  }

  type(el, text, ms, done) {
    const gen = this.gen, t0 = performance.now();
    let fired = false;
    const finish = () => { if (fired) return; fired = true; el.textContent = text; if (done) done(); };
    const step = () => {
      if (this.gen !== gen) return finish();
      const q = Math.min(1, (performance.now() - t0) / ms);
      el.textContent = text.slice(0, Math.round(text.length * q));
      if (q < 1) requestAnimationFrame(step); else finish();
    };
    requestAnimationFrame(step);
    setTimeout(finish, ms + 1200);
  }

  /* the masthead: rule, slug, then the name drawn as an outline before it inks in */
  plotHead(p, first, done) {
    const E = this.E, EA = this.EASE;
    E.name.style.stroke = p.accent;
    E.tag.style.color = p.accent;
    E.status.style.color = p.accent;
    E.name.textContent = p.name.toUpperCase();
    this.styleName(p);
    this.fitName();
    E.status.textContent = (p.status || "LIVE") + (p.shipped ? " \u00b7 " + p.shipped : "") + " \u00b7 PLOTTED AT 1:1";
    E.tag.textContent = p.tag;
    if (this.reduced) { this.settleHead(); if (done) done(); return; }
    const rl = this.len(E.rule);
    this.hold(E.rule, { strokeDasharray: rl, strokeDashoffset: rl });
    this.hold(E.status, { clipPath: "inset(0 100% 0 0)" });
    this.hold(E.tag, { clipPath: "inset(0 100% 0 0)" });
    this.hold(E.name, { fillOpacity: "0", strokeDasharray: "3000", strokeDashoffset: "3000" });
    E.slug.style.clipPath = "";
    E.slug.textContent = "";
    const t = first ? 620 : 440;
    E.rule.style.transition = "stroke-dashoffset " + t + "ms cubic-bezier(.3,.7,.3,1)";
    E.rule.style.strokeDashoffset = "0";
    setTimeout(() => {
      E.status.style.transition = "clip-path .4s " + EA;
      E.status.style.clipPath = "inset(0 0 0 0)";
      this.type(E.slug, "SHEET " + p.n + " \u00b7 " + p.slug, 420, () => {
        E.name.style.transition = "stroke-dashoffset 1.25s cubic-bezier(.35,.72,.3,1)";
        E.name.style.strokeDashoffset = "0";
        setTimeout(() => {
          E.name.style.transition = "fill-opacity .46s " + EA;
          E.name.style.fillOpacity = "1";
          E.tag.style.transition = "clip-path .56s " + EA + " 120ms";
          E.tag.style.clipPath = "inset(0 0 0 0)";
        }, 1150);
      });
    }, t);
    /* the head settles unconditionally — a remount must never strand it blank */
    clearTimeout(this.__headSettle);
    this.__headSettle = setTimeout(() => { this.settleHead(); if (done) done(); }, t + 2900);
  }

  settleHead() {
    const E = this.E;
    [E.slug, E.status, E.tag].forEach((el) => { if (el) { el.style.transition = ""; el.style.clipPath = ""; } });
    if (E.name) {
      E.name.style.transition = "";
      E.name.style.fillOpacity = "1";
      E.name.style.strokeDasharray = "";
      E.name.style.strokeDashoffset = "";
    }
    if (E.rule) { E.rule.style.transition = ""; E.rule.style.strokeDasharray = ""; E.rule.style.strokeDashoffset = ""; }
  }

  /* every annotation is wrapped to the width of its own slot in the figure,
     measured in user units — copy of any length lays out without collisions */
  fitSubs() {
    const svg = this.root.querySelector("[data-arch]");
    if (!svg) return;
    let m = svg.__m;
    if (!m) {
      m = svg.__m = document.createElementNS("http://www.w3.org/2000/svg", "text");
      m.setAttribute("x", "-9999");
      m.setAttribute("y", "-9999");
      svg.appendChild(m);
    }
    const width = (s, style) => { m.setAttribute("style", style); m.textContent = s; try { return m.getComputedTextLength(); } catch (e) { return 0; } };
    const lay = (t, maxW, up) => {
      if (!t) return;
      const full = t.__full || (t.__full = t.textContent);
      const style = t.getAttribute("style") || "";
      const words = full.split(" ");
      const lines = [];
      let cur = "";
      words.forEach((w) => {
        const test = cur ? cur + " " + w : w;
        if (cur && width(test, style) > maxW) { lines.push(cur); cur = w; } else cur = test;
      });
      if (cur) lines.push(cur);
      t.textContent = "";
      const x = t.getAttribute("x");
      const first = up ? -20 * (lines.length - 1) : 0;
      lines.forEach((s, i) => {
        const el = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
        el.setAttribute("x", x);
        el.setAttribute("dy", i === 0 ? first : 20);
        el.textContent = s;
        t.appendChild(el);
      });
    };
    const slots = [250, 268, 150, 214, 340, 280, 296];
    const sideSlots = [270, 270, 230, 230];
    (this.E.subs || []).forEach((t, i) => lay(t, slots[i] || 220, true));
    (this.E.sideSubs || []).forEach((t, i) => lay(t, sideSlots[i] || 250, false));
  }

  styleName(p) {
    const F = [
      { family: "'Saira Condensed',sans-serif", size: 150, weight: 700, ls: "0.01em" },
      { family: "'Space Grotesk',sans-serif", size: 116, weight: 700, ls: "-0.02em" },
      { family: "'Playfair Display',serif", size: 124, weight: 700, ls: "0.005em" },
      { family: "'Bebas Neue',sans-serif", size: 168, weight: 400, ls: "0.04em" }
    ][(parseInt(p.n, 10) || 1) - 1] || null;
    const n = this.E.name;
    if (F) {
      n.style.fontFamily = F.family;
      n.style.fontSize = F.size + "px";
      n.style.fontWeight = F.weight;
      n.style.letterSpacing = F.ls;
    }
    const mix = (hex, w) => {
      const v = parseInt(hex.slice(1), 16);
      const c = [v >> 16 & 255, v >> 8 & 255, v & 255].map((x) => Math.round(x + (255 - x) * w));
      return "rgb(" + c.join(",") + ")";
    };
    const s = this.E.gstops;
    if (s[0]) s[0].setAttribute("stop-color", "#f5efe7");
    if (s[1]) s[1].setAttribute("stop-color", p.accent);
    if (s[2]) s[2].setAttribute("stop-color", mix(p.accent, 0.55));
  }

  fitName() {
    let len = 0;
    try { len = this.E.name.getComputedTextLength(); } catch (e) { len = 0; }
    const s = len > 980 ? 980 / len : 1;
    this.E.name.setAttribute("transform", s < 1 ? "scale(" + s.toFixed(3) + ")" : "");
  }

  fill(p) {
    const E = this.E;
    const set = (el, v) => { if (el) el.textContent = v; };
    set(E.sum, p.summary); set(E.fail, p.failed); set(E.change, p.changed); set(E.learn, p.learned); set(E.rebuild, p.rebuild);
    p.stats.forEach((s, i) => { if (E.nums[i]) { E.nums[i].textContent = s[0]; E.nums[i].dataset.v = s[0]; } if (E.labs[i]) E.labs[i].textContent = s[1]; });
    p.decisions.forEach((d, i) => { if (E.decT[i]) E.decT[i].textContent = d[0]; if (E.decB[i]) E.decB[i].textContent = d[1]; });
    p.timeline.forEach((t, i) => { if (E.stepN[i]) E.stepN[i].textContent = t[0].toUpperCase(); if (E.stepT[i]) E.stepT[i].textContent = t[1]; });
    p.nodes.forEach((n, i) => {
      if (E.nodes[i]) E.nodes[i].textContent = n;
      if (E.subs[i]) { E.subs[i].textContent = p.subs[i]; E.subs[i].__full = p.subs[i]; }
    });
    /* the figure carries an optional second rail (ingestion) and up to three
       hangers off the first; a sheet only shows the slots its data fills */
    const arch = this.root.querySelector("[data-arch]");
    const arch2 = this.root.querySelector("[data-arch2]");
    const arch3 = this.root.querySelector("[data-arch3]");
    const arch4 = this.root.querySelector("[data-arch4]");
    const arch5 = this.root.querySelector("[data-arch5]");
    /* a sheet with its own traced schematic uses it; the rest keep the rail */
    const nm = p.name || "";
    const own = /getfreetools/i.test(nm) ? arch3 : /sahayam/i.test(nm) ? arch4
      : /umbrix/i.test(nm) ? arch2 : /veritas/i.test(nm) ? arch5 : null;
    const two = !!own || p.nodes.length > 4;
    [arch2, arch3, arch4, arch5].forEach((f) => { if (f) f.style.display = f === own ? "" : "none"; });
    if (arch) arch.style.display = own ? "none" : "";
    const cap = this.root.querySelector("[data-figcap]");
    if (cap) cap.textContent = own === arch3 ? "FIG. 01 \u2014 CLIENT-SIDE COMPUTE PATH" : own === arch4 ? "FIG. 01 \u2014 ALERT & MATCH PATH" : own === arch2 ? "FIG. 01 \u2014 INGESTION & TAILORING PATH" : own === arch5 ? "FIG. 01 \u2014 BUILD & PUBLISH PATH" : "FIG. 01 \u2014 SIGNAL PATH";
    if (arch) arch.setAttribute("viewBox", two ? "0 0 1000 575" : "0 0 1000 340");
    const r2 = this.root.querySelector("[data-rail2]");
    if (r2) r2.style.display = two ? "" : "none";
    const hangs = [].slice.call(this.root.querySelectorAll("[data-hang]"));
    const slotMap = p.sides.length <= 2 ? [0, 2] : [0, 1, 2];
    hangs.forEach((g) => { g.style.display = "none"; });
    p.sides.slice(0, 3).forEach((n, k) => {
      const i = slotMap[k];
      if (hangs[i]) hangs[i].style.display = "";
      if (E.sides[i]) E.sides[i].textContent = n;
      if (E.sideSubs[i]) { E.sideSubs[i].textContent = p.sideSubs[k]; E.sideSubs[i].__full = p.sideSubs[k]; }
    });
    const deep = this.root.querySelector("[data-deepgrp]");
    if (deep) deep.style.display = p.sides.length > 3 ? "" : "none";
    if (p.sides.length > 3) {
      if (E.sides[3]) E.sides[3].textContent = p.sides[3];
      if (E.sideSubs[3]) { E.sideSubs[3].textContent = p.sideSubs[3]; E.sideSubs[3].__full = p.sideSubs[3]; }
    }
    p.wires.forEach((w, i) => { if (E.wirelabs[i]) E.wirelabs[i].textContent = w; });
    E.stack.innerHTML = p.stack.slice(0, 8).join("<br />");
    E.visit.href = p.live || "#";
    E.visit.style.display = p.live ? "" : "none";
    E.repo.href = p.repo || "#";
    E.repo.style.display = p.repo ? "" : "none";
    /* A missing Source link reads as nothing to show. Say why instead. */
    if (E.sourceNote) {
      const note = !p.repo && p.repoNote ? p.repoNote : "";
      E.sourceNote.textContent = note;
      E.sourceNote.style.display = note ? "" : "none";
    }
    [E.tag, E.status].concat(E.nums, E.decT).forEach((el) => { if (el) el.style.color = p.accent; });
    E.grows.forEach((g) => { g.style.background = p.accent; });
    if (E.archLines[0]) E.archLines[0].setAttribute("stroke", p.accent);
    E.dots.forEach((d) => d.setAttribute("fill", p.accent));
    E.stepN.forEach((n) => { n.style.color = p.accent; });
    E.name.style.stroke = p.accent;
    this.styleName(p);
    this.fitSubs();
  }

  select(i) {
    if (!this.P || i === this.i || this.busy) return;
    this.busy = true;
    this.i = i;
    this.gen++;
    this.collect();
    const p = this.P[i];
    const E = this.E;
    E.btns.forEach((b, n) => { b.querySelector("[data-btn-name]").style.color = n === i ? "#f5efe7" : "#b0a08c"; });
    E.ticks.forEach((t, n) => {
      t.style.transition = "transform .38s " + this.EASE;
      t.style.transform = "scaleX(" + (n === i ? 1 : 0) + ")";
    });
    if (this.reduced) { this.fill(p); this.showAll(); this.busy = false; return; }
    this.lift(() => {
      this.fill(p);
      this.toTop();
      this.armAll();
      this.plotHead(p, false);
      this.plotAll(1900);
      this.busy = false;
    });
  }

  /* a new sheet always starts at the top of the table */
  toTop() {
    const el = document.scrollingElement || document.documentElement;
    if ((el.scrollTop || 0) < 4) return;
    try { el.scrollTo({ top: 0, behavior: this.reduced ? "auto" : "smooth" }); }
    catch (e) { el.scrollTop = 0; }
    setTimeout(() => { if (el.scrollTop > 4) el.scrollTop = 0; }, 700);
  }

  /* the pen lifts off the sheet: ink drains, strokes retract the way they came */
  lift(done) {
    const E = this.E;
    /* the whole sheet lifts off the drawer while the ink drains, then sets back down */
    const sheet = this.root.querySelector("main");
    if (sheet && sheet.animate) {
      const a = sheet.animate([
        { transform: "none", filter: "none" },
        { transform: "translate3d(7px,-11px,0) rotate(-0.5deg)", filter: "drop-shadow(0 20px 24px rgba(0,0,0,0.45))", offset: 0.4 },
        { transform: "none", filter: "none" }
      ], { duration: 980, easing: "cubic-bezier(.3,.8,.3,1)" });
      a.finished.then(() => a.cancel(), () => {});
    }
    const drawn = E.sections.filter((s) => !s.__armed);
    const EA = "cubic-bezier(.42,0,.72,1)";
    let n = 0;
    drawn.forEach((s) => {
      clearTimeout(s.__settle);
      const p = this.parts(s);
      p.texts.forEach((t, i) => { t.style.transition = "clip-path .3s " + EA + " " + (i * 14) + "ms"; t.style.clipPath = "inset(0 0 0 100%)"; });
      p.glyphs.concat(p.dots).forEach((g, i) => { g.style.transition = "opacity .24s ease " + (i * 10) + "ms"; g.style.opacity = "0"; });
      p.grows.forEach((g, i) => {
        g.style.transition = "transform .28s " + EA + " " + (i * 30) + "ms";
        g.style.transform = g.style.transformOrigin.indexOf("top") === 0 ? "scaleY(0)" : "scaleX(0)";
      });
      p.lines.forEach((l, i) => {
        const L = this.len(l);
        if (!L) return;
        l.style.transition = "stroke-dashoffset .34s " + EA + " " + (180 + i * 22) + "ms";
        l.style.strokeDasharray = L;
        l.style.strokeDashoffset = L;
      });
      n++;
    });
    [E.slug, E.status, E.tag].forEach((el, i) => {
      el.style.transition = "clip-path .3s " + EA + " " + (i * 40) + "ms";
      el.style.clipPath = "inset(0 0 0 100%)";
    });
    E.name.style.transition = "fill-opacity .34s " + EA;
    E.name.style.fillOpacity = "0";
    if (E.rule) {
      const L = this.len(E.rule);
      E.rule.style.transition = "stroke-dashoffset .34s " + EA + " 240ms";
      E.rule.style.strokeDasharray = L;
      E.rule.style.strokeDashoffset = L;
    }
    setTimeout(done, 620);
  }

  renderVals() { return {}; }

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

<div data-screen-label="Projects" style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', minHeight: '100dvh', color: '#ede4d8', background: 'transparent' }}>
    <span aria-hidden="true" data-r="foil" style={{ position: 'fixed', inset: '0', zIndex: '0', pointerEvents: 'none', padding: '9px', background: 'linear-gradient(135deg,#6b5638,#40331f 40%,#5a4426 70%,#382a18) border-box', WebkitMask: 'linear-gradient(#000 0 0) padding-box exclude, linear-gradient(#000 0 0)', mask: 'linear-gradient(#000 0 0) padding-box exclude, linear-gradient(#000 0 0)', opacity: '0.9', filter: 'url(#torn-edge-2)' }}></span>

  <span aria-hidden="true" data-r="spiral" style={{ position: 'fixed', top: '0', bottom: '0', left: '-16px', width: '64px', zIndex: '5', pointerEvents: 'none', backgroundRepeat: 'repeat-y', backgroundPosition: 'center top', backgroundSize: '64px 46px', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'34\' viewBox=\'0 0 48 34\'%3E%3Cpath d=\'M18 10 C 5 10 2 13.5 2 17 C 2 20.5 5 24 18 24\' fill=\'none\' stroke=\'rgba(0,0,0,0.6)\' stroke-width=\'6\' stroke-linecap=\'round\' transform=\'translate(1.8 2.6)\'/%3E%3Cpath d=\'M18 10 C 5 10 2 13.5 2 17 C 2 20.5 5 24 18 24\' fill=\'none\' stroke=\'%230d0d0f\' stroke-width=\'8.6\' stroke-linecap=\'round\'/%3E%3Cpath d=\'M18 10 C 5 10 2 13.5 2 17 C 2 20.5 5 24 18 24\' fill=\'none\' stroke=\'%231b1b1e\' stroke-width=\'5.4\' stroke-linecap=\'round\'/%3E%3Cpath d=\'M18 10 C 5 10 2 13.5 2 17 C 2 20.5 5 24 18 24\' fill=\'none\' stroke=\'%23303035\' stroke-width=\'2.4\' stroke-linecap=\'round\' opacity=\'0.85\'/%3E%3Cpath d=\'M15 10.6 C 7 11 3.6 13.6 2.7 16.4\' fill=\'none\' stroke=\'%239aa0aa\' stroke-width=\'1.6\' stroke-linecap=\'round\' opacity=\'0.8\'/%3E%3Cellipse cx=\'18.5\' cy=\'10\' rx=\'2.3\' ry=\'2.7\' fill=\'%23020202\'/%3E%3Cellipse cx=\'18.5\' cy=\'24\' rx=\'2.3\' ry=\'2.7\' fill=\'%23020202\'/%3E%3C/svg%3E' }}></span>

  <nav aria-label="Sections" data-r="nav" style={{ position: 'fixed', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', zIndex: '20', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
    <span aria-hidden="true" data-r="thread" style={{ position: 'absolute', right: '1.3rem', marginRight: '-0.5px', top: '1.7rem', bottom: '-1.1rem', width: '1px', background: 'linear-gradient(180deg,transparent,rgba(180,168,140,0.55) 8%,rgba(180,168,140,0.55) 92%,transparent)', transformOrigin: 'top', animation: 'navthread .9s cubic-bezier(.2,.8,.25,1) both' }}></span>
    <span aria-hidden="true" data-r="shine" style={{ position: 'absolute', right: '1.3rem', marginRight: '-0.5px', top: '1.7rem', bottom: '-1.1rem', width: '1px', overflow: 'hidden' }}><span style={{ position: 'absolute', left: '0', top: '-2.6rem', width: '1px', height: '2.6rem', background: 'linear-gradient(180deg,transparent,rgba(255,240,205,0.95),transparent)', animation: 'threadshine 9.5s ease-in-out 2.2s infinite' }}></span></span>
    <span aria-hidden="true" data-r="index" style={{ paddingRight: '0.45rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.6rem', letterSpacing: '0.22em', color: '#a89e8d', animation: 'navfade .7s ease .42s both' }}>INDEX</span>
    <a href="/" data-r="beadlink" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.6rem', height: '2.75rem', paddingRight: '0.85rem', transition: 'transform .3s cubic-bezier(.2,.8,.25,1)' }} className="phv1">
      <span style={{ fontFamily: '\'Playfair Display\',serif', fontSize: '0.68rem', fontWeight: '500', letterSpacing: '0.2em', textTransform: 'uppercase', whiteSpace: 'nowrap', color: '#b3a894', animation: 'navlabel .6s cubic-bezier(.2,.8,.25,1) 0.58s both' }}>Home</span>
      <span aria-hidden="true" style={{ flex: '0 0 auto', display: 'grid', placeItems: 'center', width: '0.9rem', height: '0.9rem', animation: 'navbead .55s cubic-bezier(.2,.8,.25,1) 0.50s both' }}><span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'radial-gradient(circle at 32% 26%, #f0dda6, #9c8149 62%, #4e3d1a)', boxShadow: '0 1px 2px rgba(0,0,0,0.65)' }}></span></span>
    </a>
    <a href="/about" data-r="beadlink" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.6rem', height: '2.75rem', paddingRight: '0.85rem', transition: 'transform .3s cubic-bezier(.2,.8,.25,1)' }} className="phv1">
      <span style={{ fontFamily: '\'Playfair Display\',serif', fontSize: '0.68rem', fontWeight: '500', letterSpacing: '0.2em', textTransform: 'uppercase', whiteSpace: 'nowrap', color: '#b3a894', animation: 'navlabel .6s cubic-bezier(.2,.8,.25,1) 0.69s both' }}>About</span>
      <span aria-hidden="true" style={{ flex: '0 0 auto', display: 'grid', placeItems: 'center', width: '0.9rem', height: '0.9rem', animation: 'navbead .55s cubic-bezier(.2,.8,.25,1) 0.61s both' }}><span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'radial-gradient(circle at 30% 24%, #ffffff, #e9e0cb 38%, #b8ac93 70%, #6f6650)', boxShadow: '0 1px 2px rgba(0,0,0,0.65)' }}></span></span>
    </a>
    <a href="/skills" data-r="beadlink" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.6rem', height: '2.75rem', paddingRight: '0.85rem', transition: 'transform .3s cubic-bezier(.2,.8,.25,1)' }} className="phv1">
      <span style={{ fontFamily: '\'Playfair Display\',serif', fontSize: '0.68rem', fontWeight: '500', letterSpacing: '0.2em', textTransform: 'uppercase', whiteSpace: 'nowrap', color: '#b3a894', animation: 'navlabel .6s cubic-bezier(.2,.8,.25,1) 0.80s both' }}>Skills</span>
      <span aria-hidden="true" style={{ flex: '0 0 auto', display: 'grid', placeItems: 'center', width: '0.9rem', height: '0.9rem', animation: 'navbead .55s cubic-bezier(.2,.8,.25,1) 0.72s both' }}><span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'radial-gradient(circle at 32% 26%, #b6d4c2, #5d8a70 58%, #223c2c)', boxShadow: '0 1px 2px rgba(0,0,0,0.65)' }}></span></span>
    </a>
    <a href="/projects" data-r="beadlink" aria-current="page" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.6rem', height: '2.75rem', paddingRight: '0.85rem', transition: 'transform .3s cubic-bezier(.2,.8,.25,1)' }} className="phv1">
      <span style={{ fontFamily: '\'Playfair Display\',serif', fontSize: '0.74rem', fontWeight: '700', letterSpacing: '0.2em', textTransform: 'uppercase', whiteSpace: 'nowrap', color: '#e2909a', animation: 'navlabel .6s cubic-bezier(.2,.8,.25,1) 0.91s both' }}>Projects</span>
      <span aria-hidden="true" style={{ flex: '0 0 auto', display: 'grid', placeItems: 'center', width: '0.9rem', height: '0.9rem', animation: 'navbead .55s cubic-bezier(.2,.8,.25,1) 0.83s both' }}><span style={{ width: '0.72rem', height: '0.72rem', borderRadius: '50%', background: 'radial-gradient(circle at 32% 26%, #e2909a, #a33f4a 56%, #3d1016)', boxShadow: '0 0 11px rgba(226,144,154,0.42), 0 1px 3px rgba(0,0,0,0.65)', animation: 'beadbreathe 4.6s ease-in-out 1.7s infinite' }}></span></span>
    </a>
    <a href="/contact" data-r="beadlink" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.6rem', height: '2.75rem', paddingRight: '0.85rem', transition: 'transform .3s cubic-bezier(.2,.8,.25,1)' }} className="phv1">
      <span style={{ fontFamily: '\'Playfair Display\',serif', fontSize: '0.68rem', fontWeight: '500', letterSpacing: '0.2em', textTransform: 'uppercase', whiteSpace: 'nowrap', color: '#b3a894', animation: 'navlabel .6s cubic-bezier(.2,.8,.25,1) 1.02s both' }}>Contact</span>
      <span aria-hidden="true" style={{ flex: '0 0 auto', display: 'grid', placeItems: 'center', width: '0.9rem', height: '0.9rem', animation: 'navbead .55s cubic-bezier(.2,.8,.25,1) 0.94s both' }}><span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'radial-gradient(circle at 28% 22%, #ffffff, #f2ece0 40%, #c4bcaa 74%, #7d7666)', boxShadow: '0 1px 2px rgba(0,0,0,0.65)' }}></span></span>
    </a>
  </nav>

<div data-plotter style={{ position: 'relative', zIndex: '1', order: '1', flex: '1 1 0', minWidth: '0', padding: 'clamp(1.7rem,4vw,3.6rem) clamp(9.5rem,6.6vw,10.5rem) clamp(3.5rem,6vw,5rem) clamp(4rem,4vw,4.5rem)' }} data-r="page">
  <header style={{ maxWidth: '78rem', margin: '0 0 2.8rem' }}>
    <p style={{ margin: '0', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.66rem', letterSpacing: '0.26em', color: '#b0a08c' }}><span style={{ color: '#7daa76' }}>//</span> projects.drafting_table</p>
    <h1 style={{ margin: '0.5rem 0 0', fontFamily: '\'Playfair Display\',serif', fontSize: 'clamp(2.4rem,4.6vw,3.6rem)', fontWeight: '700', letterSpacing: '-0.02em', lineHeight: '1', color: '#f5efe7' }}>My <span style={{ background: 'linear-gradient(92deg,#e58d55,#f8c398 60%,#b58ce8)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Projects.</span></h1>
    <p style={{ margin: '0.85rem 0 0', maxWidth: '38rem', fontFamily: 'Spectral,serif', fontSize: '1.02rem', lineHeight: '1.7', color: '#ccbba8', textWrap: 'pretty' }}><span data-mark>Four live products</span>, one sheet each — architecture, numbers, and what I’d rebuild.</p>
  </header>


  <div data-r="plotgrid" style={{ display: 'grid', gridTemplateColumns: '11rem 1fr', gap: 'clamp(2rem,4vw,4rem)', maxWidth: '82rem', margin: '0 auto' }}>

    <aside data-r="plotside" style={{ position: 'sticky', top: '2.5rem', alignSelf: 'start', minWidth: '0' }}>
      <p style={{ margin: '0 0 0.35rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.6rem', letterSpacing: '0.26em', color: '#9c8f7c' }}>DRAWER</p>
      <p style={{ margin: '0 0 1.4rem', fontFamily: 'Caveat,cursive', fontSize: '1.15rem', lineHeight: '1.25', color: '#baa792' }}>four sheets, four live products</p>
      <button type="button" data-btn data-i="0" style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: '0.55rem', width: '100%', padding: '0.55rem 0 0.55rem 1.1rem', border: '0', borderTop: '1px solid rgba(229,141,85,0.14)', background: 'none', textAlign: 'left', cursor: 'pointer' }}><span data-tick style={{ position: 'absolute', left: '0', top: '50%', width: '0.6rem', height: '1px', background: '#e58d55', transformOrigin: 'left', transform: 'scaleX(1)' }}></span><span style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.64rem', letterSpacing: '0.1em', color: '#b0a08c' }}>01</span><span data-btn-name style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '1rem', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#f5efe7' }}>Umbrix</span></button>
      <button type="button" data-btn data-i="1" style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: '0.55rem', width: '100%', padding: '0.55rem 0 0.55rem 1.1rem', border: '0', borderTop: '1px solid rgba(229,141,85,0.14)', background: 'none', textAlign: 'left', cursor: 'pointer' }}><span data-tick style={{ position: 'absolute', left: '0', top: '50%', width: '0.6rem', height: '1px', background: '#6fb8ae', transformOrigin: 'left', transform: 'scaleX(0)' }}></span><span style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.64rem', letterSpacing: '0.1em', color: '#b0a08c' }}>02</span><span data-btn-name style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '1rem', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#b0a08c' }}>GetFreeToolsAI</span></button>
      <button type="button" data-btn data-i="2" style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: '0.55rem', width: '100%', padding: '0.55rem 0 0.55rem 1.1rem', border: '0', borderTop: '1px solid rgba(229,141,85,0.14)', background: 'none', textAlign: 'left', cursor: 'pointer' }}><span data-tick style={{ position: 'absolute', left: '0', top: '50%', width: '0.6rem', height: '1px', background: '#b58ce8', transformOrigin: 'left', transform: 'scaleX(0)' }}></span><span style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.64rem', letterSpacing: '0.1em', color: '#b0a08c' }}>03</span><span data-btn-name style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '1rem', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#b0a08c' }}>Veritas Picks</span></button>
      <button type="button" data-btn data-i="3" style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: '0.55rem', width: '100%', padding: '0.55rem 0 0.55rem 1.1rem', border: '0', borderTop: '1px solid rgba(229,141,85,0.14)', borderBottom: '1px solid rgba(229,141,85,0.14)', background: 'none', textAlign: 'left', cursor: 'pointer' }}><span data-tick style={{ position: 'absolute', left: '0', top: '50%', width: '0.6rem', height: '1px', background: '#e5745f', transformOrigin: 'left', transform: 'scaleX(0)' }}></span><span style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.64rem', letterSpacing: '0.1em', color: '#b0a08c' }}>04</span><span data-btn-name style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '1rem', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#b0a08c' }}>Sahayam</span></button>

      <p style={{ margin: '1.8rem 0 0.5rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.6rem', letterSpacing: '0.26em', color: '#9c8f7c' }}>BILL OF MATERIALS</p>
      <p data-stack style={{ margin: '0', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.63rem', lineHeight: '2.05', letterSpacing: '0.03em', color: '#b0a08c' }}>Next.js<br />React<br />TypeScript<br />Tailwind CSS<br />PWA<br />Node.js</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '1.5rem' }}>
        <a data-visit href="https://www.umbrix.in/" target="_blank" rel="noopener" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '0.84rem', fontWeight: '600', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#e58d55', borderBottom: '1.5px solid rgba(229,141,85,0.4)', paddingBottom: '0.15rem', width: 'fit-content' }}>Visit site ↗</a>
        <a data-repo href="#" target="_blank" rel="noopener" style={{ display: 'none', fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '0.84rem', fontWeight: '600', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#b0a08c', borderBottom: '1.5px solid rgba(229,141,85,0.2)', paddingBottom: '0.15rem', width: 'fit-content' }}>Source ↗</a>
        <p data-source-note style={{ display: 'none', margin: '0.15rem 0 0', maxWidth: '13rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.58rem', lineHeight: '1.85', letterSpacing: '0.03em', color: '#8d8272' }}></p>
      </div>
    </aside>

    <main style={{ minWidth: '0' }}>
      <svg data-rule viewBox="0 0 1000 2" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '2px' }}><path data-line d="M0 1 H1000" stroke="#e58d55" strokeWidth="1.4" opacity="0.55" /></svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', margin: '0.7rem 0 1.2rem' }}>
        <p data-slug style={{ margin: '0', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.7rem', letterSpacing: '0.24em', color: '#b0a08c' }}>SHEET 01 · UMBRIX.DWG</p>
        <p data-status style={{ margin: '0', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.7rem', letterSpacing: '0.24em', color: '#e58d55' }}>LIVE · PLOTTED AT 1:1</p>
      </div>

      <svg data-namebox viewBox="0 0 1000 160" preserveAspectRatio="xMinYMid meet" style={{ display: 'block', width: '100%', height: 'auto' }}><defs><linearGradient data-namegrad id="nameGrad" x1="0" y1="0" x2="1" y2="0.35"><stop data-gstop offset="0" stopColor="#f5efe7" /><stop data-gstop offset="0.52" stopColor="#e58d55" /><stop data-gstop offset="1" stopColor="#fbcfa6" /></linearGradient></defs><text data-name x="0" y="126" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '150px', fontWeight: '700', letterSpacing: '0.01em', fill: 'url(#nameGrad)', fillOpacity: '1', stroke: '#e58d55', strokeWidth: '1.1' }}>UMBRIX</text></svg>
      <p data-tag style={{ margin: 'clamp(0.3rem,1.8vw,1.1rem) 0 0', fontFamily: 'Caveat,cursive', fontSize: 'clamp(1.5rem,2.6vw,2rem)', lineHeight: '1.2', color: '#e58d55' }}>Jobs pulled straight from the source, tailored to you.</p>

      <section data-plot style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)', gap: 'clamp(1.8rem,3vw,3rem)', marginTop: '2.6rem' }}>
        <div>
          <p data-sum style={{ margin: '0', fontFamily: 'Spectral,serif', fontSize: '1.04rem', lineHeight: '1.78', color: '#ddd1bd', textWrap: 'pretty' }}>An installable job platform for Indian freshers: listings are pulled on a schedule from Lever, Adzuna and Jooble, passed through a scam filter before they are stored, and every application is tailored to the role by a resume parser and a Groq-backed tailoring engine.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div data-stat style={{ display: 'flex', alignItems: 'baseline', gap: '0.85rem' }}><span data-num style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '2.6rem', fontWeight: '700', lineHeight: '0.9', color: '#e58d55' }}>3</span><span data-lab style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.64rem', lineHeight: '1.6', letterSpacing: '0.08em', color: '#b0a08c' }}>provider APIs ingested</span></div>
          <div data-stat style={{ display: 'flex', alignItems: 'baseline', gap: '0.85rem' }}><span data-num style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '2.6rem', fontWeight: '700', lineHeight: '0.9', color: '#e58d55' }}>0</span><span data-lab style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.64rem', lineHeight: '1.6', letterSpacing: '0.08em', color: '#b0a08c' }}>listings scraped from pages</span></div>
          <div data-stat style={{ display: 'flex', alignItems: 'baseline', gap: '0.85rem' }}><span data-num style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '2.6rem', fontWeight: '700', lineHeight: '0.9', color: '#e58d55' }}>2</span><span data-lab style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.64rem', lineHeight: '1.6', letterSpacing: '0.08em', color: '#b0a08c' }}>sides: seekers and recruiters</span></div>
        </div>
      </section>

      <section data-plot style={{ marginTop: 'clamp(2.6rem,5vw,4rem)' }}>
        <p data-figcap style={{ margin: '0 0 1.4rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.62rem', letterSpacing: '0.26em', color: '#9c8f7c' }}>FIG. 01 — SIGNAL PATH</p>
        <svg data-arch2 viewBox="0 0 1000 672" style={{ display: 'block', width: '100%', height: 'auto', overflow: 'visible' }}>
          <g data-frame>
            <path data-line d="M20 16 H520 V112 H20 Z" fill="none" stroke="rgba(200,187,159,0.2)" strokeWidth="1" />
            <text x="34" y="38" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.22em', fill: '#9c8f7c' }}>CLIENT</text>
          </g>
          <g data-frame>
            <path data-line d="M20 140 H610 V444 H20 Z" fill="none" stroke="rgba(200,187,159,0.2)" strokeWidth="1" />
            <text x="34" y="162" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.22em', fill: '#9c8f7c' }}>VERCEL APP</text>
          </g>
          <g data-frame>
            <path data-line d="M650 16 H990 V112 H650 Z" fill="none" stroke="rgba(200,187,159,0.2)" strokeWidth="1" />
            <text x="664" y="38" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.22em', fill: '#9c8f7c' }}>PROVIDER APIS</text>
          </g>
          <g data-frame>
            <path data-line d="M650 240 H990 V444 H650 Z" fill="none" stroke="rgba(200,187,159,0.2)" strokeWidth="1" />
            <text x="664" y="262" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.22em', fill: '#9c8f7c' }}>CI PIPELINE</text>
          </g>
          <g data-frame>
            <text x="200" y="566" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.22em', fill: '#9c8f7c' }}>STORAGE</text>
          </g>

          <g data-plate>
            <path data-line d="M60 46 H250 V98 H60 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="155" y="80" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Job seeker</text>
          </g>
          <g data-plate>
            <path data-line d="M300 46 H490 V98 H300 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="395" y="80" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Recruiter</text>
          </g>
          <g data-plate>
            <path data-line d="M120 176 H420 V228 H120 Z" fill="none" stroke="rgba(229,141,85,0.8)" strokeWidth="1.4" />
            <text x="270" y="211" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '28px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Installable PWA</text>
            <text x="270" y="248" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '16px', letterSpacing: '0.04em', fill: '#baa792' }}>next.js · service worker</text>
          </g>
          <g data-plate>
            <path data-line d="M120 268 H420 V320 H120 Z" fill="none" stroke="rgba(229,141,85,0.8)" strokeWidth="1.4" />
            <text x="270" y="303" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '28px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>API layer</text>
            <text x="270" y="340" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '16px', letterSpacing: '0.04em', fill: '#baa792' }}>auth · routing · quotas</text>
          </g>
          <g data-plate>
            <path data-line d="M36 376 H196 V428 H36 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="116" y="409" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '21px', fontWeight: '600', letterSpacing: '0.03em', fill: '#e7ddc8' }}>Resume parser</text>
          </g>
          <g data-plate>
            <path data-line d="M216 376 H376 V428 H216 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="296" y="409" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '21px', fontWeight: '600', letterSpacing: '0.03em', fill: '#e7ddc8' }}>Marketplace</text>
          </g>
          <g data-plate>
            <path data-line d="M396 376 H596 V428 H396 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="496" y="409" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '21px', fontWeight: '600', letterSpacing: '0.03em', fill: '#e7ddc8' }}>Tailoring engine</text>
          </g>
          <g data-plate>
            <path data-line d="M396 470 H596 V522 H396 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="496" y="503" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '24px', fontWeight: '600', letterSpacing: '0.03em', fill: '#e7ddc8' }}>Groq</text>
            <text x="496" y="542" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '16px', letterSpacing: '0.04em', fill: '#b0a08c' }}>external · llama inference</text>
          </g>
          <g data-plate>
            <path data-line d="M664 46 H764 V98 H664 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="714" y="79" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '21px', fontWeight: '600', letterSpacing: '0.03em', fill: '#e7ddc8' }}>Lever</text>
          </g>
          <g data-plate>
            <path data-line d="M774 46 H874 V98 H774 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="824" y="79" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '21px', fontWeight: '600', letterSpacing: '0.03em', fill: '#e7ddc8' }}>Adzuna</text>
          </g>
          <g data-plate>
            <path data-line d="M884 46 H984 V98 H884 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="934" y="79" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '21px', fontWeight: '600', letterSpacing: '0.03em', fill: '#e7ddc8' }}>Jooble</text>
          </g>
          <g data-plate>
            <path data-line d="M690 276 H950 V328 H690 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="820" y="311" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Cron job</text>
            <text x="820" y="348" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '16px', letterSpacing: '0.04em', fill: '#baa792' }}>one job per source</text>
          </g>
          <g data-plate>
            <path data-line d="M690 376 H950 V428 H690 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="820" y="411" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Scam filter</text>
          </g>
          <g data-plate>
            <path data-line d="M200 580 H470 V632 H200 Z" fill="none" stroke="rgba(229,141,85,0.8)" strokeWidth="1.4" />
            <text x="335" y="615" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Database</text>
            <text x="335" y="652" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '16px', letterSpacing: '0.04em', fill: '#baa792' }}>listings · profiles · applications</text>
          </g>

          <g data-wire>
            <path data-line d="M155 98 V150 H272 V172" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M270 176 l -6 -10 h 12 Z" fill="rgba(229,141,85,0.75)" />
            <text x="168" y="142" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.06em', fill: '#b0a08c' }}>installs</text>
          </g>
          <g data-wire>
            <path data-line d="M395 98 V150 H274" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
          </g>
          <g data-wire>
            <path data-line d="M270 228 V264" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M270 268 l -6 -10 h 12 Z" fill="rgba(229,141,85,0.75)" />
            <text x="440" y="252" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.06em', fill: '#b0a08c' }}>pwa → api</text>
          </g>
          <g data-wire>
            <path data-line d="M270 320 V352" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
          </g>
          <g data-wire>
            <path data-line d="M116 352 H496" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <text x="505" y="344" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '14px', letterSpacing: '0.06em', fill: '#b0a08c' }}>api → services</text>
          </g>
          <g data-wire>
            <path data-line d="M116 352 V372" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M116 376 l -6 -10 h 12 Z" fill="rgba(229,141,85,0.75)" />
          </g>
          <g data-wire>
            <path data-line d="M296 352 V372" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M296 376 l -6 -10 h 12 Z" fill="rgba(229,141,85,0.75)" />
          </g>
          <g data-wire>
            <path data-line d="M496 352 V372" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M496 376 l -6 -10 h 12 Z" fill="rgba(229,141,85,0.75)" />
          </g>
          <g data-wire>
            <path data-line d="M496 428 V466" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M496 470 l -6 -10 h 12 Z" fill="rgba(229,141,85,0.75)" />
          </g>
          <g data-wire>
            <path data-line d="M820 276 V120" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <text x="836" y="142" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.06em', fill: '#b0a08c' }}>pull · schedule</text>
          </g>
          <g data-wire>
            <path data-line d="M714 120 H934" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
          </g>
          <g data-wire>
            <path data-line d="M714 120 V104" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M714 98 l -6 10 h 12 Z" fill="rgba(229,141,85,0.75)" />
          </g>
          <g data-wire>
            <path data-line d="M824 120 V104" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M824 98 l -6 10 h 12 Z" fill="rgba(229,141,85,0.75)" />
          </g>
          <g data-wire>
            <path data-line d="M934 120 V104" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M934 98 l -6 10 h 12 Z" fill="rgba(229,141,85,0.75)" />
          </g>
          <g data-wire>
            <path data-line d="M820 328 V370" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M820 376 l -6 -10 h 12 Z" fill="rgba(229,141,85,0.75)" />
          </g>
          <g data-wire>
            <path data-line d="M420 294 H630 V550 H335 V576" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M335 580 l -6 -10 h 12 Z" fill="rgba(229,141,85,0.75)" />
            <text x="640" y="422" textAnchor="middle" transform="rotate(-90 640 422)" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.06em', fill: '#b0a08c' }}>api → db</text>
          </g>
          <g data-wire>
            <path data-line d="M690 402 H660 V606 H478" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M470 606 l 10 -6 v 12 Z" fill="rgba(229,141,85,0.75)" />
            <text x="566" y="598" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.06em', fill: '#b0a08c' }}>insert</text>
          </g>
        </svg>
        <svg data-arch3 viewBox="0 0 1000 700" style={{ display: 'none', width: '100%', height: 'auto', overflow: 'visible' }}>
          <g data-frame>
            <path data-line d="M20 16 H470 V150 H20 Z" fill="none" stroke="rgba(200,187,159,0.2)" strokeWidth="1" />
            <text x="34" y="38" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.22em', fill: '#9c8f7c' }}>CLIENT</text>
          </g>
          <g data-frame>
            <path data-line d="M20 200 H470 V470 H20 Z" fill="none" stroke="rgba(111,196,184,0.34)" strokeWidth="1" />
            <text x="34" y="222" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.22em', fill: '#9c8f7c' }}>BROWSER COMPUTE · WASM</text>
          </g>
          <g data-frame>
            <path data-line d="M530 16 H980 V300 H530 Z" fill="none" stroke="rgba(200,187,159,0.2)" strokeWidth="1" />
            <text x="544" y="38" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.22em', fill: '#9c8f7c' }}>VERCEL APP</text>
          </g>
          <g data-frame>
            <path data-line d="M530 350 H980 V470 H530 Z" fill="none" stroke="rgba(200,187,159,0.2)" strokeWidth="1" />
            <text x="544" y="372" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.22em', fill: '#9c8f7c' }}>ANALYTICS</text>
          </g>
          <g data-frame>
            <path data-line d="M20 530 H470 V650 H20 Z" fill="none" stroke="rgba(200,187,159,0.2)" strokeWidth="1" />
            <text x="34" y="552" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.22em', fill: '#9c8f7c' }}>CI PIPELINE</text>
          </g>

          <g data-plate>
            <path data-line d="M60 56 H240 V108 H60 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="150" y="90" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Visitor</text>
          </g>
          <g data-plate>
            <path data-line d="M280 56 H450 V108 H280 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="365" y="90" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '24px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Service worker</text>
            <text x="365" y="132" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.04em', fill: '#b0a08c' }}>offline shell · cache</text>
          </g>
          <g data-plate>
            <path data-line d="M50 244 H240 V296 H50 Z" fill="none" stroke="rgba(111,196,184,0.8)" strokeWidth="1.4" />
            <text x="145" y="278" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Video engine</text>
            <text x="145" y="318" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.04em', fill: '#b0a08c' }}>ffmpeg.wasm</text>
          </g>
          <g data-plate>
            <path data-line d="M260 244 H450 V296 H260 Z" fill="none" stroke="rgba(111,196,184,0.8)" strokeWidth="1.4" />
            <text x="355" y="278" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>PDF engine</text>
            <text x="355" y="318" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.04em', fill: '#b0a08c' }}>pdf-lib · worker</text>
          </g>
          <g data-plate>
            <path data-line d="M50 350 H240 V402 H50 Z" fill="none" stroke="rgba(111,196,184,0.8)" strokeWidth="1.4" />
            <text x="145" y="384" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Image engine</text>
            <text x="145" y="424" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.04em', fill: '#b0a08c' }}>canvas · codecs</text>
          </g>
          <g data-plate>
            <path data-line d="M260 350 H450 V402 H260 Z" fill="none" stroke="rgba(111,196,184,0.8)" strokeWidth="1.4" />
            <text x="355" y="384" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Viral engine</text>
            <text x="355" y="424" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.04em', fill: '#b0a08c' }}>on-device render</text>
          </g>
          <g data-plate>
            <path data-line d="M570 60 H940 V112 H570 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="755" y="94" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Edge middleware</text>
            <text x="755" y="134" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.04em', fill: '#b0a08c' }}>routing · headers</text>
          </g>
          <g data-plate>
            <path data-line d="M570 190 H940 V242 H570 Z" fill="none" stroke="rgba(111,196,184,0.8)" strokeWidth="1.4" />
            <text x="755" y="224" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Next.js app router</text>
            <text x="755" y="266" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.04em', fill: '#b0a08c' }}>static tool pages · split bundles</text>
          </g>
          <g data-plate>
            <path data-line d="M560 400 H740 V452 H560 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="650" y="433" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '21px', fontWeight: '600', letterSpacing: '0.03em', fill: '#e7ddc8' }}>Vercel analytics</text>
          </g>
          <g data-plate>
            <path data-line d="M770 400 H950 V452 H770 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="860" y="433" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '21px', fontWeight: '600', letterSpacing: '0.03em', fill: '#e7ddc8' }}>Clarity</text>
          </g>
          <g data-plate>
            <path data-line d="M50 580 H230 V632 H50 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="140" y="613" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '21px', fontWeight: '600', letterSpacing: '0.03em', fill: '#e7ddc8' }}>GitHub Actions</text>
          </g>
          <g data-plate>
            <path data-line d="M260 580 H440 V632 H260 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="350" y="613" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '21px', fontWeight: '600', letterSpacing: '0.03em', fill: '#e7ddc8' }}>Vitest suite</text>
          </g>

          <g data-wire>
            <path data-line d="M240 82 H272" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M280 82 l -10 -6 v 12 Z" fill="rgba(111,196,184,0.85)" />
          </g>
          <g data-wire>
            <path data-line d="M450 82 H562" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M570 82 l -10 -6 v 12 Z" fill="rgba(111,196,184,0.85)" />
            <text x="506" y="70" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.06em', fill: '#b0a08c' }}>request</text>
          </g>
          <g data-wire>
            <path data-line d="M755 112 V182" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M755 190 l -6 -10 h 12 Z" fill="rgba(111,196,184,0.85)" />
          </g>
          <g data-wire>
            <path data-line d="M570 216 H500 V236 H355" fill="none" stroke="rgba(111,196,184,0.55)" strokeWidth="1.2" />
            <path data-arrow d="M355 244 l -6 -10 h 12 Z" fill="rgba(111,196,184,0.85)" />
            <text x="496" y="164" textAnchor="end" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.06em', fill: '#b0a08c' }}>engine loaded on demand</text>
          </g>
          <g data-wire>
            <path data-line d="M150 108 V236" fill="none" stroke="rgba(111,196,184,0.55)" strokeWidth="1.2" />
            <path data-arrow d="M150 244 l -6 -10 h 12 Z" fill="rgba(111,196,184,0.85)" />
            <text x="136" y="182" textAnchor="middle" transform="rotate(-90 136 182)" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.06em', fill: '#b0a08c' }}>file stays local</text>
          </g>
          <g data-wire>
            <path data-line d="M450 270 H492 V130 H200 V116" fill="none" stroke="rgba(111,196,184,0.55)" strokeWidth="1.2" />
            <path data-arrow d="M200 108 l -6 10 h 12 Z" fill="rgba(111,196,184,0.85)" />
            <text x="506" y="200" textAnchor="middle" transform="rotate(-90 506 200)" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.06em', fill: '#b0a08c' }}>result — never uploaded</text>
          </g>
          <g data-wire>
            <path data-line d="M650 242 V392" fill="none" stroke="rgba(200,187,159,0.26)" strokeWidth="1" />
            <path data-arrow d="M650 400 l -6 -10 h 12 Z" fill="rgba(200,187,159,0.5)" />
            <text x="638" y="330" textAnchor="end" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.06em', fill: '#b0a08c' }}>page events only</text>
          </g>
          <g data-wire>
            <path data-line d="M860 242 V392" fill="none" stroke="rgba(200,187,159,0.26)" strokeWidth="1" />
            <path data-arrow d="M860 400 l -6 -10 h 12 Z" fill="rgba(200,187,159,0.5)" />
          </g>
          <g data-wire>
            <path data-line d="M230 606 H252" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M260 606 l -10 -6 v 12 Z" fill="rgba(111,196,184,0.85)" />
          </g>
          <g data-wire>
            <path data-line d="M140 580 V510 H994 V190 H988" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M980 190 l 10 -6 v 12 Z" fill="rgba(111,196,184,0.85)" />
            <text x="520" y="500" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.06em', fill: '#b0a08c' }}>deploy on green</text>
          </g>
        </svg>
        <svg data-arch4 viewBox="0 0 1000 700" style={{ display: 'none', width: '100%', height: 'auto', overflow: 'visible' }}>
          <g data-frame>
            <path data-line d="M530 16 H980 V150 H530 Z" fill="none" stroke="rgba(200,187,159,0.2)" strokeWidth="1" />
            <text x="544" y="38" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.22em', fill: '#9c8f7c' }}>CLIENT</text>
          </g>
          <g data-frame>
            <path data-line d="M300 300 H980 V660 H300 Z" fill="none" stroke="rgba(239,106,90,0.3)" strokeWidth="1" />
            <text x="314" y="322" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.22em', fill: '#9c8f7c' }}>BACKEND</text>
          </g>
          <g data-frame>
            <path data-line d="M20 380 H270 V660 H20 Z" fill="none" stroke="rgba(200,187,159,0.2)" strokeWidth="1" />
            <text x="34" y="402" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.22em', fill: '#9c8f7c' }}>STORAGE</text>
          </g>

          <g data-plate>
            <path data-line d="M570 56 H740 V108 H570 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="655" y="90" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Donor</text>
          </g>
          <g data-plate>
            <path data-line d="M770 56 H940 V108 H770 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="855" y="90" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Hospital</text>
          </g>
          <g data-plate>
            <path data-line d="M640 190 H870 V242 H640 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="755" y="224" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Frontend</text>
            <text x="755" y="266" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.04em', fill: '#b0a08c' }}>request · live alerts</text>
          </g>
          <g data-plate>
            <path data-line d="M640 348 H870 V400 H640 Z" fill="none" stroke="rgba(239,106,90,0.8)" strokeWidth="1.4" />
            <text x="755" y="382" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>API</text>
          </g>
          <g data-plate>
            <path data-line d="M330 452 H580 V504 H330 Z" fill="none" stroke="rgba(239,106,90,0.8)" strokeWidth="1.4" />
            <text x="455" y="486" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Matching engine</text>
            <text x="455" y="526" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.04em', fill: '#b0a08c' }}>group · eligibility · distance</text>
          </g>
          <g data-plate>
            <path data-line d="M640 452 H870 V504 H640 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="755" y="486" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '24px', fontWeight: '600', letterSpacing: '0.03em', fill: '#e7ddc8' }}>Telemetry</text>
          </g>
          <g data-plate>
            <path data-line d="M330 566 H580 V618 H330 Z" fill="none" stroke="rgba(239,106,90,0.8)" strokeWidth="1.4" />
            <text x="455" y="600" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Routing engine</text>
            <text x="455" y="640" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.04em', fill: '#b0a08c' }}>targeted pings, not a broadcast</text>
          </g>
          <g data-plate>
            <path data-line d="M640 566 H870 V618 H640 Z" fill="none" stroke="rgba(239,106,90,0.8)" strokeWidth="1.4" />
            <text x="755" y="600" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Escalation</text>
            <text x="755" y="640" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.04em', fill: '#b0a08c' }}>widen the radius on a timer</text>
          </g>
          <g data-plate>
            <path data-line d="M40 430 H250 V482 H40 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="145" y="464" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '24px', fontWeight: '600', letterSpacing: '0.03em', fill: '#e7ddc8' }}>Donor database</text>
          </g>
          <g data-plate>
            <path data-line d="M40 548 H250 V600 H40 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="145" y="582" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '22px', fontWeight: '600', letterSpacing: '0.03em', fill: '#e7ddc8' }}>Metadata bucket</text>
          </g>

          <g data-wire>
            <path data-line d="M655 108 V160 H755 V182" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M755 190 l -6 -10 h 12 Z" fill="rgba(239,106,90,0.85)" />
          </g>
          <g data-wire>
            <path data-line d="M855 108 V160 H757" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <text x="940" y="140" textAnchor="end" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.06em', fill: '#b0a08c' }}>raises a request</text>
          </g>
          <g data-wire>
            <path data-line d="M755 242 V340" fill="none" stroke="rgba(239,106,90,0.55)" strokeWidth="1.2" />
            <path data-arrow d="M755 348 l -6 -10 h 12 Z" fill="rgba(239,106,90,0.85)" />
            <text x="775" y="298" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.06em', fill: '#b0a08c' }}>REST + WS</text>
          </g>
          <g data-plate>
            <path data-line d="M886 452 H972 V504 H886 Z" fill="none" stroke="rgba(239,106,90,0.8)" strokeWidth="1.4" />
            <text x="929" y="484" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '19px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>CronLock</text>
          </g>
          <g data-wire>
            <path data-line d="M929 504 V558" fill="none" stroke="rgba(239,106,90,0.55)" strokeWidth="1.2" />
            <path data-arrow d="M929 566 l -6 -10 h 12 Z" fill="rgba(239,106,90,0.85)" />
            <text x="972" y="540" textAnchor="end" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '14px', letterSpacing: '0.06em', fill: '#b0a08c' }}>one instance escalates</text>
          </g>
          <g data-wire>
            <path data-line d="M700 400 V426 H455 V444" fill="none" stroke="rgba(239,106,90,0.55)" strokeWidth="1.2" />
            <path data-arrow d="M455 452 l -6 -10 h 12 Z" fill="rgba(239,106,90,0.85)" />
            <text x="466" y="418" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.06em', fill: '#b0a08c' }}>who can give, and how near</text>
          </g>
          <g data-wire>
            <path data-line d="M810 400 V444" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M810 452 l -6 -10 h 12 Z" fill="rgba(200,187,159,0.5)" />
          </g>
          <g data-wire>
            <path data-line d="M455 504 V558" fill="none" stroke="rgba(239,106,90,0.55)" strokeWidth="1.2" />
            <path data-arrow d="M455 566 l -6 -10 h 12 Z" fill="rgba(239,106,90,0.85)" />
          </g>
          <g data-wire>
            <path data-line d="M580 592 H632" fill="none" stroke="rgba(239,106,90,0.55)" strokeWidth="1.2" />
            <path data-arrow d="M640 592 l -10 -6 v 12 Z" fill="rgba(239,106,90,0.85)" />
            <text x="606" y="556" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '14px', letterSpacing: '0.06em', fill: '#b0a08c' }}>no confirm</text>
          </g>
          <g data-wire>
            <path data-line d="M640 374 H290 V410 H145 V422" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M145 430 l -6 -10 h 12 Z" fill="rgba(239,106,90,0.85)" />
            <text x="316" y="392" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.06em', fill: '#b0a08c' }}>writes</text>
          </g>
          <g data-wire>
            <path data-line d="M290 410 V574 H258" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M250 574 l 10 -6 v 12 Z" fill="rgba(200,187,159,0.5)" />
            <text x="284" y="534" textAnchor="end" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.06em', fill: '#b0a08c' }}>documents</text>
          </g>
          <g data-wire>
            <path data-line d="M330 478 H262" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M254 478 l 10 -6 v 12 Z" fill="rgba(239,106,90,0.85)" />
            <text x="296" y="466" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.06em', fill: '#ef6a5a' }}>$geoNear</text>
          </g>
        </svg>
        <svg data-arch5 viewBox="0 0 1000 700" style={{ display: 'none', width: '100%', height: 'auto', overflow: 'visible' }}>
          <g data-frame>
            <path data-line d="M530 16 H980 V150 H530 Z" fill="none" stroke="rgba(200,187,159,0.2)" strokeWidth="1" />
            <text x="544" y="38" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.22em', fill: '#9c8f7c' }}>CLIENT</text>
          </g>
          <g data-frame>
            <path data-line d="M300 300 H980 V660 H300 Z" fill="none" stroke="rgba(185,139,224,0.3)" strokeWidth="1" />
            <text x="314" y="322" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.22em', fill: '#9c8f7c' }}>BUILD</text>
          </g>
          <g data-frame>
            <path data-line d="M20 380 H270 V660 H20 Z" fill="none" stroke="rgba(200,187,159,0.2)" strokeWidth="1" />
            <text x="34" y="402" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.22em', fill: '#9c8f7c' }}>SOURCE</text>
          </g>

          <g data-plate>
            <path data-line d="M570 56 H740 V108 H570 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="655" y="90" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Reader</text>
          </g>
          <g data-plate>
            <path data-line d="M770 56 H940 V108 H770 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="855" y="90" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Static page</text>
          </g>

          <g data-plate>
            <path data-line d="M640 348 H870 V400 H640 Z" fill="none" stroke="rgba(185,139,224,0.8)" strokeWidth="1.4" />
            <text x="755" y="382" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Static routes</text>
          </g>
          <g data-plate>
            <path data-line d="M330 452 H580 V504 H330 Z" fill="none" stroke="rgba(185,139,224,0.8)" strokeWidth="1.4" />
            <text x="455" y="486" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Content layer</text>
            <text x="455" y="526" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.04em', fill: '#b0a08c' }}>one ProductItem schema</text>
          </g>
          <g data-plate>
            <path data-line d="M640 452 H870 V504 H640 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="755" y="486" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '24px', fontWeight: '600', letterSpacing: '0.03em', fill: '#e7ddc8' }}>Pin metadata</text>
            <text x="755" y="526" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.04em', fill: '#b0a08c' }}>5 variants per guide</text>
          </g>
          <g data-plate>
            <path data-line d="M330 566 H580 V618 H330 Z" fill="none" stroke="rgba(185,139,224,0.8)" strokeWidth="1.4" />
            <text x="455" y="600" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>gray-matter</text>
            <text x="455" y="640" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.04em', fill: '#b0a08c' }}>typed frontmatter, parsed once</text>
          </g>
          <g data-plate>
            <path data-line d="M640 566 H870 V618 H640 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="755" y="600" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '24px', fontWeight: '600', letterSpacing: '0.03em', fill: '#e7ddc8' }}>Search index</text>
            <text x="755" y="640" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.04em', fill: '#b0a08c' }}>built, not queried</text>
          </g>

          <g data-plate>
            <path data-line d="M40 430 H250 V482 H40 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="145" y="464" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '24px', fontWeight: '600', letterSpacing: '0.03em', fill: '#e7ddc8' }}>MDX guides</text>
          </g>
          <g data-plate>
            <path data-line d="M40 548 H250 V600 H40 Z" fill="none" stroke="rgba(200,187,159,0.42)" strokeWidth="1.2" />
            <text x="145" y="582" textAnchor="middle" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '22px', fontWeight: '600', letterSpacing: '0.03em', fill: '#e7ddc8' }}>18 categories</text>
          </g>

          <g data-wire>
            <path data-line d="M250 456 H290 V586 H322" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M330 586 l -10 -6 v 12 Z" fill="rgba(185,139,224,0.85)" />
            <text x="292" y="446" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.06em', fill: '#9c8f7c' }}>authored</text>
          </g>
          <g data-wire>
            <path data-line d="M250 574 H290 V600 H322" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M330 600 l -10 -6 v 12 Z" fill="rgba(185,139,224,0.85)" />
          </g>
          <g data-wire>
            <path data-line d="M455 566 V520" fill="none" stroke="rgba(185,139,224,0.55)" strokeWidth="1.1" />
            <path data-arrow d="M455 504 l -6 10 h 12 Z" fill="rgba(185,139,224,0.85)" />
            <text x="474" y="546" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.06em', fill: '#9c8f7c' }}>validate</text>
          </g>
          <g data-wire>
            <path data-line d="M580 478 H624" fill="none" stroke="rgba(185,139,224,0.55)" strokeWidth="1.1" />
            <path data-arrow d="M640 478 l -10 -6 v 12 Z" fill="rgba(185,139,224,0.85)" />
            <text x="610" y="466" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.06em', fill: '#9c8f7c' }}>derive</text>
          </g>
          <g data-wire>
            <path data-line d="M540 504 V546 H624 V566" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M624 582 l -6 -10 h 12 Z" fill="rgba(200,187,159,0.6)" transform="translate(0,-16) rotate(180 624 574)" />
          </g>
          <g data-wire>
            <path data-line d="M755 452 V416" fill="none" stroke="rgba(185,139,224,0.55)" strokeWidth="1.1" />
            <path data-arrow d="M755 400 l -6 10 h 12 Z" fill="rgba(185,139,224,0.85)" transform="rotate(180 755 405)" />
            <text x="774" y="436" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.06em', fill: '#9c8f7c' }}>prerender</text>
          </g>
          <g data-wire>
            <path data-line d="M755 348 V210 H855 V124" fill="none" stroke="rgba(185,139,224,0.55)" strokeWidth="1.1" />
            <path data-arrow d="M855 108 l -6 10 h 12 Z" fill="rgba(185,139,224,0.85)" transform="rotate(180 855 113)" />
            <text x="770" y="196" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.06em', fill: '#9c8f7c' }}>deployed as files</text>
          </g>
          <g data-wire>
            <path data-line d="M770 82 H756" fill="none" stroke="rgba(200,187,159,0.4)" strokeWidth="1.1" />
            <path data-arrow d="M740 82 l 10 -6 v 12 Z" fill="rgba(185,139,224,0.85)" />
            <text x="655" y="134" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '15px', letterSpacing: '0.06em', fill: '#b98be0' }}>0 client fetches</text>
          </g>
        </svg>

        <svg data-arch viewBox="0 0 1000 575" style={{ display: 'none', width: '100%', height: 'auto', overflow: 'visible' }}>
          <path data-line d="M40 150 H960" stroke="#e58d55" strokeWidth="1.4" />
          <path data-line d="M40 128 V172" stroke="#b0a08c" strokeWidth="1" opacity="0.4" />
          <path data-line d="M960 128 V172" stroke="#b0a08c" strokeWidth="1" opacity="0.4" />
          <circle data-dot cx="40" cy="150" r="4" fill="#e58d55" /><circle data-dot cx="320" cy="150" r="4" fill="#e58d55" /><circle data-dot cx="614" cy="150" r="4" fill="#e58d55" /><circle data-dot cx="960" cy="150" r="4" fill="#e58d55" />
          <text data-node x="40" y="126" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Job seeker</text>
          <text data-sub x="40" y="98" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '18px', letterSpacing: '0.04em', fill: '#baa792' }}>installs the PWA</text>
          <text data-node x="320" y="126" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Installable PWA</text>
          <text data-sub x="320" y="98" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '18px', letterSpacing: '0.04em', fill: '#baa792' }}>one surface, both sides</text>
          <text data-node x="614" y="126" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>API layer</text>
          <text data-sub x="614" y="98" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '18px', letterSpacing: '0.04em', fill: '#baa792' }}>auth · routing · quotas</text>
          <text data-node x="960" y="126" textAnchor="end" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Database</text>
          <text data-sub x="960" y="98" textAnchor="end" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '18px', letterSpacing: '0.04em', fill: '#baa792' }}>listings · profiles · applications</text>
          <text data-wirelab x="176" y="142" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '17px', letterSpacing: '0.08em', fill: '#baa792' }}>pwa install</text>
          <text data-wirelab x="466" y="142" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '17px', letterSpacing: '0.08em', fill: '#baa792' }}>pwa → api</text>
          <text data-wirelab x="790" y="142" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '17px', letterSpacing: '0.08em', fill: '#baa792' }}>api → db</text>

          <g data-hang>
            <path data-line d="M180 150 V240" stroke="#b0a08c" strokeWidth="1.1" opacity="0.65" />
            <text data-side x="180" y="262" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '23px', fontWeight: '600', letterSpacing: '0.03em', fill: '#ddd1bd' }}>Resume parser</text>
            <text data-sidesub x="180" y="288" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '17px', letterSpacing: '0.04em', fill: '#b0a08c' }}>cv → structured fields</text>
          </g>
          <g data-hang>
            <path data-line d="M470 150 V240" stroke="#b0a08c" strokeWidth="1.1" opacity="0.65" />
            <text data-side x="470" y="262" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '23px', fontWeight: '600', letterSpacing: '0.03em', fill: '#ddd1bd' }}>Marketplace</text>
            <text data-sidesub x="470" y="288" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '17px', letterSpacing: '0.04em', fill: '#b0a08c' }}>listings · applications</text>
          </g>
          <g data-hang>
            <path data-line d="M760 150 V240" stroke="#b0a08c" strokeWidth="1.1" opacity="0.65" />
            <text data-side x="760" y="262" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '23px', fontWeight: '600', letterSpacing: '0.03em', fill: '#ddd1bd' }}>Tailoring engine</text>
            <text data-sidesub x="760" y="288" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '17px', letterSpacing: '0.04em', fill: '#b0a08c' }}>per-role rewrite</text>
          </g>
          <g data-deepgrp>
            <path data-line d="M760 302 V346" stroke="#b0a08c" strokeWidth="1" opacity="0.5" />
            <text data-side x="760" y="370" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '21px', fontWeight: '600', letterSpacing: '0.03em', fill: '#c8bb9f' }}>Groq</text>
            <text data-sidesub x="760" y="394" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '16px', letterSpacing: '0.04em', fill: '#7d6f55' }}>llama inference</text>
          </g>

          <g data-rail2>
            <path data-line d="M40 520 H960" stroke="#b0a08c" strokeWidth="1.2" opacity="0.75" />
            <path data-line d="M960 520 V160" stroke="#b0a08c" strokeWidth="1" opacity="0.42" />
            <path data-line d="M40 502 V538" stroke="#b0a08c" strokeWidth="1" opacity="0.4" />
            <circle data-dot cx="40" cy="520" r="4" fill="#e58d55" /><circle data-dot cx="400" cy="520" r="4" fill="#e58d55" /><circle data-dot cx="700" cy="520" r="4" fill="#e58d55" />
            <text data-node x="40" y="496" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Lever · Adzuna · Jooble</text>
            <text data-sub x="40" y="468" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '18px', letterSpacing: '0.04em', fill: '#baa792' }}>three provider apis</text>
            <text data-node x="400" y="496" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Cron job</text>
            <text data-sub x="400" y="468" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '18px', letterSpacing: '0.04em', fill: '#baa792' }}>one job per source</text>
            <text data-node x="700" y="496" style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '26px', fontWeight: '600', letterSpacing: '0.03em', fill: '#f5efe7' }}>Scam filter</text>
            <text data-sub x="700" y="468" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '18px', letterSpacing: '0.04em', fill: '#baa792' }}>runs before the insert</text>
            <text data-wirelab x="220" y="512" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '17px', letterSpacing: '0.08em', fill: '#baa792' }}>pull · schedule</text>
            <text data-wirelab x="550" y="512" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '17px', letterSpacing: '0.08em', fill: '#baa792' }}>raw listings</text>
            <text data-wirelab x="830" y="512" textAnchor="middle" style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '17px', letterSpacing: '0.08em', fill: '#baa792' }}>insert</text>
          </g>
        </svg>
      </section>

      <section data-plot style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,15rem),1fr))', gap: 'clamp(1.6rem,3vw,2.6rem)', marginTop: 'clamp(2.6rem,5vw,4rem)' }}>
        <div><span data-grow style={{ display: 'block', height: '2px', background: '#e58d55', transformOrigin: 'left' }}></span><p style={{ margin: '0.75rem 0 0.5rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.6rem', letterSpacing: '0.24em', color: '#b0a08c' }}>WHAT FAILED</p><p data-fail style={{ margin: '0', fontFamily: 'Spectral,serif', fontSize: '0.97rem', lineHeight: '1.75', color: '#ddd1bd', textWrap: 'pretty' }}>Scraping listing pages. Every layout change broke the parser, duplicates piled up across sources, and I was storing junk that a student would have to sift through.</p></div>
        <div><span data-grow style={{ display: 'block', height: '2px', background: '#e58d55', transformOrigin: 'left' }}></span><p style={{ margin: '0.75rem 0 0.5rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.6rem', letterSpacing: '0.24em', color: '#b0a08c' }}>WHAT I CHANGED</p><p data-change style={{ margin: '0', fontFamily: 'Spectral,serif', fontSize: '0.97rem', lineHeight: '1.75', color: '#ddd1bd', textWrap: 'pretty' }}>I moved to provider APIs with a scheduled job per source, so listings are structured on arrival and the scam filter runs before the insert rather than after.</p></div>
        <div><span data-grow style={{ display: 'block', height: '2px', background: '#e58d55', transformOrigin: 'left' }}></span><p style={{ margin: '0.75rem 0 0.5rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.6rem', letterSpacing: '0.24em', color: '#b0a08c' }}>WHAT IT TAUGHT ME</p><p data-learn style={{ margin: '0', fontFamily: 'Spectral,serif', fontSize: '0.97rem', lineHeight: '1.75', color: '#ddd1bd', textWrap: 'pretty' }}>The boring layer is where the trust lives. A filter that runs before the write did more for output quality than any prompt I tried.</p></div>
      </section>

      <section data-plot style={{ marginTop: 'clamp(2.6rem,5vw,4rem)' }}>
        <p style={{ margin: '0 0 1.3rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.62rem', letterSpacing: '0.26em', color: '#9c8f7c' }}>DECISION LOG</p>
        <div data-dec style={{ display: 'grid', gridTemplateColumns: '2.6rem minmax(0,13rem) minmax(0,1fr)', gap: '0.9rem', alignItems: 'baseline', padding: '0.85rem 0', borderTop: '1px solid rgba(229,141,85,0.14)' }}><span style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.62rem', letterSpacing: '0.1em', color: '#9c8f7c' }}>01</span><span data-dec-t style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '1rem', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#e58d55' }}>Apis, not scrapers</span><span data-dec-b style={{ fontFamily: 'Spectral,serif', fontSize: '0.95rem', lineHeight: '1.7', color: '#c8bb9f', textWrap: 'pretty' }}>Lever, Adzuna and Jooble return structured listings. A layout change can no longer break ingestion.</span></div>
        <div data-dec style={{ display: 'grid', gridTemplateColumns: '2.6rem minmax(0,13rem) minmax(0,1fr)', gap: '0.9rem', alignItems: 'baseline', padding: '0.85rem 0', borderTop: '1px solid rgba(229,141,85,0.14)' }}><span style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.62rem', letterSpacing: '0.1em', color: '#9c8f7c' }}>02</span><span data-dec-t style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '1rem', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#e58d55' }}>Filter before write</span><span data-dec-b style={{ fontFamily: 'Spectral,serif', fontSize: '0.95rem', lineHeight: '1.7', color: '#c8bb9f', textWrap: 'pretty' }}>The scam filter sits between the cron and the database, so a bad listing never reaches a student.</span></div>
        <div data-dec style={{ display: 'grid', gridTemplateColumns: '2.6rem minmax(0,13rem) minmax(0,1fr)', gap: '0.9rem', alignItems: 'baseline', padding: '0.85rem 0', borderTop: '1px solid rgba(229,141,85,0.14)' }}><span style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.62rem', letterSpacing: '0.1em', color: '#9c8f7c' }}>03</span><span data-dec-t style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '1rem', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#e58d55' }}>Parse, then tailor</span><span data-dec-b style={{ fontFamily: 'Spectral,serif', fontSize: '0.95rem', lineHeight: '1.7', color: '#c8bb9f', textWrap: 'pretty' }}>The resume parser hands the model structured fields, which is what stops it inventing experience.</span></div>
        <div data-dec style={{ display: 'grid', gridTemplateColumns: '2.6rem minmax(0,13rem) minmax(0,1fr)', gap: '0.9rem', alignItems: 'baseline', padding: '0.85rem 0', borderTop: '1px solid rgba(229,141,85,0.14)', borderBottom: '1px solid rgba(229,141,85,0.14)' }}><span style={{ fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.62rem', letterSpacing: '0.1em', color: '#9c8f7c' }}>04</span><span data-dec-t style={{ fontFamily: '\'Saira Condensed\',sans-serif', fontSize: '1rem', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#e58d55' }}>One api, two audiences</span><span data-dec-b style={{ fontFamily: 'Spectral,serif', fontSize: '0.95rem', lineHeight: '1.7', color: '#c8bb9f', textWrap: 'pretty' }}>Seekers and recruiters hit the same API surface through the same installable PWA.</span></div>
      </section>

      <section data-plot style={{ marginTop: 'clamp(2.6rem,5vw,4rem)' }}>
        <p style={{ margin: '0 0 1.3rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.62rem', letterSpacing: '0.26em', color: '#9c8f7c' }}>BUILD TRACK</p>
        <span data-grow style={{ display: 'block', height: '1px', background: 'rgba(229,141,85,0.35)', transformOrigin: 'left' }}></span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,9.5rem),1fr))', gap: '1.4rem 1.6rem', marginTop: '0' }}>
          <div style={{ position: 'relative', minWidth: '0', paddingTop: '1.15rem' }}>
            <span data-grow style={{ position: 'absolute', top: '0', left: '0', width: '1px', height: '0.75rem', background: '#e58d55', transformOrigin: 'top' }}></span>
            <p data-step-n style={{ margin: '0 0 0.35rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.6rem', letterSpacing: '0.18em', color: '#e58d55' }}>STEP 01</p>
            <p data-step-t style={{ margin: '0', fontFamily: 'Spectral,serif', fontSize: '0.9rem', lineHeight: '1.6', color: '#c8bb9f', textWrap: 'pretty' }}>Provider integrations: Lever, Adzuna, Jooble</p>
          </div>
          <div style={{ position: 'relative', minWidth: '0', paddingTop: '1.15rem' }}>
            <span data-grow style={{ position: 'absolute', top: '0', left: '0', width: '1px', height: '0.75rem', background: '#e58d55', transformOrigin: 'top' }}></span>
            <p data-step-n style={{ margin: '0 0 0.35rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.6rem', letterSpacing: '0.18em', color: '#e58d55' }}>STEP 02</p>
            <p data-step-t style={{ margin: '0', fontFamily: 'Spectral,serif', fontSize: '0.9rem', lineHeight: '1.6', color: '#c8bb9f', textWrap: 'pretty' }}>Scheduled ingestion with the filter before insert</p>
          </div>
          <div style={{ position: 'relative', minWidth: '0', paddingTop: '1.15rem' }}>
            <span data-grow style={{ position: 'absolute', top: '0', left: '0', width: '1px', height: '0.75rem', background: '#e58d55', transformOrigin: 'top' }}></span>
            <p data-step-n style={{ margin: '0 0 0.35rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.6rem', letterSpacing: '0.18em', color: '#e58d55' }}>STEP 03</p>
            <p data-step-t style={{ margin: '0', fontFamily: 'Spectral,serif', fontSize: '0.9rem', lineHeight: '1.6', color: '#c8bb9f', textWrap: 'pretty' }}>Resume parser into structured fields</p>
          </div>
          <div style={{ position: 'relative', minWidth: '0', paddingTop: '1.15rem' }}>
            <span data-grow style={{ position: 'absolute', top: '0', left: '0', width: '1px', height: '0.75rem', background: '#e58d55', transformOrigin: 'top' }}></span>
            <p data-step-n style={{ margin: '0 0 0.35rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.6rem', letterSpacing: '0.18em', color: '#e58d55' }}>STEP 04</p>
            <p data-step-t style={{ margin: '0', fontFamily: 'Spectral,serif', fontSize: '0.9rem', lineHeight: '1.6', color: '#c8bb9f', textWrap: 'pretty' }}>Groq tailoring engine against job requirements</p>
          </div>
          <div style={{ position: 'relative', minWidth: '0', paddingTop: '1.15rem' }}>
            <span data-grow style={{ position: 'absolute', top: '0', left: '0', width: '1px', height: '0.75rem', background: '#e58d55', transformOrigin: 'top' }}></span>
            <p data-step-n style={{ margin: '0 0 0.35rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.6rem', letterSpacing: '0.18em', color: '#e58d55' }}>STEP 05</p>
            <p data-step-t style={{ margin: '0', fontFamily: 'Spectral,serif', fontSize: '0.9rem', lineHeight: '1.6', color: '#c8bb9f', textWrap: 'pretty' }}>Marketplace and recruiter side on the same API</p>
          </div>
        </div>
      </section>

      <section data-plot style={{ marginTop: 'clamp(2.4rem,4vw,3.4rem)' }}>
        <span data-grow style={{ display: 'block', height: '2px', background: '#e58d55', transformOrigin: 'left' }}></span>
        <p style={{ margin: '0.8rem 0 0.4rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.6rem', letterSpacing: '0.24em', color: '#b0a08c' }}>IF I REBUILT IT</p>
        <p data-rebuild style={{ margin: '0', maxWidth: '44rem', fontFamily: 'Caveat,cursive', fontSize: '1.45rem', lineHeight: '1.35', color: '#ddd1bd' }}>A queue in front of the ingestion job so one slow provider cannot stall the run, and per-source dedupe keyed on company plus title rather than provider id.</p>
      </section>
    </main>
  </div>
</div>


  <div aria-hidden="true" style={{ position: 'absolute', bottom: '1.55rem', left: '6rem', right: '2rem', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(224,214,188,0.16) 12%,rgba(224,214,188,0.16) 88%,transparent)', pointerEvents: 'none' }}></div>
  <div aria-hidden="true" style={{ position: 'absolute', bottom: '0.625rem', left: '6rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.6rem', letterSpacing: '0.08em', color: 'rgba(224,214,188,0.45)' }}>NO. 04</div>
  <div aria-hidden="true" style={{ position: 'absolute', bottom: '0.625rem', right: '2rem', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '0.6rem', letterSpacing: '0.08em', color: 'rgba(224,214,188,0.45)' }}>REV 1.04 · 7a19e6c</div>
</div>
</>
    );
  }
}

export default function ProjectsScreen() {
  return <Page />;
}
