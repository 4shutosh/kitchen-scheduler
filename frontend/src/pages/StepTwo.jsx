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

			setOrderItems({
				todo: todoRes.data || [],
				inprogress: inprogressRes.data || [],
				done: doneRes.data || [],
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

	const renderKanbanColumn = (title, items, status) => {
		return (
			<div
				style={{
					flex: 1,
					margin: "0 clamp(5px, 1vw, 10px)",
					backgroundColor: "#f5f5f5",
					borderRadius: "8px",
					padding: "clamp(10px, 2vw, 15px)",
					minHeight: "clamp(300px, 50vh, 500px)",
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
						gap: "4px",
					}}
				>
					{items.map((item) => {
						const customerName =
							item.order?.customer?.name || "Unknown Customer";
						const orderType =
							item.order?.order_type === "dine_in" ? "Dine In" : "Parcel";
						const menuItemName = item.menu_item?.name || "Unknown Item";

						// Determine left and right navigation based on status
						const canMoveLeft = status !== "todo";
						const canMoveRight = status !== "done";
						const leftStatus =
							status === "inprogress"
								? "todo"
								: status === "done"
								? "inprogress"
								: null;
						const rightStatus =
							status === "todo"
								? "inprogress"
								: status === "inprogress"
								? "done"
								: null;

						return (
							<div
								key={item.id}
								style={{
									padding: "6px 8px",
									backgroundColor: "white",
									borderRadius: "4px",
									border: "1px solid #ddd",
									boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
									display: "flex",
									alignItems: "center",
									gap: "8px",
								}}
							>
								{/* Left Arrow Button */}
								{canMoveLeft && (
									<button
										onClick={() => moveItem(item, status, leftStatus)}
										style={{
											padding: "4px 6px",
											backgroundColor: "#ff9800",
											color: "white",
											border: "none",
											borderRadius: "3px",
											cursor: "pointer",
											fontSize: "13px",
											flexShrink: 0,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											minWidth: "24px",
											height: "24px",
										}}
										title={`Move to ${
											leftStatus === "todo" ? "Todo" : "In Progress"
										}`}
									>
										←
									</button>
								)}
								{!canMoveLeft && (
									<div style={{ width: "24px", flexShrink: 0 }} />
								)}

								{/* Content - Menu Item Name */}
								<div
									style={{
										fontSize: "13px",
										fontWeight: "600",
										color: "#333",
										flex: 1,
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{menuItemName}
								</div>

								{/* Customer Name */}
								<span
									style={{
										fontSize: "12px",
										color: "#666",
										flexShrink: 0,
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
										maxWidth: "120px",
									}}
								>
									{customerName}
								</span>

								{/* Order Type Badge */}
								<span
									style={{
										padding: "2px 6px",
										backgroundColor:
											orderType === "Dine In" ? "#e3f2fd" : "#fff3e0",
										color: orderType === "Dine In" ? "#1976d2" : "#f57c00",
										borderRadius: "3px",
										fontSize: "11px",
										fontWeight: "500",
										flexShrink: 0,
									}}
								>
									{orderType}
								</span>

								{/* Right Arrow Button */}
								{canMoveRight && (
									<button
										onClick={() => moveItem(item, status, rightStatus)}
										style={{
											padding: "4px 6px",
											backgroundColor:
												rightStatus === "done" ? "#4CAF50" : "#2196F3",
											color: "white",
											border: "none",
											borderRadius: "3px",
											cursor: "pointer",
											fontSize: "13px",
											flexShrink: 0,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											minWidth: "24px",
											height: "24px",
										}}
										title={`Move to ${
											rightStatus === "done" ? "Done" : "In Progress"
										}`}
									>
										→
									</button>
								)}
								{!canMoveRight && (
									<div style={{ width: "24px", flexShrink: 0 }} />
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
				padding: "clamp(10px, 3vw, 20px)",
				maxWidth: "1400px",
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
				Step Two: Kitchen Staff View
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
						gap: "10px",
					}}
				>
					<label
						style={{
							fontSize: "13px",
							fontWeight: "600",
						}}
					>
						Select Station:
					</label>
					<select
						value={selectedStationId || ""}
						onChange={(e) => setSelectedStationId(parseInt(e.target.value))}
						style={{
							padding: "10px",
							fontSize: "13px",
							width: "100%",
							borderRadius: "4px",
							border: "1px solid #ddd",
							boxSizing: "border-box",
						}}
					>
						{stations.map((station) => (
							<option key={station.id} value={station.id}>
								{station.name}
							</option>
						))}
					</select>

					{/* {loading && (
						<span style={{ fontSize: "13px", color: "#666" }}>Loading...</span>
					)} */}
				</div>
			</div>

			{selectedStationId && (
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "clamp(10px, 2vw, 15px)",
						marginTop: "clamp(10px, 2vw, 20px)",
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
