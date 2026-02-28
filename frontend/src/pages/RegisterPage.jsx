import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "var(--sp-12) auto" }}>
      <div className="card card-elevated fade-in" style={{ padding: "var(--sp-10) var(--sp-8) var(--sp-8)" }}>
        <div style={{ textAlign: "center", marginBottom: "var(--sp-8)" }}>
          <h2 style={{ fontSize: "1.375rem", fontWeight: 700, letterSpacing: "-0.025em", marginBottom: "var(--sp-1)" }}>Create Account</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Start tracking your Batak wedding budget
          </p>
        </div>

        {error && <div className="inline-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min 6 characters" />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "var(--sp-5)", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
