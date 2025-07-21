export async function fetchMenus(sheetId, sheetName) {
  // Build the Google Visualization API URL for JSON output
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;

  // Fetch the sheet data
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Sheet request failed: ${res.status}`);
  }
  const text = await res.text();

  // Strip the Google API prefix/suffix to isolate valid JSON
  const jsonText = text.substr(47).slice(0, -2);
  const json = JSON.parse(jsonText);

  // Extract column labels
  const cols = json.table.cols.map(col => col.label);

  // Map rows into objects keyed by column
  const rows = json.table.rows.map(row => {
    const entry = {};
    cols.forEach((colName, idx) => {
      const cell = row.c[idx];
      entry[colName] = cell && cell.v != null ? cell.v : '';
    });
    return entry;
  });

  return rows;
}
