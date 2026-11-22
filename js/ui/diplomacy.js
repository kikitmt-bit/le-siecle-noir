// Diplomatie : mariages, trêves, dons d'or, accusations
import * as A from "../audio.js?v=1795390620";
import * as E from "../engine.js?v=1795390620";
import { $, L, S, esc, me } from "../state.js?v=1795390620";
import { houseName, setInput } from "./common.js?v=1795390620";
import { shield } from "./draw.js?v=1795390620";
import { render } from "./render.js?v=1795390620";

// ---- diplomatie : mariages, trêves, dons d'or, accusations ----
export function myOffers() { const st = S(); const o = L.myInput.offers; return o && o.round === st.round ? o.items || [] : []; }

export function myGifts() { const st = S(); const g = L.myInput.gifts; return g && g.round === st.round ? g.items || [] : []; }

export function diplomacyHtml() {
  const st = S(), pid = me();
  const others = st.order.filter((p) => p !== pid && st.players[p].house !== "anglais");
  if (!others.length) return "";
  const pl = st.players[pid];
  const incoming = Object.entries(st.proposals || {}).filter(([, pr]) => pr.to === pid);
  const offers = myOffers();
  const gifts = myGifts();
  const myChild = E.marriageable(st, pid);
  let h = `<div class="pbox"><p class="ph">Diplomatie</p><p class="hint" style="margin-top:0">Mariage : alliance permanente (+1 or par manche). Trêve : 3 manches. Attaquer un allié ou rompre une trêve = trahison (−5 Prestige).</p>`;
  for (const [key, pr] of incoming) {
    const ans = L.ui.answers[key] ?? (L.myInput.answers || {})[key];
    const kind = pr.kind || "marriage";
    const theirChild = E.marriageable(st, pr.from);
    const what = kind === "treaty" ? "propose une trêve de 3 manches" : `demande la main de ${esc(myChild ? E.personTitle(myChild) : "ton enfant")} pour ${esc(theirChild ? E.personTitle(theirChild) : "son enfant")}`;
    h += `<div class="proposal" style="margin:8px 0"><span class="grow"><b>${esc(houseName(pr.from))}</b> ${what}.</span>
      ${ans === undefined ? `<button class="btn btn-small btn-red" data-ans="${key}" data-v="1">Accepter</button><button class="btn btn-small" data-ans="${key}" data-v="0">Refuser</button>` : `<i>${ans ? "Accepté (effet à la révélation)" : "Refusé"}</i>`}</div>`;
  }
  for (const o of others) {
    const al = E.allied(st, pid, o);
    const tr = (st.treaties || []).find((t) => ((t.a === pid && t.b === o) || (t.b === pid && t.a === o)) && t.until >= st.round);
    const askedM = offers.some((x) => x.to === o && x.kind === "marriage");
    const askedT = offers.some((x) => x.to === o && x.kind === "treaty");
    const gift = gifts.find((g) => g.to === o);
    h += `<div style="margin:8px 0;padding-top:6px;border-top:1px solid #D9C7A0"><div class="row">${shield(st.players[o].house, 18)}<span class="grow">${esc(houseName(o))}${st.players[o].isBot ? " <i>(ordinateur)</i>" : ""}${al ? '<span class="rel">ALLIÉ</span>' : ""}${tr ? `<span class="rel treaty">TRÊVE → ${E.yearOf(tr.until)}</span>` : ""}</span></div>
      <div class="row wrap" style="margin-top:6px">
        ${al ? "" : askedM ? "<i>Mariage proposé</i>" : `<button class="btn btn-small" data-offer="marriage" data-to="${o}" ${E.canPropose(st, pid, o, "marriage") ? "" : "disabled"} title="Il faut un enfant à marier de chaque côté, et moins de 50 de Peur">Mariage</button>`}
        ${al || tr ? "" : askedT ? "<i>Trêve proposée</i>" : `<button class="btn btn-small" data-offer="treaty" data-to="${o}">Trêve</button>`}
        ${gift ? `<i>${gift.amount} or envoyés</i>` : `<button class="btn btn-small" data-giftto="${o}" ${pl.gold < 1 ? "disabled" : ""}>Envoyer de l'or</button>`}
      </div>
      ${L.ui.giftTo === o ? `<div class="row" style="margin-top:6px"><span class="stepper"><button data-gm="-1" aria-label="Moins">−</button><b>${L.ui.giftAmt}</b><button data-gm="1" aria-label="Plus">+</button></span><span class="grow">or</span><button class="btn btn-small btn-red" id="gift-ok">Envoyer</button></div>` : ""}</div>`;
  }
  h += `</div>`;
  // accusations
  const uns = (st.unsolved || []);
  if (uns.length) {
    const acc = L.myInput.accuse && L.myInput.accuse.round === st.round ? L.myInput.accuse : null;
    h += `<div class="pbox"><p class="ph">Crimes non élucidés</p><p class="hint" style="margin-top:0">Accuse la bonne maison : elle perd 4 Prestige et tu en gagnes 2. Accuse à tort : −2 pour toi. Une accusation par manche.</p>`;
    for (const u of uns) {
      h += `<div style="margin:8px 0"><p class="ptext" style="font-size:14px;margin:0 0 6px"><i>${esc(u.text)}</i></p>`;
      if (acc) h += acc.crime === u.id ? `<i>Tu accuses ${esc(houseName(acc.target))}. Verdict à la révélation.</i>` : "";
      else h += `<div class="row wrap">${st.order.filter((p) => p !== pid).map((p) => `<button class="btn btn-small" data-acc="${u.id}" data-tgt-acc="${p}">Accuser ${esc(houseName(p))}</button>`).join("")}</div>`;
      h += `</div>`;
    }
    h += `</div>`;
  }
  return h;
}

export function bindDiplomacy() {
  const st = S();
  document.querySelectorAll("[data-offer]").forEach((el) => (el.onclick = () => {
    const items = [...myOffers(), { kind: el.dataset.offer, to: el.dataset.to }];
    setInput("offers", { round: st.round, items });
    A.play(el.dataset.offer === "marriage" ? "bells" : "seal"); render();
  }));
  document.querySelectorAll("[data-ans]").forEach((el) => (el.onclick = () => {
    L.ui.answers[el.dataset.ans] = el.dataset.v === "1";
    setInput("answers", { ...(L.myInput.answers || {}), ...L.ui.answers });
    render();
  }));
  document.querySelectorAll("[data-giftto]").forEach((el) => (el.onclick = () => { L.ui.giftTo = el.dataset.giftto; L.ui.giftAmt = 1; render(); }));
  document.querySelectorAll("[data-gm]").forEach((el) => (el.onclick = () => { const max = st.players[me()].gold; L.ui.giftAmt = Math.max(1, Math.min(max, L.ui.giftAmt + +el.dataset.gm)); render(); }));
  if ($("#gift-ok")) $("#gift-ok").onclick = () => {
    const items = [...myGifts().filter((g) => g.to !== L.ui.giftTo), { to: L.ui.giftTo, amount: L.ui.giftAmt }];
    setInput("gifts", { round: st.round, items }); L.ui.giftTo = null; A.play("coins"); render();
  };
  document.querySelectorAll("[data-acc]").forEach((el) => (el.onclick = () => { setInput("accuse", { round: st.round, crime: el.dataset.acc, target: el.dataset.tgtAcc }); A.play("seal"); render(); }));
}
