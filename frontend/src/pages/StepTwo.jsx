import { useState, useEffect } from "react";
import { stationsAPI, kitchenAPI } from "../api";

function StepTwo() {
	const [stations, setStations] = useState([]);
	const [selectedStationId, setSelectedStationId] = useState(null);
	const [orderItems, setOrderItems] = useState({
		todo: [],
		inprogress: [],
		done: [],
	});
	const [loading, setLoading] = useState(false);
	const [collapsedItems, setCollapsedItems] = useState(new Set());

	useEffect(() => {
		loadStations();
	}, []);

	useEffect(() => {
		if (selectedStationId) {
			loadOrderItems();
			// Set up polling for real-time updates
			const interval = setInterval(loadOrderItems, 2000); // Poll every 2 seconds
			return () => clearInterval(interval);
		}
	}, [selectedStationId]);

	const loadStations = async () => {
		try {
			const response = await stationsAPI.getAll();
			setStations(response.data);
			if (response.data.length > 0 && !selectedStationId) {
				setSelectedStationId(response.data[0].id);
			}
		} catch (error) {
			console.error("Error loading stations:", error);
		}
	};

	const loadOrderItems = async () => {
		if (!selectedStationId) return;

		setLoading(true);
		try {
			const [todoRes, inprogressRes, doneRes] = await Promise.all([
				kitchenAPI.getOrderItemsByStation(selectedStationId, "todo"),
				kitchenAPI.getOrderItemsByStation(selectedStationId, "inprogress"),
				kitchenAPI.getOrderItemsByStation(selectedStationId, "done"),
			]);

			const doneItems = doneRes.data || [];

			setOrderItems({
				todo: todoRes.data || [],
				inprogress: inprogressRes.data || [],
				done: doneItems,
			});

			// Automatically collapse all done items by default (only add new ones, preserve user's manual expand/collapse)
			setCollapsedItems((prev) => {
				const newSet = new Set(prev);
				// Get current done item IDs
				const currentDoneIds = new Set(doneItems.map((item) => item.id));

				// Remove items that are no longer in done state
				prev.forEach((itemId) => {
					if (!currentDoneIds.has(itemId)) {
						newSet.delete(itemId);
					}
				});

				// Add all done items (newly moved to done or newly loaded) - collapsed by default
				doneItems.forEach((item) => {
					if (!prev.has(item.id)) {
						// Only add if not already in Set (preserves user's manual expansion)
						newSet.add(item.id);
					}
				});

				return newSet;
			});
		} catch (error) {
			console.error("Error loading order items:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleStatusChange = async (orderItemId, newStatus) => {
		try {
			await kitchenAPI.updateOrderItemStatus(orderItemId, newStatus);
			await loadOrderItems();
		} catch (error) {
			console.error("Error updating status:", error);
			alert("Error updating status");
		}
	};

	const moveItem = (item, fromStatus, toStatus) => {
		handleStatusChange(item.id, toStatus);
	};

	const toggleItemCollapse = (itemId) => {
		setCollapsedItems((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(itemId)) {
				newSet.delete(itemId);
			} else {
				newSet.add(itemId);
			}
			return newSet;
		});
	};

	const renderKanbanColumn = (title, items, status) => {
		return (
			<div
				style={{
					flex: 1,
					margin: "0 10px",
					backgroundColor: "#f5f5f5",
					borderRadius: "8px",
					padding: "15px",
					minHeight: "500px",
				}}
			>
				<h3
					style={{
						marginBottom: "15px",
						padding: "10px",
						backgroundColor:
							status === "todo"
								? "#ff9800"
								: status === "inprogress"
								? "#2196F3"
								: "#4CAF50",
						color: "white",
						borderRadius: "4px",
						textAlign: "center",
					}}
				>
					{title} ({items.length})
				</h3>

				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "10px",
					}}
				>
					{items.map((item) => {
						const isCollapsed =
							status === "done" && collapsedItems.has(item.id);
						return (
							<div
								key={item.id}
								style={{
									padding: "15px",
									backgroundColor: "white",
									borderRadius: "4px",
									border: "1px solid #ddd",
									boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
									cursor: status !== "done" ? "pointer" : "default",
								}}
							>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										marginBottom: isCollapsed ? "0" : "10px",
										cursor: status === "done" ? "pointer" : "default",
									}}
									onClick={
										status === "done"
											? () => toggleItemCollapse(item.id)
											: undefined
									}
									title={
										status === "done"
											? isCollapsed
												? "Click to expand"
												: "Click to collapse"
											: ""
									}
								>
									<h4 style={{ margin: 0, color: "#333", flex: 1 }}>
										{item.menu_item?.name || "Unknown Item"}
									</h4>
									{status === "done" && (
										<span
											style={{
												fontSize: "14px",
												color: "#666",
												marginLeft: "10px",
											}}
										>
											{isCollapsed ? "▶" : "▼"}
										</span>
									)}
								</div>

								{!isCollapsed && (
									<>
										<div
											style={{
												fontSize: "14px",
												color: "#666",
												marginBottom: "10px",
											}}
										>
											<p style={{ margin: "5px 0" }}>
												<strong>Order #:</strong> {item.order_id}
											</p>
											<p style={{ margin: "5px 0" }}>
												<strong>Quantity:</strong> {item.quantity}
											</p>
											{item.order && (
												<>
													<p style={{ margin: "5px 0" }}>
														<strong>Type:</strong>{" "}
														{item.order.order_type === "dine_in"
															? "Dine In"
															: "Parcel"}
													</p>
													{item.order.table_number && (
														<p style={{ margin: "5px 0" }}>
															<strong>Table:</strong> {item.order.table_number}
														</p>
													)}
												</>
											)}
											{item.menu_item && (
												<p style={{ margin: "5px 0" }}>
													<strong>Prep Time:</strong> {item.menu_item.prep_time}{" "}
													min
												</p>
											)}
											<p
												style={{
													margin: "5px 0",
													fontSize: "12px",
													color: "#999",
												}}
											>
												Added: {new Date(item.created_at).toLocaleTimeString()}
											</p>
										</div>

										{status === "todo" && (
											<button
												onClick={() => moveItem(item, "todo", "inprogress")}
												style={{
													width: "100%",
													padding: "8px",
													backgroundColor: "#2196F3",
													color: "white",
													border: "none",
													borderRadius: "4px",
													cursor: "pointer",
													marginTop: "10px",
												}}
											>
												Start
											</button>
										)}

										{status === "inprogress" && (
											<div
												style={{
													display: "flex",
													gap: "5px",
													marginTop: "10px",
												}}
											>
												<button
													onClick={() => moveItem(item, "inprogress", "todo")}
													style={{
														flex: 1,
														padding: "8px",
														backgroundColor: "#ff9800",
														color: "white",
														border: "none",
														borderRadius: "4px",
														cursor: "pointer",
													}}
												>
													Back to Todo
												</button>
												<button
													onClick={() => moveItem(item, "inprogress", "done")}
													style={{
														flex: 1,
														padding: "8px",
														backgroundColor: "#4CAF50",
														color: "white",
														border: "none",
														borderRadius: "4px",
														cursor: "pointer",
													}}
												>
													Mark Done
												</button>
											</div>
										)}

										{status === "done" && (
											<div
												style={{
													display: "flex",
													gap: "5px",
													marginTop: "10px",
												}}
											>
												<button
													onClick={() => moveItem(item, "done", "todo")}
													style={{
														flex: 1,
														padding: "8px",
														backgroundColor: "#ff9800",
														color: "white",
														border: "none",
														borderRadius: "4px",
														cursor: "pointer",
														fontSize: "12px",
													}}
												>
													Back to Todo
												</button>
												<button
													onClick={() => moveItem(item, "done", "inprogress")}
													style={{
														flex: 1,
														padding: "8px",
														backgroundColor: "#2196F3",
														color: "white",
														border: "none",
														borderRadius: "4px",
														cursor: "pointer",
														fontSize: "12px",
													}}
												>
													Back to In Progress
												</button>
											</div>
										)}
									</>
								)}
							</div>
						);
					})}

					{items.length === 0 && (
						<div
							style={{
								padding: "40px",
								textAlign: "center",
								color: "#999",
								fontStyle: "italic",
							}}
						>
							No items
						</div>
					)}
				</div>
			</div>
		);
	};

	return (
		<div
			style={{
				padding: "20px",
				maxWidth: "1400px",
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
				Step Two: Kitchen Staff View
			</h1>

			<div
				style={{
					marginBottom: "30px",
					padding: "20px",
					backgroundColor: "#f0f0f0",
					borderRadius: "4px",
				}}
			>
				<label style={{ fontSize: "18px", marginRight: "15px" }}>
					<strong>Select Station:</strong>
				</label>
				<select
					value={selectedStationId || ""}
					onChange={(e) => setSelectedStationId(parseInt(e.target.value))}
					style={{
						padding: "10px 15px",
						fontSize: "16px",
						minWidth: "250px",
						borderRadius: "4px",
						border: "1px solid #ddd",
					}}
				>
					{stations.map((station) => (
						<option key={station.id} value={station.id}>
							{station.name}
						</option>
					))}
				</select>

				{loading && (
					<span style={{ marginLeft: "15px", color: "#666" }}>Loading...</span>
				)}
			</div>

			{selectedStationId && (
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "10px",
						marginTop: "20px",
					}}
					className="kanban-container"
				>
					<style>{`
						@media (min-width: 768px) {
							.kanban-container {
								flex-direction: row !important;
							}
						}
					`}</style>
					{renderKanbanColumn("To Do", orderItems.todo, "todo")}
					{renderKanbanColumn(
						"In Progress",
						orderItems.inprogress,
						"inprogress"
					)}
					{renderKanbanColumn("Done", orderItems.done, "done")}
				</div>
			)}

			{!selectedStationId && stations.length === 0 && (
				<div
					style={{
						padding: "40px",
						textAlign: "center",
						backgroundColor: "#fff3cd",
						borderRadius: "4px",
						color: "#856404",
					}}
				>
					<p>
						No stations available. Please create stations in Step Zero first.
					</p>
				</div>
			)}
		</div>
	);
}

export default StepTwo;
