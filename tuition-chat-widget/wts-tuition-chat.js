/*!
 * WTS Tuition Chat — embeddable widget
 * Floating bottom-right chat dialog for prospective-student tuition
 * questions, answered by the Hedwig web-chat API (repo:
 * hedwig-admissions-slackbot, hedwig/webchat/). All markup and styles
 * live in a Shadow DOM, so nothing collides with the host page's CSS.
 *
 * Configuration (optional):
 *   <script src=".../wts-tuition-chat.js" data-api-base="https://..."></script>
 *   or window.WTS_TUITION_CHAT_CONFIG = { apiBase: "https://...", mock: fn }
 *
 * Source: https://github.com/wts-developer/wts-web (projects/tuition-chat-widget)
 */
(function () {
  "use strict";

  var CSS = "/* WTS tuition chat widget - styles live inside the widget's Shadow DOM.\n   Brand tokens mirror projects/tuition-estimator/src/calculator.css so the\n   two widgets read as one family when both are on the page. */\n\n:host {\n  /* The host element occupies no layout space; everything visible is\n     fixed-position inside the shadow root. */\n  display: block;\n  width: 0;\n  height: 0;\n\n  /* Brand tokens measured from the computed styles of the live\n     wts.edu tuition page (Webflow CSS), so the widget sits on the page\n     in the site's exact palette: maroon nav rgb(138,34,51), gold\n     rgb(191,139,58), the \"content-section light-tan\" background\n     rgb(231,229,226) (the Don't Wait to Apply band), body text\n     rgb(51,51,51). Body copy on the site is Lato, matched below. */\n  --wts-red: #8a2233;\n  --wts-red-dark: #6e1726;\n  --wts-gold: #bf8b3a;\n  --wts-gray: #56575a;\n  --wts-paper: #e7e5e2;\n  --wts-ink: #333333;\n  --accent: var(--wts-red);\n  --accent-dark: var(--wts-red-dark);\n  --accent-soft: #f5e9eb;\n  --sans: \"Lato\", Arial, Helvetica, sans-serif;\n  --mono: \"Roboto Mono\", \"Courier New\", monospace;\n  --border: rgba(86, 87, 90, .18);\n  --shadow: 0 18px 50px rgba(31, 32, 35, .22);\n  --radius-lg: 20px;\n  --radius-md: 14px;\n}\n\n.wts-chat * { box-sizing: border-box; }\n\n.wts-chat {\n  font-family: var(--sans);\n  color: var(--wts-ink);\n  line-height: 1.45;\n  font-size: 15px;\n}\n\n/* ---- Launcher ------------------------------------------------------ */\n/* First impression is a labeled pill (\"Get instant answers\") so the\n   entry point is unmissable on a content-heavy page. Once the visitor\n   opens the chat it collapses to the quieter icon circle for the rest\n   of that page view; a fresh page load brings the pill back. */\n\n.wts-chat__launcher {\n  position: fixed;\n  right: 22px;\n  bottom: 22px;\n  z-index: 2147483000;\n  height: 60px;\n  padding: 0 24px 0 18px;\n  border: 0;\n  border-radius: 999px;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  color: #fff;\n  font-family: var(--sans);\n  font-size: 15px;\n  font-weight: 700;\n  letter-spacing: .01em;\n  white-space: nowrap;\n  /* Flat brand maroon, not a gradient: matches the site's primary\n     header bar exactly (marketing wants one maroon, not a shaded\n     variant of it). */\n  background: var(--accent);\n  box-shadow: 0 10px 28px rgba(110, 23, 38, .45);\n  transition: transform .18s ease, box-shadow .18s ease;\n}\n.wts-chat__launcher:hover { transform: translateY(-2px) scale(1.03); }\n.wts-chat__launcher:focus-visible {\n  outline: 3px solid var(--wts-gold);\n  outline-offset: 2px;\n}\n.wts-chat__launcher svg { width: 28px; height: 28px; display: block; flex-shrink: 0; }\n.wts-chat__launcher .icon-close { display: none; }\n.wts-chat--open .wts-chat__launcher .icon-chat { display: none; }\n.wts-chat--open .wts-chat__launcher .icon-close { display: block; }\n\n/* A soft expanding ring draws the eye on page load, three beats then\n   done. Skipped entirely for visitors who prefer reduced motion. */\n.wts-chat__launcher::before {\n  content: \"\";\n  position: absolute;\n  inset: 0;\n  border-radius: inherit;\n  box-shadow: 0 0 0 0 rgba(138, 34, 51, .55);\n  animation: wts-chat-pulse 2.2s ease-out 1.2s 3;\n  pointer-events: none;\n}\n@keyframes wts-chat-pulse {\n  0% { box-shadow: 0 0 0 0 rgba(138, 34, 51, .55); }\n  70% { box-shadow: 0 0 0 16px rgba(138, 34, 51, 0); }\n  100% { box-shadow: 0 0 0 0 rgba(138, 34, 51, 0); }\n}\n@media (prefers-reduced-motion: reduce) {\n  .wts-chat__launcher::before { animation: none; }\n  .wts-chat__launcher:hover { transform: none; }\n}\n\n/* Collapsed (post-engagement / open) form: icon circle, no label. */\n.wts-chat--engaged .wts-chat__launcher,\n.wts-chat--open .wts-chat__launcher {\n  width: 60px;\n  padding: 0;\n  justify-content: center;\n}\n.wts-chat--engaged .wts-chat__launcher .wts-chat__launcher-label,\n.wts-chat--open .wts-chat__launcher .wts-chat__launcher-label { display: none; }\n.wts-chat--engaged .wts-chat__launcher::before { animation: none; }\n\n/* ---- Panel --------------------------------------------------------- */\n\n.wts-chat__panel {\n  position: fixed;\n  right: 22px;\n  bottom: 96px;\n  z-index: 2147483000;\n  width: min(380px, calc(100vw - 32px));\n  height: min(560px, calc(100vh - 130px));\n  display: none;\n  flex-direction: column;\n  overflow: hidden;\n  background: var(--wts-paper);\n  border: 1px solid var(--border);\n  border-radius: var(--radius-lg);\n  box-shadow: var(--shadow);\n}\n.wts-chat--open .wts-chat__panel { display: flex; }\n\n@media (max-width: 480px) {\n  .wts-chat__panel {\n    right: 8px;\n    left: 8px;\n    width: auto;\n    bottom: 92px;\n    height: min(560px, calc(100dvh - 110px));\n  }\n}\n\n/* ---- Header -------------------------------------------------------- */\n\n.wts-chat__header {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  padding: 14px 16px;\n  color: #fff;\n  background: var(--accent);\n  flex-shrink: 0;\n}\n/* The reversed (white) logo variant sits directly on the maroon header,\n   matching how wts.edu's own header presents it. */\n.wts-chat__logo {\n  width: 40px;\n  height: 40px;\n  flex-shrink: 0;\n  display: grid;\n  place-items: center;\n}\n.wts-chat__logo img {\n  width: 100%;\n  height: 100%;\n  object-fit: contain;\n  display: block;\n}\n.wts-chat__heading { min-width: 0; }\n.wts-chat__title {\n  font-weight: 900;\n  font-size: 16px;\n  letter-spacing: .01em;\n}\n.wts-chat__subtitle {\n  font-size: 11.5px;\n  opacity: .85;\n  letter-spacing: .04em;\n  text-transform: uppercase;\n}\n.wts-chat__close {\n  margin-left: auto;\n  border: 0;\n  background: transparent;\n  color: #fff;\n  cursor: pointer;\n  font-size: 22px;\n  line-height: 1;\n  padding: 6px;\n  border-radius: 8px;\n}\n.wts-chat__close:hover { background: rgba(255, 255, 255, .15); }\n.wts-chat__close:focus-visible { outline: 2px solid var(--wts-gold); }\n\n/* ---- Messages ------------------------------------------------------ */\n\n.wts-chat__messages {\n  flex: 1;\n  overflow-y: auto;\n  padding: 16px 14px 8px;\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  scroll-behavior: smooth;\n}\n\n.wts-chat__msg {\n  max-width: 88%;\n  padding: 10px 13px;\n  border-radius: var(--radius-md);\n  overflow-wrap: break-word;\n}\n/* A bubble carrying a cost table takes the full row so the table gets\n   every available pixel before the font-fit logic has to shrink it. */\n.wts-chat__msg--wide { max-width: 100%; }\n.wts-chat__msg--bot {\n  align-self: flex-start;\n  background: #fff;\n  border: 1px solid var(--border);\n  border-bottom-left-radius: 4px;\n}\n.wts-chat__msg--user {\n  align-self: flex-end;\n  color: #fff;\n  background: var(--accent);\n  border-bottom-right-radius: 4px;\n}\n.wts-chat__msg--error {\n  background: #fdf3f4;\n  border-color: rgba(138, 34, 51, .35);\n}\n\n.wts-chat__msg pre {\n  margin: 8px 0;\n  padding: 8px 10px;\n  overflow-x: auto;\n  font-family: var(--mono);\n  font-size: 11.5px;\n  line-height: 1.5;\n  background: #f4f2ee;\n  border: 1px solid var(--border);\n  border-radius: 8px;\n  white-space: pre;\n}\n/* Last-resort fit (fitPre hit its font floor and the widest line still\n   doesn't fit): wrap instead of side-scrolling. Only the longest lines\n   wrap; the right-aligned money rows are narrower and stay intact. */\n.wts-chat__msg pre.wts-chat__pre--wrap {\n  white-space: pre-wrap;\n  word-break: break-word;\n  overflow-x: hidden;\n}\n.wts-chat__msg p { margin: 0 0 8px; }\n.wts-chat__msg p:last-child { margin-bottom: 0; }\n\n/* Typing indicator: three pulsing dots in a bot bubble. */\n.wts-chat__typing { display: inline-flex; gap: 5px; padding: 4px 2px; }\n.wts-chat__typing i {\n  width: 7px;\n  height: 7px;\n  border-radius: 50%;\n  background: var(--wts-gray);\n  opacity: .35;\n  animation: wts-chat-blink 1.2s infinite;\n}\n.wts-chat__typing i:nth-child(2) { animation-delay: .2s; }\n.wts-chat__typing i:nth-child(3) { animation-delay: .4s; }\n@keyframes wts-chat-blink {\n  0%, 60%, 100% { opacity: .35; transform: translateY(0); }\n  30% { opacity: 1; transform: translateY(-3px); }\n}\n\n/* ---- Suggestion chips ---------------------------------------------- */\n\n.wts-chat__chips {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n  padding: 2px 2px 4px;\n}\n.wts-chat__chip {\n  border: 1px solid rgba(138, 34, 51, .4);\n  background: #fff;\n  color: var(--accent);\n  font-family: var(--sans);\n  font-size: 12.5px;\n  padding: 6px 11px;\n  border-radius: 999px;\n  cursor: pointer;\n  transition: background .15s ease;\n}\n.wts-chat__chip:hover { background: var(--accent-soft); }\n.wts-chat__chip:focus-visible { outline: 2px solid var(--wts-gold); }\n\n/* ---- Composer ------------------------------------------------------ */\n\n.wts-chat__composer {\n  display: flex;\n  gap: 8px;\n  padding: 10px 12px;\n  border-top: 1px solid var(--border);\n  background: #fff;\n  flex-shrink: 0;\n}\n.wts-chat__input {\n  flex: 1;\n  border: 1px solid var(--border);\n  border-radius: 999px;\n  padding: 10px 16px;\n  font-family: var(--sans);\n  font-size: 14px;\n  color: var(--wts-ink);\n  background: var(--wts-paper);\n}\n.wts-chat__input:focus {\n  outline: 2px solid var(--accent);\n  outline-offset: -1px;\n  background: #fff;\n}\n.wts-chat__send {\n  width: 42px;\n  height: 42px;\n  flex-shrink: 0;\n  border: 0;\n  border-radius: 50%;\n  cursor: pointer;\n  display: grid;\n  place-items: center;\n  color: #fff;\n  background: var(--accent);\n}\n.wts-chat__send:hover { background: var(--accent-dark); }\n.wts-chat__send:disabled { opacity: .45; cursor: default; }\n.wts-chat__send:focus-visible { outline: 2px solid var(--wts-gold); outline-offset: 2px; }\n.wts-chat__send svg { width: 18px; height: 18px; display: block; }\n\n.wts-chat__disclaimer {\n  padding: 6px 14px 10px;\n  background: #fff;\n  font-size: 10.5px;\n  color: var(--wts-gray);\n  text-align: center;\n  flex-shrink: 0;\n}\n";
  var HTML = "<div class=\"wts-chat\">\n  <button class=\"wts-chat__launcher\" type=\"button\"\n          aria-label=\"Open tuition assistant chat\" aria-expanded=\"false\">\n    <svg class=\"icon-chat\" viewBox=\"0 0 24 24\" fill=\"none\" aria-hidden=\"true\">\n      <path d=\"M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H9.9L5.7 19.6c-.66.5-1.7.03-1.7-.8V5.5Z\"\n            fill=\"currentColor\"/>\n      <circle cx=\"8.6\" cy=\"9.6\" r=\"1.15\" fill=\"#8a2233\"/>\n      <circle cx=\"12\"  cy=\"9.6\" r=\"1.15\" fill=\"#8a2233\"/>\n      <circle cx=\"15.4\" cy=\"9.6\" r=\"1.15\" fill=\"#8a2233\"/>\n    </svg>\n    <span class=\"wts-chat__launcher-label\">Get instant answers</span>\n    <svg class=\"icon-close\" viewBox=\"0 0 24 24\" fill=\"none\" aria-hidden=\"true\">\n      <path d=\"M6 6l12 12M18 6L6 18\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\"/>\n    </svg>\n  </button>\n\n  <section class=\"wts-chat__panel\" role=\"dialog\" aria-label=\"Westminster tuition assistant\">\n    <header class=\"wts-chat__header\">\n      <span class=\"wts-chat__logo\" aria-hidden=\"true\">\n        <!-- Official WTS logo icon (reversed/white variant) served from the\n             wts.edu Webflow CDN - same asset the site header uses, so the\n             widget inherits any future logo refresh automatically. -->\n        <img src=\"https://cdn.prod.website-files.com/607eea4517cd5c0a2e0d32e2/607eea4517cd5c64230d3312_WTS_LogoIcon_Rev.svg\" alt=\"\" />\n      </span>\n      <div class=\"wts-chat__heading\">\n        <div class=\"wts-chat__title\">Tuition Assistant</div>\n        <div class=\"wts-chat__subtitle\">Westminster Theological Seminary</div>\n      </div>\n      <button class=\"wts-chat__close\" type=\"button\" aria-label=\"Close chat\">&#215;</button>\n    </header>\n\n    <div class=\"wts-chat__messages\" role=\"log\" aria-live=\"polite\" aria-label=\"Chat messages\"></div>\n\n    <form class=\"wts-chat__composer\">\n      <input class=\"wts-chat__input\" type=\"text\" autocomplete=\"off\"\n             maxlength=\"500\" placeholder=\"Ask about tuition costs&#8230;\"\n             aria-label=\"Type your tuition question\" />\n      <button class=\"wts-chat__send\" type=\"submit\" aria-label=\"Send message\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" aria-hidden=\"true\">\n          <path d=\"M3.4 11.05 20 4.13c.7-.3 1.4.4 1.1 1.1l-6.92 16.6c-.32.77-1.44.7-1.66-.1l-1.9-6.85-6.85-1.9c-.8-.22-.87-1.34-.1-1.66Z\" fill=\"currentColor\"/>\n        </svg>\n      </button>\n    </form>\n    <div class=\"wts-chat__disclaimer\">\n      Automated answers based on published tuition rates. Confirm details\n      with an admissions counselor.\n    </div>\n  </section>\n</div>\n";
  var FONTS_URL = "https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&family=Roboto+Mono:wght@400;500&display=swap";
  var DEFAULT_API_BASE = "https://hedwig-webchat-api.onrender.com";
  var currentScript = document.currentScript;

  // @font-face must live in the light DOM; shadow content can then use it.
  function ensureFonts() {
    if (document.querySelector("link[data-wts-chat-fonts]")) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONTS_URL;
    link.setAttribute("data-wts-chat-fonts", "");
    document.head.appendChild(link);
  }

  /* WTS tuition chat logic. Written shadow-DOM-aware: everything scopes off
     the `root` (shadow root) and `app` (`.wts-chat` wrapper) passed to
     runChat(root, app, config) - no bare document.* DOM lookups, so build.py
     can inline this file without rewriting it.

     Talks to the Hedwig web-chat API (hedwig/webchat/ in the
     hedwig-admissions-slackbot repo): POST {apiBase}/api/chat
     {"message": "..."} -> {"reply": <Slack-mrkdwn string>, "routed": bool,
     "outro": str|null}. The outro is the generic closing boilerplate
     (no hidden fees, talk to your counselor); it arrives as its own field
     so the widget can show it once per conversation instead of after
     every answer. The reply is Slack mrkdwn because the same engine
     serves Slack; the mini-renderer below covers the three constructs
     tuition answers use (``` code blocks, *bold*, _italic_). */

  function runChat(root, app, config) {
    "use strict";

    var STORAGE_KEY = "wtsTuitionChat.v1";
    var MAX_TRANSCRIPT = 40;

    // Cost-framed questions only: the engine answers duration questions
    // ("how long at N courses/term?") with a cost-first reply that reads
    // mismatched, so don't suggest that phrasing until the engine has a
    // duration-first framing.
    var SUGGESTIONS = [
      "How much does the MATS cost if I raise $3,000?",
      "What would the MAC cost me with 6 transfer credits?",
    ];

    var WELCOME =
      "Hi! I can estimate what a Westminster program would cost you, " +
      "including scholarships and how far the money you raise can go. " +
      "Try one of these, or ask in your own words:";

    var launcher = app.querySelector(".wts-chat__launcher");
    var panel = app.querySelector(".wts-chat__panel");
    var closeBtn = app.querySelector(".wts-chat__close");
    var messagesEl = app.querySelector(".wts-chat__messages");
    var form = app.querySelector(".wts-chat__composer");
    var input = app.querySelector(".wts-chat__input");
    var sendBtn = app.querySelector(".wts-chat__send");

    // ---- session persistence (open state + transcript survive page
    // navigation within the visit, reset when the tab closes) ----------

    function loadState() {
      try {
        return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {};
      } catch (e) {
        return {};
      }
    }

    function saveState() {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) { /* storage full or blocked: chat still works, just won't persist */ }
    }

    var state = loadState();
    if (!Array.isArray(state.transcript)) state.transcript = [];
    // The closing boilerplate shows once per browser session; the flag
    // rides the same sessionStorage state as the transcript.
    if (typeof state.outroShown !== "boolean") state.outroShown = false;

    // ---- mrkdwn mini-renderer -----------------------------------------

    function escapeHtml(s) {
      // [<] not a bare < : the mockup build inlines this file into a <script>
      // block and escapes every `</` to `<\/`, which would corrupt a /</g
      // regex literal. The character class sidesteps the sequence entirely.
      return s.replace(/&/g, "&amp;").replace(/[<]/g, "&lt;").replace(/[>]/g, "&gt;");
    }

    function inlineMrkdwn(s) {
      // Bold/italic only; the escapes above make this injection-safe.
      return s
        .replace(/\*([^*\n]+)\*/g, "<strong>$1</strong>")
        .replace(/_([^_\n]+)_/g, "<em>$1</em>");
    }

    function renderMrkdwn(text) {
      var html = "";
      // Fences split the message into alternating text / code segments.
      var segments = escapeHtml(text).split(/```/);
      for (var i = 0; i < segments.length; i++) {
        var seg = segments[i];
        if (i % 2 === 1) {
          html += "<pre>" + seg.replace(/^\n+|\n+$/g, "") + "</pre>";
        } else {
          var paras = seg.split(/\n{2,}/);
          for (var j = 0; j < paras.length; j++) {
            var p = paras[j].replace(/^\n+|\n+$/g, "");
            if (p) html += "<p>" + inlineMrkdwn(p).replace(/\n/g, "<br>") + "</p>";
          }
        }
      }
      return html;
    }

    // ---- transcript rendering -----------------------------------------

    // Shrink a code block's mono face until its widest line fits the
    // bubble, so the cost table reads without side-scrolling. Floor at
    // 9px for legibility; if the widest line still doesn't fit there,
    // soft-wrap it (only the longest lines wrap; the aligned money rows
    // are narrower and keep their columns). No-op while the panel is
    // hidden (clientWidth 0) - fitAllPres() re-runs on open for a
    // transcript restored into a closed panel.
    function fitPre(pre) {
      if (!pre.clientWidth) return;
      var size = 11.5;
      pre.classList.remove("wts-chat__pre--wrap");
      pre.style.fontSize = size + "px";
      while (size > 9 && pre.scrollWidth > pre.clientWidth) {
        size -= 0.5;
        pre.style.fontSize = size + "px";
      }
      if (pre.scrollWidth > pre.clientWidth) {
        pre.classList.add("wts-chat__pre--wrap");
      }
    }

    function fitAllPres() {
      var pres = messagesEl.querySelectorAll("pre");
      for (var i = 0; i < pres.length; i++) fitPre(pres[i]);
    }

    function addBubble(who, text, opts) {
      var div = document.createElement("div");
      div.className = "wts-chat__msg wts-chat__msg--" + (who === "user" ? "user" : "bot");
      if (opts && opts.error) div.className += " wts-chat__msg--error";
      if (who === "user") {
        div.textContent = text;
      } else {
        div.innerHTML = renderMrkdwn(text);
      }
      var pres = who === "user" ? [] : div.querySelectorAll("pre");
      if (pres.length) div.className += " wts-chat__msg--wide";
      messagesEl.appendChild(div);
      // Fit after insertion - scrollWidth/clientWidth are 0 off-DOM.
      for (var i = 0; i < pres.length; i++) fitPre(pres[i]);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return div;
    }

    function record(who, text) {
      state.transcript.push({ who: who, text: text });
      if (state.transcript.length > MAX_TRANSCRIPT) {
        state.transcript = state.transcript.slice(-MAX_TRANSCRIPT);
      }
      saveState();
    }

    function addSuggestionChips() {
      var wrap = document.createElement("div");
      wrap.className = "wts-chat__chips";
      SUGGESTIONS.forEach(function (q) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "wts-chat__chip";
        chip.textContent = q;
        chip.addEventListener("click", function () { send(q); });
        wrap.appendChild(chip);
      });
      messagesEl.appendChild(wrap);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function showWelcome() {
      addBubble("bot", WELCOME);
      addSuggestionChips();
    }

    function restoreTranscript() {
      if (!state.transcript.length) {
        showWelcome();
        return;
      }
      state.transcript.forEach(function (m) { addBubble(m.who, m.text); });
    }

    // ---- talk to the API ------------------------------------------------

    function askBackend(text) {
      if (typeof config.mock === "function") {
        // Demo/mockup mode: canned answers, no network. See dist/index.html.
        return Promise.resolve(config.mock(text));
      }
      return fetch(config.apiBase.replace(/\/$/, "") + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      }).then(function (resp) {
        return resp.json().then(function (payload) {
          if (!resp.ok) {
            // 4xx payloads may carry displayable copy in `reply`.
            var err = new Error("api " + resp.status);
            err.reply = payload && payload.reply;
            throw err;
          }
          return payload;
        });
      });
    }

    var pending = false;

    // Hold the typing indicator on screen for a beat even when the answer
    // comes back instantly (mock mode, warm API): an immediate wall of
    // text reads as a search result, a short pause reads as a chat.
    function typingPause(payload, startedAt) {
      var target = 800 + Math.random() * 700;
      var remaining = target - (Date.now() - startedAt);
      if (remaining <= 0) return Promise.resolve(payload);
      return new Promise(function (resolve) {
        setTimeout(function () { resolve(payload); }, remaining);
      });
    }

    function send(text) {
      text = (text || "").trim();
      if (!text || pending) return;
      pending = true;
      sendBtn.disabled = true;
      input.value = "";

      addBubble("user", text);
      record("user", text);

      var typing = document.createElement("div");
      typing.className = "wts-chat__msg wts-chat__msg--bot";
      typing.innerHTML = '<span class="wts-chat__typing"><i></i><i></i><i></i></span>';
      messagesEl.appendChild(typing);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      var startedAt = Date.now();

      askBackend(text)
        .then(function (payload) { return typingPause(payload, startedAt); })
        .then(function (payload) {
          typing.remove();
          addBubble("bot", payload.reply);
          record("bot", payload.reply);
          if (payload.outro && !state.outroShown) {
            state.outroShown = true;
            addBubble("bot", payload.outro);
            record("bot", payload.outro); // record() also persists the flag
          }
        })
        .catch(function (err) {
          typing.remove();
          var reply = err.reply ||
            "Sorry - I couldn't reach the tuition service just now. " +
            "Please try again in a moment, or email admissions@wts.edu.";
          addBubble("bot", reply, { error: true });
          record("bot", reply);
        })
        .finally(function () {
          pending = false;
          sendBtn.disabled = false;
          input.focus();
        });
    }

    // ---- open/close ------------------------------------------------------

    function setOpen(open) {
      app.classList.toggle("wts-chat--open", open);
      launcher.setAttribute("aria-expanded", String(open));
      launcher.setAttribute("aria-label",
        open ? "Close tuition assistant chat" : "Open tuition assistant chat");
      state.open = open;
      // Opening collapses the labeled launcher pill to the quieter icon
      // circle. Deliberately not persisted: a fresh page load gets the
      // full "Get instant answers" pill back, so the entry point stays
      // prominent on every page of the visit.
      if (open) app.classList.add("wts-chat--engaged");
      saveState();
      if (open) {
        fitAllPres();
        input.focus();
      }
    }

    launcher.addEventListener("click", function () {
      setOpen(!app.classList.contains("wts-chat--open"));
    });
    closeBtn.addEventListener("click", function () {
      setOpen(false);
      launcher.focus();
    });
    panel.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        setOpen(false);
        launcher.focus();
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      send(input.value);
    });
    // Explicit Enter handling too: implicit form submission is skipped for
    // synthetic key events (test drivers) and some IME edge cases.
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.isComposing) {
        e.preventDefault();
        send(input.value);
      }
    });

    restoreTranscript();
    if (state.open) setOpen(true);
  }

  function resolveConfig() {
    var config = { apiBase: DEFAULT_API_BASE };
    var overrides = window.WTS_TUITION_CHAT_CONFIG || {};
    for (var k in overrides) config[k] = overrides[k];
    if (currentScript && currentScript.dataset && currentScript.dataset.apiBase) {
      config.apiBase = currentScript.dataset.apiBase;
    }
    return config;
  }

  function boot(host) {
    if (host.shadowRoot) return; // already booted
    ensureFonts();
    var shadow = host.attachShadow({ mode: "open" });
    var style = document.createElement("style");
    style.textContent = CSS;
    shadow.appendChild(style);
    var wrapper = document.createElement("div");
    wrapper.innerHTML = HTML;
    var app = wrapper.firstElementChild;
    shadow.appendChild(app);
    runChat(shadow, app, resolveConfig());
  }

  function init() {
    var host = document.getElementById("wts-tuition-chat");
    if (!host) {
      // The widget is fixed-position, so the host can live anywhere;
      // body-append keeps it out of the page's layout entirely.
      host = document.createElement("div");
      host.id = "wts-tuition-chat";
      document.body.appendChild(host);
    }
    boot(host);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
