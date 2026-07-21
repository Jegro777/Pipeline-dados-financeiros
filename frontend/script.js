/**
 * cotacao.dev — script.js
 * Responsável por:
 *  1. Buscar cotações na API própria (FastAPI, http://127.0.0.1:8000/api/cotacoes) e atualizar o dashboard
 *  2. Comportamento da navbar (menu mobile, destaque do link ativo)
 *  3. Animações de revelação ao rolar a página
 */

(function () {
    "use strict";

    /* ------------------------------------------------------------------ *
     * Configuração
     * ------------------------------------------------------------------ */
    const CONFIG = {
        // API própria (FastAPI) — o navegador não fala mais direto com CoinGecko/AwesomeAPI.
        backendUrl: "http://127.0.0.1:8000/api/cotacoes",
        refreshIntervalMs: 30000, // 30s
    };

    const formatterBRL = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    });

    const formatterUSD = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    });

    const formatTime = (date) =>
        date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    // Mapeia cada código retornado pelo backend para o elemento e o formato certo.
    const MOEDA_MAP = {
        "BTC-BRL": { valueId: "btc-brl", updatedId: "btc-updated", format: formatterBRL.format },
        "BTC-USD": { valueId: "btc-usd", updatedId: "btc-updated", format: formatterUSD.format },
        "ETH-BRL": { valueId: "eth-brl", updatedId: "eth-updated", format: formatterBRL.format },
        "ETH-USD": { valueId: "eth-usd", updatedId: "eth-updated", format: formatterUSD.format },
        "USD-BRL": { valueId: "usd-brl", updatedId: "usd-updated", format: formatterBRL.format },
        "EUR-BRL": { valueId: "eur-brl", updatedId: "eur-updated", format: formatterBRL.format },
    };

    /* ------------------------------------------------------------------ *
     * Helpers de DOM
     * ------------------------------------------------------------------ */
    const $ = (id) => document.getElementById(id);

    function setValue(id, text) {
        const el = $(id);
        if (!el) return;
        el.textContent = text;
        el.removeAttribute("data-error");
    }

    function setUpdatedNow(id) {
        const el = $(id);
        if (!el) return;
        const now = new Date();
        el.textContent = formatTime(now);
        el.setAttribute("datetime", now.toISOString());
    }

    function setStatus(state, message) {
        const el = $("dashboard-status");
        if (!el) return;
        el.textContent = message;
        el.setAttribute("data-state", state);
    }

    /* ------------------------------------------------------------------ *
     * Fetch: API própria (FastAPI)
     * Espera um array como [{ moeda: "USD-BRL", valor: 5.40 }, ...]
     * ------------------------------------------------------------------ */
    async function fetchCotacoes() {
        try {
            const res = await fetch(CONFIG.backendUrl);
            if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);

            const dados = await res.json();
            let atualizouAlgo = false;

            // Resiliência: se um item não vier na resposta (ex: falha ao extrair o Bitcoin
            // hoje), o card correspondente simplesmente mantém o último valor exibido —
            // um item ausente nunca apaga ou quebra os demais.
            for (const item of dados) {
                const alvo = MOEDA_MAP[item.moeda];
                if (!alvo) continue;

                setValue(alvo.valueId, alvo.format(Number(item.valor)));
                setUpdatedNow(alvo.updatedId);
                atualizouAlgo = true;
            }

            if (!atualizouAlgo) {
                console.warn("[cotacao.dev] O backend respondeu, mas sem nenhuma cotação reconhecida.");
                setStatus("error", "A API respondeu sem dados reconhecidos. Verifique o backend.");
                return;
            }

            setStatus("ok", "Cotações atualizadas.");
        } catch (err) {
            // Mantém os últimos valores válidos na tela — só o aviso de status muda.
            console.error("[cotacao.dev] Erro ao conectar com a API local:", err);
            setStatus("error", "Não foi possível conectar à API local (http://127.0.0.1:8000). Tentando novamente em instantes.");
        }
    }

    function initDashboard() {
        if (!$("crypto-container")) return;
        fetchCotacoes();
        setInterval(fetchCotacoes, CONFIG.refreshIntervalMs);
    }

    /* ------------------------------------------------------------------ *
     * Navbar: menu mobile
     * ------------------------------------------------------------------ */
    function initNav() {
        const toggle = $("nav-toggle");
        const links = $("nav-links");
        if (!toggle || !links) return;

        const closeMenu = () => {
            links.classList.remove("is-open");
            toggle.setAttribute("aria-expanded", "false");
        };

        const openMenu = () => {
            links.classList.add("is-open");
            toggle.setAttribute("aria-expanded", "true");
        };

        toggle.addEventListener("click", () => {
            const isOpen = links.classList.contains("is-open");
            isOpen ? closeMenu() : openMenu();
        });

        links.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", closeMenu);
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeMenu();
        });

        document.addEventListener("click", (e) => {
            if (!links.contains(e.target) && !toggle.contains(e.target)) {
                closeMenu();
            }
        });
    }

    /* ------------------------------------------------------------------ *
     * Destaque do link ativo na navbar conforme a rolagem
     * ------------------------------------------------------------------ */
    function initActiveNavHighlight() {
        const sections = document.querySelectorAll("main section[id]");
        const navAnchors = document.querySelectorAll(".nav-links a");
        if (!sections.length || !navAnchors.length) return;

        const map = new Map();
        navAnchors.forEach((a) => map.set(a.getAttribute("href").slice(1), a));

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const link = map.get(entry.target.id);
                    if (!link) return;
                    if (entry.isIntersecting) {
                        navAnchors.forEach((a) => a.removeAttribute("aria-current"));
                        link.setAttribute("aria-current", "true");
                    }
                });
            },
            { rootMargin: "-40% 0px -50% 0px" }
        );

        sections.forEach((section) => observer.observe(section));
    }

    /* ------------------------------------------------------------------ *
     * Revelação suave ao rolar
     * ------------------------------------------------------------------ */
    function initRevealOnScroll() {
        const items = document.querySelectorAll(".reveal");
        if (!items.length) return;

        const observer = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        obs.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15 }
        );

        items.forEach((item) => observer.observe(item));
    }

    /* ------------------------------------------------------------------ *
     * Init
     * ------------------------------------------------------------------ */
    document.addEventListener("DOMContentLoaded", () => {
        const yearEl = $("year");
        if (yearEl) yearEl.textContent = new Date().getFullYear();

        initNav();
        initActiveNavHighlight();
        initRevealOnScroll();
        initDashboard();
    });
})();