import { useState, useEffect } from "react";
import { adminApi } from "../../api/axios";
import { useToast } from "../../context/ToastContext";

// Derive backend base URL from VITE_API_URL (strips /api suffix)
// Works in both local dev (http://localhost:5001/api) and production
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const BACKEND_URL = API_URL.replace(/\/api$/, '');

// Handle base64 data URLs, absolute URLs, and relative /uploads/ paths
const getImageSrc = (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('data:')) return imageUrl;   // base64 — use as-is
  if (imageUrl.startsWith('http')) return imageUrl;    // already absolute URL
  return `${BACKEND_URL}${imageUrl}`;                  // relative path e.g. /uploads/...
};

const TruckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="1" y="3" width="15" height="13" rx="2" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

export default function ManageTrucks() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const { showToast } = useToast();

  const fetchTrucks = async () => {
    try {
      const res = await adminApi.get("/trucks");
      if (res.data.success) setTrucks(res.data.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTrucks();
  }, []);

  const openAdd = () => {
    setModal({
      mode: "add",
      data: {
        truck_number: "",
        type: "Container",
        capacity_tons: "",
        base_location: "Chha. SambhajiNagar",
        year: new Date().getFullYear(),
        owner_name: "Bharat Khese",
        owner_phone: "9284652405",
      },
    });
    setImageFile(null);
  };

  const openEdit = (t) => {
    setModal({ mode: "edit", data: { ...t } });
    setImageFile(null);
  };

  const handleChange = (e) => {
    setModal({
      ...modal,
      data: { ...modal.data, [e.target.name]: e.target.value },
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const formData = new FormData();
    Object.entries(modal.data).forEach(([key, val]) => {
      if (val !== undefined && val !== null) formData.append(key, val);
    });
    if (imageFile) formData.append("image", imageFile);

    try {
      let res;
      if (modal.mode === "add") {
        res = await adminApi.post("/trucks", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await adminApi.put(`/trucks/${modal.data.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      if (res.data.success) {
        showToast(
          modal.mode === "add" ? "Truck added!" : "Truck updated!",
          "success",
        );
        setModal(null);
        // ✅ Update state immediately from response — no page refresh needed
        const updatedTruck = res.data.data;
        if (updatedTruck) {
          if (modal.mode === "add") {
            setTrucks((prev) => [...prev, updatedTruck]);
          } else {
            setTrucks((prev) =>
              prev.map((t) => (t.id === updatedTruck.id ? updatedTruck : t))
            );
          }
        } else {
          // Fallback: refetch if API doesn't return updated truck
          fetchTrucks();
        }
      } else showToast(res.data.message, "error");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed.", "error");
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this truck?")) return;
    try {
      const res = await adminApi.delete(`/trucks/${id}`);
      if (res.data.success) {
        showToast("Truck removed!", "success");
        fetchTrucks();
      } else showToast(res.data.message, "error");
    } catch (err) {
      showToast("Delete failed.", "error");
    }
  };

  const handleMaintenance = async (id, currentStatus) => {
    const maintenance = currentStatus !== "Maintenance";
    try {
      const res = await adminApi.put(`/trucks/${id}/maintenance`, {
        maintenance,
      });
      if (res.data.success) {
        showToast(res.data.message, "success");
        fetchTrucks();
      } else showToast(res.data.message, "error");
    } catch (err) {
      showToast("Failed.", "error");
    }
  };

  return (
    <div className="page-scroll">
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">
          <TruckIcon />
          Manage Trucks
        </h1>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Truck
        </button>
      </div>

      {loading ? (
        <div className="loading-text">Loading trucks...</div>
      ) : (
        <div className="admin-card">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Number</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Location</th>
                  <th>Year</th>
                  <th>Status</th>
                  <th>Driver</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trucks.map((t) => (
                  <tr key={t.id}>
                    <td>
                      {t.image_url ? (
                        <img
                          src={`${getImageSrc(t.image_url)}${t.image_url.startsWith('data:') ? '' : `?v=${t.updated_at || t.id}`}`}
                          alt={t.truck_number}
                          className="truck-thumb"
                        />
                      ) : (
                        <div className="truck-thumb-icon">
                          <TruckIcon />
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{t.truck_number}</strong>
                    </td>
                    <td>{t.type}</td>
                    <td>{t.capacity_tons}T</td>
                    <td>{t.base_location || "—"}</td>
                    <td>{t.year || "—"}</td>
                    <td>
                      <span
                        className={`status-badge status-${(t.status || "").replace(/\s+/g, "-")}`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td>
                      {t.assigned_driver_name
                        ? `${t.assigned_driver_name}${t.assigned_driver_phone ? ` (${t.assigned_driver_phone})` : ''}`
                        : '—'}
                    </td>
                    <td className="table-actions">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => openEdit(t)}
                        title="Edit"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleMaintenance(t.id, t.status)}
                        title={
                          t.status === "Maintenance"
                            ? "Set Available"
                            : "Set Maintenance"
                        }
                      >
                        {t.status === "Maintenance" ? (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                          </svg>
                        )}
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(t.id)}
                        title="Delete"
                      >
                        <svg
                          width="12"
                          height="12"
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

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{modal.mode === "add" ? "Add New Truck" : "Edit Truck"}</h2>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Truck Number</label>
                <input
                  type="text"
                  name="truck_number"
                  className="form-input"
                  value={modal.data.truck_number}
                  onChange={handleChange}
                  required
                  placeholder="MH 20 AB 1234"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  name="type"
                  className="form-input form-select"
                  value={modal.data.type}
                  onChange={handleChange}
                >
                  <option>Container</option>
                  <option>Open Body</option>
                  <option>Refrigerated</option>
                  <option>Trailer</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Capacity (tons)</label>
                <input
                  type="number"
                  name="capacity_tons"
                  className="form-input"
                  value={modal.data.capacity_tons}
                  onChange={handleChange}
                  step="0.5"
                  min="0.5"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Base Location</label>
                <input
                  type="text"
                  name="base_location"
                  className="form-input"
                  value={modal.data.base_location}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <input
                  type="number"
                  name="year"
                  className="form-input"
                  value={modal.data.year}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Owner Name</label>
                <input
                  type="text"
                  name="owner_name"
                  className="form-input"
                  value={modal.data.owner_name}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Owner Phone</label>
                <input
                  type="text"
                  name="owner_phone"
                  className="form-input"
                  value={modal.data.owner_phone}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group full">
                <label className="form-label">Truck Image</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={(e) => setImageFile(e.target.files[0])}
                />
                {/* Live preview of newly selected file */}
                {imageFile && (
                  <div style={{ marginTop: 10 }}>
                    <img
                      src={URL.createObjectURL(imageFile)}
                      alt="Preview"
                      className="truck-preview"
                      style={{ border: '2px solid var(--blue-300)' }}
                    />
                    <p className="file-name">Selected: {imageFile.name}</p>
                  </div>
                )}
                {/* Show current image only if no new file selected */}
                {modal.data.image_url && !imageFile && (
                  <img
                    src={getImageSrc(modal.data.image_url)}
                    alt="Current"
                    className="truck-preview"
                  />
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <svg
                      className="spin"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>{" "}
                    Saving...
                  </>
                ) : (
                  "Save Truck"
                )}
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
