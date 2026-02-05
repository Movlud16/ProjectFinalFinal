/*
	ZEUS Defense (template)
*/

function qs(sel, root = document) {
	if (!root || typeof root.querySelector !== "function") return null;
	return root.querySelector(sel);
}
function qsa(sel, root = document) {
	if (!root || typeof root.querySelectorAll !== "function") return [];
	return Array.from(root.querySelectorAll(sel));
}

function setHidden(el, hidden) {
	if (!el) return;
	if (hidden) {
		el.setAttribute("hidden", "");
	} else {
		el.removeAttribute("hidden");
	}
}

function lockScroll(locked) {
	document.documentElement.style.overflow = locked ? "hidden" : "";
}

function isDesktop() {
	return window.matchMedia("(min-width: 981px)").matches;
}

function initHeader() {
	const header = qs("[data-header]");
	if (!header) return;

	const onScroll = () => {
		header.classList.toggle("is-scrolled", window.scrollY > 8);
	};
	onScroll();
	window.addEventListener("scroll", onScroll, { passive: true });
}

function closeAllMega() {
	qsa("[data-mega]").forEach((item) => {
		item.classList.remove("is-open");
		const btn = qs("[data-mega-toggle]", item);
		if (btn) btn.setAttribute("aria-expanded", "false");
	});
}

function initMegaMenu() {
	const megaItems = qsa("[data-mega]");
	if (!megaItems.length) return;

	megaItems.forEach((item) => {
		const btn = qs("[data-mega-toggle]", item);
		const panel = qs("[data-mega-panel]", item);
		if (!btn || !panel) return;

		const open = () => {
			closeAllMega();
			item.classList.add("is-open");
			btn.setAttribute("aria-expanded", "true");
		};
		const close = () => {
			item.classList.remove("is-open");
			btn.setAttribute("aria-expanded", "false");
		};

		// Desktop: hover/focus opens
		item.addEventListener("mouseenter", () => {
			if (!isDesktop()) return;
			open();
		});
		item.addEventListener("mouseleave", () => {
			if (!isDesktop()) return;
			close();
		});

		btn.addEventListener("click", (e) => {
			if (!isDesktop()) return; // mobile uses drawer accordions
			e.preventDefault();
			const expanded = btn.getAttribute("aria-expanded") === "true";
			// If already open, keep it open (fixes touch/hybrid "blink" issues).
			// If closed, open it.
			if (!expanded) open();
		});

		// Keep open when focusing inside
		item.addEventListener("focusin", () => {
			if (!isDesktop()) return;
			open();
		});
	});

	document.addEventListener("click", (e) => {
		if (!isDesktop()) return;
		const inMega = e.target.closest("[data-mega]");
		if (!inMega) closeAllMega();
	});

	document.addEventListener("focusin", (e) => {
		if (!isDesktop()) return;
		const inMega = e.target.closest("[data-mega]");
		if (!inMega) closeAllMega();
	});

	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") {
			closeAllMega();
		}
	});
}

function initDrawer() {
	const drawer = qs("[data-drawer]");
	const backdrop = qs("[data-backdrop]");
	const openBtn = qs("[data-drawer-open]");
	const closeBtn = qs("[data-drawer-close]");
	if (!drawer || !backdrop || !openBtn || !closeBtn) return;

	const getAccordionPanel = (btn) => {
		let el = btn.nextElementSibling;
		while (el && el instanceof HTMLElement && !el.classList.contains("drawer-panel")) {
			el = el.nextElementSibling;
		}
		return el instanceof HTMLElement && el.classList.contains("drawer-panel") ? el : null;
	};

	const open = () => {
		drawer.classList.add("is-open");
		drawer.setAttribute("aria-hidden", "false");
		setHidden(backdrop, false);
		lockScroll(true);
		openBtn.setAttribute("aria-expanded", "true");
	};
	const close = () => {
		drawer.classList.remove("is-open");
		drawer.setAttribute("aria-hidden", "true");
		setHidden(backdrop, true);
		lockScroll(false);
		openBtn.setAttribute("aria-expanded", "false");
	};

	openBtn.addEventListener("click", open);
	closeBtn.addEventListener("click", close);
	backdrop.addEventListener("click", close);

	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") close();
	});

	// Drawer accordions
	qsa("[data-drawer-acc]", drawer).forEach((btn) => {
		const panelId = btn.getAttribute("aria-controls");
		const panel = (panelId && document.getElementById(panelId)) || getAccordionPanel(btn);
		if (!panel) return;

		panel.classList.toggle("is-open", btn.getAttribute("aria-expanded") === "true");

		btn.addEventListener("click", (e) => {
			e.stopPropagation();
			const expanded = btn.getAttribute("aria-expanded") === "true";
			btn.setAttribute("aria-expanded", expanded ? "false" : "true");
			panel.classList.toggle("is-open", !expanded);
		});
	});

	// Close drawer on navigation
	qsa("a", drawer).forEach((a) => {
		a.addEventListener("click", () => {
			close();
		});
	});
}

function initLangSwitch() {
	const roots = qsa("[data-lang-switch]");
	if (!roots.length) return;

	const instances = [];

	const safeGet = (key) => {
		try {
			return localStorage.getItem(key);
		} catch {
			return null;
		}
	};
	const safeSet = (key, value) => {
		try {
			localStorage.setItem(key, value);
		} catch {
			// ignore
		}
	};

	roots.forEach((root) => {
		const btn = qs("[data-lang-btn]", root);
		const menu = qs("[data-lang-menu]", root);
		if (!btn || !menu) return;

		const close = () => {
			btn.setAttribute("aria-expanded", "false");
			setHidden(menu, true);
		};
		const open = () => {
			btn.setAttribute("aria-expanded", "true");
			setHidden(menu, false);
		};
		const toggle = (e) => {
			e.preventDefault();
			e.stopPropagation();
			const expanded = btn.getAttribute("aria-expanded") === "true";
			expanded ? close() : open();
		};

		btn.addEventListener("click", toggle);
		menu.addEventListener("click", (e) => e.stopPropagation());

		qsa("[data-lang-option]", menu).forEach((opt) => {
			opt.addEventListener("click", (e) => {
				e.preventDefault();
				const code = (opt.dataset.langCode || opt.textContent || "EN").trim();
				btn.textContent = code;
				safeSet("zeus_lang_code", code);
				close();
			});
		});

		const saved = safeGet("zeus_lang_code");
		if (saved) btn.textContent = saved;
		close();

		instances.push({ root, close });
	});

	if (!instances.length) return;

	document.addEventListener("click", (e) => {
		instances.forEach(({ root, close }) => {
			if (!root.contains(e.target)) close();
		});
	});

	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") {
			instances.forEach(({ close }) => close());
		}
	});
}

function initSearch() {
	const overlay = qs("[data-search]");
	const openBtns = qsa("[data-search-open]");
	const closeBtn = qs("[data-search-close]");
	const form = qs("[data-search-form]");
	const input = form ? qs("input", form) : null;
	if (!overlay || !openBtns.length || !closeBtn || !form || !input) return;

	const open = () => {
		setHidden(overlay, false);
		lockScroll(true);
		// Clear previous highlights
		qsa("[data-search-hit]").forEach((el) => el.removeAttribute("data-search-hit"));
		setTimeout(() => input.focus(), 0);
	};
	const close = () => {
		setHidden(overlay, true);
		lockScroll(false);
	};

	openBtns.forEach((b) => b.addEventListener("click", open));
	closeBtn.addEventListener("click", close);
	overlay.addEventListener("click", (e) => {
		if (e.target === overlay) close();
	});

	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && !overlay.hasAttribute("hidden")) {
			close();
		}
	});

	qsa("[data-chip]").forEach((chip) => {
		chip.addEventListener("click", () => {
			input.value = chip.textContent.trim();
			form.requestSubmit();
		});
	});

	const highlightSections = (q) => {
		const query = q.trim().toLowerCase();
		if (!query) return false;

		const sections = qsa("main section[id]");
		let firstHit = null;

		sections.forEach((s) => {
			const text = s.textContent.toLowerCase();
			const hit = text.includes(query);
			if (hit) {
				s.setAttribute("data-search-hit", "true");
				if (!firstHit) firstHit = s;
			}
		});

		if (firstHit) {
			close();
			firstHit.scrollIntoView({ behavior: "smooth", block: "start" });
			return true;
		}
		return false;
	};

	form.addEventListener("submit", (e) => {
		e.preventDefault();
		const ok = highlightSections(input.value);
		if (!ok) {
			input.select();
		}
	});
}

function initSlider() {
	const slider = qs("[data-slider]");
	if (!slider) return;
	const track = qs("[data-slider-track]", slider);
	const slides = qsa("[data-slide]", slider);
	const dots = qs("[data-dots]", slider);
	const prev = qs("[data-prev]", slider);
	const next = qs("[data-next]", slider);
	if (!track || !slides.length || !dots || !prev || !next) return;

	let index = 0;
	let timer = null;
	const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	const renderDots = () => {
		dots.innerHTML = "";
		slides.forEach((_, i) => {
			const b = document.createElement("button");
			b.className = "dot";
			b.type = "button";
			b.setAttribute("role", "tab");
			b.setAttribute("aria-label", `Go to slide ${i + 1}`);
			b.setAttribute("aria-selected", i === index ? "true" : "false");
			b.addEventListener("click", () => goTo(i));
			dots.appendChild(b);
		});
	};

	const goTo = (i) => {
		index = (i + slides.length) % slides.length;
		track.style.transform = `translateX(${-index * 100}%)`;
		qsa(".dot", dots).forEach((d, di) => d.setAttribute("aria-selected", di === index ? "true" : "false"));
		restart();
	};

	const restart = () => {
		if (reduce) return;
		if (timer) window.clearInterval(timer);
		timer = window.setInterval(() => {
			goTo(index + 1);
		}, 5500);
	};

	prev.addEventListener("click", () => goTo(index - 1));
	next.addEventListener("click", () => goTo(index + 1));

	slider.addEventListener("mouseenter", () => {
		if (timer) window.clearInterval(timer);
	});
	slider.addEventListener("mouseleave", () => restart());

	renderDots();
	restart();
}

function initHeroMedia() {
	const media = qs("[data-hero-media]");
	const canvas = qs("[data-hero-canvas]", media || document);
	const video = qs(".hero-video", media || document);
	const iframe = qs(".hero-embed iframe", media || document);
	if (!media || !(canvas instanceof HTMLCanvasElement)) return;

	const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	const fit = () => {
		const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
		const rect = media.getBoundingClientRect();
		canvas.width = Math.max(1, Math.floor(rect.width * dpr));
		canvas.height = Math.max(1, Math.floor(rect.height * dpr));
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.scale(dpr, dpr);
	};

	fit();
	window.addEventListener("resize", fit);

	// Prefer video as the default background; fall back to the canvas if video fails.
	const setNoVideo = (noVideo) => media.classList.toggle("no-video", noVideo);

	if (iframe) {
		if (reduce) {
			setNoVideo(true);
		} else {
			setNoVideo(false);
			iframe.addEventListener("error", () => setNoVideo(true));
		}
	} else if (video) {
		if (reduce) {
			try {
				video.pause();
			} catch {
				// ignore
			}
			setNoVideo(true);
		} else {
			setNoVideo(false);
			video.addEventListener("error", () => setNoVideo(true));
			qsa("source", video).forEach((source) => {
				source.addEventListener("error", () => setNoVideo(true));
			});

			try {
				const p = video.play();
				if (p && typeof p.catch === "function") {
					p.catch(() => {
					});
				}
			} catch {
				// ignore
			}
		}
	} else {
		setNoVideo(true);
	}

	const particles = [];
	const count = 52;
	const rand = (min, max) => min + Math.random() * (max - min);

	const rect = () => media.getBoundingClientRect();
	const seed = () => {
		particles.length = 0;
		const r = rect();
		for (let i = 0; i < count; i++) {
			particles.push({
				x: rand(0, r.width),
				y: rand(0, r.height),
				vx: rand(-0.18, 0.18),
				vy: rand(-0.14, 0.14),
				r: rand(1.1, 2.2),
			});
		}
	};

	seed();
	window.addEventListener("resize", seed);

	const drawStatic = () => {
		const r = rect();
		ctx.clearRect(0, 0, r.width, r.height);
		const g = ctx.createLinearGradient(0, 0, r.width, r.height);
		g.addColorStop(0, "rgba(224, 32, 32, 0.20)");
		g.addColorStop(0.5, "rgba(10, 71, 255, 0.14)");
		g.addColorStop(1, "rgba(255, 255, 255, 0.04)");
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, r.width, r.height);
	};

	if (reduce) {
		drawStatic();
		return;
	}

	let t0 = performance.now();
	const loop = (t) => {
		const r = rect();
		const dt = Math.min(40, t - t0);
		t0 = t;

		ctx.clearRect(0, 0, r.width, r.height);

		// base wash
		const bg = ctx.createRadialGradient(r.width * 0.22, r.height * 0.25, 0, r.width * 0.22, r.height * 0.25, r.width);
		bg.addColorStop(0, "rgba(10, 71, 255, 0.16)");
		bg.addColorStop(0.45, "rgba(224, 32, 32, 0.10)");
		bg.addColorStop(1, "rgba(0, 0, 0, 0)");
		ctx.fillStyle = bg;
		ctx.fillRect(0, 0, r.width, r.height);

		// particles update
		for (const p of particles) {
			p.x += p.vx * dt;
			p.y += p.vy * dt;
			if (p.x < -10) p.x = r.width + 10;
			if (p.x > r.width + 10) p.x = -10;
			if (p.y < -10) p.y = r.height + 10;
			if (p.y > r.height + 10) p.y = -10;
		}

		// lines
		for (let i = 0; i < particles.length; i++) {
			for (let j = i + 1; j < particles.length; j++) {
				const a = particles[i];
				const b = particles[j];
				const dx = a.x - b.x;
				const dy = a.y - b.y;
				const d2 = dx * dx + dy * dy;
				if (d2 > 150 * 150) continue;
				const alpha = Math.max(0, 0.18 - d2 / (150 * 150) * 0.18);
				ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(a.x, a.y);
				ctx.lineTo(b.x, b.y);
				ctx.stroke();
			}
		}

		// points
		for (const p of particles) {
			ctx.fillStyle = "rgba(255,255,255,0.55)";
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
			ctx.fill();
		}

		// scanline sweep
		const y = ((t * 0.03) % (r.height + 220)) - 110;
		const grad = ctx.createLinearGradient(0, y - 80, 0, y + 80);
		grad.addColorStop(0, "rgba(255,255,255,0)");
		grad.addColorStop(0.5, "rgba(255,255,255,0.10)");
		grad.addColorStop(1, "rgba(255,255,255,0)");
		ctx.fillStyle = grad;
		ctx.fillRect(0, y - 80, r.width, 160);

		requestAnimationFrame(loop);
	};

	requestAnimationFrame(loop);
}

function initAccordion() {
	const root = qs("[data-accordion]");
	if (!root) return;

	const buttons = qsa("[data-acc]", root);
	const panels = qsa("[data-acc-panel]", root);
	if (!buttons.length || buttons.length !== panels.length) return;

	const openAt = (i) => {
		buttons.forEach((b, bi) => {
			const expanded = bi === i;
			b.setAttribute("aria-expanded", expanded ? "true" : "false");
			panels[bi].hidden = !expanded;
		});
	};

	buttons.forEach((b, i) => {
		b.addEventListener("click", () => {
			const expanded = b.getAttribute("aria-expanded") === "true";
			openAt(expanded ? -1 : i);
		});
	});

	const firstExpanded = buttons.findIndex((b) => b.getAttribute("aria-expanded") === "true");
	if (firstExpanded >= 0) openAt(firstExpanded);
}

function initNewsFilter() {
	const buttons = qsa("[data-news-filter]");
	const cards = qsa("[data-news]");
	if (!buttons.length || !cards.length) return;

	const setActive = (value) => {
		buttons.forEach((b) => b.classList.toggle("chip-active", b.dataset.newsFilter === value));
		cards.forEach((c) => {
			const match = value === "all" || c.dataset.news === value;
			c.classList.toggle("is-dim", !match);
		});
	};

	buttons.forEach((b) => {
		b.addEventListener("click", () => setActive(b.dataset.newsFilter));
	});

	setActive("all");
}

function initCarousels() {
	const carousels = qsa("[data-carousel]");
	if (!carousels.length) return;

	const prefersReduced =
		window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	carousels.forEach((root) => {
		const track = qs("[data-carousel-track]", root);
		const btnPrev = qs("[data-carousel-prev]", root);
		const btnNext = qs("[data-carousel-next]", root);
		if (!track || !btnPrev || !btnNext) return;

		const getStep = () => {
			// Scroll by approx one card width + gap (fallback to 320px)
			const first = track.querySelector(":scope > *");
			if (!first) return 320;
			const rect = first.getBoundingClientRect();
			return Math.max(280, Math.round(rect.width + 14));
		};

		const scrollByStep = (dir) => {
			track.scrollBy({
				left: dir * getStep(),
				behavior: prefersReduced ? "auto" : "smooth",
			});
		};

		btnPrev.addEventListener("click", () => scrollByStep(-1));
		btnNext.addEventListener("click", () => scrollByStep(1));

		const sync = () => {
			const max = track.scrollWidth - track.clientWidth;
			const left = track.scrollLeft;
			btnPrev.disabled = left <= 2;
			btnNext.disabled = left >= max - 2;
		};

		track.addEventListener("scroll", () => window.requestAnimationFrame(sync), {
			passive: true,
		});
		window.addEventListener("resize", sync);
		sync();
	});
}

function initModal() {
	const modal = qs("[data-modal]");
	const title = qs("[data-modal-title]", modal);
	const text = qs("[data-modal-text]", modal);
	const closeBtns = qsa("[data-modal-close]", modal);
	const jobBtns = qsa("[data-job]");
	if (!modal || !title || !text || !closeBtns.length || !jobBtns.length) return;

	const open = (role) => {
		title.textContent = role;
		text.textContent =
			"This is a demo modal. Replace this with real job descriptions (from JSON/CMS), and wire an application flow.";
		setHidden(modal, false);
		lockScroll(true);
		closeBtns[0].focus();
	};

	const close = () => {
		setHidden(modal, true);
		lockScroll(false);
	};

	jobBtns.forEach((b) => {
		b.addEventListener("click", () => open(b.dataset.job));
	});

	closeBtns.forEach((b) => b.addEventListener("click", close));
	modal.addEventListener("click", (e) => {
		if (e.target === modal) close();
	});

	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && !modal.hasAttribute("hidden")) close();
	});
}

function initForm() {
	const form = qs("[data-form]");
	const status = qs("[data-form-status]");
	if (!form || !status) return;

	form.addEventListener("submit", (e) => {
		e.preventDefault();
		status.textContent = "";

		const data = new FormData(form);
		const name = String(data.get("name") || "").trim();
		const org = String(data.get("org") || "").trim();
		const email = String(data.get("email") || "").trim();
		const msg = String(data.get("msg") || "").trim();

		if (!name || !org || !email || !msg) {
			status.textContent = "Please fill in all fields.";
			return;
		}

		// Basic email check
		if (!/^\S+@\S+\.\S+$/.test(email)) {
			status.textContent = "Please enter a valid email.";
			return;
		}

		status.textContent = "Thanks — message prepared (demo only).";
		form.reset();
	});
}

function initNewsletter() {
	const form = qs("[data-newsletter]");
	if (!form) return;

	const email = qs("input[type='email']", form);
	const btn = qs("button[type='submit']", form);

	form.addEventListener("submit", (e) => {
		e.preventDefault();
		const value = String(email?.value || "").trim();
		if (!value || !/^\S+@\S+\.\S+$/.test(value)) {
			email?.focus();
			return;
		}

		if (btn) {
			const prev = btn.textContent;
			btn.textContent = "Subscribed";
			btn.disabled = true;
			window.setTimeout(() => {
				btn.textContent = prev;
				btn.disabled = false;
			}, 1600);
		}

		form.reset();
	});
}

function initYearAndTop() {
	const year = qs("[data-year]");
	if (year) year.textContent = String(new Date().getFullYear());

	const top = qs("[data-to-top]");
	if (top) {
		top.addEventListener("click", (e) => {
			e.preventDefault();
			window.scrollTo({ top: 0, behavior: "smooth" });
		});
	}
}

function initSearchHighlightStyle() {
	// Add a tiny style hook for search hits without editing CSS further.
	const style = document.createElement("style");
	style.textContent = `
		[data-search-hit="true"]{
			outline: 2px solid rgba(105,242,255,0.55);
			outline-offset: -2px;
			scroll-margin-top: 90px;
		}
	`;
	document.head.appendChild(style);
}

document.addEventListener("DOMContentLoaded", () => {
	initHeader();
	initMegaMenu();
	initDrawer();
	initLangSwitch();
	initSearch();
	initHeroMedia();
	initSlider();
	initAccordion();
	initNewsFilter();
	initCarousels();
	initModal();
	initForm();
	initNewsletter();
	initYearAndTop();
	initSearchHighlightStyle();

	// Close mega menu on resize into mobile
	window.addEventListener("resize", () => {
		if (!isDesktop()) closeAllMega();
	});
});




// _______________________The End ___________________
