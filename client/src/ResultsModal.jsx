import React, { useEffect } from "react";
import "./ResultsModal.css";

const confidenceColor = { high: "#22c55e", medium: "#f59e0b", low: "#ef4444" };
const confidenceIcon  = { high: "✦", medium: "◈", low: "◇" };

function PercentBar({ value, color = "var(--accent)" }) {
  return (
    <div className="rm-bar-track">
      <div
        className="rm-bar-fill"
        style={{ width: `${Math.min(100, Math.max(0, value ?? 0))}%`, background: color }}
      />
    </div>
  );
}

// ---- Stock Count result (simple) ----
function StockCountResult({ result, brand, containerType }) {
  const { count, confidence, notes } = result;
  return (
    <div className="rm-stock-result">
      <div className="rm-count-circle">
        <span className="rm-count-number">{count}</span>
      </div>
      <p className="rm-count-label">{brand} {containerType}{count !== 1 ? "s" : ""}</p>
      <span
        className="rm-confidence-badge"
        style={{ background: confidenceColor[confidence] ?? "#6b7280" }}
      >
        {confidenceIcon[confidence]} {confidence} confidence
      </span>
      <p className="rm-notes">"{notes}"</p>
    </div>
  );
}

// ---- Share of Shelf result (full breakdown) ----
function ShareOfShelfResult({ result, brand, containerType }) {
  const { count, confidence, notes, totalShelves, facingPercentage, shelves = [] } = result;
  const label = `${brand} ${containerType}`;

  return (
    <>
      {/* Summary cards */}
      <section className="rm-section">
        <p className="rm-section-label">Overall summary</p>
        <div className="rm-summary-grid">
          <div className="rm-stat-card rm-stat-accent">
            <span className="rm-stat-value">{count}</span>
            <span className="rm-stat-label">Total units</span>
          </div>
          <div className="rm-stat-card">
            <span className="rm-stat-value">{totalShelves ?? "—"}</span>
            <span className="rm-stat-label">Shelf levels</span>
          </div>
          <div className="rm-stat-card">
            <span className="rm-stat-value">{facingPercentage != null ? `${facingPercentage}%` : "—"}</span>
            <span className="rm-stat-label">Facing share</span>
          </div>
        </div>

        {facingPercentage != null && (
          <div className="rm-bar-wrap" style={{ marginTop: "0.75rem" }}>
            <div className="rm-bar-labels">
              <span>Overall {label} facing</span>
              <span>{facingPercentage}%</span>
            </div>
            <PercentBar value={facingPercentage} />
          </div>
        )}

        <p className="rm-notes">"{notes}"</p>
      </section>

      {/* Per-shelf breakdown */}
      {shelves.length > 0 && (
        <section className="rm-section">
          <p className="rm-section-label">Per-shelf breakdown</p>
          <div className="rm-shelf-list">
            {shelves.map((shelf) => (
              <div key={shelf.shelfNumber} className="rm-shelf-card">
                <div className="rm-shelf-header">
                  <div className="rm-shelf-num-badge">Shelf {shelf.shelfNumber}</div>
                  <span className="rm-shelf-note">{shelf.notes}</span>
                </div>
                <div className="rm-shelf-stats">
                  <div className="rm-shelf-stat">
                    <span className="rm-shelf-stat-value">{shelf.count}</span>
                    <span className="rm-shelf-stat-label">units</span>
                  </div>
                  <div className="rm-shelf-stat">
                    <span className="rm-shelf-stat-value">
                      {shelf.facingPercentage != null ? `${shelf.facingPercentage}%` : "—"}
                    </span>
                    <span className="rm-shelf-stat-label">facing</span>
                  </div>
                  <div className="rm-shelf-bar-wrap">
                    <PercentBar
                      value={shelf.facingPercentage ?? 0}
                      color={
                        (shelf.facingPercentage ?? 0) >= 60 ? "#22c55e" :
                        (shelf.facingPercentage ?? 0) >= 30 ? "#f59e0b" : "#ef4444"
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

// ---- Modal wrapper ----
export default function ResultsModal({ result, brand, containerType, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!result) return null;

  const isShareOfShelf = result.mode === "share_of_shelf";
  const modeLabel = isShareOfShelf ? "Share of Shelf" : "Stock Count";

  return (
    <div className="rm-backdrop" onClick={onClose}>
      <div className="rm-sheet" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="rm-header">
          <div>
            <p className="rm-header-sub">{modeLabel} · {brand} {containerType}</p>
            <h2 className="rm-header-title">Analysis Results</h2>
          </div>
          <button className="rm-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div className="rm-body">
          {isShareOfShelf
            ? <ShareOfShelfResult result={result} brand={brand} containerType={containerType} />
            : <StockCountResult result={result} brand={brand} containerType={containerType} />
          }
        </div>

        {/* Footer */}
        <div className="rm-footer">
          <button className="rm-btn-close" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
