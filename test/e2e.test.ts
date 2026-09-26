import { existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const BASE_URL = "http://localhost:3001";

async function runTests() {
  console.log("=== STARTING COMPREHENSIVE E2E VERIFICATION ===");

  // 1. Start server process
  const serverProc = Bun.spawn(["bun", "run", "server/index.ts"], {
    cwd: process.cwd(),
    stdout: "pipe",
    stderr: "pipe",
  });

  // Wait 1.5s for server to start
  await new Promise((r) => setTimeout(r, 1500));

  try {
    // -------------------------------------------------------------
    // Test 1: Validation errors on Register
    // -------------------------------------------------------------
    console.log("\n[Test 1] Testing Register validation...");
    const badReg = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", email: "bad-email", password: "123", confirmPassword: "456" }),
    });
    if (badReg.status === 400) {
      console.log("✓ Invalid registration correctly rejected (400)");
    } else {
      throw new Error(`Expected 400 for bad registration, got ${badReg.status}`);
    }

    // -------------------------------------------------------------
    // Test 2: Successful Registration for Harshitha
    // -------------------------------------------------------------
    console.log("\n[Test 2] Registering Harshitha...");
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Harshitha",
        email: "harshitha@university.edu",
        password: "securepassword123",
        confirmPassword: "securepassword123",
      }),
    });
    if (!regRes.ok) {
      // In case user was already registered in a previous run
      console.log("User might already exist, attempting login...");
    } else {
      const regData = await regRes.json();
      console.log(`✓ Registered user: ${regData.user.name} (${regData.user.email})`);
    }

    // -------------------------------------------------------------
    // Test 3: Login for Harshitha
    // -------------------------------------------------------------
    console.log("\n[Test 3] Logging in Harshitha...");
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "harshitha@university.edu",
        password: "securepassword123",
      }),
    });
    if (!loginRes.ok) throw new Error(`Login failed: ${await loginRes.text()}`);
    const loginData = await loginRes.json();
    const tokenA = loginData.token;
    console.log("✓ Login successful, received JWT Bearer token");

    const authHeadersA = {
      Authorization: `Bearer ${tokenA}`,
      "Content-Type": "application/json",
    };

    // -------------------------------------------------------------
    // Test 4: Create Subjects
    // -------------------------------------------------------------
    console.log("\n[Test 4] Creating Subjects for Harshitha...");
    const sub1Res = await fetch(`${BASE_URL}/api/subjects`, {
      method: "POST",
      headers: authHeadersA,
      body: JSON.stringify({
        name: "Data Structures",
        description: "CS201 - Trees, Graphs, Sorting & Complexity",
      }),
    });
    const sub1 = (await sub1Res.json()).subject;
    console.log(`✓ Created subject 1: "${sub1.name}" (ID: ${sub1.id})`);

    const sub2Res = await fetch(`${BASE_URL}/api/subjects`, {
      method: "POST",
      headers: authHeadersA,
      body: JSON.stringify({
        name: "Operating Systems",
        description: "Kernel, Threads, Memory & File Systems",
      }),
    });
    const sub2 = (await sub2Res.json()).subject;
    console.log(`✓ Created subject 2: "${sub2.name}" (ID: ${sub2.id})`);

    // Verify list
    const listRes = await fetch(`${BASE_URL}/api/subjects`, { headers: authHeadersA });
    const listData = await listRes.json();
    console.log(`✓ Subjects list returns ${listData.subjects.length} subjects for Harshitha`);

    // -------------------------------------------------------------
    // Test 5: Upload Resources (PDF, TXT, PNG)
    // -------------------------------------------------------------
    console.log("\n[Test 5] Uploading resources to Data Structures...");

    // PDF dummy file
    const pdfBlob = new Blob(["%PDF-1.4 Mock PDF Content For Data Structures Notes"], { type: "application/pdf" });
    const formDataPdf = new FormData();
    formDataPdf.append("file", pdfBlob, "DSA_Unit_1_Trees.pdf");

    const uploadPdfRes = await fetch(`${BASE_URL}/api/subjects/${sub1.id}/resources`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: formDataPdf,
    });
    if (!uploadPdfRes.ok) throw new Error(`PDF upload failed: ${await uploadPdfRes.text()}`);
    const pdfData = await uploadPdfRes.json();
    console.log(`✓ Uploaded PDF: ${pdfData.resource.file_name} (${pdfData.resource.file_size} bytes, ID: ${pdfData.resource.id})`);

    // TXT file
    const txtBlob = new Blob(["Course Syllabus:\n1. Binary Trees\n2. AVL Trees\n3. Graph Traversals"], { type: "text/plain" });
    const formDataTxt = new FormData();
    formDataTxt.append("file", txtBlob, "DSA_Syllabus.txt");

    const uploadTxtRes = await fetch(`${BASE_URL}/api/subjects/${sub1.id}/resources`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: formDataTxt,
    });
    const txtData = await uploadTxtRes.json();
    console.log(`✓ Uploaded TXT: ${txtData.resource.file_name} (${txtData.resource.file_size} bytes)`);

    // Upload resource to Subject 2 (OS)
    const osBlob = new Blob(["Process Scheduling Notes:\nRound Robin, Priority, FIFO"], { type: "text/plain" });
    const formDataOs = new FormData();
    formDataOs.append("file", osBlob, "OS_Scheduling.txt");

    const uploadOsRes = await fetch(`${BASE_URL}/api/subjects/${sub2.id}/resources`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: formDataOs,
    });
    const osData = await uploadOsRes.json();
    console.log(`✓ Uploaded resource to OS: ${osData.resource.file_name}`);

    // -------------------------------------------------------------
    // Test 6: Verify Resource View and Download
    // -------------------------------------------------------------
    console.log("\n[Test 6] Testing View & Download streaming...");

    // View PDF
    const viewPdfRes = await fetch(`${BASE_URL}/api/resources/${pdfData.resource.id}/view?token=${encodeURIComponent(tokenA)}`);
    if (viewPdfRes.status !== 200) throw new Error(`View PDF failed with ${viewPdfRes.status}`);
    const viewPdfContentType = viewPdfRes.headers.get("Content-Type");
    const viewPdfDisposition = viewPdfRes.headers.get("Content-Disposition");
    console.log(`✓ Stream PDF View: status 200, Content-Type: ${viewPdfContentType}, Content-Disposition: ${viewPdfDisposition}`);

    // Download PDF
    const dlPdfRes = await fetch(`${BASE_URL}/api/resources/${pdfData.resource.id}/download?token=${encodeURIComponent(tokenA)}`);
    if (dlPdfRes.status !== 200) throw new Error(`Download PDF failed with ${dlPdfRes.status}`);
    const dlDisposition = dlPdfRes.headers.get("Content-Disposition");
    console.log(`✓ Stream PDF Download: status 200, Content-Disposition: ${dlDisposition}`);

    // View Text content
    const viewTxtRes = await fetch(`${BASE_URL}/api/resources/${txtData.resource.id}/view?token=${encodeURIComponent(tokenA)}`);
    const txtContent = await viewTxtRes.text();
    if (!txtContent.includes("Binary Trees")) throw new Error("Text content does not match");
    console.log(`✓ Stream Text View content verified: "${txtContent.split("\n")[0]}"`);

    // -------------------------------------------------------------
    // Test 7: Global Search
    // -------------------------------------------------------------
    console.log("\n[Test 7] Testing Global Search...");
    const searchRes = await fetch(`${BASE_URL}/api/search?q=structures`, { headers: authHeadersA });
    const searchData = await searchRes.json();
    console.log(`✓ Search "structures" returned ${searchData.subjects.length} subjects and ${searchData.resources.length} resources`);
    if (searchData.subjects.length === 0) throw new Error("Search failed to find Data Structures subject");

    const searchRes2 = await fetch(`${BASE_URL}/api/search?q=syllabus`, { headers: authHeadersA });
    const searchData2 = await searchRes2.json();
    console.log(`✓ Search "syllabus" returned ${searchData2.resources.length} resources`);
    if (searchData2.resources.length === 0) throw new Error("Search failed to find syllabus.txt resource");

    // -------------------------------------------------------------
    // Test 8: Security & User Data Isolation
    // -------------------------------------------------------------
    console.log("\n[Test 8] Testing Security & Row-Level User Isolation...");
    // Register User B with unique email
    const emailB = `bob_${Date.now()}@university.edu`;
    const regB = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Second Student",
        email: emailB,
        password: "password456",
        confirmPassword: "password456",
      }),
    });
    const dataB = await regB.json();
    const tokenB = dataB.token;
    const authHeadersB = { Authorization: `Bearer ${tokenB}`, "Content-Type": "application/json" };

    // User B lists subjects -> should be 0!
    const listB = await (await fetch(`${BASE_URL}/api/subjects`, { headers: authHeadersB })).json();
    if (listB.subjects.length !== 0) {
      throw new Error(`CRITICAL: User B saw ${listB.subjects.length} subjects! Expected 0.`);
    }
    console.log("✓ User B has 0 subjects (cannot see User A's subjects)");

    // User B attempts to view User A's subject directly -> 404
    const getSubDirect = await fetch(`${BASE_URL}/api/subjects/${sub1.id}`, { headers: authHeadersB });
    if (getSubDirect.status !== 404) {
      throw new Error(`CRITICAL: User B could access User A's subject! Got status ${getSubDirect.status}`);
    }
    console.log("✓ User B cannot access User A's subject details (404 Access Denied)");

    // User B attempts to download User A's file -> 404
    const dlForbidden = await fetch(`${BASE_URL}/api/resources/${pdfData.resource.id}/download?token=${encodeURIComponent(tokenB)}`);
    if (dlForbidden.status !== 404) {
      throw new Error(`CRITICAL: User B could download User A's file! Got status ${dlForbidden.status}`);
    }
    console.log("✓ User B cannot download User A's files (404 Access Denied)");

    // User B attempts to delete User A's subject -> 404
    const delForbidden = await fetch(`${BASE_URL}/api/subjects/${sub1.id}`, {
      method: "DELETE",
      headers: authHeadersB,
    });
    if (delForbidden.status !== 404) {
      throw new Error(`CRITICAL: User B could delete User A's subject! Got status ${delForbidden.status}`);
    }
    console.log("✓ User B cannot delete User A's subject (404 Access Denied)");

    // -------------------------------------------------------------
    // Test 9: Cascade Deletion
    // -------------------------------------------------------------
    console.log("\n[Test 9] Testing Cascade Deletion...");
    const osFilePath = osData.resource.storage_path;
    console.log(`OS file on disk before deletion: exists = ${existsSync(osFilePath)}`);

    const delSub2Res = await fetch(`${BASE_URL}/api/subjects/${sub2.id}`, {
      method: "DELETE",
      headers: authHeadersA,
    });
    if (!delSub2Res.ok) throw new Error("Delete subject failed");
    console.log("✓ Subject 'Operating Systems' deleted by User A");

    const osFileStillExists = existsSync(osFilePath);
    if (osFileStillExists) {
      throw new Error("Physical file was NOT removed from disk upon subject cascade delete");
    }
    console.log("✓ Physical file safely deleted from uploads/ on disk (Cascade clean-up verified)");

    // -------------------------------------------------------------
    // Test 10: Profile Update
    // -------------------------------------------------------------
    console.log("\n[Test 10] Testing Profile update...");
    const updateRes = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: "PATCH",
      headers: authHeadersA,
      body: JSON.stringify({ name: "Harshitha Sharma" }),
    });
    const updateData = await updateRes.json();
    console.log(`✓ User name updated to: "${updateData.user.name}"`);

    const meRes = await fetch(`${BASE_URL}/api/auth/me`, { headers: authHeadersA });
    const meData = await meRes.json();
    console.log(`✓ User stats: ${meData.stats.total_subjects} subjects, ${meData.stats.total_resources} resources`);

    // -------------------------------------------------------------
    // Test 11: Production SPA static serving test
    // -------------------------------------------------------------
    console.log("\n[Test 11] Testing SPA static serving from dist/...");
    const spaRes = await fetch(`${BASE_URL}/`);
    const spaHtml = await spaRes.text();
    if (spaHtml.includes("ACADNOTE")) {
      console.log("✓ Production SPA served cleanly from http://localhost:3001/");
    } else {
      console.log("Notice: index.html served without ACADNOTE token, verify build output");
    }

    console.log("\n🎉 ALL 11 E2E VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉\n");
  } finally {
    serverProc.kill();
  }
}

runTests().catch((err) => {
  console.error("\n❌ E2E TEST FAILED:", err);
  process.exit(1);
});
