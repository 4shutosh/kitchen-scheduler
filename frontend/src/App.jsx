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
import "./App.css";

function Navigation() {
	const location = useLocation();

	const navStyle = {
		backgroundColor: "#333",
		padding: "15px 0",
		marginBottom: "20px",
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
			<div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
				<div
					style={{
						display: "flex",
						flexWrap: "wrap",
						alignItems: "center",
						gap: "10px",
					}}
				>
					<Link
						to="/"
						style={{
							...linkStyle,
							fontWeight: "bold",
							fontSize: "clamp(16px, 3vw, 18px)",
							marginRight: "10px",
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
							fontSize: "clamp(12px, 2.5vw, 14px)",
							padding: "8px 15px",
						}}
					>
						Step Zero: Menu Setup
					</Link>
					<Link
						to="/step-one"
						style={{
							...(location.pathname === "/step-one"
								? activeLinkStyle
								: linkStyle),
							fontSize: "clamp(12px, 2.5vw, 14px)",
							padding: "8px 15px",
						}}
					>
						Step One: Take Order
					</Link>
					<Link
						to="/step-two"
						style={{
							...(location.pathname === "/step-two"
								? activeLinkStyle
								: linkStyle),
							fontSize: "clamp(12px, 2.5vw, 14px)",
							padding: "8px 15px",
						}}
					>
						Step Two: Kitchen Staff
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
			<p style={{ fontSize: "18px", marginBottom: "40px" }}>
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
				</Routes>
			</div>
		</Router>
	);
}

export default App;
