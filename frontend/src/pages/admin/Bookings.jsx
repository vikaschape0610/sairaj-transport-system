import { useState, useEffect } from "react";
import { adminApi } from "../../api/axios";
import { useSocket } from "../../context/SocketContext";
import { useToast } from "../../context/ToastContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [trucks, setTrucks] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dlMenu, setDlMenu] = useState(false);
  const socket = useSocket();
  const { showToast } = useToast();

  const fetchBookings = async () => {
    try {
      const res = await adminApi.get("/bookings");
      if (res.data.success) setBookings(res.data.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleCreated = () => fetchBookings();

    const handleUpdated = () => {
      console.log("📡 Update event received");
      fetchBookings();
    };

    // 🔥 ADD THIS
    const handleDeleted = (data) => {
      console.log("🗑️ Delete event received:", data);

      if (!data || !data.bookingId) return;

      fetchBookings(); // simplest + safest
    };

    socket.on("bookingCreated", handleCreated);
    socket.on("bookingUpdated", handleUpdated);
    socket.on("bookingDeleted", handleDeleted); // ✅ NEW

    return () => {
      socket.off("bookingCreated", handleCreated);
      socket.off("bookingUpdated", handleUpdated);
      socket.off("bookingDeleted", handleDeleted); // ✅ CLEANUP
    };
  }, [socket]);

  const openUpdateModal = async (booking) => {
    setModal({
      booking,
      status: "",
      truck_id: booking.truck_id || "",
      driver_id: booking.driver_id || "",
    });
    try {
      const [tRes, dRes] = await Promise.all([
        adminApi.get(`/trucks/unassigned`),
        adminApi.get(`/drivers/available`),
      ]);
      setTrucks(tRes.data.data || []);
      setDrivers(dRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async () => {
    if (!modal) return;
    const body = {};
    if (modal.status) body.status = modal.status;
    if (modal.truck_id !== (modal.booking.truck_id || ""))
      body.truck_id = modal.truck_id || null;
    if (modal.driver_id !== (modal.booking.driver_id || ""))
      body.driver_id = modal.driver_id || null;
    if (Object.keys(body).length === 0) {
      showToast("Nothing to update.", "info");
      return;
    }
    try {
      const res = await adminApi.put(
        `/bookings/${modal.booking.booking_id}`,
        body,
      );
      if (res.data.success) {
        showToast("Booking updated!", "success");
        setModal(null);
        fetchBookings();
      } else showToast(res.data.message, "error");
    } catch (err) {
      showToast(err.response?.data?.message || "Update failed.", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete booking ${id}?`)) return;
    try {
      const res = await adminApi.delete(`/bookings/${id}`);
      if (res.data.success) {
        showToast("Deleted!", "success");
        fetchBookings();
      } else showToast(res.data.message, "error");
    } catch (err) {
      showToast("Delete failed.", "error");
    }
  };

  const transitions = {
    Pending: ["Confirmed", "Cancelled"],
    Confirmed: ["In Transit", "Cancelled"],
    "In Transit": ["Delivered"],
    Delivered: [],
    Cancelled: [],
  };
  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const filtered = bookings.filter((b) => {
    if (filter && b.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        (b.booking_id || "").toLowerCase().includes(s) ||
        (b.user_name || "").toLowerCase().includes(s) ||
        (b.pickup_location || "").toLowerCase().includes(s) ||
        (b.destination || "").toLowerCase().includes(s)
      );
    }
    return true;
  });

  // ─── PDF Download ─────────────────────────────────────────────
  const downloadPDF = (mode) => {
    setDlMenu(false);
    const isColor = true;
    const title = filter ? `${filter} Bookings` : "All Bookings";
    const doc = new jsPDF({ orientation: "landscape" });

    // Header
    if (isColor) {
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, 297, 28, "F");
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(10, 28, 287, 28);
      doc.setTextColor(0, 0, 0);
    }
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Sairaj Transport - Report", 14, 14);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(title, 14, 21);
    doc.text(
      `${new Date().toLocaleString("en-IN")}  •  ${filtered.length} records`,
      283,
      14,
      { align: "right" },
    );

    // Status color map
    const statusColors = {
      Pending: [245, 158, 11],
      Confirmed: [37, 99, 235],
      "In Transit": [139, 92, 246],
      Delivered: [22, 163, 74],
      Cancelled: [220, 38, 38],
    };

    // Table
    const head = [
      [
        "#",
        "Booking ID",
        "Customer",
        "Route",
        "Goods",
        "Wt",
        "Truck Type",
        "Status",
        "Pickup Date",
        "Delivery Date",
        "Truck",
        "Driver",
        "Notes",
      ],
    ];
    const body = filtered.map((b, i) => [
      i + 1,
      b.booking_id,
      b.user_name || "—",
      `${b.pickup_location}\n|\n${b.destination}`,
      b.goods_type,
      `${b.weight_tons}T`,
      b.preferred_truck_type || "—",
      b.status,
      formatDate(b.pickup_date),
      formatDate(b.final_delivery_date),
      b.truck_number || "—",
      b.driver_name || "—",
      (b.notes || "—").substring(0, 40),
    ]);

    autoTable(doc, {
      startY: 34,
      head,
      body,
      theme: "grid",
      styles: {
        overflow: "linebreak", //
      },
      headStyles: {
        fillColor: isColor ? [30, 58, 138] : [220, 220, 220],
        textColor: isColor ? 255 : 0,
        fontStyle: "bold",
        fontSize: 7.5,
        cellPadding: 3,
      },
      bodyStyles: { fontSize: 7.5, cellPadding: 3, textColor: [31, 41, 55] },
      alternateRowStyles: {
        fillColor: isColor ? [249, 250, 251] : [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { fontStyle: "bold", cellWidth: 22 },
        3: { cellWidth: 45, halign: "center" },
        11: { cellWidth: 30 },
      },
      didParseCell: (data) => {
        // Color status cells
        if (isColor && data.section === "body" && data.column.index === 7) {
          const sc = statusColors[data.cell.raw] || [107, 114, 128];
          data.cell.styles.textColor = sc;
          data.cell.styles.fontStyle = "bold";
        }
      },
      margin: { left: 10, right: 10 },
    });

    // Footer
    const y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text("Generated by Sairaj Transport Admin Panel", 148.5, y, {
      align: "center",
    });

    const fileName = `Sairaj_${title.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
    try {
      doc.save(fileName);
      showToast(`Downloaded: ${fileName}`, "success");
    } catch (e) {
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Downloaded: ${fileName}`, "success");
    }
  };

  return (
    <div className="page-scroll">
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          Manage Bookings
        </h1>
        <div className="dl-menu-wrap">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => downloadPDF("color")}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PDF
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {dlMenu && (
            <div className="dl-dropdown">
              <button onClick={() => downloadPDF("color")}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                Color Report (PDF)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--gray-400)"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="form-input"
            placeholder="Search bookings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-input form-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ maxWidth: 180 }}
        >
          <option value="">All Statuses</option>
          <option>Pending</option>
          <option>Confirmed</option>
          <option>In Transit</option>
          <option>Delivered</option>
          <option>Cancelled</option>
        </select>
        <span className="admin-count">{filtered.length} bookings</span>
      </div>

      {loading ? (
        <div className="loading-text">Loading...</div>
      ) : (
        <div className="admin-card">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Route</th>
                  <th>Goods</th>
                  <th>Weight</th>
                  <th>Truck Type</th>
                  <th>Pickup</th>
                  <th>Delivery</th>
                  <th>Status</th>
                  <th>Truck</th>
                  <th>Driver</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.booking_id}>
                    <td>
                      <strong>{b.booking_id}</strong>
                    </td>
                    <td>
                      {b.user_name || "—"}
                      <br />
                      <small className="text-muted">{b.user_phone || ""}</small>
                    </td>
                    <td className="td-route">
                      <span className="route-from">{b.pickup_location}</span>
                      <span className="route-arrow">↓</span>
                      <span className="route-to">{b.destination}</span>
                    </td>
                    <td>{b.goods_type}</td>
                    <td>{b.weight_tons}T</td>
                    <td>{b.preferred_truck_type || "—"}</td>
                    <td>{formatDate(b.pickup_date)}</td>
                    <td>{formatDate(b.final_delivery_date)}</td>
                    <td>
                      <span
                        className={`status-badge status-${(b.status || "").replace(/\s+/g, "-")}`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td>{b.truck_number || "—"}</td>
                    <td>{b.driver_name || "—"}</td>
                    <td className="td-notes">
                      {b.notes ? (
                        <span title={b.notes}>
                          {b.notes.substring(0, 30)}
                          {b.notes.length > 30 ? "..." : ""}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="table-actions">
                      {transitions[b.status]?.length > 0 && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => openUpdateModal(b)}
                          title="Update"
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(b.booking_id)}
                        title="Delete"
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Update: {modal.booking.booking_id}</h2>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-input form-select"
                value={modal.status}
                onChange={(e) => setModal({ ...modal, status: e.target.value })}
              >
                <option value="">— No change —</option>
                {(transitions[modal.booking.status] || []).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            {/* ✅ Assign truck/driver ONLY for Confirmed — not Pending */}
            {modal.booking.status === "Confirmed" && (
              <>
                <div className="form-group">
                  <label className="form-label">Assign Truck</label>
                  <select
                    className="form-input form-select"
                    value={modal.truck_id}
                    onChange={(e) =>
                      setModal({ ...modal, truck_id: e.target.value })
                    }
                  >
                    <option value="">— Select Truck —</option>
                    {trucks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.truck_number} ({t.type}, {t.capacity_tons}T)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Assign Driver</label>
                  <select
                    className="form-input form-select"
                    value={modal.driver_id}
                    onChange={(e) =>
                      setModal({ ...modal, driver_id: e.target.value })
                    }
                  >
                    <option value="">— Select Driver —</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.phone})
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleUpdate}>
                Update
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setModal(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
