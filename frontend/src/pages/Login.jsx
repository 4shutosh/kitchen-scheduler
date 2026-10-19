import { useState } from "react";
import { authAPI } from "../api";

export default function Login({ onLogin }) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			const res = await authAPI.login(username, password);
			sessionStorage.setItem("auth_token", res.data.token);
			onLogin();
		} catch {
			setError("Invalid username or password");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
			<div style={{ backgroundColor: "white", padding: "40px", borderRadius: "8px", boxShadow: "0 2px 12px rgba(0,0,0,0.1)", width: "100%", maxWidth: "360px" }}>
				<h2 style={{ marginBottom: "8px", textAlign: "center" }}>Kuchen Kitchen</h2>
				<p style={{ textAlign: "center", color: "#666", marginBottom: "24px", fontSize: "14px" }}>Sign in to continue</p>
				<form onSubmit={handleSubmit}>
					<div style={{ marginBottom: "16px" }}>
						<label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}>Username</label>
						<input
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							required
							autoFocus
							style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px", boxSizing: "border-box" }}
						/>
					</div>
					<div style={{ marginBottom: "20px" }}>
						<label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}>Password</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px", boxSizing: "border-box" }}
						/>
					</div>
					{error && <p style={{ color: "#d32f2f", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}
					<button
						type="submit"
						disabled={loading}
						style={{ width: "100%", padding: "12px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "4px", fontSize: "15px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
					>
						{loading ? "Signing in..." : "Sign In"}
					</button>
				</form>
			</div>
		</div>
	);
}
