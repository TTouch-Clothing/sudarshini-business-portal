import { useEffect, useMemo, useState } from "react";
import { Search, ArrowLeft, X } from "lucide-react";
import http from "../api/http";
import { Card, LoadingBlock } from "../components/UI";

export default function PredictionPage() {
  const [data, setData] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchPrediction = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await http.get("/prediction");

        if (isMounted) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Prediction error:", err);

        let message = "Failed to load prediction";

        if (err.code === "ECONNABORTED") {
          message = "Prediction request timed out. Please try again.";
        } else if (err.response?.data?.message) {
          message = err.response.data.message;
        } else if (err.message) {
          message = err.message;
        }

        if (isMounted) {
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPrediction();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") {
        setPreviewImage(null);
      }
    }

    if (previewImage) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => window.removeEventListener("keydown", handleEsc);
  }, [previewImage]);

  const baseRows = useMemo(() => {
    if (!data) return [];
    return showAll ? data.allItems || [] : data.items || [];
  }, [data, showAll]);

  const rows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return baseRows;

    return baseRows.filter((r) => {
      const sku = String(r.sku || "").toLowerCase();
      const productName = String(r.productName || "").toLowerCase();
      return sku.includes(keyword) || productName.includes(keyword);
    });
  }, [baseRows, search]);

  if (loading) {
    return <LoadingBlock lines={7} />;
  }

  if (error) {
    return (
      <Card title="SKU Demand Forecast">
        <div
          style={{
            padding: "24px",
            textAlign: "center",
            color: "#dc2626",
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card
        title="SKU Demand Forecast"
        right={
          <div className="prediction-toolbar">
            <div className="prediction-search-box">
              <Search size={16} className="prediction-search-icon" />
              <input
                type="text"
                placeholder="Search by SKU code or product name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="prediction-search-input"
              />
              {search && (
                <button
                  type="button"
                  className="prediction-clear-btn"
                  onClick={() => setSearch("")}
                  title="Clear"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {showAll ? (
              <button
                type="button"
                className="prediction-back-btn"
                onClick={() => {
                  setShowAll(false);
                  setSearch("");
                }}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                className="primary-btn small"
                onClick={() => setShowAll(true)}
              >
                View SKU Forecast
              </button>
            )}
          </div>
        }
      >
        <div style={{ overflowX: "auto" }}>
          <table className="table prediction-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th>Image</th>
                <th className="text-center">5 Day</th>
                <th className="text-center">Expected</th>
                <th className="text-center">Actual</th>
                <th className="text-center">Month</th>
                <th className="text-center">Expected</th>
                <th className="text-center">Actual</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>

            <tbody>
              {rows.length ? (
                rows.map((r, index) => {
                  const imageSrc = r.image || r.imageUrl;

                  return (
                    <tr key={r.sku || `${r.productName}-${index}`}>
                      <td>{r.sku || "-"}</td>
                      <td>{r.productName || "-"}</td>

                      <td>
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={r.productName || "Product"}
                            className="prediction-thumb"
                            onClick={() => setPreviewImage(imageSrc)}
                          />
                        ) : (
                          <div className="prediction-no-image">No Image</div>
                        )}
                      </td>

                      <td className="text-center">
                        {r.fiveDay?.rangeLabel || "-"}
                      </td>

                      <td className="text-center">
                        {r.fiveDay?.expected ?? 0}
                      </td>

                      <td className="text-center">
                        {r.fiveDay?.actual ?? 0}
                      </td>

                      <td className="text-center">
                        {r.month?.rangeLabel || "-"}
                      </td>

                      <td className="text-center">
                        {r.month?.expected ?? 0}
                      </td>

                      <td className="text-center">
                        {r.month?.actual ?? 0}
                      </td>

                      <td className="text-center">
                        <span
                          className={`status-badge ${
                            String(r.status).toLowerCase() === "fast"
                              ? "fast"
                              : String(r.status).toLowerCase() === "normal"
                              ? "normal"
                              : "slow"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center muted"
                    style={{ padding: 24 }}
                  >
                    No SKU found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {previewImage && (
        <div
          className="image-modal-overlay"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="image-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="image-modal-close"
              onClick={() => setPreviewImage(null)}
            >
              ✕
            </button>

            <img
              src={previewImage}
              alt="Preview"
              className="image-modal-preview"
            />
          </div>
        </div>
      )}
    </>
  );
}