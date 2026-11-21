// Boucle de temps : chronos et révélation
import * as A from "../audio.js?v=1795297295";
import { checkHostAlive, hostTick } from "../host.js?v=1795297295";
import { $, S, lastTickSec, net, setLastTickSec } from "../state.js?v=1795297295";
import { fmtTime } from "./common.js?v=1795297295";
import { tickReveal } from "./reveal.js?v=1795297295";

setInterval(() => {
  const st = S();
  if (st && st.phase !== "lobby" && st.deadline && !st.solo && st.timer && st.timer !== "none" && !["end", "reveal", "interlude"].includes(st.phase)) {
    const ms = st.deadline - net.now();
    const t = fmtTime(ms);
    $("#tb-timer").textContent = t;
    document.querySelectorAll("[data-timer]").forEach((e) => (e.textContent = t));
    const urgent = ms < 10000 && ms > 0;
    $("#tb-timer").classList.toggle("urgent", urgent);
    const sec = Math.ceil(ms / 1000);
    if (urgent && sec !== lastTickSec && sec <= 5) A.play("tick");
    setLastTickSec(sec);
  } else if ($("#tb-timer")) { $("#tb-timer").textContent = ""; $("#tb-timer").classList.remove("urgent"); }
  tickReveal();
  hostTick();
  checkHostAlive();
}, 250);
