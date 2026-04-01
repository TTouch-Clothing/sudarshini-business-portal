import { useEffect, useMemo, useState } from "react";
import {
  X,
  CalendarDays,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import http from "../api/http";
import { Card, LoadingBlock, StatCard } from "../components/UI";

const PAGE_SIZE = 10;

function getDhakaNow() {
  const dhakaNowString = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Dhaka",
  });
  return new Date(dhakaNowString);
}

function getDefaultValue(type) {
  const now = getDhakaNow();

  if (type === "day") {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  if (type === "month") {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }

  return String(now.getFullYear());
}

export default function PeriodPage({ type, title }) {
  const [value, setValue] = useState(getDefaultValue(type));
  const [data, setData] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [page, setPage] = useState(1);

  const load = () =>
    http.get(`/dashboard/period/${type}`, { params: { value } }).then((r) => {
      setData(r.data);
      setPage(1);
    });

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") setPreviewImage(null);
    }

    if (previewImage) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => window.removeEventListener("keydown", handleEsc);
  }, [previewImage]);

  const totalProducts = data?.bestProducts?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));

  const paginatedProducts = useMemo(() => {
    if (!data?.bestProducts) return [];
    const start = (page - 1) * PAGE_SIZE;
    return data.bestProducts.slice(start, start + PAGE_SIZE);
  }, [data, page]);

  if (!data) return <LoadingBlock lines={7} />;

  return (
    <>
      <div className="page-grid">
        <Card
          title={title}
          right={
            <div className="period-filter">
              <div className="period-filter-input-wrap">
                <CalendarDays size={18} className="period-filter-icon" />
                <input
                  className="period-filter-input"
                  type={
                    type === "year"
                      ? "number"
                      : type === "month"
                        ? "month"
                        : "date"
                  }
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={
                    type === "year"
                      ? "Enter year"
                      : type === "month"
                        ? "Select month"
                        : "Select date"
                  }
                />
              </div>

              <button
                className="primary-btn small period-search-btn"
                onClick={load}
              >
                <Search size={16} />
                <span>Search</span>
              </button>
            </div>
          }
        >
          <div className="stats-row">
            <StatCard label="Total Orders" value={data.totalOrders} />
            <StatCard label="Total Quantity" value={data.totalQuantity} />
            <StatCard label="Total Revenue" value={data.totalRevenue} />
          </div>
        </Card>

        <Card title="Best Product List">
          <div style={{ overflowX: "auto" }}>
            <table className="table best-product-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Image</th>
                  {/* <th className="text-center">Total Orders</th> */}
                  <th className="text-center">Total Quantity</th>
                </tr>
              </thead>

              <tbody>
                {paginatedProducts.length ? (
                  paginatedProducts.map((p) => {
                    const imageSrc =
                      p.image || p.imageUrl || p.productImage || "";

                    return (
                      <tr key={p.sku}>
                        <td>{p.sku}</td>
                        <td>{p.productName}</td>

                        <td>
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={p.productName}
                              className="product-thumb"
                              onClick={() => setPreviewImage(imageSrc)}
                            />
                          ) : (
                            <div className="product-no-image">No Image</div>
                          )}
                        </td>

                        {/* <td className="text-center">{p.orderCount ?? 0}</td> */}
                        <td className="text-center">{p.totalQuantity ?? 0}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center muted"
                      style={{ padding: 20 }}
                    >
                      No data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 16,
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ color: "#6b7280", fontWeight: 600 }}>
              Total Products: {totalProducts}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                className="icon-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                type="button"
                title="Previous"
              >
                <ChevronLeft size={16} />
              </button>

              <div
                style={{ minWidth: 90, textAlign: "center", fontWeight: 700 }}
              >
                {page} / {totalPages}
              </div>

              <button
                className="icon-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                type="button"
                title="Next"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </Card>
      </div>

      {previewImage && (
        <div
          className="image-modal-overlay"
          onClick={() => setPreviewImage(null)}
        >
          <div className="image-modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              className="image-modal-close"
              onClick={() => setPreviewImage(null)}
            >
              <X size={20} />
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
