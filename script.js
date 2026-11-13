// ========== Reiken Coffee – script.js ==========
(() => {
  const WA = "6287777883323";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rupiah = n => "Rp " + n.toLocaleString("id-ID");

  // ---------- Tema terang / gelap ----------
  const root = document.documentElement;
  try { const t = localStorage.getItem("reiken-theme"); if (t) root.dataset.theme = t; } catch (e) {}
  $("#theme").addEventListener("click", () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("reiken-theme", root.dataset.theme); } catch (e) {}
  });

  // ---------- Menu mobile ----------
  const links = $("#links");
  $("#burger").addEventListener("click", () => links.classList.toggle("open"));
  $$("a", links).forEach(a => a.addEventListener("click", () => links.classList.remove("open")));

  // ---------- Scroll: progress, bayangan nav, tombol ke atas, link aktif ----------
  const nav = $("#nav"), bar = $("#progress"), topBtn = $("#top-btn");
  const onScroll = () => {
    const y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    nav.classList.toggle("sc", y > 10);
    topBtn.classList.toggle("show", y > 600);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  topBtn.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) $$("a", links).forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  $$("section[id]").forEach(s => spy.observe(s));

  // ---------- Muncul saat di-scroll ----------
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: .12 });
    $$(".reveal").forEach((el, i) => { el.style.transitionDelay = (i % 4) * 80 + "ms"; io.observe(el); });
  } else $$(".reveal").forEach(el => el.classList.add("in"));

  // ---------- Jadwal buka: status buka/tutup (zona waktu WIB) ----------
  const OPEN = 12 * 60, CLOSE = 60; // 12.00 - 01.00 (lewat tengah malam)
  let isOpen = true;
  function hours() {
    const w = new Date(Date.now() + 7 * 3600e3);
    const m = w.getUTCHours() * 60 + w.getUTCMinutes();
    isOpen = m >= OPEN || m < CLOSE;
    const day = m < CLOSE ? (w.getUTCDay() + 6) % 7 : w.getUTCDay(); // 00.00-01.00 masih jadwal kemarin
    const st = $("#status");
    st.className = "status " + (isOpen ? "open" : "closed");
    $("#st-main").textContent = isOpen ? "Buka sekarang" : "Sedang tutup";
    $("#st-sub").textContent = isOpen ? "Tutup pukul 01.00 WIB" : "Buka lagi pukul 12.00 WIB";
    $$("#days li").forEach(li => li.classList.toggle("today", +li.dataset.d === day));
  }
  hours(); setInterval(hours, 60000);

  // ---------- Filter menu ----------
  $$(".filters button").forEach(btn => btn.addEventListener("click", () => {
    $$(".filters button").forEach(b => b.classList.toggle("on", b === btn));
    const f = btn.dataset.f;
    $$(".item").forEach(it => it.classList.toggle("hide", f !== "semua" && it.dataset.cat !== f));
  }));

  // ---------- Keranjang & pemesanan ----------
  const cart = {};
  const box = $("#cart"), panel = $("#panel"), lines = $("#lines"), dlg = $("#checkout");
  const cards = $$(".item");

  function change(n, p, d) {
    cart[n] = cart[n] || { p, q: 0 };
    cart[n].q = Math.max(0, cart[n].q + d);
    render();
  }
  cards.forEach(card => {
    const q = document.createElement("div");
    q.className = "qty"; q.hidden = true;
    q.innerHTML = '<button type="button" data-d="-1" aria-label="Kurangi">−</button><span>0</span><button type="button" data-d="1" aria-label="Tambah">+</button>';
    $(".row", card).append(q);
    $(".add", card).addEventListener("click", () => change(card.dataset.name, +card.dataset.price, 1));
    q.addEventListener("click", e => { const b = e.target.closest("button"); if (b) change(card.dataset.name, +card.dataset.price, +b.dataset.d); });
  });

  const summary = () => {
    const names = Object.keys(cart).filter(n => cart[n].q > 0);
    return { names, count: names.reduce((s, n) => s + cart[n].q, 0), total: names.reduce((s, n) => s + cart[n].q * cart[n].p, 0) };
  };

  function render() {
    const { names, count, total } = summary();
    cards.forEach(card => {
      const q = cart[card.dataset.name] ? cart[card.dataset.name].q : 0;
      $(".add", card).hidden = q > 0;
      $(".qty", card).hidden = q === 0;
      $(".qty span", card).textContent = q;
    });
    box.hidden = count === 0;
    document.body.classList.toggle("has-cart", count > 0);
    if (!count) { panel.hidden = true; if (dlg.open) dlg.close(); }
    $("#count").textContent = count + " item";
    $("#total").textContent = rupiah(total);
    lines.innerHTML = "";
    names.forEach(n => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${n}</span><span><button data-n="${n}" data-d="-1" aria-label="Kurangi">−</button><span class="q">${cart[n].q}</span><button data-n="${n}" data-d="1" aria-label="Tambah">+</button></span>`;
      lines.append(li);
    });
  }
  lines.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    change(b.dataset.n, cart[b.dataset.n].p, +b.dataset.d);
  });
  $("#toggle").addEventListener("click", () => { panel.hidden = !panel.hidden; });
  $("#clear").addEventListener("click", () => { Object.keys(cart).forEach(k => delete cart[k]); render(); });

  // ---------- Formulir pesanan -> WhatsApp ----------
  $("#order").addEventListener("click", () => {
    const { names, total } = summary();
    $("#sum").innerHTML = names.map(n => `<li><span>${cart[n].q}× ${n}</span><b>${rupiah(cart[n].q * cart[n].p)}</b></li>`).join("");
    $("#sumtotal").textContent = rupiah(total);
    $("#closed-note").hidden = isOpen;
    $("#err").hidden = true;
    dlg.showModal();
  });
  $("#cancel").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
  $("#form").addEventListener("submit", e => {
    e.preventDefault();
    const name = $("#f-name").value.trim();
    if (!name) { const er = $("#err"); er.textContent = "Isi nama kamu dulu ya."; er.hidden = false; $("#f-name").focus(); return; }
    const { names, total } = summary();
    const tipe = $("input[name=tipe]:checked").value, note = $("#f-note").value.trim();
    const msg = "Halo Reiken Coffee, saya mau pesan:\n" +
      names.map(n => `- ${cart[n].q}x ${n} (${rupiah(cart[n].p * cart[n].q)})`).join("\n") +
      `\n\nTotal: ${rupiah(total)}\nAtas nama: ${name}\nJenis pesanan: ${tipe}` + (note ? `\nCatatan: ${note}` : "") + "\n\nTerima kasih!";
    const url = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
    if (!window.open(url, "_blank")) location.href = url;
    dlg.close();
  });
})();