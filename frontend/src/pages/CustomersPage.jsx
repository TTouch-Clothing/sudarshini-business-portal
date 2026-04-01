import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import http from '../api/http';
import { Card, LoadingBlock } from '../components/UI';

const PAGE_SIZE = 15;

export default function CustomersPage() {
  const [rows, setRows] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    http.get('/dashboard/customers').then((r) => setRows(r.data));
  }, []);

  const totalCustomers = rows?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalCustomers / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    if (!rows) return [];
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);

  if (!rows) return <LoadingBlock lines={6} />;

  return (
    <Card title={`Customers (${totalCustomers})`}>
      <table className='table'>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Address</th>
            <th>Phone</th>
            <th className='text-center'>Orders</th>
            <th className='text-center'>Quantity</th>
            <th className='text-center'>Amount Pay</th>
          </tr>
        </thead>

        <tbody>
          {paginatedRows.map((r, index) => (
            <tr key={r._id || r.phone || index}>
              <td>{r.customerName || r.name || '-'}</td>
              <td>{r.address || '-'}</td>
              <td>{r.phone || '-'}</td>
              <td className='text-center'>{r.totalOrders ?? 0}</td>
              <td className='text-center'>{r.totalQuantity ?? 0}</td>
              <td className='text-center'>{r.totalAmount ?? 0}</td>
            </tr>
          ))}

          {!paginatedRows.length && (
            <tr>
              <td colSpan={6} className='text-center' style={{ padding: 24 }}>
                No customers found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 16,
          gap: 12,
          flexWrap: 'wrap'
        }}
      >
        <div style={{ color: '#6b7280', fontWeight: 600 }}>
          Total Customers: {totalCustomers}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className='icon-btn'
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            title='Previous'
            type='button'
          >
            <ChevronLeft size={16} />
          </button>

          <div style={{ minWidth: 90, textAlign: 'center', fontWeight: 700 }}>
            {page} / {totalPages}
          </div>

          <button
            className='icon-btn'
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            title='Next'
            type='button'
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </Card>
  );
}