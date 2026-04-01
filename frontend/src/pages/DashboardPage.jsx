// import { useEffect, useState } from "react";
// import {
//   ResponsiveContainer,
//   AreaChart,
//   Area,
//   XAxis,
//   YAxis,
//   Tooltip
// } from "recharts";
// import http from "../api/http";
// import { Card, LoadingBlock, StatCard } from "../components/UI";

// export default function DashboardPage() {
//   const [data, setData] = useState(null);

//   useEffect(() => {
//     http.get("/dashboard/summary").then((r) => setData(r.data));
//   }, []);

//   if (!data) return <LoadingBlock lines={8} />;

//   return (
//     <div className="page-grid">
//       <div className="stats-row">
//         <StatCard
//           label={`Today Orders • ${data.today.dateLabel}`}
//           value={data.today.orders}
//         />
//         <StatCard label="Today Quantity" value={data.today.quantity} />
//         <StatCard label="Today Revenue" value={data.today.revenue} />
//       </div>

//       <div className="dashboard-top">
//         <Card title="Sales Overview">
//           <div style={{ width: "100%", height: 280 }}>
//             <ResponsiveContainer>
//               <AreaChart data={data.overview}>
//                 <XAxis dataKey="label" />
//                 <YAxis />
//                 <Tooltip />
//                 <Area
//                   type="monotone"
//                   dataKey="revenue"
//                   stroke="#2563eb"
//                   fill="#bfdbfe"
//                 />
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>
//         </Card>

//         <div className="side-stats">
//           <StatCard label="VIP Customers" value={data.vipCustomers} />
//           <StatCard label="New Customers" value={data.newCustomers} />
//         </div>
//       </div>

//       <div className="three-col">
//         <Card title="Latest Orders">
//           <table className="table">
//             <thead>
//               <tr>
//                 <th>Order ID</th>
//                 <th>Date &amp; Time</th>
//                 <th>Customer</th>
//               </tr>
//             </thead>
//             <tbody>
//               {data.latestOrders.map((o) => (
//                 <tr key={o._id}>
//                   <td>{o.orderId}</td>
//                   {/* <td>{formatDateTime(o.orderDate)}</td> */}
//                   <td>{o.orderDateText || "-"}</td>
//                   <td>{o.customerName}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </Card>

//         <Card title="Top Selling SKUs">
//           <table className="table">
//             <thead>
//               <tr>
//                 <th>SKU</th>
//                 <th>Product</th>
//                 <th>Qty</th>
//               </tr>
//             </thead>
//             <tbody>
//               {data.topSellingSkus.map((p) => (
//                 <tr key={p.sku}>
//                   <td>{p.sku}</td>
//                   <td>{p.productName}</td>
//                   <td>{p.totalQuantity}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </Card>

//         <Card title="Least Selling Products">
//           <table className="table">
//             <thead>
//               <tr>
//                 <th>SKU</th>
//                 <th>Product</th>
//                 <th>Qty</th>
//               </tr>
//             </thead>
//             <tbody>
//               {data.leastSellingProducts.map((p) => (
//                 <tr key={p.sku}>
//                   <td>{p.sku}</td>
//                   <td>{p.productName}</td>
//                   <td>{p.totalQuantity}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </Card>
//       </div>
//     </div>
//   );
// }


import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";
import { X } from "lucide-react";
import http from "../api/http";
import { Card, LoadingBlock, StatCard } from "../components/UI";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    http.get("/dashboard/summary").then((r) => setData(r.data));
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

  if (!data) return <LoadingBlock lines={8} />;

  return (
    <>
      <div className="page-grid">
        <div className="stats-row">
          <StatCard
            label={`Today Orders • ${data.today.dateLabel}`}
            value={data.today.orders}
          />
          <StatCard label="Today Quantity" value={data.today.quantity} />
          <StatCard label="Today Revenue" value={data.today.revenue} />
        </div>

        <div className="dashboard-top">
          <Card title="Sales Overview">
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <AreaChart data={data.overview}>
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    fill="#bfdbfe"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="side-stats">
            <StatCard label="VIP Customers" value={data.vipCustomers} />
            <StatCard label="New Customers" value={data.newCustomers} />
          </div>
        </div>

        <div className="three-col">
          <Card title="Latest Orders">
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date &amp; Time</th>
                    <th>Customer</th>
                  </tr>
                </thead>
                <tbody>
                  {data.latestOrders.map((o) => (
                    <tr key={o._id}>
                      <td>{o.orderId}</td>
                      <td>{o.orderDateText || "-"}</td>
                      <td>{o.customerName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Top Selling SKUs">
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Image</th>
                    <th>Product</th>
                    <th>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topSellingSkus.map((p, index) => {
                    const imageSrc = p.image || p.imageUrl;

                    return (
                      <tr key={p.sku || `${p.productName}-${index}`}>
                        <td>{p.sku || "-"}</td>

                        <td>
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={p.productName || "Product"}
                              style={{
                                width: 44,
                                height: 44,
                                objectFit: "cover",
                                borderRadius: 8,
                                cursor: "pointer",
                                border: "1px solid #e5e7eb"
                              }}
                              onClick={() => setPreviewImage(imageSrc)}
                            />
                          ) : (
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 8,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "#f3f4f6",
                                color: "#6b7280",
                                fontSize: 12
                              }}
                            >
                              No Image
                            </div>
                          )}
                        </td>

                        <td>{p.productName || "-"}</td>
                        <td>{p.totalQuantity ?? 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Least Selling Products">
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Image</th>
                    <th>Product</th>
                    <th>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {data.leastSellingProducts.map((p, index) => {
                    const imageSrc = p.image || p.imageUrl;

                    return (
                      <tr key={p.sku || `${p.productName}-${index}`}>
                        <td>{p.sku || "-"}</td>

                        <td>
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={p.productName || "Product"}
                              style={{
                                width: 44,
                                height: 44,
                                objectFit: "cover",
                                borderRadius: 8,
                                cursor: "pointer",
                                border: "1px solid #e5e7eb"
                              }}
                              onClick={() => setPreviewImage(imageSrc)}
                            />
                          ) : (
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 8,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "#f3f4f6",
                                color: "#6b7280",
                                fontSize: 12
                              }}
                            >
                              No Image
                            </div>
                          )}
                        </td>

                        <td>{p.productName || "-"}</td>
                        <td>{p.totalQuantity ?? 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 24
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh"
            }}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              style={{
                position: "absolute",
                top: -14,
                right: -14,
                width: 36,
                height: 36,
                borderRadius: "9999px",
                border: "none",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
              }}
            >
              <X size={18} />
            </button>

            <img
              src={previewImage}
              alt="Preview"
              style={{
                maxWidth: "90vw",
                maxHeight: "90vh",
                borderRadius: 16,
                objectFit: "contain",
                background: "#fff",
                display: "block"
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}