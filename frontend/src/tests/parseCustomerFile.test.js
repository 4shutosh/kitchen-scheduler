import { describe, it, expect } from 'vitest';
import { parseCustomerFile as _parse } from '../utils/parseCustomerFile';

// Unwrap helper — most tests only care about parsed customers
const parseCustomerFile = (text) => _parse(text).customers;
const parseWithSkipped = (text) => _parse(text);

const HEADERS = 'TimeStamp,Full Name,Email,Mobile Number,Day,Slot,Quantity: 136,Ticket,Payment,Payment Status';

const makeRow = (overrides = {}) => {
	const defaults = {
		timestamp: '"Sunday, 19 April 2026 at 10:56:40"',
		name: 'Ashutosh Zohan',
		email: 'test@example.com',
		phone: '919999999999',
		day: '25th Saturday',
		slot: '12:00 pm – 4:00 pm',
		quantity: '1',
		ticket: 'Single ticket — 1 slice of cake + 1 drink (₹550)',
		payment: 'Paid ₹550',
		paymentStatus: 'pay_ABC123',
	};
	const r = { ...defaults, ...overrides };
	return `${r.timestamp},${r.name},${r.email},${r.phone},${r.day},${r.slot},${r.quantity},"${r.ticket}",${r.payment},${r.paymentStatus}`;
};

const makeCSV = (rows) => [HEADERS, ...rows].join('\n');


describe('parseCustomerFile — happy path', () => {
	it('parses a single paid row correctly', () => {
		const result = parseCustomerFile(makeCSV([makeRow()]));
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			name: 'Ashutosh Zohan',
			email: 'test@example.com',
			phone_number: '919999999999',
			plan_type: 'Single ticket — 1 slice of cake + 1 drink (₹550)',
			paid: 550,
		});
	});

	it('extracts correct paid amount for quantity 3 (₹1650)', () => {
		const row = makeRow({ quantity: '3', ticket: '3 × Single ticket — 1 slice of cake + 1 drink (₹550)', payment: 'Paid ₹1650' });
		const result = parseCustomerFile(makeCSV([row]));
		expect(result[0].paid).toBe(1650);
	});

	it('parses multiple rows', () => {
		const rows = [
			makeRow({ name: 'Alice', email: 'a@example.com', payment: 'Paid ₹550' }),
			makeRow({ name: 'Bob', email: 'b@example.com', payment: 'Paid ₹1100', quantity: '2' }),
		];
		const result = parseCustomerFile(makeCSV(rows));
		expect(result).toHaveLength(2);
		expect(result[0].name).toBe('Alice');
		expect(result[1].paid).toBe(1100);
	});

	it('allows duplicate emails', () => {
		const rows = [
			makeRow({ name: 'Alice', email: 'same@example.com' }),
			makeRow({ name: 'Alice Again', email: 'same@example.com' }),
		];
		expect(parseCustomerFile(makeCSV(rows))).toHaveLength(2);
	});

	it('handles CRLF line endings', () => {
		const csv = makeCSV([makeRow()]).replace(/\n/g, '\r\n');
		expect(parseCustomerFile(csv)).toHaveLength(1);
	});

	it('handles tab-separated files', () => {
		const cols = ['TimeStamp', 'Full Name', 'Email', 'Mobile Number', 'Day', 'Slot', 'Quantity: 136', 'Ticket', 'Payment', 'Payment Status'];
		const vals = ['Sunday 19 April', 'Tab User', 'tab@example.com', '9999999999', 'Sat', '12pm', '1', 'Single ticket (₹550)', 'Paid ₹550', 'pay_123'];
		const tsv = [cols.join('\t'), vals.join('\t')].join('\n');
		const result = parseCustomerFile(tsv);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe('Tab User');
		expect(result[0].paid).toBe(550);
	});

	it('handles "Quantity: 136" style header with startsWith match', () => {
		// The actual file has "Quantity: 136" as column header
		const headers = HEADERS.replace('Quantity: 136', 'Quantity: 136');
		const result = parseCustomerFile([headers, makeRow()].join('\n'));
		expect(result).toHaveLength(1);
	});
});


describe('parseCustomerFile — filtering', () => {
	it('skips rows where Payment does not start with "Paid"', () => {
		const rows = [
			makeRow({ payment: 'Pending ₹550' }),
			makeRow({ name: 'Paid Guy', payment: 'Paid ₹550' }),
		];
		const result = parseCustomerFile(makeCSV(rows));
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe('Paid Guy');
	});

	it('skips rows with empty Ticket column', () => {
		const rows = [
			makeRow({ ticket: '' }),
			makeRow({ name: 'Has Ticket', ticket: 'Single ticket — 1 slice (₹550)' }),
		];
		const result = parseCustomerFile(makeCSV(rows));
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe('Has Ticket');
	});

	it('skips blank lines', () => {
		const csv = makeCSV([makeRow(), '', makeRow({ name: 'Second' })]);
		expect(parseCustomerFile(csv)).toHaveLength(2);
	});

	it('returns empty array when no paid rows', () => {
		const rows = [makeRow({ payment: 'Pending ₹550' })];
		expect(parseCustomerFile(makeCSV(rows))).toHaveLength(0);
	});

	it('is case-insensitive for "paid" check', () => {
		const rows = [makeRow({ payment: 'PAID ₹550' })];
		expect(parseCustomerFile(makeCSV(rows))).toHaveLength(1);
	});
});


describe('parseCustomerFile — paid amount extraction', () => {
	it('extracts ₹ amount from "Paid ₹550"', () => {
		expect(parseCustomerFile(makeCSV([makeRow({ payment: 'Paid ₹550' })]))[0].paid).toBe(550);
	});

	it('extracts ₹ amount from "Paid ₹1650"', () => {
		expect(parseCustomerFile(makeCSV([makeRow({ payment: 'Paid ₹1650' })]))[0].paid).toBe(1650);
	});

	it('returns 0 when no ₹ symbol found', () => {
		expect(parseCustomerFile(makeCSV([makeRow({ payment: 'Paid' })]))[0].paid).toBe(0);
	});

	it('handles Indian comma-formatted amounts like ₹3,300', () => {
		// Payment value with comma must be quoted in CSV
		const row = `"Sunday, 19 April 2026",Alice,alice@example.com,9999999999,Sat,12pm,6,Single ticket (₹550),"Paid ₹3,300",pay_123`;
		const result = parseCustomerFile([HEADERS, row].join('\n'));
		expect(result[0].paid).toBe(3300);
	});

	it('handles larger comma-formatted amounts like ₹1,10,000', () => {
		const row = `"Sunday, 19 April 2026",Alice,alice@example.com,9999999999,Sat,12pm,20,Single ticket (₹550),"Paid ₹1,10,000",pay_123`;
		const result = parseCustomerFile([HEADERS, row].join('\n'));
		expect(result[0].paid).toBe(110000);
	});
});


describe('parseCustomerFile — quoted CSV fields', () => {
	it('handles commas inside ticket names (quoted field)', () => {
		// Ticket column value contains a comma — must be quoted in CSV
		const row = `"Sunday, 19 April 2026",Alice,alice@example.com,9999999999,Sat,12pm,1,"Ticket, with comma inside",Paid ₹550,pay_123`;
		const headers = 'TimeStamp,Full Name,Email,Mobile Number,Day,Slot,Quantity: 136,Ticket,Payment,Payment Status';
		const result = parseCustomerFile([headers, row].join('\n'));
		expect(result[0].plan_type).toBe('Ticket, with comma inside');
		expect(result[0].paid).toBe(550);
	});

	it('does not shift column indices when ticket has commas', () => {
		// The timestamp is quoted (contains comma), ticket is quoted (contains comma)
		// This is the real-world format
		const result = parseCustomerFile(makeCSV([makeRow()]));
		expect(result[0].email).toBe('test@example.com');
		expect(result[0].paid).toBe(550);
	});
});


describe('parseCustomerFile — error handling', () => {
	it('throws when required columns are missing', () => {
		const csv = 'Name,Email\nAlice,a@example.com';
		expect(() => parseCustomerFile(csv)).toThrow('Missing required column(s)');
	});

	it('error message lists which columns are missing', () => {
		const csv = 'Full Name,Email\nAlice,a@example.com';
		expect(() => parseCustomerFile(csv)).toThrow('"Mobile Number"');
	});

	it('error message shows found columns', () => {
		const csv = 'Wrong Column,Other\nval1,val2';
		try {
			parseCustomerFile(csv);
		} catch (e) {
			expect(e.message).toContain('Found columns');
			expect(e.message).toContain('"Wrong Column"');
		}
	});

	it('returns empty array for header-only file', () => {
		expect(parseCustomerFile(HEADERS)).toHaveLength(0);
	});
});


describe('parseCustomerFile — skipped rows reporting', () => {
	it('reports skipped rows with empty ticket in skipped array', () => {
		const rows = [
			makeRow({ ticket: '' }),
			makeRow({ name: 'Valid User', ticket: 'Single ticket (₹550)' }),
		];
		const { customers, skipped } = parseWithSkipped(makeCSV(rows));
		expect(customers).toHaveLength(1);
		expect(skipped).toHaveLength(1);
		expect(skipped[0]).toContain('no ticket value');
	});

	it('includes the customer name in the skipped message', () => {
		const row = makeRow({ name: 'John Doe', ticket: '' });
		const { skipped } = parseWithSkipped(makeCSV([row]));
		expect(skipped[0]).toContain('John Doe');
	});

	it('returns empty skipped array when all rows have tickets', () => {
		const { skipped } = parseWithSkipped(makeCSV([makeRow()]));
		expect(skipped).toHaveLength(0);
	});

	it('does not add unpaid rows to skipped (they are just ignored)', () => {
		const rows = [makeRow({ payment: 'Pending ₹550', ticket: '' })];
		const { skipped } = parseWithSkipped(makeCSV(rows));
		expect(skipped).toHaveLength(0);
	});
});


describe('parseCustomerFile — Tickets/Savoury sheet format', () => {
	const NEW_HEADERS = 'Timestamp,Name,Email,Phone,Day,Slot,Tickets: 9,Savoury: 3,Payment Status,Payment ID';

	const makeNewRow = (overrides = {}) => {
		const defaults = {
			timestamp: '"Sunday, 19 April 2026 at 10:56:40"',
			name: 'Ashutosh Zohan',
			email: 'test@example.com',
			phone: '919999999999',
			day: '25th Saturday',
			slot: '12:00 pm – 4:00 pm',
			tickets: '2',
			savoury: '1',
			paymentStatus: '"Paid ₹1,698"',
			paymentId: 'pay_ABC123',
		};
		const r = { ...defaults, ...overrides };
		return `${r.timestamp},${r.name},${r.email},${r.phone},${r.day},${r.slot},${r.tickets},${r.savoury},${r.paymentStatus},${r.paymentId}`;
	};

	const makeNewCSV = (rows) => [NEW_HEADERS, ...rows].join('\n');

	it('parses a paid row with tickets and savoury', () => {
		const result = parseCustomerFile(makeNewCSV([makeNewRow()]));
		expect(result).toEqual([{
			name: 'Ashutosh Zohan',
			email: 'test@example.com',
			phone_number: '919999999999',
			plan_type: '2 × Ticket, 1 × Savoury',
			paid: 1698,
		}]);
	});

	it('omits zero or empty counts from plan_type', () => {
		const result = parseCustomerFile(makeNewCSV([
			makeNewRow({ name: 'Tickets Only', savoury: '' }),
			makeNewRow({ name: 'Savoury Only', tickets: '0', savoury: '3' }),
		]));
		expect(result[0].plan_type).toBe('2 × Ticket');
		expect(result[1].plan_type).toBe('3 × Savoury');
	});

	it('ignores rows whose Payment Status is not paid', () => {
		const result = parseCustomerFile(makeNewCSV([
			makeNewRow({ paymentStatus: 'Pending' }),
			makeNewRow({ paymentStatus: '' }),
			makeNewRow({ name: 'Paid Guy' }),
		]));
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe('Paid Guy');
	});

	it('reports paid rows with no tickets or savoury as skipped', () => {
		const { customers, skipped } = parseWithSkipped(makeNewCSV([
			makeNewRow({ name: 'Empty Order', tickets: '', savoury: '0' }),
		]));
		expect(customers).toHaveLength(0);
		expect(skipped).toEqual(['Skipped "Empty Order": no tickets or savoury']);
	});

	it('handles tab-separated files', () => {
		const cols = ['Timestamp', 'Name', 'Email', 'Phone', 'Day', 'Slot', 'Tickets: 9', 'Savoury: 3', 'Payment Status', 'Payment ID'];
		const vals = ['Sunday 19 April', 'Tab User', 'tab@example.com', '9999999999', 'Sat', '12pm', '1', '1', 'Paid ₹1,698', 'pay_123'];
		const result = parseCustomerFile([cols.join('\t'), vals.join('\t')].join('\n'));
		expect(result[0].name).toBe('Tab User');
		expect(result[0].paid).toBe(1698);
	});

	it('lists missing columns for this format', () => {
		const csv = 'Name,Email,Tickets: 9\nAlice,a@example.com,1';
		expect(() => parseCustomerFile(csv)).toThrow('"Phone", "Savoury", "Payment Status"');
	});
});
