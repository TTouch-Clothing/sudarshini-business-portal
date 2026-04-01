import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import http from "../api/http";
import { Card, LoadingBlock } from "../components/UI";

const PAGE_SIZE = 25;

export default function UserLogsPage() {
  const [rows, setRows] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    http.get("/dashboard/logs").then((r) => setRows(r.data));
  }, []);

  function formatDateTime(value) {
    if (!value) return "-";

    return new Date(value).toLocaleString("en-BD", {
      timeZone: "Asia/Dhaka",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  }

  const totalLogs = rows?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalLogs / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    if (!rows) return [];
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);

  if (!rows) return <LoadingBlock lines={6} />;

  return (
    <Card title={`User Logs (${totalLogs})`}>
      <table className="table">
        <thead>
          <tr>
            <th>User</th>
            <th>Action</th>
            <th className="text-center">Time</th>
            <th>IP</th>
          </tr>
        </thead>

        <tbody>
          {paginatedRows.map((r) => (
            <tr key={r._id}>
              <td>{r.userName}</td>
              <td>{r.action}</td>
              <td className="text-center">{formatDateTime(r.createdAt)}</td>
              <td>{r.ipAddress}</td>
            </tr>
          ))}

          {!paginatedRows.length && (
            <tr>
              <td colSpan={4} style={{ textAlign: "center", padding: 24 }}>
                No logs found
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
          flexWrap: "wrap"
        }}
      >
        <div style={{ color: "#6b7280", fontWeight: 600 }}>
          Total Logs: {totalLogs}
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
  );
}