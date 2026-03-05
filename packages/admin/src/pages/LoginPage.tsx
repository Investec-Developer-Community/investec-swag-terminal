import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-investec-navy-900">
      <div className="w-full max-w-sm p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white tracking-wide uppercase mb-1">
            Swag Portal
          </h1>
          <p className="text-investec-stone text-sm">
            Investec Developer Community — Admin
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-investec-navy-800 border border-investec-navy-700 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-investec-navy-300 uppercase tracking-wider mb-6">
            Sign in
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded border border-investec-burgundy/30 bg-investec-burgundy/10 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-investec-stone mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-investec-navy-900 border border-investec-navy-700 rounded text-white text-sm placeholder-investec-navy-500 focus:ring-1 focus:ring-investec-teal focus:border-investec-teal outline-none"
                placeholder="admin@investec.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-investec-stone mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-investec-navy-900 border border-investec-navy-700 rounded text-white text-sm placeholder-investec-navy-500 focus:ring-1 focus:ring-investec-teal focus:border-investec-teal outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-investec-teal text-white font-semibold rounded text-sm hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-investec-navy-500 text-xs mt-6">
          Investec Developer Community
        </p>
      </div>
    </div>
  );
}
