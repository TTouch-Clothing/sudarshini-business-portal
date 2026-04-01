import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Pencil,
  Trash2,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import http from "../api/http";
import { Card, LoadingBlock } from "../components/UI";

const PAGE_SIZE = 20;

export default function OrdersPage() {
  const [rows, setRows] = useState(null);
  const [search, setSearch] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [page, setPage] = useState(1);

  const [deleteId, setDeleteId] = useState(null);
  const [deleteOrderNumber, setDeleteOrderNumber] = useState("");

  const [editOrder, setEditOrder] = useState(null);
  const [editQty, setEditQty] = useState(0);
  const [editTotal, setEditTotal] = useState(0);
  const [editPP, setEditPP] = useState(0);
  const [editDC, setEditDC] = useState(0);

  async function load(keyword = "") {
    const { data } = await http.get("/orders");
    const q = String(keyword || "")
      .trim()
      .toLowerCase();

    if (!q) {
      setRows(data);
      setPage(1);
      return;
    }

    const filtered = data.filter((order) =>
      String(order.orderId || "")
        .toLowerCase()
        .includes(q),
    );

    setRows(filtered);
    setPage(1);
  }

  useEffect(() => {
    load("");
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      load(search);
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  async function remove(id) {
    await http.delete(`/orders/${id}`);
    toast.success("Order deleted");
    setDeleteId(null);
    setDeleteOrderNumber("");
    load(search);
  }

  async function updateOrder() {
    if (!editOrder) return;

    await http.put(`/orders/${editOrder._id}`, {
      total: Number(editTotal),
      productPrice: Number(editPP),
      deliveryCharge: Number(editDC),
      items: (editOrder.items || []).map((item, index) => {
        if (index === 0) {
          return { ...item, quantity: Number(editQty) };
        }
        return item;
      }),
    });

    toast.success("Order updated");
    setEditOrder(null);
    setEditQty(0);
    setEditTotal(0);
    setEditPP(0);
    setEditDC(0);
    load(search);
  }

  function getUniqueItems(items = []) {
    const map = new Map();

    for (const item of items) {
      const key = item.sku || item.productName || item.imageUrl;
      if (!map.has(key)) {
        map.set(key, item);
      }
    }

    return [...map.values()];
  }

  function formatDateTime(value) {
    if (!value) return "-";

    const date = new Date(value);

    return date.toLocaleString("en-BD", {
      timeZone: "Asia/Dhaka",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  const totalOrders = rows?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalOrders / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    if (!rows) return [];
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);

  if (!rows) return <LoadingBlock lines={8} />;

  return (
    <>
      <Card
        title={`Orders (${totalOrders})`}
        right={
          <div className="prediction-toolbar">
            <div className="prediction-search-box">
              <Search size={16} className="prediction-search-icon" />

              <input
                placeholder="Search by Order ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="prediction-search-input"
              />

              {search && (
                <button
                  type="button"
                  className="prediction-clear-btn"
                  onClick={() => {
                    setSearch("");
                    load("");
                  }}
                  title="Clear"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        }
      >
        <table className="table">
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Day &amp; Time</th>
              <th>Image</th>
              <th>SKU</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Address</th>
              <th className="text-center">PP</th>
              <th className="text-center">DC</th>
              <th className="text-center">Total</th>
              <th className="text-center">Quantity</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedRows.map((o) => {
              const uniqueItems = getUniqueItems(o.items || []);
              const skuText = uniqueItems
                .map((item) => item.sku)
                .filter(Boolean)
                .join(", ");

              const qty = (o.items || []).reduce(
                (sum, item) => sum + Number(item.quantity || 0),
                0,
              );

              return (
                <tr key={o._id}>
                  <td>{o.orderId}</td>
                  <td>{o.orderDateText || formatDateTime(o.orderDate)}</td>

                  <td>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      {uniqueItems.map((item, index) =>
                        item.imageUrl ? (
                          <img
                            key={`${o._id}-${item.sku || index}`}
                            src={item.imageUrl}
                            alt={item.productName || "product"}
                            title={item.productName || ""}
                            onClick={() => setPreviewImage(item.imageUrl)}
                            style={{
                              width: 45,
                              height: 45,
                              objectFit: "cover",
                              borderRadius: 8,
                              border: "1px solid #e5e7eb",
                              cursor: "pointer",
                            }}
                          />
                        ) : null,
                      )}
                    </div>
                  </td>

                  <td>{skuText || "-"}</td>
                  <td>{o.customerName}</td>
                  <td>{o.phone}</td>
                  <td>{o.address || "-"}</td>
                  <td className="text-center">{o.productPrice ?? "-"}</td>
                  <td className="text-center">{o.deliveryCharge ?? "-"}</td>
                  <td className="text-center">{o.total ?? "-"}</td>
                  <td className="text-center">{qty}</td>

                  <td>
                    <div className="actions">
                      <button
                        className="icon-btn"
                        title="Edit"
                        onClick={() => {
                          setEditOrder(o);
                          setEditQty(qty);
                          setEditTotal(o.total || 0);
                          setEditPP(o.productPrice || 0);
                          setEditDC(o.deliveryCharge || 0);
                        }}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        className="icon-btn danger"
                        title="Delete"
                        onClick={() => {
                          setDeleteId(o._id);
                          setDeleteOrderNumber(o.orderId);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {!paginatedRows.length && (
              <tr>
                <td colSpan={12} style={{ textAlign: "center", padding: 24 }}>
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>

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
            Total Orders: {totalOrders}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              className="icon-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              title="Previous"
              type="button"
            >
              <ChevronLeft size={16} />
            </button>

            <div style={{ minWidth: 90, textAlign: "center", fontWeight: 700 }}>
              {page} / {totalPages}
            </div>

            <button
              className="icon-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              title="Next"
              type="button"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </Card>

      {previewImage && (
        <div
          onClick={() => setPreviewImage("")}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              background: "#fff",
              padding: 16,
              borderRadius: 16,
              maxWidth: "90vw",
              maxHeight: "90vh",
            }}
          >
            <button
              type="button"
              className="icon-btn danger"
              onClick={() => setPreviewImage("")}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                zIndex: 2,
              }}
            >
              <X size={18} />
            </button>

            <img
              src={previewImage}
              alt="Preview"
              style={{
                maxWidth: "80vw",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: 12,
                display: "block",
              }}
            />
          </div>
        </div>
      )}

      {deleteId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 30,
              borderRadius: 14,
              width: 340,
              textAlign: "center",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginBottom: 15 }}>Delete Order</h3>

            <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.6 }}>
              Are you sure you want to delete order <b>{deleteOrderNumber}</b>?
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 12,
                marginTop: 20,
              }}
            >
              <button
                onClick={() => {
                  setDeleteId(null);
                  setDeleteOrderNumber("");
                }}
                style={{
                  background: "#e5e7eb",
                  color: "#111827",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>

              <button
                onClick={() => remove(deleteId)}
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {editOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 30,
              borderRadius: 14,
              width: 360,
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginBottom: 20, textAlign: "center" }}>
              Edit Order {editOrder.orderId}
            </h3>

            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Quantity
                </label>
                <input
                  type="number"
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 10,
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Product Price (PP)
                </label>
                <input
                  type="number"
                  value={editPP}
                  onChange={(e) => setEditPP(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 10,
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Delivery charge (DC)
                </label>
                <input
                  type="number"
                  value={editDC}
                  onChange={(e) => setEditDC(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 10,
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Total Amount
                </label>
                <input
                  type="number"
                  value={editTotal}
                  onChange={(e) => setEditTotal(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 10,
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 22,
              }}
            >
              <button
                onClick={() => {
                  setEditOrder(null);
                  setEditQty(0);
                  setEditTotal(0);
                  setEditPP(0);
                  setEditDC(0);
                }}
                style={{
                  background: "#e5e7eb",
                  color: "#111827",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>

              <button
                onClick={updateOrder}
                style={{
                  background: "#315efb",
                  color: "#fff",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
