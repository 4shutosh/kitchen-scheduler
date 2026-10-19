// Split a line respecting quoted fields (for CSV with commas inside values)
const splitLine = (line, delimiter) => {
	if (delimiter === "\t") return line.split("\t").map((f) => f.trim());
	const result = [];
	let current = "";
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (ch === '"') {
			if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
			else inQuotes = !inQuotes;
		} else if (ch === delimiter && !inQuotes) {
			result.push(current.trim());
			current = "";
		} else {
			current += ch;
		}
	}
	result.push(current.trim());
	return result;
};

const parseAmount = (payment) => {
	const amountMatch = payment.match(/₹\s*([\d,]+)/);
	return amountMatch ? parseInt(amountMatch[1].replace(/,/g, ""), 10) : 0;
};

const isPaid = (payment) => payment.toLowerCase().startsWith("paid");

// Original sheet: Full Name, Mobile Number, Quantity: N, Ticket, Payment
const legacyFormat = {
	columns: {
		name: "Full Name",
		email: "Email",
		phone: "Mobile Number",
		quantity: "Quantity",
		ticket: "Ticket",
		payment: "Payment",
	},
	parseRow: (get, name) => {
		const payment = get("payment");
		if (!isPaid(payment)) return null;

		const ticket = get("ticket").trim();
		if (!ticket) return { skip: `Skipped "${name}": no ticket value` };

		return { plan_type: ticket, paid: parseAmount(payment) };
	},
};

// Newer sheet: Name, Phone, Tickets: N, Savoury: N, Payment Status
// The numbers in the Tickets/Savoury headers are sheet totals; cells hold per-row counts
const ticketsFormat = {
	columns: {
		name: "Name",
		email: "Email",
		phone: "Phone",
		tickets: "Tickets",
		savoury: "Savoury",
		payment: "Payment Status",
	},
	parseRow: (get, name) => {
		const payment = get("payment");
		if (!isPaid(payment)) return null;

		const tickets = parseInt(get("tickets"), 10) || 0;
		const savoury = parseInt(get("savoury"), 10) || 0;
		if (tickets === 0 && savoury === 0) {
			return { skip: `Skipped "${name}": no tickets or savoury` };
		}

		const parts = [];
		if (tickets > 0) parts.push(`${tickets} × Ticket`);
		if (savoury > 0) parts.push(`${savoury} × Savoury`);

		return { plan_type: parts.join(", "), paid: parseAmount(payment) };
	},
};

// Header matches exactly, or is followed by ":" (handles headers like "Quantity: 136")
const headerMatches = (header, col) => header === col || header.startsWith(`${col}:`);

export const parseCustomerFile = (text) => {
	const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
	if (lines.length === 0) return [];

	const firstLine = lines[0];
	const delimiter = firstLine.includes("\t") ? "\t" : ",";
	const headers = splitLine(firstLine, delimiter);

	const format = headers.some((h) => headerMatches(h, "Tickets")) ? ticketsFormat : legacyFormat;
	const required = format.columns;

	const idx = Object.fromEntries(
		Object.entries(required).map(([key, col]) => [key, headers.findIndex((h) => headerMatches(h, col))])
	);

	const missing = Object.entries(required)
		.filter(([key]) => idx[key] === -1)
		.map(([, col]) => `"${col}"`);

	if (missing.length > 0) {
		const found = headers.length > 0
			? `\n\nFound columns:\n${headers.map((h) => `  - "${h}"`).join("\n")}`
			: "\n\nNo columns found.";
		throw new Error(`Missing required column(s): ${missing.join(", ")}` + found);
	}

	const customers = [];
	const skipped = [];

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;

		const values = splitLine(line, delimiter);
		const get = (key) => values[idx[key]] || "";
		const name = get("name") || `Row ${i + 1}`;

		const result = format.parseRow(get, name);
		if (!result) continue;
		if (result.skip) {
			skipped.push(result.skip);
			continue;
		}

		customers.push({
			name: get("name"),
			email: get("email"),
			phone_number: get("phone"),
			plan_type: result.plan_type,
			paid: result.paid,
		});
	}

	return { customers, skipped };
};
