# Equipment Borrow Tracker — Vue 3 + Vite

A daily equipment borrow record tracker with two sections (new vs old/damaged equipment), per-equipment borrower records, and a searchable history saved to localStorage.

---

## Project Structure

```
equipment-tracker/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.js                        # App entry point
    ├── App.vue                        # Root component (wires everything)
    ├── assets/
    │   └── main.css                   # Global CSS variables, shared styles
    ├── composables/
    │   └── useRecords.js              # ALL state & business logic (reactive data, localStorage)
    └── components/
        ├── AppHeader.vue              # Top header bar with live clock
        ├── AppNav.vue                 # Tab navigation (Daily Record / History)
        ├── DailyRecord.vue            # Daily entry view + sticky save bar
        ├── EquipmentTable.vue         # One section table (Section A or B)
        ├── BorrowerForm.vue           # Expandable borrower sub-table per equipment row
        ├── HistoryView.vue            # History search + record cards + detail modal
        └── ModalEquipRow.vue          # Read-only row inside history modal
```

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Build for production
npm run build
```

---

## Features

### Daily Record Tab
- Set the **Record Date** at the top — this labels the saved record
- Two separated tables:
  - **Section A** (cyan) — New / Good Condition Equipment
  - **Section B** (orange) — Old / Damaged Equipment
- Each equipment row contains:
  - QTY, Equipment/Tool Name, Control Number
  - Condition (Excellent / Good / Fair / Poor) + Damage Notes
  - Accessories/Components Returned (YES / NO toggle)
  - Remarks
- Click **▼ Borrowers** on any equipment row to expand a borrower sub-table with columns:
  - Name of Borrower
  - Assigned Project
  - Condition at Check-Out + Checkout Damage Notes
  - Date Borrowed + Time Borrowed
  - Return Date + Return Time
  - Condition Upon Return + Return Damage Notes
- **Save Record** saves the current day to history (overwrites if same date exists)

### History Tab
- Lists all saved records sorted by date (newest first)
- **Search by date** to filter
- Each card shows: new equip count, old/damaged count, total borrowers
- Click a card to open a detail modal showing all data
- From the modal, click **Edit This Record** to load it back into the editor

---

## Data Persistence
All records are stored in **localStorage** under the key `eqt_history` as a JSON array.

For production, replace `localStorage` calls in `src/composables/useRecords.js` with your API:
- `loadHistory()` → fetch from backend
- `persistHistory()` → POST/PUT to backend
- `deleteRecord()` → DELETE to backend

---

## Customization

### Adding more condition options
Edit the `<select>` inside `EquipmentTable.vue` and `BorrowerForm.vue`.

### Adding new columns to equipment rows
1. Add the field to `makeRow()` in `useRecords.js`
2. Add the `<th>` in `EquipmentTable.vue` thead
3. Add the `<td>` input in the equipment tbody row

### Adding new columns to borrower rows
1. Add the field to `makeBorrower()` in `useRecords.js`
2. Add the `<th>` in `BorrowerForm.vue` thead
3. Add the `<td>` input in the borrower tbody row

### Theming
All colors are CSS variables in `src/assets/main.css` under `:root { }`.
