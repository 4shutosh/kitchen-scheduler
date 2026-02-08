import { useState, useEffect } from "react";
import { stationsAPI, menusAPI, menuItemsAPI } from "../api";

function StepZero() {
	const [stations, setStations] = useState([]);
	const [menus, setMenus] = useState([]);
	const [selectedMenu, setSelectedMenu] = useState(null);
	const [menuItems, setMenuItems] = useState([]);
	const [showStationForm, setShowStationForm] = useState(false);
	const [showMenuItemForm, setShowMenuItemForm] = useState(false);
	const [stationForm, setStationForm] = useState({ name: "", description: "" });
	const [menuItemForm, setMenuItemForm] = useState({
		name: "",
		station_id: null,
		// Optional fields with defaults
		availability: "available",
		prep_time: 0,
		category: "",
		description: "",
		price: 0,
	});

	useEffect(() => {
		loadStations();
		loadMenus();
	}, []);

	useEffect(() => {
		if (selectedMenu) {
			loadMenuItems(selectedMenu.id);
		}
	}, [selectedMenu]);

	const loadStations = async () => {
		try {
			const response = await stationsAPI.getAll();
			setStations(response.data);
		} catch (error) {
			console.error("Error loading stations:", error);
		}
	};

	const loadMenus = async () => {
		try {
			const response = await menusAPI.getAll();
			setMenus(response.data);
			if (response.data.length > 0 && !selectedMenu) {
				setSelectedMenu(response.data[0]);
			}
		} catch (error) {
			console.error("Error loading menus:", error);
		}
	};

	const loadMenuItems = async (menuId) => {
		try {
			const response = await menusAPI.getMenuItems(menuId);
			setMenuItems(response.data);
		} catch (error) {
			console.error("Error loading menu items:", error);
		}
	};

	const handleCreateStation = async (e) => {
		e.preventDefault();
		try {
			await stationsAPI.create(stationForm);
			setStationForm({ name: "", description: "" });
			setShowStationForm(false);
			loadStations();
		} catch (error) {
			console.error("Error creating station:", error);
			alert("Error creating station");
		}
	};

	const handleDeleteStation = async (stationId, stationName) => {
		const confirmed = window.confirm(
			`Are you sure you want to delete station "${stationName}"?\n\nThis will also delete all menu items associated with this station.`
		);
		if (!confirmed) return;

		try {
			const response = await stationsAPI.delete(stationId);
			if (response.data.menu_items_count > 0) {
				alert(
					`Station deleted successfully along with ${response.data.menu_items_count} associated menu item(s).`
				);
			}
			loadStations();
			if (selectedMenu) {
				loadMenuItems(selectedMenu.id);
			}
		} catch (error) {
			console.error("Error deleting station:", error);
			alert("Error deleting station");
		}
	};

	const handleCreateMenuItem = async (e) => {
		e.preventDefault();
		if (!selectedMenu) {
			alert("Please select or create a menu first");
			return;
		}
		if (!menuItemForm.name || !menuItemForm.station_id) {
			alert("Name and Station are required");
			return;
		}

		try {
			// Create menu item and associate with selected menu
			await menuItemsAPI.create({ ...menuItemForm, menu_id: selectedMenu.id });
			setMenuItemForm({
				name: "",
				station_id: null,
				availability: "available",
				prep_time: 0,
				category: "",
				description: "",
				price: 0,
			});
			setShowMenuItemForm(false);
			loadMenuItems(selectedMenu.id);
		} catch (error) {
			console.error("Error creating menu item:", error);
			alert("Error creating menu item");
		}
	};

	const handleCreateMenu = async () => {
		const name = prompt("Enter menu name:");
		if (name) {
			try {
				const response = await menusAPI.create({ name, description: "" });
				await loadMenus();
				setSelectedMenu(response.data);
			} catch (error) {
				console.error("Error creating menu:", error);
				alert("Error creating menu");
			}
		}
	};

	const handleDeleteMenuItem = async (itemId) => {
		if (!window.confirm("Are you sure you want to delete this menu item?")) {
			return;
		}

		try {
			await menuItemsAPI.delete(itemId);
			if (selectedMenu) {
				loadMenuItems(selectedMenu.id);
			}
		} catch (error) {
			console.error("Error deleting menu item:", error);
			alert("Error deleting menu item");
		}
	};

	return (
		<div
			style={{
				padding: "clamp(10px, 3vw, 20px)",
				maxWidth: "1200px",
				margin: "0 auto",
				width: "100%",
				boxSizing: "border-box",
			}}
		>
			<h1
				style={{
					fontSize: "clamp(20px, 4vw, 28px)",
					marginBottom: "clamp(15px, 3vw, 30px)",
					color: "#333",
				}}
			>
				Step Zero: Menu Management
			</h1>

			{/* Stations Section */}
			<section style={{ marginBottom: "40px" }}>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: "20px",
						flexWrap: "wrap",
						gap: "10px",
					}}
				>
					<h2
						style={{
							fontSize: "clamp(16px, 2.5vw, 18px)",
							margin: 0,
							fontWeight: "600",
						}}
					>
						Stations
					</h2>
					<button
						onClick={() => setShowStationForm(!showStationForm)}
						style={{
							padding: "10px 20px",
							backgroundColor: "#4CAF50",
							color: "white",
							border: "none",
							borderRadius: "4px",
							cursor: "pointer",
							fontSize: "13px",
							whiteSpace: "nowrap",
						}}
					>
						{showStationForm ? "Cancel" : "+ Add Station"}
					</button>
				</div>

				{showStationForm && (
					<form
						onSubmit={handleCreateStation}
						style={{
							marginBottom: "20px",
							padding: "20px",
							border: "1px solid #ddd",
							borderRadius: "4px",
						}}
					>
						<div style={{ marginBottom: "10px" }}>
							<label>Station Name: </label>
							<input
								type="text"
								value={stationForm.name}
								onChange={(e) =>
									setStationForm({ ...stationForm, name: e.target.value })
								}
								required
								style={{ padding: "8px", width: "300px", marginLeft: "10px" }}
							/>
						</div>
						<div style={{ marginBottom: "10px" }}>
							<label>Description: </label>
							<input
								type="text"
								value={stationForm.description}
								onChange={(e) =>
									setStationForm({
										...stationForm,
										description: e.target.value,
									})
								}
								style={{ padding: "8px", width: "300px", marginLeft: "10px" }}
							/>
						</div>
						<button
							type="submit"
							style={{
								padding: "10px 20px",
								backgroundColor: "#2196F3",
								color: "white",
								border: "none",
								borderRadius: "4px",
								cursor: "pointer",
							}}
						>
							Create Station
						</button>
					</form>
				)}

				<div
					style={{
						display: "grid",
						gridTemplateColumns:
							"repeat(auto-fill, minmax(min(200px, 100%), 1fr))",
						gap: "15px",
					}}
				>
					{stations.map((station) => (
						<div
							key={station.id}
							style={{
								padding: "15px",
								border: "1px solid #ddd",
								borderRadius: "4px",
								backgroundColor: "#f9f9f9",
								position: "relative",
							}}
						>
							<button
								onClick={() => handleDeleteStation(station.id, station.name)}
								style={{
									position: "absolute",
									top: "10px",
									right: "10px",
									backgroundColor: "#ffffff",
									color: "#f44336",
									border: "none",
									borderRadius: "4px",
									padding: "6px 12px",
									cursor: "pointer",
									fontSize: "14px",
									fontWeight: "500",
									boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
									transition: "all 0.2s ease",
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.backgroundColor = "#fbe9e7";
									e.currentTarget.style.transform = "scale(1.1)";
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.backgroundColor = "#ffffff";
									e.currentTarget.style.transform = "scale(1)";
								}}
								title="Delete station"
							>
								🗑️
							</button>
							<h3 style={{ marginRight: "50px" }}>{station.name}</h3>
							{station.description && (
								<p style={{ fontSize: "13px", color: "#666" }}>
									{station.description}
								</p>
							)}
						</div>
					))}
				</div>
			</section>

			{/* Menus Section */}
			<section style={{ marginBottom: "40px" }}>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: "20px",
						flexWrap: "wrap",
						gap: "10px",
					}}
				>
					<h2
						style={{
							fontSize: "clamp(16px, 2.5vw, 18px)",
							margin: 0,
							fontWeight: "600",
						}}
					>
						Menus
					</h2>
					<button
						onClick={handleCreateMenu}
						style={{
							padding: "10px 20px",
							backgroundColor: "#4CAF50",
							color: "white",
							border: "none",
							borderRadius: "4px",
							cursor: "pointer",
						}}
					>
						+ Create Menu
					</button>
				</div>

				<div style={{ marginBottom: "20px" }}>
					<label style={{ marginRight: "10px", fontWeight: "500" }}>
						Select Menu:{" "}
					</label>
					<select
						value={selectedMenu?.id || ""}
						onChange={(e) => {
							const menu = menus.find((m) => m.id === parseInt(e.target.value));
							setSelectedMenu(menu);
						}}
						style={{
							padding: "10px 15px",
							minWidth: "200px",
							borderRadius: "4px",
							border: "1px solid #ddd",
							backgroundColor: "white",
							color: "#333",
							fontSize: "13px",
							cursor: "pointer",
						}}
					>
						{menus.map((menu) => (
							<option key={menu.id} value={menu.id} style={{ color: "#333" }}>
								{menu.name}
							</option>
						))}
					</select>
				</div>
			</section>

			{/* Menu Items Section */}
			<section>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: "20px",
						flexWrap: "wrap",
						gap: "10px",
					}}
				>
					<h2
						style={{
							fontSize: "clamp(16px, 2.5vw, 18px)",
							margin: 0,
							fontWeight: "600",
						}}
					>
						Menu Items {selectedMenu && `(${selectedMenu.name})`}
					</h2>
					<button
						onClick={() => setShowMenuItemForm(!showMenuItemForm)}
						disabled={!selectedMenu}
						style={{
							padding: "10px 20px",
							backgroundColor: selectedMenu ? "#4CAF50" : "#ccc",
							color: "white",
							border: "none",
							borderRadius: "4px",
							cursor: selectedMenu ? "pointer" : "not-allowed",
						}}
					>
						{showMenuItemForm ? "Cancel" : "+ Add Menu Item"}
					</button>
				</div>

				{showMenuItemForm && selectedMenu && (
					<form
						onSubmit={handleCreateMenuItem}
						style={{
							marginBottom: "20px",
							padding: "20px",
							border: "1px solid #ddd",
							borderRadius: "8px",
							backgroundColor: "white",
							boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
						}}
					>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
								gap: "15px",
								marginBottom: "15px",
							}}
						>
							<div>
								<label
									style={{
										display: "block",
										marginBottom: "5px",
										fontWeight: "500",
									}}
								>
									Name <span style={{ color: "#e53935" }}>*</span>
								</label>
								<input
									type="text"
									value={menuItemForm.name}
									onChange={(e) =>
										setMenuItemForm({ ...menuItemForm, name: e.target.value })
									}
									required
									placeholder="Enter item name"
									style={{
										padding: "10px",
										width: "100%",
										border: "1px solid #ddd",
										borderRadius: "4px",
										fontSize: "13px",
									}}
								/>
							</div>
							<div>
								<label
									style={{
										display: "block",
										marginBottom: "5px",
										fontWeight: "500",
									}}
								>
									Station <span style={{ color: "#e53935" }}>*</span>
								</label>
								<select
									value={menuItemForm.station_id || ""}
									onChange={(e) =>
										setMenuItemForm({
											...menuItemForm,
											station_id: e.target.value
												? parseInt(e.target.value)
												: null,
										})
									}
									required
									style={{
										padding: "10px",
										width: "100%",
										border: "1px solid #ddd",
										borderRadius: "4px",
										backgroundColor: "white",
										color: "#333",
										fontSize: "13px",
										cursor: "pointer",
									}}
								>
									<option value="">Select Station</option>
									{stations.map((station) => (
										<option
											key={station.id}
											value={station.id}
											style={{ color: "#333" }}
										>
											{station.name}
										</option>
									))}
								</select>
							</div>
							<div>
								<label
									style={{
										display: "block",
										marginBottom: "5px",
										fontWeight: "500",
									}}
								>
									Category (Optional)
								</label>
								<input
									type="text"
									value={menuItemForm.category}
									onChange={(e) =>
										setMenuItemForm({
											...menuItemForm,
											category: e.target.value,
										})
									}
									placeholder="e.g., Main Course"
									style={{
										padding: "10px",
										width: "100%",
										border: "1px solid #ddd",
										borderRadius: "4px",
										fontSize: "13px",
									}}
								/>
							</div>
							<div>
								<label
									style={{
										display: "block",
										marginBottom: "5px",
										fontWeight: "500",
									}}
								>
									Price (Optional)
								</label>
								<input
									type="number"
									step="0.01"
									value={menuItemForm.price || ""}
									onChange={(e) =>
										setMenuItemForm({
											...menuItemForm,
											price: parseFloat(e.target.value) || 0,
										})
									}
									placeholder="0.00"
									style={{
										padding: "10px",
										width: "100%",
										border: "1px solid #ddd",
										borderRadius: "4px",
										fontSize: "13px",
									}}
								/>
							</div>
							<div>
								<label
									style={{
										display: "block",
										marginBottom: "5px",
										fontWeight: "500",
									}}
								>
									Prep Time - minutes (Optional)
								</label>
								<input
									type="number"
									value={menuItemForm.prep_time || ""}
									onChange={(e) =>
										setMenuItemForm({
											...menuItemForm,
											prep_time: parseInt(e.target.value) || 0,
										})
									}
									placeholder="0"
									style={{
										padding: "10px",
										width: "100%",
										border: "1px solid #ddd",
										borderRadius: "4px",
										fontSize: "13px",
									}}
								/>
							</div>
							<div>
								<label
									style={{
										display: "block",
										marginBottom: "5px",
										fontWeight: "500",
									}}
								>
									Availability (Optional)
								</label>
								<select
									value={menuItemForm.availability}
									onChange={(e) =>
										setMenuItemForm({
											...menuItemForm,
											availability: e.target.value,
										})
									}
									style={{
										padding: "10px",
										width: "100%",
										border: "1px solid #ddd",
										borderRadius: "4px",
										backgroundColor: "white",
										color: "#333",
										fontSize: "13px",
										cursor: "pointer",
									}}
								>
									<option value="available">Available</option>
									<option value="unavailable">Unavailable</option>
									<option value="sold_out">Sold Out</option>
								</select>
							</div>
						</div>
						<div style={{ marginBottom: "15px" }}>
							<label
								style={{
									display: "block",
									marginBottom: "5px",
									fontWeight: "500",
								}}
							>
								Description (Optional)
							</label>
							<textarea
								value={menuItemForm.description}
								onChange={(e) =>
									setMenuItemForm({
										...menuItemForm,
										description: e.target.value,
									})
								}
								placeholder="Item description..."
								style={{
									padding: "10px",
									width: "100%",
									marginTop: "5px",
									minHeight: "80px",
									border: "1px solid #ddd",
									borderRadius: "4px",
									fontSize: "13px",
									resize: "vertical",
								}}
							/>
						</div>
						<button
							type="submit"
							style={{
								padding: "12px 24px",
								backgroundColor: "#2196F3",
								color: "white",
								border: "none",
								borderRadius: "4px",
								cursor: "pointer",
								fontSize: "14px",
								fontWeight: "500",
							}}
						>
							Create Menu Item
						</button>
					</form>
				)}

				<div
					style={{
						display: "grid",
						gridTemplateColumns:
							"repeat(auto-fill, minmax(min(300px, 100%), 1fr))",
						gap: "15px",
					}}
				>
					{menuItems.map((item) => (
						<div
							key={item.id}
							style={{
								padding: "15px",
								border: "1px solid #ddd",
								borderRadius: "4px",
								backgroundColor: "#f9f9f9",
								position: "relative",
							}}
						>
							<button
								onClick={() => handleDeleteMenuItem(item.id)}
								style={{
									position: "absolute",
									top: "10px",
									right: "10px",
									backgroundColor: "#ffffff",
									color: "white",
									border: "none",
									borderRadius: "4px",
									padding: "6px 12px",
									cursor: "pointer",
									fontSize: "11px",
									fontWeight: "500",
									boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
									transition: "all 0.2s ease",
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.backgroundColor = "#d32f2f";
									e.currentTarget.style.transform = "scale(1.05)";
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.backgroundColor = "#ffffff";
									e.currentTarget.style.transform = "scale(1)";
								}}
								title="Delete menu item"
							>
								🗑️
							</button>
							<h3 style={{ marginRight: "80px", marginBottom: "10px" }}>
								{item.name}
							</h3>
							<p>
								<strong>Station:</strong>{" "}
								{stations.find((s) => s.id === item.station_id)?.name ||
									"Not assigned"}
							</p>
							{item.category && (
								<p>
									<strong>Category:</strong> {item.category}
								</p>
							)}
							{item.price > 0 && (
								<p>
									<strong>Price:</strong> ₹{item.price.toFixed(2)}
								</p>
							)}
							{item.prep_time > 0 && (
								<p>
									<strong>Prep Time:</strong> {item.prep_time} min
								</p>
							)}
							{item.description && (
								<p
									style={{ fontSize: "13px", color: "#666", marginTop: "10px" }}
								>
									{item.description}
								</p>
							)}
						</div>
					))}
					{menuItems.length === 0 && selectedMenu && (
						<p>No menu items yet. Add one to get started!</p>
					)}
				</div>
			</section>
		</div>
	);
}

export default StepZero;
