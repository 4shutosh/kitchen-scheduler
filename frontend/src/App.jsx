import {
	BrowserRouter as Router,
	Routes,
	Route,
	Link,
	useLocation,
} from "react-router-dom";
import StepZero from "./pages/StepZero";
import StepOne from "./pages/StepOne";
import StepTwo from "./pages/StepTwo";
import CustomerManagement from "./pages/CustomerManagement";
import "./App.css";

function Navigation() {
	const location = useLocation();

	const navStyle = {
		backgroundColor: "#333",
		padding: "15px 0",
		marginBottom: "20px",
		position: "sticky",
		top: 0,
		zIndex: 1000,
		boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
	};

	const linkStyle = {
		color: "white",
		textDecoration: "none",
		padding: "10px 20px",
		margin: "0 5px",
		borderRadius: "4px",
		display: "inline-block",
		transition: "background-color 0.3s",
	};

	const activeLinkStyle = {
		...linkStyle,
		backgroundColor: "#4CAF50",
	};

	return (
		<nav style={navStyle}>
			<div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 clamp(10px, 3vw, 20px)" }}>
				<div
					style={{
						display: "flex",
						flexWrap: "wrap",
						alignItems: "center",
						gap: "clamp(6px, 1.5vw, 10px)",
					}}
				>
					<Link
						to="/"
						style={{
							...linkStyle,
							fontWeight: "bold",
							fontSize: "clamp(14px, 3vw, 18px)",
							marginRight: "clamp(5px, 2vw, 10px)",
							padding: "clamp(6px, 1.5vw, 10px) clamp(10px, 2vw, 20px)",
						}}
					>
						Kitchen Scheduler
					</Link>
					<Link
						to="/step-zero"
						style={{
							...(location.pathname === "/step-zero"
								? activeLinkStyle
								: linkStyle),
							fontSize: "clamp(11px, 2.5vw, 14px)",
							padding: "clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 15px)",
						}}
					>
						Step Zero
					</Link>
					<Link
						to="/step-one"
						style={{
							...(location.pathname === "/step-one"
								? activeLinkStyle
								: linkStyle),
							fontSize: "clamp(11px, 2.5vw, 14px)",
							padding: "clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 15px)",
						}}
					>
						Step One
					</Link>
						<Link
							to="/step-two"
							style={{
								...(location.pathname === "/step-two"
									? activeLinkStyle
									: linkStyle),
							fontSize: "clamp(11px, 2.5vw, 14px)",
							padding: "clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 15px)",
							}}
						>
						Step Two
						</Link>
						<Link
							to="/customers"
							style={{
								...(location.pathname === "/customers"
									? activeLinkStyle
									: linkStyle),
							fontSize: "clamp(11px, 2.5vw, 14px)",
							padding: "clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 15px)",
							}}
						>
							Customers
						</Link>
					</div>
				</div>
			</nav>
		);
	}

function Home() {
	return (
		<div
			style={{
				padding: "40px",
				maxWidth: "800px",
				margin: "0 auto",
				textAlign: "center",
			}}
		>
			<h1>Welcome to Kitchen Scheduler</h1>
			<p style={{ fontSize: "14px", marginBottom: "40px" }}>
				Manage your restaurant operations efficiently
			</p>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
					gap: "20px",
					marginTop: "40px",
				}}
			>
				<Link to="/step-zero" style={{ textDecoration: "none" }}>
					<div
						style={{
							padding: "30px",
							backgroundColor: "#f5f5f5",
							borderRadius: "8px",
							border: "2px solid #ddd",
							transition: "all 0.3s",
							cursor: "pointer",
						}}
					>
						<h2>Step Zero</h2>
						<p>Menu Setup & Station Management</p>
					</div>
				</Link>

				<Link to="/step-one" style={{ textDecoration: "none" }}>
					<div
						style={{
							padding: "30px",
							backgroundColor: "#f5f5f5",
							borderRadius: "8px",
							border: "2px solid #ddd",
							transition: "all 0.3s",
							cursor: "pointer",
						}}
					>
						<h2>Step One</h2>
						<p>Take Orders</p>
					</div>
				</Link>

				<Link to="/step-two" style={{ textDecoration: "none" }}>
					<div
						style={{
							padding: "30px",
							backgroundColor: "#f5f5f5",
							borderRadius: "8px",
							border: "2px solid #ddd",
							transition: "all 0.3s",
							cursor: "pointer",
						}}
					>
						<h2>Step Two</h2>
						<p>Kitchen Staff View</p>
					</div>
				</Link>

				<Link to="/customers" style={{ textDecoration: "none" }}>
					<div
						style={{
							padding: "30px",
							backgroundColor: "#f5f5f5",
							borderRadius: "8px",
							border: "2px solid #ddd",
							transition: "all 0.3s",
							cursor: "pointer",
						}}
					>
						<h2>Customers</h2>
						<p>Manage Customer Information</p>
					</div>
				</Link>
			</div>
		</div>
	);
}

function App() {
  return (
		<Router>
      <div>
				<Navigation />
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/step-zero" element={<StepZero />} />
				<Route path="/step-one" element={<StepOne />} />
				<Route path="/step-two" element={<StepTwo />} />
				<Route path="/customers" element={<CustomerManagement />} />
			</Routes>
      </div>
	</Router>
);
}

export default App;
