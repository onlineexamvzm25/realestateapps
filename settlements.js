 // Supabase credentials
    const supabaseUrl = 'https://rqsiopzedqyucvptwsjk.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxc2lvcHplZHF5dWN2cHR3c2prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MTg4NjgsImV4cCI6MjA3MjE5NDg2OH0.rY6opU6M5UMaaUe2Mp9FjVOue9Vd9_8vXruJ3Vts_Ww';

    supabase = supabase.createClient(supabaseUrl, supabaseKey); // ✅ Use window


const contentArea = document.getElementById("contentArea");

// Add Settlement Form
document.getElementById("btnAddSettlement").addEventListener("click", async () => {
  contentArea.innerHTML = `
    <div class="form-section">
      <label>Select Site</label>
      <select id="siteSelect"><option value="">--None--</option></select>

      <label>Select Customer</label>
      <select id="customerSelect"><option value="">--None--</option></select>

      <label>Date of Settlement</label>
      <input type="date" id="setDate" value="${new Date().toISOString().split("T")[0]}">

      <label>Settlement Type</label>
      <select id="setType">
        <option value="">--None--</option>
        <option value="Token">Token</option>
        <option value="Half Paid">Half Paid</option>
        <option value="Full Paid">Full Paid</option>
        <option value="Registered">Registered</option>
      </select>

      <label>Comments</label>
      <textarea id="comments" maxlength="100"></textarea>

      <button id="saveSettlement">SAVE SETTLEMENT</button>
    </div>
  `;

  // Load sites
  let { data: sites } = await supabase.from("sites").select("sid, sname");
  const siteSelect = document.getElementById("siteSelect");
  sites?.forEach(s => {
    siteSelect.innerHTML += `<option value="${s.sid}" data-name="${s.sname}">${s.sname}</option>`;
  });

  // Load customers
  let { data: customers } = await supabase.from("customers").select("cid, cname");
  const custSelect = document.getElementById("customerSelect");
  customers?.forEach(c => {
    custSelect.innerHTML += `<option value="${c.cid}" data-name="${c.cname}">${c.cname}</option>`;
  });

  // Save Settlement
  document.getElementById("saveSettlement").addEventListener("click", async () => {
    const siteId = siteSelect.value;
    const siteName = siteSelect.options[siteSelect.selectedIndex]?.dataset.name || "";
    const custId = custSelect.value;
    const custName = custSelect.options[custSelect.selectedIndex]?.dataset.name || "";
    const setDate = document.getElementById("setDate").value;
    const setType = document.getElementById("setType").value;
    const comments = document.getElementById("comments").value;

    if (!siteId || !custId || !setDate || !setType) {
      alert("Please fill all mandatory fields!");
      return;
    }

    // Get next setid
    let { data: maxRow } = await supabase.from("settelements").select("setid").order("setid", { ascending: false }).limit(1);
    const nextId = (maxRow?.[0]?.setid || 0) + 1;

    const { error } = await supabase.from("settelements").insert([{
      setid: nextId,
      sid: siteId,
      sname: siteName,
      cid: custId,
      cname: custName,
      setdate: setDate,
      settype: setType,
      comments: comments
    }]);

    if (error) {
      alert("Error saving settlement: " + error.message);
    } else {
      alert("Settlement saved successfully!");
      contentArea.innerHTML = "";
    }
  });
});

// Show Settlements
document.getElementById("btnShowSettlements").addEventListener("click", () => {
  contentArea.innerHTML = `
  <div class="form-section">
    <label>Select Settlement Type</label>
    <div class="radio-box">
      <label><input type="radio" name="stype" value="Token"> Token</label>
      <label><input type="radio" name="stype" value="Half Paid"> Half Paid</label>
      <label><input type="radio" name="stype" value="Full Paid"> Full Paid</label>
      <label><input type="radio" name="stype" value="Registered"> Registered</label>
      <label><input type="radio" name="stype" value="All" checked> All Settlements</label>
    </div>
    <button id="getSettlements">Get Settlements</button>
  </div>
  <div id="settlementTable"></div>
`;


  document.getElementById("getSettlements").addEventListener("click", async () => {
    const type = document.querySelector("input[name='stype']:checked").value;
    let query = supabase.from("settelements").select("*");
    if (type !== "All") query = query.eq("settype", type);

    let { data, error } = await query;
    if (error) {
      alert("Error loading settlements");
      return;
    }

    if (!data.length) {
      document.getElementById("settlementTable").innerHTML = "<p>No settlements found</p>";
      return;
    }

    let tableHtml = `
      <div class="action-buttons">
        <button id="clearTable">Clear</button>
        <button id="downloadPdf">Download PDF</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Site</th><th>Customer</th><th>Date</th><th>Type</th><th>Comments</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(d => `
            <tr>
              <td>${d.setid}</td>
              <td>${d.sname}</td>
              <td>${d.cname}</td>
              <td>${d.setdate}</td>
              <td>${d.settype}</td>
              <td>${d.comments || ""}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
    document.getElementById("settlementTable").innerHTML = tableHtml;

    document.getElementById("clearTable").onclick = () => {
      document.getElementById("settlementTable").innerHTML = "";
    };

    document.getElementById("downloadPdf").onclick = () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.text("Settlements Report", 14, 20);
      let y = 30;
      data.forEach(row => {
        doc.text(`${row.setid} | ${row.sname} | ${row.cname} | ${row.setdate} | ${row.settype} | ${row.comments || ""}`, 14, y);
        y += 10;
      });
      doc.save("settlements.pdf");
    };
  });
});

// Home
document.getElementById("btnHome").addEventListener("click", () => {
  window.location.href = "index.html";
});
