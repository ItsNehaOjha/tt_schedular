// frontend/src/components/TeacherSelect.jsx
// Axios-only, BUSY teachers disabled, searchable with priority,
// filters legacy entries (blank name or empty teacherId),
// cache invalidation supported via a window event.

import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../utils/api";

let TEACHER_CACHE = null;
function invalidateTeacherCache() { TEACHER_CACHE = null; }

export default function TeacherSelect({
  value,
  onChange,
  day,
  slotKey,
  timeSlot,
  departmentFilter,
  disabled = false,
  placeholder = "Select teacher...",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [busyIds, setBusyIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [busyLoading, setBusyLoading] = useState(false);
  const containerRef = useRef(null);

  // Allow external invalidation after "Add Teacher"
  useEffect(() => {
    const handler = () => invalidateTeacherCache();
    window.addEventListener("teacher-cache-invalidate", handler);
    return () => window.removeEventListener("teacher-cache-invalidate", handler);
  }, []);

  // Load list (cached)
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoading(true);
        setLoadErr("");
        if (!TEACHER_CACHE) {
          const res = await api.get("/teachers/list");
          const data = res.data;

          const normalized = (data?.data || []).map((t) => ({
            id: t.id || t._id || String(t.teacherId || t.name || Math.random()),
            name: t.name || t.displayName || `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim(),
            teacherId: t.teacherId || "",
            department: t.department || "",
            isActive: t.isActive !== false,
          }))
          // filter legacy/invalid entries
          .filter(t => t.name && t.name.trim() !== "")
          .filter(t => t.teacherId && t.teacherId.trim() !== "");

          TEACHER_CACHE = normalized;
        }
        if (!alive) return;
        setTeachers(TEACHER_CACHE);
      } catch (err) {
        if (!alive) return;
        console.error("TeacherSelect: failed to load teachers", err);
        setLoadErr(err?.message || "Failed to load teachers");
        setTeachers([]);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, []);

  // Load busy for this slot when menu opens
  useEffect(() => {
    if (!open || !day || (!slotKey && !timeSlot)) return;
    let alive = true;
    async function loadBusy() {
      try {
        setBusyLoading(true);
        const res = await api.get("/timetable/clash", {
          params: {
            day,
            slotKey: slotKey ? String(slotKey) : undefined,
            timeSlot: !slotKey && timeSlot ? String(timeSlot) : undefined,
          },
        });
        if (!alive) return;
        setBusyIds(new Set((res.data?.busyTeachers || []).map(String)));
      } catch (err) {
        if (!alive) return;
        console.warn("TeacherSelect: busy check failed (non-blocking)", err);
        setBusyIds(new Set());
      } finally {
        if (alive) setBusyLoading(false);
      }
    }
    loadBusy();
    return () => { alive = false; };
  }, [open, day, slotKey, timeSlot]);

  // Search + ranking: startsWith gets higher priority than contains
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = (teachers || [])
      .filter(t => t.isActive)
      .filter(t => (departmentFilter ? t.department === departmentFilter : true));

    if (!q) return base.sort((a,b) => (a.name||"").localeCompare(b.name||""));

    const score = (t) => {
      const n = (t.name||"").toLowerCase();
      const id = (t.teacherId||"").toLowerCase();
      const d = (t.department||"").toLowerCase();
      // Higher score = earlier
      if (n.startsWith(q)) return 3;
      if (id.startsWith(q)) return 3;
      if (n.includes(q)) return 2;
      if (id.includes(q) || d.includes(q)) return 1;
      return 0;
    };

    return base
      .map(t => ({ t, s: score(t) }))
      .filter(x => x.s > 0)
      .sort((x, y) => y.s - x.s || (x.t.name||"").localeCompare(y.t.name||""))
      .map(x => x.t);
  }, [teachers, departmentFilter, query]);

  // Close on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function handlePick(t) {
    if (busyIds.has(String(t.id))) return;
    onChange?.({ id: t.id, name: t.name, teacherId: t.teacherId, department: t.department });
    setOpen(false);
  }

  function clearSelection(e) { e.stopPropagation(); onChange?.(null); }

  return (
    <div ref={containerRef} style={styles.wrap}>
      <div
        style={{
          ...styles.control,
          ...(disabled ? styles.controlDisabled : {}),
          ...(open ? styles.controlOpen : {}),
        }}
        onClick={() => !disabled && setOpen(o => !o)}
      >
        <div style={styles.valueText}>
          {value?.name ? (
            <>
              {value.name}{value.teacherId ? " • " + value.teacherId : ""}
            </>
          ) : (
            <span style={styles.placeholder}>{loading ? "Loading teachers…" : placeholder}</span>
          )}
        </div>
        <div style={styles.actions}>
          {value?.name && <button title="Clear" onClick={clearSelection} style={styles.clearBtn}>×</button>}
          <span style={styles.chevron}>{open ? "▴" : "▾"}</span>
        </div>
      </div>

      {loadErr && <div style={styles.errorLine}>{loadErr}</div>}

      {open && !disabled && (
        <div style={styles.menu}>
          <div style={styles.searchRow}>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={busyLoading ? "Checking clashes…" : "Search name, ID or dept…"}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.list}>
            {filtered.length === 0 && <div style={styles.empty}>No teachers match.</div>}
            {filtered.map((t) => {
              const isBusy = busyIds.has(String(t.id));
              return (
                <div
                  key={t.id}
                  title={isBusy ? "Already assigned in this slot" : ""}
                  onClick={() => !isBusy && handlePick(t)}
                  style={{ ...styles.item, ...(isBusy ? styles.itemBusy : {}) }}
                >
                 <div style={styles.itemLine1}>
                      <span>{t.name}</span>
                      {isBusy && <span style={styles.busyBadge}>BUSY</span>}
                    </div>

                    <div style={styles.itemLine2}>
                      <span>{t.department || "—"}</span>
                      {t.teacherId && <span> • {t.teacherId}</span>}
                    </div>

                    {/* 🧩 Add visible class info below busy teacher */}
                    {isBusy && (
  <>
    {t.classLabel && (
      <div style={{ fontSize: 11, color: "#b10000", marginTop: 2 }}>
        {t.classLabel}
      </div>
    )}
    {t.classDetail && (
      <div style={{ fontSize: 10, color: "#d33", opacity: 0.8 }}>
        {t.classDetail}
      </div>
    )}
  </>
)}


                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// No shorthand/individual conflicts → removes React warning
const styles = {
  wrap: { position: "relative", width: "100%" },
  control: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    minHeight: 38,
    borderWidth: 1, borderStyle: "solid", borderColor: "#d0d7de",
    borderRadius: 8, padding: "6px 10px",
    cursor: "pointer", background: "#fff", userSelect: "none",
  },
  controlOpen: { borderColor: "#6e9fff", boxShadow: "0 0 0 2px rgba(110,159,255,0.15)" },
  controlDisabled: { background: "#f5f5f5", color: "#aaa", cursor: "not-allowed" },
  valueText: { overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" },
  placeholder: { color: "#888" },
  actions: { display: "flex", gap: 6, alignItems: "center" },
  clearBtn: { border: "none", background: "transparent", fontSize: 16, lineHeight: 1, cursor: "pointer" },
  chevron: { fontSize: 12, opacity: 0.7 },
  errorLine: { marginTop: 6, color: "#b10000", fontSize: 12 },
  menu: {
    position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
    background: "#fff", borderWidth: 1, borderStyle: "solid", borderColor: "#d0d7de",
    borderRadius: 8, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
    zIndex: 1000,
  },
  searchRow: { padding: 8, borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "#eee" },
  searchInput: { width: "100%", padding: "8px 10px", borderRadius: 6, borderWidth: 1, borderStyle: "solid", borderColor: "#d0d7de", outline: "none" },
  list: { maxHeight: 260, overflowY: "auto", padding: 6 },
  item: { padding: "8px 10px", borderRadius: 6, cursor: "pointer" },
  itemBusy: { opacity: 0.55, background: "#fafafa", color: "#888", cursor: "not-allowed" },
  itemLine1: { display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 600, fontSize: 14 },
  itemLine2: { fontSize: 12, color: "#666", marginTop: 2 },
  busyBadge: { fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 999, background: "#ffe3e3", color: "#b10000", marginLeft: 8 },
  empty: { padding: 10, color: "#777", textAlign: "center" },
};
