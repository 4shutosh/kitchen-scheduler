import { useState, useEffect } from "react";
import { menusAPI, menuItemsAPI, ordersAPI } from "../api";

function StepOne() {
	const [menus, setMenus] = useState([]);
	const [selectedMenu, setSelectedMenu] = useState(null);
	const [menuItems, setMenuItems] = useState([]);
	const [selectedItems, setSelectedItems] = useState({}); // { menuItemId: { quantity, orderType } }
	const [tableNumber, setTableNumber] = useState("");
	const [orderType, setOrderType] = useState("dine_in");

	useEffect(() => {
		loadMenus();
	}, []);

	useEffect(() => {
		if (selectedMenu) {
			loadMenuItems(selectedMenu.id);
		}
	}, [selectedMenu]);

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
			// Filter only available items
			const available = response.data.filter(
				(item) => item.availability === "available"
			);
			setMenuItems(available);
		} catch (error) {
			console.error("Error loading menu items:", error);
		}
	};

	const handleItemToggle = (itemId) => {
		setSelectedItems((prev) => {
			const newState = { ...prev };
			if (newState[itemId]) {
				delete newState[itemId];
			} else {
				newState[itemId] = { quantity: 1, orderType: orderType };
			}
			return newState;
		});
	};

	const handleQuantityChange = (itemId, quantity) => {
		if (quantity > 0) {
			setSelectedItems((prev) => ({
				...prev,
				[itemId]: { ...prev[itemId], quantity: parseInt(quantity) },
			}));
		} else {
			setSelectedItems((prev) => {
				const newState = { ...prev };
				delete newState[itemId];
				return newState;
			});
		}
	};

	const handleOrderTypeChange = (itemId, newType) => {
		setSelectedItems((prev) => ({
			...prev,
			[itemId]: { ...prev[itemId], orderType: newType },
		}));
	};

	const handlePlaceOrder = async () => {
		const itemIds = Object.keys(selectedItems);
		if (itemIds.length === 0) {
			alert("Please select at least one item");
			return;
		}

		// Group items by order type
		const itemsByType = {};
		itemIds.forEach((itemId) => {
			const { orderType, quantity } = selectedItems[itemId];
			if (!itemsByType[orderType]) {
				itemsByType[orderType] = [];
			}
			itemsByType[orderType].push({
				menu_item_id: parseInt(itemId),
				quantity,
			});
		});

		// Create orders for each type
		try {
			for (const [type, items] of Object.entries(itemsByType)) {
				await ordersAPI.create({
					table_number: type === "dine_in" ? tableNumber : null,
					order_type: type,
					order_items: items,
				});
			}

			alert("Order placed successfully!");
			setSelectedItems({});
			setTableNumber("");
			setOrderType("dine_in");
		} catch (error) {
			console.error("Error placing order:", error);
			alert("Error placing order");
		}
	};

	const selectedItemsList = Object.entries(selectedItems)
		.map(([itemId, data]) => {
			const item = menuItems.find((i) => i.id === parseInt(itemId));
			return { item, ...data };
		})
		.filter((entry) => entry.item);

	const totalPrice = selectedItemsList.reduce((sum, entry) => {
		return sum + entry.item.price * entry.quantity;
	}, 0);

	return (
		<div
			style={{
				padding: "20px",
				maxWidth: "1200px",
				margin: "0 auto",
				width: "100%",
			}}
		>
			<h1
				style={{
					fontSize: "clamp(24px, 4vw, 32px)",
					marginBottom: "30px",
					color: "#333",
				}}
			>
				Step One: Take Order
			</h1>

			<div
				style={{
					marginBottom: "30px",
					padding: "20px",
					backgroundColor: "#f0f0f0",
					borderRadius: "4px",
				}}
			>
				<div style={{ marginBottom: "15px" }}>
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
							fontSize: "14px",
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

				<div style={{ marginBottom: "15px" }}>
					<label>Default Order Type: </label>
					<select
						value={orderType}
						onChange={(e) => setOrderType(e.target.value)}
						style={{ padding: "8px", marginLeft: "10px" }}
					>
						<option value="dine_in">Dine In</option>
						<option value="parcel">Parcel</option>
					</select>
				</div>

				{orderType === "dine_in" && (
					<div>
						<label>Table Number: </label>
						<input
							type="text"
							value={tableNumber}
							onChange={(e) => setTableNumber(e.target.value)}
							placeholder="e.g., Table 5"
							style={{ padding: "8px", width: "200px", marginLeft: "10px" }}
						/>
					</div>
				)}
			</div>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
					gap: "20px",
				}}
			>
				{/* Menu Items Selection */}
				<div>
					<h2>Menu Items</h2>
					<div
						style={{
							display: "grid",
							gridTemplateColumns:
								"repeat(auto-fill, minmax(min(250px, 100%), 1fr))",
							gap: "15px",
						}}
					>
						{menuItems.map((item) => {
							const isSelected = selectedItems[item.id];
							return (
								<div
									key={item.id}
									style={{
										padding: "15px",
										border: `2px solid ${isSelected ? "#4CAF50" : "#ddd"}`,
										borderRadius: "4px",
										backgroundColor: isSelected ? "#e8f5e9" : "white",
										cursor: "pointer",
									}}
									onClick={() => handleItemToggle(item.id)}
								>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "start",
											marginBottom: "10px",
										}}
									>
										<div>
											<h3 style={{ margin: 0 }}>{item.name}</h3>
											<p style={{ margin: "5px 0", color: "#666" }}>
												${item.price.toFixed(2)}
											</p>
										</div>
										<input
											type="checkbox"
											checked={!!isSelected}
											onChange={() => handleItemToggle(item.id)}
											onClick={(e) => e.stopPropagation()}
										/>
									</div>

									{isSelected && (
										<div
											onClick={(e) => e.stopPropagation()}
											style={{
												marginTop: "10px",
												paddingTop: "10px",
												borderTop: "1px solid #ddd",
											}}
										>
											<div style={{ marginBottom: "10px" }}>
												<label>Type: </label>
												<select
													value={selectedItems[item.id].orderType}
													onChange={(e) =>
														handleOrderTypeChange(item.id, e.target.value)
													}
													style={{ padding: "5px", marginLeft: "5px" }}
												>
													<option value="dine_in">Dine In</option>
													<option value="parcel">Parcel</option>
												</select>
											</div>
											<div>
												<label>Quantity: </label>
												<input
													type="number"
													min="1"
													value={selectedItems[item.id].quantity}
													onChange={(e) =>
														handleQuantityChange(item.id, e.target.value)
													}
													style={{
														padding: "5px",
														width: "60px",
														marginLeft: "5px",
													}}
												/>
											</div>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>

				{/* Order Summary */}
				<div
					style={{
						padding: "20px",
						backgroundColor: "#f9f9f9",
						borderRadius: "4px",
						height: "fit-content",
						position: "sticky",
						top: "20px",
						maxHeight: "calc(100vh - 40px)",
						overflowY: "auto",
					}}
				>
					<h2>Order Summary</h2>

					{selectedItemsList.length === 0 ? (
						<p>No items selected</p>
					) : (
						<>
							<div style={{ marginBottom: "20px" }}>
								{selectedItemsList.map(({ item, quantity, orderType }) => (
									<div
										key={item.id}
										style={{
											marginBottom: "10px",
											padding: "10px",
											backgroundColor: "white",
											borderRadius: "4px",
										}}
									>
										<div
											style={{
												display: "flex",
												justifyContent: "space-between",
											}}
										>
											<span>
												<strong>{item.name}</strong>
											</span>
											<span>${(item.price * quantity).toFixed(2)}</span>
										</div>
										<div
											style={{
												fontSize: "14px",
												color: "#666",
												marginTop: "5px",
											}}
										>
											Qty: {quantity} |{" "}
											{orderType === "dine_in" ? "Dine In" : "Parcel"}
										</div>
									</div>
								))}
							</div>

							<div
								style={{
									borderTop: "2px solid #ddd",
									paddingTop: "15px",
									marginTop: "15px",
								}}
							>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										fontSize: "18px",
										fontWeight: "bold",
										marginBottom: "20px",
									}}
								>
									<span>Total:</span>
									<span>${totalPrice.toFixed(2)}</span>
								</div>

								<button
									onClick={handlePlaceOrder}
									style={{
										width: "100%",
										padding: "15px",
										backgroundColor: "#4CAF50",
										color: "white",
										border: "none",
										borderRadius: "4px",
										fontSize: "16px",
										fontWeight: "bold",
										cursor: "pointer",
									}}
								>
									Place Order
								</button>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}

export default StepOne;
