import { useState, useEffect, useRef } from "react";
import { customersAPI } from "../api";

function CustomerManagement() {
	const [customers, setCustomers] = useState([]);
	const [showCustomerForm, setShowCustomerForm] = useState(false);
	const [editingCustomer, setEditingCustomer] = useState(null);
	const [customerForm, setCustomerForm] = useState({
		email: "",
		name: "",
		phone_number: "",
		plan_type: "",
		paid: 0,
	});
	const [importing, setImporting] = useState(false);
	const [importStatus, setImportStatus] = useState(null);
	const fileInputRef = useRef(null);
	const customerFormRef = useRef(null);

	useEffect(() => {
		loadCustomers();
	}, []);

	const loadCustomers = async () => {
		try {
			const response = await customersAPI.getAll();
			setCustomers(response.data);
		} catch (error) {
			console.error("Error loading customers:", error);
		}
	};

	const handleCreateOrUpdateCustomer = async (e) => {
		e.preventDefault();
		if (!customerForm.email || !customerForm.name) {
			alert("Email and Name are required");
			return;
		}

		try {
			if (editingCustomer) {
				await customersAPI.update(editingCustomer.id, customerForm);
			} else {
				await customersAPI.create(customerForm);
			}
			setCustomerForm({
				email: "",
				name: "",
				phone_number: "",
				plan_type: "",
				paid: 0,
			});
			setEditingCustomer(null);
			setShowCustomerForm(false);
			loadCustomers();
		} catch (error) {
			console.error("Error saving customer:", error);
			alert("Error saving customer");
		}
	};

	const handleEditCustomer = (customer) => {
		setCustomerForm({
			email: customer.email,
			name: customer.name,
			phone_number: customer.phone_number || "",
			plan_type: customer.plan_type || "",
			paid: customer.paid || 0,
		});
		setEditingCustomer(customer);
		setShowCustomerForm(true);
		// Scroll to form after state updates
		setTimeout(() => {
			customerFormRef.current?.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
		}, 100);
	};

	const handleDeleteCustomer = async (customerId, customerName) => {
		if (
			!window.confirm(
				`Are you sure you want to delete customer "${customerName}"?`
			)
		) {
			return;
		}

		try {
			await customersAPI.delete(customerId);
			loadCustomers();
		} catch (error) {
			console.error("Error deleting customer:", error);
			alert("Error deleting customer");
		}
	};

	const handleCancelCustomerForm = () => {
		setCustomerForm({
			email: "",
			name: "",
			phone_number: "",
			plan_type: "",
			paid: 0,
		});
		setEditingCustomer(null);
		setShowCustomerForm(false);
	};

	const extractPaidAmount = (planTypeText) => {
		// Extract integer that follows the ₹ symbol
		// Pattern: ₹ followed by optional spaces, then digits
		const matches = planTypeText.match(/₹\s*(\d+)/);
		if (matches && matches.length > 1) {
			return parseInt(matches[1]);
		}
		return 0;
	};

	// Helper function to parse CSV line handling quoted fields
	const parseCSVLine = (line) => {
		const result = [];
		let current = "";
		let inQuotes = false;

		for (let i = 0; i < line.length; i++) {
			const char = line[i];
			const nextChar = line[i + 1];

			if (char === '"') {
				if (inQuotes && nextChar === '"') {
					// Escaped quote
					current += '"';
					i++; // Skip next quote
				} else {
					// Toggle quote state
					inQuotes = !inQuotes;
				}
			} else if (char === "," && !inQuotes) {
				// End of field
				result.push(current.trim());
				current = "";
			} else {
				current += char;
			}
		}

		// Add last field
		result.push(current.trim());
		return result;
	};

	const parseCSV = (text) => {
		const lines = text.split("\n");
		if (lines.length === 0) return [];

		// Get headers from first line using proper CSV parsing
		const headers = parseCSVLine(lines[0]).map((h) => h.replace(/^"|"$/g, ""));

		// Define required columns
		const requiredColumns = {
			name: "name",
			email: "email",
			phone_number: "phone_number",
			planType:
				"Pick your tasting plate (You can pick one or more, payment will be collected via Whatsapp)",
			approval_status: "approval_status",
		};

		// Find column indices
		const nameIdx = headers.indexOf(requiredColumns.name);
		const phoneIdx = headers.indexOf(requiredColumns.phone_number);
		const planTypeIdx = headers.indexOf(requiredColumns.planType);
		const emailIdx = headers.indexOf(requiredColumns.email);
		const approvalIdx = headers.indexOf(requiredColumns.approval_status);

		// Check which columns are missing and provide specific error
		const missingColumns = [];
		if (nameIdx === -1) missingColumns.push(`"${requiredColumns.name}"`);
		if (emailIdx === -1) missingColumns.push(`"${requiredColumns.email}"`);
		if (phoneIdx === -1)
			missingColumns.push(`"${requiredColumns.phone_number}"`);
		if (planTypeIdx === -1)
			missingColumns.push(`"${requiredColumns.planType}"`);
		if (approvalIdx === -1)
			missingColumns.push(`"${requiredColumns.approval_status}"`);

		if (missingColumns.length > 0) {
			const foundColumns =
				headers.length > 0
					? `\n\nFound columns in your file:\n${headers
							.map((h) => `  - "${h}"`)
							.join("\n")}`
					: "\n\nNo columns found in your file.";
			throw new Error(
				`Missing required column(s): ${missingColumns.join(", ")}\n\n` +
					`Required columns are:\n` +
					`  - "${requiredColumns.name}"\n` +
					`  - "${requiredColumns.email}"\n` +
					`  - "${requiredColumns.phone_number}"\n` +
					`  - "${requiredColumns.planType}"\n` +
					`  - "${requiredColumns.approval_status}"` +
					foundColumns
			);
		}

		const customers = [];

		// Process data rows
		for (let i = 1; i < lines.length; i++) {
			const line = lines[i].trim();
			if (!line) continue;

			// Use proper CSV parsing to handle quoted fields with commas
			const values = parseCSVLine(line).map((v) => v.replace(/^"|"$/g, ""));

			const approvalStatus = values[approvalIdx]?.toLowerCase();

			// Only process approved rows
			if (approvalStatus === "approved") {
				const planType = values[planTypeIdx] || "";
				const paid = extractPaidAmount(planType);

				customers.push({
					name: values[nameIdx] || "",
					email: values[emailIdx] || "",
					phone_number: values[phoneIdx] || "",
					plan_type: planType,
					paid: paid,
				});
			}
		}

		return customers;
	};

	const handleFileSelect = async (event) => {
		const file = event.target.files[0];
		if (!file) return;

		setImporting(true);
		setImportStatus(null);

		try {
			const text = await file.text();
			const parsedCustomers = parseCSV(text);

			if (parsedCustomers.length === 0) {
				setImportStatus({
					type: "warning",
					message: "No approved customers found in the CSV file.",
				});
				setImporting(false);
				return;
			}

			// Import customers one by one using upsert (create or update based on email)
			let successCount = 0;
			let updatedCount = 0;
			let failCount = 0;
			const errors = [];

			for (const customer of parsedCustomers) {
				try {
					if (!customer.email || !customer.name) {
						failCount++;
						errors.push(`Skipped row: missing email or name`);
						continue;
					}

					// Check if customer exists before upsert to track creates vs updates
					const existingCustomers = customers;
					const exists = existingCustomers.find(
						(c) => c.email === customer.email
					);

					await customersAPI.upsert(customer);

					if (exists) {
						updatedCount++;
					} else {
						successCount++;
					}
				} catch (error) {
					failCount++;
					errors.push(
						`Failed to import ${customer.name}: ${
							error.response?.data?.detail || error.message
						}`
					);
				}
			}

			const totalSuccess = successCount + updatedCount;
			setImportStatus({
				type: totalSuccess > 0 ? "success" : "error",
				message: `Import completed: ${successCount} created, ${updatedCount} updated, ${failCount} failed`,
				errors: errors.length > 0 ? errors.slice(0, 5) : null, // Show first 5 errors
			});

			loadCustomers();
		} catch (error) {
			// Format error message to preserve newlines
			const errorMessage = error.message || "Unknown error occurred";
			const isColumnError = errorMessage.includes("Missing required column");
			setImportStatus({
				type: "error",
				message: isColumnError
					? "Import failed: Missing required columns"
					: `Import failed: ${errorMessage}`,
				detailedError: isColumnError ? errorMessage : null,
			});
		} finally {
			setImporting(false);
			// Reset file input
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	const handleImportClick = () => {
		fileInputRef.current?.click();
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
				Customer Management
			</h1>

			{/* Customer Management Section */}
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
						Customers
					</h2>
					<div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
						<input
							ref={fileInputRef}
							type="file"
							accept=".csv"
							onChange={handleFileSelect}
							style={{ display: "none" }}
						/>
						<button
							onClick={handleImportClick}
							disabled={importing}
							style={{
								padding: "10px 20px",
								backgroundColor: importing ? "#9E9E9E" : "#FF9800",
								color: "white",
								border: "none",
								borderRadius: "4px",
								cursor: importing ? "not-allowed" : "pointer",
								fontSize: "13px",
								whiteSpace: "nowrap",
							}}
						>
							{importing ? "Importing..." : "📥 Import CSV"}
						</button>
						<button
							onClick={() => setShowCustomerForm(!showCustomerForm)}
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
							{showCustomerForm ? "Cancel" : "+ Add Customer"}
						</button>
					</div>
				</div>

				{/* Import Status Message */}
				{importStatus && (
					<div
						style={{
							marginBottom: "20px",
							padding: "15px",
							backgroundColor:
								importStatus.type === "success"
									? "#d4edda"
									: importStatus.type === "warning"
									? "#fff3cd"
									: "#f8d7da",
							border: `1px solid ${
								importStatus.type === "success"
									? "#c3e6cb"
									: importStatus.type === "warning"
									? "#ffeaa7"
									: "#f5c6cb"
							}`,
							borderRadius: "4px",
							color:
								importStatus.type === "success"
									? "#155724"
									: importStatus.type === "warning"
									? "#856404"
									: "#721c24",
						}}
					>
						<strong>{importStatus.message}</strong>
						{importStatus.detailedError && (
							<pre
								style={{
									marginTop: "10px",
									marginBottom: 0,
									fontSize: "13px",
									fontFamily: "inherit",
									whiteSpace: "pre-wrap",
									wordWrap: "break-word",
									backgroundColor: "rgba(0,0,0,0.05)",
									padding: "10px",
									borderRadius: "4px",
								}}
							>
								{importStatus.detailedError}
							</pre>
						)}
						{importStatus.errors && (
							<ul style={{ marginTop: "10px", marginBottom: 0 }}>
								{importStatus.errors.map((error, idx) => (
									<li key={idx} style={{ fontSize: "13px" }}>
										{error}
									</li>
								))}
							</ul>
						)}
					</div>
				)}

				{showCustomerForm && (
					<form
						ref={customerFormRef}
						onSubmit={handleCreateOrUpdateCustomer}
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
									Email <span style={{ color: "#e53935" }}>*</span>
								</label>
								<input
									type="email"
									value={customerForm.email}
									onChange={(e) =>
										setCustomerForm({ ...customerForm, email: e.target.value })
									}
									required
									placeholder="customer@example.com"
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
									Name <span style={{ color: "#e53935" }}>*</span>
								</label>
								<input
									type="text"
									value={customerForm.name}
									onChange={(e) =>
										setCustomerForm({ ...customerForm, name: e.target.value })
									}
									required
									placeholder="John Doe"
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
									Phone Number
								</label>
								<input
									type="tel"
									value={customerForm.phone_number}
									onChange={(e) =>
										setCustomerForm({
											...customerForm,
											phone_number: e.target.value,
										})
									}
									placeholder="+1234567890"
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
									Plan Type
								</label>
								<input
									type="text"
									value={customerForm.plan_type}
									onChange={(e) =>
										setCustomerForm({
											...customerForm,
											plan_type: e.target.value,
										})
									}
									placeholder="e.g., Premium, Basic"
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
									Amount Paid
								</label>
								<input
									type="number"
									value={customerForm.paid}
									onChange={(e) =>
										setCustomerForm({
											...customerForm,
											paid: parseInt(e.target.value) || 0,
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
						</div>
						<div style={{ display: "flex", gap: "10px" }}>
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
								{editingCustomer ? "Update Customer" : "Create Customer"}
							</button>
							{editingCustomer && (
								<button
									type="button"
									onClick={handleCancelCustomerForm}
									style={{
										padding: "12px 24px",
										backgroundColor: "#9E9E9E",
										color: "white",
										border: "none",
										borderRadius: "4px",
										cursor: "pointer",
										fontSize: "14px",
										fontWeight: "500",
									}}
								>
									Cancel
								</button>
							)}
						</div>
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
					{customers.map((customer) => (
						<div
							key={customer.id}
							style={{
								padding: "15px",
								border: "1px solid #ddd",
								borderRadius: "4px",
								backgroundColor: "#f9f9f9",
								position: "relative",
							}}
						>
							<div
								style={{
									position: "absolute",
									top: "10px",
									right: "10px",
									display: "flex",
									gap: "5px",
								}}
							>
								<button
									onClick={() => handleEditCustomer(customer)}
									style={{
										backgroundColor: "#ffffff",
										color: "#2196F3",
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
										e.currentTarget.style.backgroundColor = "#e3f2fd";
										e.currentTarget.style.transform = "scale(1.1)";
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.backgroundColor = "#ffffff";
										e.currentTarget.style.transform = "scale(1)";
									}}
									title="Edit customer"
								>
									✏️
								</button>
								<button
									onClick={() =>
										handleDeleteCustomer(customer.id, customer.name)
									}
									style={{
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
									title="Delete customer"
								>
									🗑️
								</button>
							</div>
							<h3 style={{ marginRight: "100px", marginBottom: "10px" }}>
								{customer.name}
							</h3>
							<p style={{ marginBottom: "5px" }}>
								<strong>Email:</strong> {customer.email}
							</p>
							{customer.phone_number && (
								<p style={{ marginBottom: "5px" }}>
									<strong>Phone:</strong> {customer.phone_number}
								</p>
							)}
							{customer.plan_type && (
								<p style={{ marginBottom: "5px" }}>
									<strong>Plan:</strong> {customer.plan_type}
								</p>
							)}
							<p style={{ marginBottom: "5px" }}>
								<strong>Paid:</strong> ₹{customer.paid}
							</p>
						</div>
					))}
					{customers.length === 0 && (
						<p>No customers yet. Add one to get started!</p>
					)}
				</div>
			</section>
		</div>
	);
}

export default CustomerManagement;
