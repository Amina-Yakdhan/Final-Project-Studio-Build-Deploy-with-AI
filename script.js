/* ============================================================
   StreamBox — TMDB-powered movie browser
   ============================================================
   1) Get a free TMDB API key: https://www.themoviedb.org/settings/api
   2) Paste it below (v3 API Key — 32 hex chars).
      OR use a v4 Read Access Token (starts with "eyJ") in TMDB_BEARER.
   ============================================================ */

const TMDB_API_KEY = "de6b393adcc974a011e1eea3067d213a";
const TMDB_BEARER  = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkZTZiMzkzYWRjYzk3NGEwMTFlMWVlYTMwNjdkMjEzYSIsIm5iZiI6MTc4Mzg4MzM0Ny44OTUsInN1YiI6IjZhNTNlNjUzYmQyODg1NzQxODM0NzY0ZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.BtQP8bWrNro1w6uGXwAnqN2IklPnD17E6IO9SQ_wYvs"; // optional: v4 token starting with "eyJ..."

const IMG = "https://image.tmdb.org/t/p";

const ROWS = [
    { title: "Trending This Week", anchor: "trending", path: "/trending/movie/week" },
    { title: "Popular",             anchor: "popular",  path: "/movie/popular" },
    { title: "Top Rated",           anchor: "top",      path: "/movie/top_rated" },
    { title: "Coming Soon",         anchor: "soon",     path: "/movie/upcoming" },
];

async function tmdb(path) {
    const usingBearer = !!TMDB_BEARER;
    const url = usingBearer
        ? `https://api.themoviedb.org/3${path}`
        : `https://api.themoviedb.org/3${path}${path.includes("?") ? "&" : "?"}api_key=${TMDB_API_KEY}`;

    const res = await fetch(url, {
        headers: usingBearer
            ? { Authorization: `Bearer ${TMDB_BEARER}`, accept: "application/json" }
            : { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    return res.json();
}

function movieCard(m) {
    const card = document.createElement("a");
    card.className = "card";
    card.href = `https://www.themoviedb.org/movie/${m.id}`;
    card.target = "_blank";
    card.rel = "noreferrer";
    card.title = `Open ${m.title} on TMDB`;

    const poster = m.poster_path
        ? `${IMG}/w500${m.poster_path}`
        : "";
    const year = m.release_date ? m.release_date.slice(0, 4) : "—";
    const rating = m.vote_average ? m.vote_average.toFixed(1) : "—";

    card.innerHTML = `
        ${poster ? `<img src="${poster}" alt="${m.title}" loading="lazy">` : `<div style="height:250px;background:#222;display:flex;align-items:center;justify-content:center;color:#666">No image</div>`}
        <div class="card-info">
            <h4>${m.title}</h4>
            <div class="meta">★ ${rating} · ${year}</div>
        </div>
    `;
    return card;
}

function renderRow({ title, anchor, movies }) {
    const wrap = document.createElement("div");
    wrap.id = anchor;
    wrap.innerHTML = `<h3 class="section-title">${title}</h3>`;
    const row = document.createElement("div");
    row.className = "row";
    movies.forEach((m) => row.appendChild(movieCard(m)));
    wrap.appendChild(row);
    return wrap;
}

function renderHero(m) {
    if (!m) return;
    const hero = document.getElementById("hero");
    const backdrop = m.backdrop_path ? `${IMG}/original${m.backdrop_path}` : "";
    if (backdrop) hero.style.backgroundImage = `url(${backdrop})`;
    document.getElementById("heroTitle").textContent = m.title;
    document.getElementById("heroDesc").textContent = m.overview || "";
    document.getElementById("heroBtn").href = `https://www.themoviedb.org/movie/${m.id}`;
}

function showNotice(html) {
    document.getElementById("app").innerHTML = `<div class="notice">${html}</div>`;
}

async function loadHome() {
    if (!TMDB_API_KEY || TMDB_API_KEY.startsWith("PASTE_")) {
        if (!TMDB_BEARER) {
            showNotice(`Add your free TMDB API key in <code>script.js</code> (see the top of the file).<br><br>
                Get one at <a href="https://www.themoviedb.org/settings/api" target="_blank" style="color:#e50914">themoviedb.org/settings/api</a>.`);
            return;
        }
    }

    try {
        const results = await Promise.all(ROWS.map((r) => tmdb(r.path)));
        const app = document.getElementById("app");
        app.innerHTML = "";

        // Hero from first trending movie with a backdrop
        const featured = (results[0].results || []).find((m) => m.backdrop_path);
        renderHero(featured);

        ROWS.forEach((r, i) => {
            app.appendChild(renderRow({ ...r, movies: results[i].results || [] }));
        });
    } catch (err) {
        showNotice(`Couldn't load movies (${err.message}). Double-check your TMDB key.`);
    }
}

/* --- Search --- */
const searchInput = document.getElementById("search");
let searchTimer;
searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    const q = e.target.value.trim();
    if (!q) { loadHome(); return; }
    searchTimer = setTimeout(() => runSearch(q), 300);
});

async function runSearch(q) {
    try {
        const data = await tmdb(`/search/movie?query=${encodeURIComponent(q)}`);
        const app = document.getElementById("app");
        app.innerHTML = `<h3 class="section-title">Results for “${q}”</h3>`;
        if (!data.results || data.results.length === 0) {
            app.innerHTML += `<div class="notice">No movies found.</div>`;
            return;
        }
        const grid = document.createElement("div");
        grid.className = "grid";
        data.results.forEach((m) => grid.appendChild(movieCard(m)));
        app.appendChild(grid);
    } catch (err) {
        showNotice(`Search failed (${err.message}).`);
    }
}

/* --- PWA install (service worker) --- */
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("sw.js").catch(() => {});
    });
}

loadHome();
