import { useState, useEffect, useRef } from "react";
import { adminApi } from "../../api/axios";
import { useToast } from "../../context/ToastContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    adminApi
      .get("/reports")
      .then((res) => {
        if (res.data.success) setData(res.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const downloadPDF = () => {
    if (!data) return;
    const isColor = true;
    const doc = new jsPDF({ orientation: "portrait" });
    const pageW = 210;

    // === HEADER ===
    if (isColor) {
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, pageW, 35, "F");
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setFillColor(240, 240, 240);
      doc.rect(0, 0, pageW, 35, "F");
      doc.setTextColor(0, 0, 0);
    }
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Sairaj Transport", 14, 16);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Reports & Analytics", 14, 24);
    doc.setFontSize(8);
    doc.text(new Date().toLocaleString("en-IN"), pageW - 14, 16, {
      align: "right",
    });
    doc.setTextColor(
      isColor ? 200 : 100,
      isColor ? 200 : 100,
      isColor ? 200 : 100,
    );

    let y = 44;

    // === STATUS BREAKDOWN ===
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Booking Status Breakdown", 14, y);
    y += 8;

    const statusColors = {
      Pending: [245, 158, 11],
      Confirmed: [37, 99, 235],
      "In Transit": [139, 92, 246],
      Delivered: [22, 163, 74],
      Cancelled: [220, 38, 38],
    };
    const totalBookings = (data.byStatus || []).reduce(
      (sum, s) => sum + Number(s.count),
      0,
    );

    autoTable(doc, {
      startY: y,
      head: [["Status", "Count", "Percentage"]],
      body: (data.byStatus || []).map((s) => [
        s.status,
        String(s.count),
        `${totalBookings ? ((s.count / totalBookings) * 100).toFixed(2) : "0.00"}%`,
      ]),
      theme: "grid",
      headStyles: {
        fillColor: isColor ? [30, 58, 138] : [200, 200, 200],
        textColor: isColor ? 255 : 0,
        fontStyle: "bold",
        fontSize: 9,
        cellPadding: 4,
        halign: "center",
      },
      bodyStyles: { fontSize: 9, cellPadding: 4, textColor: [31, 41, 55], halign: "center" },
      alternateRowStyles: {
        fillColor: isColor ? [249, 250, 251] : [245, 245, 245],
      },
      didParseCell: (hookData) => {
        if (
          isColor &&
          hookData.section === "body" &&
          hookData.column.index === 0
        ) {
          const sc = statusColors[hookData.cell.raw] || [107, 114, 128];
          hookData.cell.styles.textColor = sc;
          hookData.cell.styles.fontStyle = "bold";
        }
      },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 14;

    // === MONTHLY TREND ===
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(31, 41, 55);
    doc.text("Monthly Bookings (Last 6 Months)", 14, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["Month", "Total Bookings"]],
      body: (data.monthly || []).map((m) => [m.month, String(m.total)]),
      theme: "grid",

      headStyles: {
        fillColor: isColor ? [30, 58, 138] : [200, 200, 200],
        textColor: isColor ? 255 : 0,
        fontStyle: "bold",
        fontSize: 9,
        cellPadding: 4,
        halign: "center",
      },
      bodyStyles: { fontSize: 9, cellPadding: 4, halign: "center" },
      alternateRowStyles: {
        fillColor: isColor ? [249, 250, 251] : [245, 245, 245],
      },
      columnStyles: {
        0: { halign: "center" },
        1: { fontStyle: "bold", halign: "center" },
      },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 14;

    // === TOP ROUTES ===
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(31, 41, 55);
    doc.text("Top Routes", 14, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["#", "From", "To", "Total Bookings"]],
      body: (data.topRoutes || []).map((r, i) => [
        i + 1,
        r.pickup_location,
        r.destination,
        String(r.total),
      ]),
      theme: "grid",
      headStyles: {
        fillColor: isColor ? [30, 58, 138] : [200, 200, 200],
        textColor: isColor ? 255 : 0,
        fontStyle: "bold",
        fontSize: 9,
        cellPadding: 4,
        halign: "center",
      },
      bodyStyles: { fontSize: 9, cellPadding: 4, halign: "center" },
      alternateRowStyles: {
        fillColor: isColor ? [249, 250, 251] : [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { halign: "center" },
        2: { halign: "center" },
        3: { fontStyle: "bold", halign: "center" },
      },
      margin: { left: 14, right: 14 },
    });

    // === FOOTER ===
    const finalY = doc.lastAutoTable.finalY + 12;
    doc.setDrawColor(229, 231, 235);
    doc.line(14, finalY, pageW - 14, finalY);
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(
      "Generated by Sairaj Transport Admin Panel",
      pageW / 2,
      finalY + 7,
      { align: "center" },
    );
    doc.text("Chhatrapati Sambhajinagar, Maharashtra", pageW / 2, finalY + 12, {
      align: "center",
    });

    const fileName = `Sairaj_Analytics_Report_${new Date().toISOString().slice(0, 10)}.pdf`;

    // Direct download - no print dialog
    try {
      doc.save(fileName);
      showToast(`Downloaded: ${fileName}`, "success");
    } catch (e) {
      // Fallback: create blob URL and download
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

  if (loading) return <div className="loading-text">Loading reports...</div>;
  if (!data) return <div className="error-box">Failed to load reports.</div>;

  const statusColors = {
    Pending: "#f59e0b",
    Confirmed: "#3b82f6",
    "In Transit": "#8b5cf6",
    Delivered: "#22c55e",
    Cancelled: "#ef4444",
  };

  const totalBookings = (data.byStatus || []).reduce(
    (sum, s) => sum + Number(s.count),
    0,
  );

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
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Reports &amp; Analytics
        </h1>

        {/* Download dropdown */}
        <button
          className="btn btn-primary btn-sm"
          onClick={() => downloadPDF()}
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
        </button>
      </div>

      {/* Status Breakdown */}
      <div className="admin-card">
        <h2 className="admin-card-title">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Booking Status Breakdown
        </h2>
        <div className="report-status-grid">
          {(data.byStatus || []).map((s) => (
            <div className="report-status-item" key={s.status}>
              <div className="report-status-info" style={{ marginBottom: 4 }}>
                <span
                  className="report-status-name"
                  style={{ color: statusColors[s.status] }}
                >
                  {s.status}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="report-status-count">{s.count}</span>
                  <span
                    style={{ fontSize: ".72rem", color: "var(--gray-400)" }}
                  >
                    {totalBookings
                      ? `${((s.count / totalBookings) * 100).toFixed(2)}%`
                      : "0.00%"}
                  </span>
                </span>
              </div>
              <div className="report-status-bar">
                <div
                  className="report-status-fill"
                  style={{
                    width: `${totalBookings ? (s.count / totalBookings) * 100 : 0}%`,
                    backgroundColor: statusColors[s.status] || "#6b7280",
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="admin-card">
        <h2 className="admin-card-title">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Monthly Bookings (Last 6 Months)
        </h2>
        <div className="report-monthly">
          {(data.monthly || []).map((m) => {
            const maxCount = Math.max(
              ...(data.monthly || []).map((x) => x.total),
              1,
            );
            return (
              <div className="report-bar-item" key={m.month}>
                <div className="report-bar-label">{m.month}</div>
                <div className="report-bar-track">
                  <div
                    className="report-bar-fill"
                    style={{ width: `${(m.total / maxCount) * 100}%` }}
                  ></div>
                </div>
                <div className="report-bar-value">{m.total}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Routes */}
      <div className="admin-card">
        <h2 className="admin-card-title">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12h18m-9-9l9 9-9 9" />
          </svg>
          Top Routes
        </h2>
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>From</th>
                <th>To</th>
                <th>Total Bookings</th>
              </tr>
            </thead>
            <tbody>
              {(data.topRoutes || []).map((r, i) => (
                <tr key={i}>
                  <td>
                    <strong>{i + 1}</strong>
                  </td>
                  <td>{r.pickup_location}</td>
                  <td>{r.destination}</td>
                  <td>
                    <strong style={{ color: "var(--blue-600)" }}>
                      {r.total}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </div>
  );
}
