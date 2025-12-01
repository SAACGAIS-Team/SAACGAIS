import React, { useEffect, useState } from "react";

function Home() {
  const [testRows, setTestRows] = useState([]);

  const API_BASE = 'http://localhost:5000';

  useEffect(() => {
    fetch(`${API_BASE}/test`)
      .then(res => res.json())
      .then(data => setTestRows(data))
      .catch(err => console.error("Error fetching test rows:", err));
  }, []);

  const addRow = async () => {
    try {
      const res = await fetch(`${API_BASE}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'Hello from React!' })
      });
      const data = await res.json();
      console.log("Inserted row:", data);

      // Refresh
      const updated = await fetch(`${API_BASE}/test`).then(res => res.json());
      setTestRows(updated);
    } catch (err) {
      console.error("Error adding row:", err);
    }
  };


  return (
    <div style={{ padding: "20px" }}>
      <h1>Welcome to SAACGAIS</h1>
      <p>This is the home page.</p>

      <button onClick={addRow}>Add New Row</button>

      <h2>Test Table Rows:</h2>
      {testRows.length === 0 ? (
        <p>No rows found.</p>
      ) : (
        <ul>
          {testRows.map((row) => (
            <li key={row.test_id}>
              {row.test_id}: {row.test}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Home;
