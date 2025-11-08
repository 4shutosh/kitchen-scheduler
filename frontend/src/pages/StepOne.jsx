import { useState, useEffect } from "react";
import {
	menusAPI,
	menuItemsAPI,
	ordersAPI,
	customersAPI,
	stationsAPI,
} from "../api";

function StepOne() {
	const [menus, setMenus] = useState([]);
	const [selectedMenu, setSelectedMenu] = useState(null);
	const [menuItems, setMenuItems] = useState([]);
	const [customers, setCustomers] = useState([]);
	const [stations, setStations] = useState([]);
	const [selectedItems, setSelectedItems] = useState({}); // { menuItemId: { quantity, orderType } }
	const [orderType, setOrderType] = useState("dine_in");
	const [selectedCustomerId, setSelectedCustomerId] = useState(null);
	const [pastOrders, setPastOrders] = useState([]);
	const [loadingOrders, setLoadingOrders] = useState(false);
	const [isOutOfPlan, setIsOutOfPlan] = useState(false); // Checkbox state for marking order as out of plan

	useEffect(() => {
		loadMenus();
		loadCustomers();
		loadStations();
	}, []);

	useEffect(() => {
		if (selectedMenu) {
			loadMenuItems(selectedMenu.id);
		}
	}, [selectedMenu]);

	useEffect(() => {
		if (selectedCustomerId) {
			loadPastOrders(selectedCustomerId, true);
			// Set up polling to refresh past orders every 3 seconds (silent refresh)
			const interval = setInterval(() => {
				loadPastOrders(selectedCustomerId, false);
			}, 3000);
			return () => clearInterval(interval);
		} else {
			setPastOrders([]);
		}
		// Reset out of plan checkbox when customer changes
		setIsOutOfPlan(false);
	}, [selectedCustomerId]);

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

	const loadCustomers = async () => {
		try {
			const response = await customersAPI.getAll();
			// Sort customers alphabetically by name
			const sorted = [...response.data].sort((a, b) =>
				a.name.localeCompare(b.name)
			);
			setCustomers(sorted);
		} catch (error) {
			console.error("Error loading customers:", error);
		}
	};

	const loadStations = async () => {
		try {
			const response = await stationsAPI.getAll();
			setStations(response.data);
		} catch (error) {
			console.error("Error loading stations:", error);
		}
	};

	const loadPastOrders = async (customerId, showLoading = true) => {
		if (showLoading) {
			setLoadingOrders(true);
		}
		try {
			const response = await ordersAPI.getAll();
			// Filter orders for this customer and sort by created_at descending
			const customerOrders = response.data
				.filter((order) => order.customer_id === customerId)
				.sort((a, b) => {
					const dateA = new Date(a.created_at);
					const dateB = new Date(b.created_at);
					return dateB - dateA; // Most recent first
				});
			setPastOrders(customerOrders);
		} catch (error) {
			console.error("Error loading past orders:", error);
			setPastOrders([]);
		} finally {
			if (showLoading) {
				setLoadingOrders(false);
			}
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

	const handleQuantityChange = (itemId, value) => {
		// Allow empty string for typing
		if (value === "" || value === null || value === undefined) {
			setSelectedItems((prev) => ({
				...prev,
				[itemId]: { ...prev[itemId], quantity: "" },
			}));
			return;
		}

		const numValue = parseInt(value);
		// Only update if it's a valid positive number
		if (!isNaN(numValue) && numValue > 0) {
			setSelectedItems((prev) => ({
				...prev,
				[itemId]: { ...prev[itemId], quantity: numValue },
			}));
		} else if (numValue === 0 || isNaN(numValue)) {
			// Allow typing but keep minimum at 1 when placing order
			setSelectedItems((prev) => ({
				...prev,
				[itemId]: { ...prev[itemId], quantity: value },
			}));
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

		if (!selectedCustomerId) {
			alert("Please select a customer");
			return;
		}

		// Validate quantities
		for (const itemId of itemIds) {
			const { quantity } = selectedItems[itemId];
			const qty = typeof quantity === "string" ? parseInt(quantity) : quantity;
			if (isNaN(qty) || qty < 1) {
				alert(`Please enter a valid quantity (minimum 1) for all selected items`);
				return;
			}
		}

		// Group items by order type
		const itemsByType = {};
		itemIds.forEach((itemId) => {
			const { orderType, quantity } = selectedItems[itemId];
			const qty = typeof quantity === "string" ? parseInt(quantity) : quantity;
			if (!itemsByType[orderType]) {
				itemsByType[orderType] = [];
			}
			itemsByType[orderType].push({
				menu_item_id: parseInt(itemId),
				quantity: qty,
			});
		});

		// Create orders for each type
		try {
			for (const [type, items] of Object.entries(itemsByType)) {
				await ordersAPI.create({
					table_number: null,
					order_type: type,
					customer_id: selectedCustomerId,
					order_items: items,
					is_out_of_plan: isOutOfPlan, // Use only checkbox state (manual marking)
				});
			}

			alert("Order placed successfully!");
			setSelectedItems({});
			setOrderType("dine_in");
			setIsOutOfPlan(false); // Reset checkbox
			// Refresh past orders if customer is still selected
			if (selectedCustomerId) {
				loadPastOrders(selectedCustomerId, false);
			}
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
		const qty = typeof entry.quantity === "string" ? parseInt(entry.quantity) || 0 : entry.quantity || 0;
		return sum + entry.item.price * qty;
	}, 0);

	// Get selected customer's paid amount
	const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
	const customerPaid = selectedCustomer?.paid || 0;
	const exceedsPaidAmount = totalPrice > customerPaid;

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
				Step One: Take Order
			</h1>

			<div
				style={{
					marginBottom: "clamp(15px, 3vw, 30px)",
					padding: "clamp(12px, 3vw, 20px)",
					backgroundColor: "#f0f0f0",
					borderRadius: "4px",
				}}
			>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "12px",
					}}
				>
					<div>
						<label
							style={{
								display: "block",
								marginBottom: "6px",
								fontWeight: "500",
								fontSize: "13px",
							}}
						>
							Select Menu:
						</label>
						<select
							value={selectedMenu?.id || ""}
							onChange={(e) => {
								const menu = menus.find(
									(m) => m.id === parseInt(e.target.value)
								);
								setSelectedMenu(menu);
							}}
							style={{
								padding: "10px",
								width: "100%",
								borderRadius: "4px",
								border: "1px solid #ddd",
								backgroundColor: "white",
								color: "#333",
								fontSize: "13px",
								cursor: "pointer",
								boxSizing: "border-box",
							}}
						>
							{menus.map((menu) => (
								<option key={menu.id} value={menu.id} style={{ color: "#333" }}>
									{menu.name}
								</option>
							))}
						</select>
					</div>

					<div>
						<label
							style={{
								display: "block",
								marginBottom: "6px",
								fontSize: "13px",
							}}
						>
							Default Order Type:
						</label>
						<select
							value={orderType}
							onChange={(e) => setOrderType(e.target.value)}
							style={{
								padding: "10px",
								width: "100%",
								borderRadius: "4px",
								border: "1px solid #ddd",
								backgroundColor: "white",
								color: "#333",
								fontSize: "13px",
								boxSizing: "border-box",
								cursor: "pointer",
							}}
						>
							<option value="dine_in" style={{ color: "#333" }}>
								Dine In
							</option>
							<option value="parcel" style={{ color: "#333" }}>
								Parcel
							</option>
						</select>
					</div>

					<div>
						<label
							style={{
								display: "block",
								marginBottom: "6px",
								fontWeight: "500",
								fontSize: "13px",
							}}
						>
							Select Customer <span style={{ color: "#e53935" }}>*</span>:
						</label>
						<select
							value={selectedCustomerId || ""}
							onChange={(e) =>
								setSelectedCustomerId(
									e.target.value ? parseInt(e.target.value) : null
								)
							}
							required
							style={{
								padding: "10px",
								width: "100%",
								borderRadius: "4px",
								border: "1px solid #ddd",
								backgroundColor: "white",
								color: "#333",
								fontSize: "14px",
								cursor: "pointer",
								boxSizing: "border-box",
							}}
						>
							<option value="">-- Select Customer --</option>
							{customers.map((customer) => (
								<option
									key={customer.id}
									value={customer.id}
									style={{ color: "#333" }}
								>
									{customer.name} ({customer.email})
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			<div
				style={{
					display: "grid",
					gridTemplateColumns:
						"repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
					gap: "clamp(10px, 2vw, 15px)",
				}}
			>
				{/* Menu Items Selection */}
				<div>
					<h2
						style={{
							fontSize: "clamp(16px, 2.5vw, 18px)",
							marginBottom: "12px",
							fontWeight: "600",
						}}
					>
						Menu Items
					</h2>
					<div
						style={{
							display: "grid",
							gridTemplateColumns:
								"repeat(auto-fill, minmax(min(200px, 100%), 1fr))",
							gap: "10px",
						}}
					>
						{menuItems.map((item) => {
							const isSelected = selectedItems[item.id];
							const station = stations.find((s) => s.id === item.station_id);
							const stationName = station?.name || "No Station";

							return (
								<div
									key={item.id}
									style={{
										padding: "10px",
										border: `1px solid ${isSelected ? "#4CAF50" : "#e0e0e0"}`,
										borderRadius: "6px",
										backgroundColor: isSelected ? "#f1f8f4" : "white",
										cursor: "pointer",
										transition: "all 0.2s ease",
										boxShadow: isSelected
											? "0 2px 8px rgba(76, 175, 80, 0.2)"
											: "0 1px 3px rgba(0,0,0,0.1)",
									}}
									onClick={() => handleItemToggle(item.id)}
									onMouseEnter={(e) => {
										if (!isSelected) {
											e.currentTarget.style.borderColor = "#4CAF50";
											e.currentTarget.style.boxShadow =
												"0 2px 6px rgba(0,0,0,0.15)";
										}
									}}
									onMouseLeave={(e) => {
										if (!isSelected) {
											e.currentTarget.style.borderColor = "#e0e0e0";
											e.currentTarget.style.boxShadow =
												"0 1px 3px rgba(0,0,0,0.1)";
										}
									}}
								>
									{/* Compact Header */}
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "flex-start",
											marginBottom: "8px",
										}}
									>
										<div style={{ flex: 1, minWidth: 0 }}>
											<h3
												style={{
													margin: 0,
													fontSize: "13px",
													fontWeight: "600",
													color: "#333",
													lineHeight: "1.3",
												}}
											>
												{item.name}
											</h3>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: "6px",
													marginTop: "4px",
												}}
											>
												<span
													style={{
														fontSize: "11px",
														color: "#666",
														backgroundColor: "#f5f5f5",
														padding: "2px 6px",
														borderRadius: "3px",
													}}
												>
													{stationName}
												</span>
												<span
													style={{
														fontSize: "12px",
														fontWeight: "600",
														color: "#4CAF50",
													}}
												>
													₹{item.price.toFixed(2)}
												</span>
											</div>
										</div>
										<input
											type="checkbox"
											checked={!!isSelected}
											onChange={() => handleItemToggle(item.id)}
											onClick={(e) => e.stopPropagation()}
											style={{
												marginLeft: "8px",
												width: "18px",
												height: "18px",
												cursor: "pointer",
											}}
										/>
									</div>

									{/* Selection Controls - Minimal */}
									{isSelected && (
										<div
											onClick={(e) => e.stopPropagation()}
											style={{
												marginTop: "8px",
												paddingTop: "8px",
												borderTop: "1px solid #e0e0e0",
												display: "flex",
												gap: "8px",
												alignItems: "center",
											}}
										>
											<select
												value={selectedItems[item.id].orderType}
												onChange={(e) =>
													handleOrderTypeChange(item.id, e.target.value)
												}
												style={{
													padding: "4px 6px",
													border: "1px solid #ddd",
													borderRadius: "4px",
													fontSize: "12px",
													flex: 1,
												}}
											>
												<option value="dine_in">Dine In</option>
												<option value="parcel">Parcel</option>
											</select>
											<input
												type="text"
												inputMode="numeric"
												pattern="[0-9]*"
												min="1"
												value={selectedItems[item.id].quantity}
												onChange={(e) =>
													handleQuantityChange(item.id, e.target.value)
												}
												onBlur={(e) => {
													// Ensure minimum value of 1 on blur
													const value = parseInt(e.target.value);
													if (isNaN(value) || value < 1) {
														handleQuantityChange(item.id, "1");
													}
												}}
												style={{
													padding: "4px 6px",
													width: "60px",
													border: "1px solid #ddd",
													borderRadius: "4px",
													fontSize: "12px",
													textAlign: "center",
												}}
											/>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>

				{/* Order Summary - Compact */}
				<div
					style={{
						padding: "12px",
						backgroundColor: "#f9f9f9",
						borderRadius: "6px",
						height: "fit-content",
						position: "sticky",
						top: "10px",
						maxHeight: "calc(100vh - 20px)",
						overflowY: "auto",
					}}
					className="order-summary"
				>
					<style>{`
						@media (max-width: 768px) {
							.order-summary {
								position: relative !important;
								top: 0 !important;
								max-height: none !important;
							}
						}
					`}</style>
					<h2
						style={{
							fontSize: "clamp(16px, 2.5vw, 18px)",
							marginBottom: "12px",
							marginTop: 0,
							fontWeight: "600",
						}}
					>
						Order Summary
					</h2>

					{/* Customer Details - Detailed */}
					{selectedCustomerId && (
						<div
							style={{
								marginBottom: "12px",
								padding: "12px",
								backgroundColor: "#e3f2fd",
								borderRadius: "4px",
								border: "1px solid #2196F3",
							}}
						>
							{(() => {
								const customer = customers.find(
									(c) => c.id === selectedCustomerId
								);
								if (!customer) return null;
								return (
									<div style={{ fontSize: "13px", lineHeight: "1.6" }}>
										<div
											style={{
												fontWeight: "600",
												marginBottom: "8px",
												fontSize: "14px",
												color: "#1976D2",
											}}
										>
											{customer.name}
										</div>
										<div
											style={{
												display: "flex",
												flexDirection: "column",
												gap: "6px",
											}}
										>
											<div>
												<strong>Email:</strong>{" "}
												<span style={{ color: "#666" }}>{customer.email}</span>
											</div>
											{customer.phone_number && (
												<div>
													<strong>Phone:</strong>{" "}
													<span style={{ color: "#666" }}>
														{customer.phone_number}
													</span>
												</div>
											)}
											{customer.plan_type && (
												<div>
													<strong>Plan Type:</strong>{" "}
													<span
														style={{
															color: "#1976D2",
															fontWeight: "500",
														}}
													>
														{customer.plan_type}
													</span>
												</div>
											)}
											<div>
												<strong>Amount Paid:</strong>{" "}
												<span
													style={{
														color: "#4CAF50",
														fontWeight: "600",
													}}
												>
													₹{customer.paid || 0}
												</span>
											</div>
										</div>
									</div>
								);
							})()}
						</div>
					)}

					{/* Past Orders */}
					{selectedCustomerId && (
						<div
							style={{
								marginBottom: "12px",
								padding: "12px",
								backgroundColor: "#fff3e0",
								borderRadius: "4px",
								border: "1px solid #ff9800",
								display: "flex",
								flexDirection: "column",
								maxHeight: "40vh",
								minHeight: "150px",
							}}
						>
							<div
								style={{
									fontWeight: "600",
									marginBottom: "8px",
									fontSize: "13px",
									color: "#e65100",
									flexShrink: 0,
								}}
							>
								Past Orders
							</div>
							{loadingOrders ? (
								<div style={{ fontSize: "12px", color: "#666" }}>
									Loading orders...
								</div>
							) : pastOrders.length === 0 ? (
								<div style={{ fontSize: "12px", color: "#666" }}>
									No past orders found
								</div>
							) : (
								<div
									style={{
										overflowY: "auto",
										overflowX: "hidden",
										display: "flex",
										flexDirection: "column",
										gap: "6px",
										flex: "1 1 auto",
										minHeight: 0,
										maxHeight: "250px",
										paddingRight: "4px",
										// Make scrollbar visible
										scrollbarWidth: "thin",
										scrollbarColor: "#ff9800 #fff3e0",
									}}
									className="past-orders-scroll"
								>
									<style>{`
										.past-orders-scroll::-webkit-scrollbar {
											width: 10px;
										}
										.past-orders-scroll::-webkit-scrollbar-track {
											background: #fff3e0;
											border-radius: 5px;
										}
										.past-orders-scroll::-webkit-scrollbar-thumb {
											background: #ff9800;
											border-radius: 5px;
											border: 2px solid #fff3e0;
										}
										.past-orders-scroll::-webkit-scrollbar-thumb:hover {
											background: #f57c00;
										}
									`}</style>
									{pastOrders.map((order) => {
										const orderDate = new Date(order.created_at);
										const totalAmount = order.order_items.reduce(
											(sum, item) => {
												const itemPrice =
													item.menu_item?.price || 0;
												return sum + itemPrice * item.quantity;
											},
											0
										);
										const isOutOfPlanOrder = order.is_out_of_plan || false;

										return (
											<div
												key={order.id}
												style={{
													padding: "6px 8px",
													backgroundColor: "white",
													borderRadius: "3px",
													border: isOutOfPlanOrder
														? "2px solid #ff9800"
														: "1px solid #ffcc80",
													fontSize: "11px",
													position: "relative",
												}}
											>
												{isOutOfPlanOrder && (
													<div
														style={{
															position: "absolute",
															top: "4px",
															right: "4px",
															backgroundColor: "#ff9800",
															color: "white",
															padding: "2px 6px",
															borderRadius: "3px",
															fontSize: "9px",
															fontWeight: "600",
														}}
														title="Order exceeds customer's paid amount"
													>
														OUT OF PLAN
													</div>
												)}
												<div
													style={{
														display: "flex",
														justifyContent: "space-between",
														alignItems: "center",
														marginBottom: "3px",
														marginRight: isOutOfPlanOrder ? "70px" : "0",
													}}
												>
													<span style={{ color: "#666", fontSize: "10px" }}>
														{orderDate.toLocaleDateString()}{" "}
														{orderDate.toLocaleTimeString([], {
															hour: "2-digit",
															minute: "2-digit",
														})}
													</span>
													<span
														style={{
															fontWeight: "500",
															fontSize: "10px",
															color:
																order.status === "completed"
																	? "#4CAF50"
																	: order.status === "in_progress"
																	? "#FF9800"
																	: "#666",
														}}
													>
														{order.status === "completed"
															? "Completed"
															: order.status === "in_progress"
															? "In Progress"
															: "Pending"}
													</span>
												</div>
												<div
													style={{
														fontSize: "12px",
														fontWeight: "600",
														color: "#333",
														marginBottom: "4px",
														lineHeight: "1.4",
													}}
												>
													{order.order_items.map((item, idx) => (
														<span key={idx}>
															{item.menu_item?.name || "Unknown"}{" "}
															<span
																style={{
																	color: "#ff9800",
																	fontWeight: "700",
																	fontSize: "11px",
																}}
															>
																({item.quantity}x)
															</span>
															{idx < order.order_items.length - 1 && ", "}
														</span>
													))}
												</div>
												<div
													style={{
														textAlign: "right",
														fontWeight: "600",
														color: "#4CAF50",
														fontSize: "11px",
													}}
												>
													₹{totalAmount.toFixed(2)}
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>
					)}

					{selectedItemsList.length === 0 ? (
						<p style={{ fontSize: "12px", color: "#999", margin: 0 }}>
							No items selected
						</p>
					) : (
						<>
							<div style={{ marginBottom: "12px" }}>
								{selectedItemsList.map(({ item, quantity, orderType }) => (
									<div
										key={item.id}
										style={{
											marginBottom: "6px",
											padding: "6px 8px",
											backgroundColor: "white",
											borderRadius: "4px",
											fontSize: "12px",
										}}
									>
										<div
											style={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
											}}
										>
											<span style={{ fontWeight: "600", flex: 1 }}>
												{item.name}
											</span>
											<span
												style={{
													fontWeight: "600",
													color: "#4CAF50",
													marginLeft: "8px",
												}}
											>
												₹{(item.price * (typeof quantity === "string" ? parseInt(quantity) || 0 : quantity || 0)).toFixed(2)}
											</span>
										</div>
										<div
											style={{
												fontSize: "11px",
												color: "#666",
												marginTop: "2px",
											}}
										>
											{typeof quantity === "string" ? (parseInt(quantity) || quantity) : quantity}x •{" "}
											{orderType === "dine_in" ? "Dine In" : "Parcel"}
										</div>
									</div>
								))}
							</div>

							<div
								style={{
									borderTop: "1px solid #ddd",
									paddingTop: "10px",
									marginTop: "10px",
								}}
							>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										fontSize: "14px",
										fontWeight: "bold",
										marginBottom: "12px",
									}}
								>
									<span>Total:</span>
									<span style={{ color: "#4CAF50" }}>
										₹{totalPrice.toFixed(2)}
									</span>
								</div>

								{/* Out of Plan Warning */}
								{selectedCustomerId && exceedsPaidAmount && (
									<div
										style={{
											marginBottom: "12px",
											padding: "10px",
											backgroundColor: "#fff3cd",
											border: "1px solid #ffc107",
											borderRadius: "4px",
											fontSize: "12px",
										}}
									>
										<div
											style={{
												fontWeight: "600",
												color: "#856404",
												marginBottom: "8px",
											}}
										>
											⚠️ Order Exceeds Paid Amount
										</div>
										<div style={{ color: "#856404", marginBottom: "8px" }}>
											Customer paid: ₹{customerPaid.toFixed(2)}
											<br />
											Order total: ₹{totalPrice.toFixed(2)}
											<br />
											<strong>
												Excess: ₹{(totalPrice - customerPaid).toFixed(2)}
											</strong>
										</div>
									</div>
								)}

								{/* Out of Plan Checkbox - Always visible when customer is selected */}
								{selectedCustomerId && (
									<div
										style={{
											marginBottom: "12px",
											padding: "10px",
											backgroundColor: "#f5f5f5",
											border: "1px solid #ddd",
											borderRadius: "4px",
										}}
									>
										<label
											style={{
												display: "flex",
												alignItems: "center",
												gap: "8px",
												cursor: "pointer",
												color: "#333",
											}}
										>
											<input
												type="checkbox"
												checked={isOutOfPlan}
												onChange={(e) => setIsOutOfPlan(e.target.checked)}
												style={{
													width: "16px",
													height: "16px",
													cursor: "pointer",
												}}
											/>
											<span style={{ fontSize: "12px", fontWeight: "500" }}>
												Mark order as out of plan
											</span>
										</label>
										{exceedsPaidAmount && (
											<div
												style={{
													marginTop: "6px",
													fontSize: "11px",
													color: "#666",
													fontStyle: "italic",
												}}
											>
												Note: This order exceeds the customer's paid amount
											</div>
										)}
									</div>
								)}

								<button
									onClick={handlePlaceOrder}
									style={{
										width: "100%",
										padding: "10px",
										backgroundColor: "#4CAF50",
										color: "white",
										border: "none",
										borderRadius: "4px",
										fontSize: "13px",
										fontWeight: "600",
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
