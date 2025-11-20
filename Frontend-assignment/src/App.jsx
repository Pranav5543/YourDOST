import React, { useEffect, useState, useMemo } from "react";

export default function UserDirectoryApp() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("first_name");
  const [sortDir, setSortDir] = useState("asc");
  const [filterLetter, setFilterLetter] = useState("");
  const [filterDomain, setFilterDomain] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const abort = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      setError("");

      const url =
        import.meta.env.MODE === "production"
          ? `https://reqres.in/api/users?page=${page}`
          : `/api/users?page=${page}`;

      try {
        const res = await fetch(url, {
          signal: abort.signal,
          mode: "cors",
          credentials: "omit",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const j = await res.json();
        if (!j.data || !Array.isArray(j.data)) {
          throw new Error("Invalid API response structure");
        }

        setUsers(j.data);
        setTotalPages(j.total_pages || 1);
        setError(""); // Clear any previous errors
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error("Fetch error:", e);
          setError(`Failed to load users: ${e.message}`);
          setUsers([]);
          setTotalPages(1);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => abort.abort();
  }, [page]);

  // Derived / filtered list
  const filtered = useMemo(() => {
    let list = users.slice();
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (u) =>
          `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q)
      );
    }
    if (filterLetter) {
      list = list.filter(
        (u) =>
          (u.first_name || "")[0]?.toLowerCase() === filterLetter.toLowerCase()
      );
    }
    if (filterDomain) {
      list = list.filter((u) => (u.email || "").endsWith(`@${filterDomain}`));
    }

    // sort
    list.sort((a, b) => {
      const A = (a[sortBy] || "").toLowerCase();
      const B = (b[sortBy] || "").toLowerCase();
      if (A < B) return sortDir === "asc" ? -1 : 1;
      if (A > B) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [users, query, sortBy, sortDir, filterLetter, filterDomain]);

  const domains = useMemo(() => {
    const s = new Set();
    users.forEach((u) => {
      const parts = (u.email || "").split("@");
      if (parts[1]) s.add(parts[1]);
    });
    return Array.from(s);
  }, [users]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>User Directory</h1>
          <p style={styles.subtitle}>
            Discover and connect with users effortlessly
          </p>
        </header>

        {error && <div style={styles.error}>{error}</div>}

        <section style={styles.controls}>
          <div style={styles.searchContainer}>
            <input
              placeholder="Search by name or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.spacer}></div>

          <div style={styles.filtersContainer}>
            <div style={styles.filterGroup}>
              <label style={styles.label}>Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={styles.select}
              >
                <option value="first_name">First name</option>
                <option value="last_name">Last name</option>
                <option value="email">Email</option>
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.label}>Direction</label>
              <select
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value)}
                style={styles.select}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.label}>First Letter</label>
              <input
                placeholder="e.g. A"
                value={filterLetter}
                onChange={(e) => setFilterLetter(e.target.value)}
                style={styles.inputSmall}
              />
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.label}>Domain</label>
              <select
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value)}
                style={styles.select}
              >
                <option value="">(any)</option>
                {domains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.filterGroup}>
              <button
                onClick={() => {
                  setQuery("");
                  setFilterDomain("");
                  setFilterLetter("");
                  setSortBy("first_name");
                  setSortDir("asc");
                }}
                style={styles.clearBtn}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </section>

        <main style={styles.main}>
          {loading ? (
            <div style={styles.loading}>
              <div style={styles.spinner} />
              <div style={styles.loadingText}>Loading users...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>👤</div>
              No users found.
            </div>
          ) : (
            <div style={styles.grid}>
              {filtered.map((u, index) => (
                <div
                  key={u.id}
                  style={{ ...styles.card, animationDelay: `${index * 0.1}s` }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(-15px) scale(1.03) rotateX(5deg)";
                    e.currentTarget.style.boxShadow =
                      "0 20px 50px rgba(0,0,0,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(0) scale(1) rotateX(0deg)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 30px rgba(0,0,0,0.2)";
                  }}
                >
                  <div style={styles.cardHeader}>
                    <img src={u.avatar} alt="avatar" style={styles.avatar} />
                  </div>
                  <div style={styles.cardBody}>
                    <h3 style={styles.cardName}>
                      {u.first_name} {u.last_name}
                    </h3>
                    <p style={styles.cardEmail}>{u.email}</p>
                  </div>
                  <div style={styles.cardFooter}>
                    <a href={`mailto:${u.email}`} style={styles.emailBtn}>
                      Email
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={styles.pagination}>
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              style={
                page === 1
                  ? { ...styles.pageBtn, ...styles.pageBtnDisabled }
                  : styles.pageBtn
              }
            >
              First
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={
                page === 1
                  ? { ...styles.pageBtn, ...styles.pageBtnDisabled }
                  : styles.pageBtn
              }
            >
              Prev
            </button>
            <span style={styles.pageInfo}>
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={
                page === totalPages
                  ? { ...styles.pageBtn, ...styles.pageBtnDisabled }
                  : styles.pageBtn
              }
            >
              Next
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              style={
                page === totalPages
                  ? { ...styles.pageBtn, ...styles.pageBtnDisabled }
                  : styles.pageBtn
              }
            >
              Last
            </button>
          </div>
        </main>

        <footer style={styles.footer}>
          Tip: Try searching "emma" or filter domain to see results.
        </footer>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    fontFamily:
      "'Inter', 'Segoe UI', Roboto, -apple-system, BlinkMacSystemFont, sans-serif",
    background: "#000",
    minHeight: "100vh",
    padding: "0px",
    color: "#ffffffff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    animation: "fadeIn 1s ease-in-out",
  },
  container: {
    width: "100%",
    maxWidth: "1400px",
    padding: "10 20px",
    background: "black",
  },
  header: {
    textAlign: "center",
    marginBottom: "40px",
    color: "#ffffffff",
    animation: "slideDown 0.8s ease-out",
  },
  title: {
    margin: 0,
    fontSize: "3rem",
    fontWeight: 800,
    background: "linear-gradient(45deg, #ffd700, #ffed4e)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    textShadow: "0 4px 8px rgba(0,0,0,0.3)",
    marginBottom: "10px",
    letterSpacing: "2px",
  },
  subtitle: {
    margin: 0,
    fontSize: "1.2rem",
    opacity: 0.9,
    fontWeight: 400,
    color: "#e0e0e0",
  },
  error: {
    background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)",
    border: "1px solid #ff4757",
    color: "#fff",
    padding: "20px",
    borderRadius: "16px",
    marginBottom: "30px",
    boxShadow: "0 8px 25px rgba(255, 107, 107, 0.4)",
    textAlign: "center",
    fontWeight: 600,
    animation: "shake 0.5s ease-in-out",
  },

  input: {
    width: "100%",
    padding: "15px 20px",
    borderRadius: "12px",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    fontSize: "16px",
    transition: "all 0.3s ease",
    background: "rgba(255, 255, 255, 0.1)",
    color: "#fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    outline: "none",
  },
  inputSmall: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    fontSize: "14px",
    transition: "all 0.3s ease",
    background: "rgba(255, 255, 255, 0.1)",
    color: "#fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    outline: "none",
  },
  filtersContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    alignItems: "end",
    animation: "slideUp 0.8s ease-out 0.4s both",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#ffd700",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  select: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    fontSize: "14px",
    background: "rgba(126, 125, 125, 0.1)",
    color: "#535353ff",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    cursor: "pointer",
    outline: "none",
  },
  clearBtn: {
    padding: "14px 24px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
    color: "#000",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 6px 20px rgba(255, 215, 0, 0.4)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontSize: "14px",
  },
  main: {
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(20px)",
    borderRadius: "20px",
    marginTop: "20px",
    padding: "40px",
    boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    width: "100%",
    maxWidth: "1200px",
    animation: "slideUp 0.8s ease-out 0.6s both",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "25px",
    marginBottom: "40px",
  },
  card: {
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "16px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
    overflow: "hidden",
    transition: "all 0.4s ease",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    animation: "fadeInUp 0.6s ease-out both",
  },
  cardHeader: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "25px",
    textAlign: "center",
  },
  avatar: {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "4px solid #fff",
    boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
  },
  cardBody: {
    padding: "25px",
    textAlign: "center",
  },
  cardName: {
    margin: "0 0 10px 0",
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#fff",
  },
  cardEmail: {
    margin: 0,
    fontSize: "1rem",
    color: "#e0e0e0",
    wordBreak: "break-all",
  },
  cardFooter: {
    padding: "20px 25px",
    background: "rgba(0,0,0,0.2)",
    textAlign: "center",
  },
  emailBtn: {
    display: "inline-block",
    padding: "12px 24px",
    background: "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
    color: "#000",
    textDecoration: "none",
    borderRadius: "10px",
    fontWeight: 700,
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(255, 215, 0, 0.4)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontSize: "14px",
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "15px",
    flexWrap: "wrap",
  },
  pageBtn: {
    padding: "12px 18px",
    borderRadius: "10px",
    border: "2px solid #ffd700",
    background: "rgba(255, 255, 255, 0.1)",
    color: "#ffd700",
    cursor: "pointer",
    fontWeight: 700,
    transition: "all 0.3s ease",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontSize: "14px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  },
  pageBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
    background: "rgba(255, 255, 255, 0.05)",
    borderColor: "#666",
    color: "#666",
  },
  pageInfo: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#ffd700",
    margin: "0 15px",
  },
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 20px",
  },
  spinner: {
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    border: "6px solid rgba(255, 255, 255, 0.3)",
    borderTop: "6px solid #ffd700",
    animation: "spin 1s linear infinite",
    marginBottom: "25px",
  },
  loadingText: {
    fontSize: "20px",
    color: "#e0e0e0",
    fontWeight: 600,
  },
  empty: {
    textAlign: "center",
    padding: "80px 20px",
    color: "#e0e0e0",
  },
  emptyIcon: {
    fontSize: "5rem",
    marginBottom: "25px",
    opacity: 0.8,
  },
  footer: {
    textAlign: "center",
    marginTop: "40px",
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: "14px",
    animation: "fadeIn 1s ease-in-out 1s both",
  },
  spacer: {
    height: "20px",
  },
};

// small runtime CSS injection for keyframes (works in single-file preview)
// small runtime CSS injection for keyframes (works in single-file preview)
const styleEl = document.createElement("style");
styleEl.innerHTML = `
  /* FIX WHITE BORDER */
  html, body {
    margin: 0;
    padding: 0;
    background: #000; /* full black */
  }

  @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideDown { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes fadeInUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
`;
document.head.appendChild(styleEl);
