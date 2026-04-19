// ============================================================
// pages/BookTruck.jsx – Truck Booking Form (Secured)
// userId is now read from the JWT on the backend — NOT sent in body
// ============================================================

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";
import PageHero from "../components/PageHero";

const WA_NUMBER = "919284652405";

export default function BookTruck() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const today = new Date().toISOString().split("T")[0];

  const emptyForm = {
    pickup: "",
    dest: "",
    goods: "",
    customGoods: "",
    weight: "",
    pickdate: today,
    deliverydate: today,
    trucktype: "",
    notes: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const goodsType = form.goods === "other" ? form.customGoods : form.goods;

      // ✅ userId is NOT sent — backend reads it from the JWT token
      // The api instance (axios.js) automatically attaches the Authorization header
      const res = await api.post("/bookings/book", {
        pickupLocation: form.pickup,
        destination: form.dest,
        goodsType,
        weight: form.weight,
        pickupDate: form.pickdate,
        deliveryDate: form.deliverydate,
        truckType: form.trucktype,
        notes: form.notes,
      });

      if (res.data.success) {
        setSuccess({ bookingId: res.data.data?.bookingId });
        setForm(emptyForm);
        showToast("Booking submitted successfully!", "success");
      } else {
        showToast(res.data.message || "Booking failed.", "error");
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to submit booking.",
        "error",
      );
    }
    setLoading(false);
  };

  return (
    <>
      <PageHero
        title="Book a Truck"
        subtitle="Fill in your shipment details and confirm your booking below."
      />

      <section className="section-sm">
        <div className="container" style={{ maxWidth: 760 }}>
          {/* Contact Alert */}
          <div className="contact-alert">
            <div className="contact-alert-icon-svg">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--yellow-500)"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="contact-alert-content" style={{ flex: 1 }}>
              <h3>Contact for Pricing</h3>
              <p>
                For transport pricing, please contact the owner directly before
                confirming your booking.
              </p>
            </div>
            <div>
              <a href="tel:9284652405">
                <button className="btn-call">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ verticalAlign: "middle", marginRight: 5 }}
                  >
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.88 19.79 19.79 0 01.22 1.2 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  Call: 9284652405
                </button>
              </a>
            </div>
          </div>

          {/* Booking Form */}
          <div className="book-form-card">
            <div className="book-form-header">
              <h2>Shipment Booking Form</h2>
              <p>Enter your shipment details to proceed with the booking.</p>
            </div>
            <div className="book-form-body">
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Pickup Location</label>
                    <input
                      type="text"
                      name="pickup"
                      className="form-input"
                      placeholder="e.g. Chha. SambhajiNagar, MH"
                      value={form.pickup}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Destination</label>
                    <input
                      type="text"
                      name="dest"
                      className="form-input"
                      placeholder="e.g. Mumbai, MH"
                      value={form.dest}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Goods Type</label>
                    <select
                      name="goods"
                      className="form-input form-select"
                      value={form.goods}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>
                        Select goods type
                      </option>
                      <option>Agricultural Products</option>
                      <option>Industrial Machinery</option>
                      <option>Construction Materials</option>
                      <option>Food &amp; Beverages</option>
                      <option>Chemicals</option>
                      <option>Textiles</option>
                      <option>Electronics</option>
                      <option value="other">Other</option>
                    </select>
                    {form.goods === "other" && (
                      <input
                        type="text"
                        name="customGoods"
                        className="form-input"
                        placeholder="Specify goods type"
                        value={form.customGoods}
                        onChange={handleChange}
                        required
                        style={{ marginTop: 10 }}
                      />
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Approx. Weight (tons)</label>
                    <input
                      type="number"
                      name="weight"
                      className="form-input"
                      placeholder="e.g. 10"
                      min="0.5"
                      max="40"
                      step="0.5"
                      value={form.weight}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pickup Date</label>
                    <input
                      type="date"
                      name="pickdate"
                      className="form-input"
                      min={today}
                      value={form.pickdate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expected Delivery Date</label>
                    <input
                      type="date"
                      name="deliverydate"
                      className="form-input"
                      min={form.pickdate || today}
                      value={form.deliverydate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Preferred Truck Type</label>
                    <select
                      name="trucktype"
                      className="form-input form-select"
                      value={form.trucktype}
                      onChange={handleChange}
                    >
                      <option value="">No preference</option>
                      <option>Container</option>
                      <option>Open Body</option>
                      <option>Refrigerated</option>
                      <option>Trailer</option>
                    </select>
                  </div>
                  <div className="form-group full">
                    <label className="form-label">
                      Additional Notes (optional)
                    </label>
                    <textarea
                      name="notes"
                      className="form-input"
                      rows="3"
                      placeholder="Any special requirements or handling instructions..."
                      value={form.notes}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    style={{ flex: 1 }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg
                          className="spin"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="M21 12a9 9 0 11-6.219-8.56" />
                        </svg>{" "}
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Confirm Booking
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setForm(emptyForm)}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                    Clear
                  </button>
                </div>
              </form>

              {success && (
                <div className="success-msg">
                  <div className="success-icon">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--green-600)"
                      strokeWidth="1.5"
                    >
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <h3>Booking Request Submitted!</h3>
                  <p>
                    Your Booking ID:{" "}
                    <strong
                      style={{ color: "var(--blue-700)", fontSize: "1.05rem" }}
                    >
                      {success.bookingId}
                    </strong>
                  </p>
                  <p>
                    The transport owner will contact you shortly to confirm
                    pricing and details.
                  </p>
                  <p>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--green-600)"
                      strokeWidth="2"
                      style={{ verticalAlign: "middle", marginRight: 4 }}
                    >
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.88 19.79 19.79 0 01.22 1.2 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                    </svg>
                    For faster confirmation:{" "}
                    <a href="tel:9284652405" style={{ fontWeight: 700 }}>
                      9284652405
                    </a>
                  </p>
                  <a
                    href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Hello, I have a query regarding Booking ID: ${success.bookingId}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      style={{ verticalAlign: "middle", marginRight: 6 }}
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Message on WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
