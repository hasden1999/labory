import Module from "node:module";

// Mock electron runtime for unit/integration tests running under tsx / Node
const originalRequire = (Module.prototype as any).require;
(Module.prototype as any).require = function (id: string, ...args: any[]) {
  if (id === "electron") {
    return {
      app: {
        getVersion: () => "1.1.3",
        getPath: () => process.cwd(),
        isPackaged: false,
        on: () => {},
      },
      ipcMain: {
        handle: () => {},
        on: () => {},
      },
      BrowserWindow: class {
        webContents = { send: () => {} };
      }
    };
  }
  return originalRequire.apply(this, [id, ...args]);
};

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { getStore, createTestInStore, updateTestInStore, deleteTestInStore, createPanelInStore, deletePanelInStore } from "../apps/web/src/lib/serverStore";

async function runTests() {
  const { UpdateService } = require("../apps/desktop/services/updateService.js");
  console.log("=================================================");
  console.log("🧪 Running UpdateService & Catalog Integration Tests");
  console.log("=================================================");

  // -------------------------------------------------------------------------
  // 1. UpdateService Tests
  // -------------------------------------------------------------------------
  console.log("\n[TEST 1] UpdateService State Machine & Channel Config");
  const updateService = new UpdateService();
  
  // Test initial state
  const initialState = updateService.getState();
  assert.strictEqual(initialState.status, "idle", "Initial status should be idle");
  assert.strictEqual(typeof initialState.currentVersion, "string", "currentVersion should be string");

  // Test Channel switching
  assert.strictEqual(updateService.getChannel(), "stable", "Default channel should be stable");
  updateService.setChannel("beta");
  assert.strictEqual(updateService.getChannel(), "beta", "Channel should be updated to beta");
  updateService.setChannel("stable");
  assert.strictEqual(updateService.getChannel(), "stable", "Channel should be restored to stable");

  // Test Listener registration and notification
  let receivedState: any = null;
  const unsubscribe = updateService.onStateChange((state: any) => {
    receivedState = state;
  });
  
  // Trigger internal state change
  (updateService as any).updateState({ status: "checking", error: null });
  assert.strictEqual(receivedState?.status, "checking", "Listener should receive 'checking' state");
  
  unsubscribe();

  // Test Backup Routine on UpdateService
  console.log("[TEST 2] Database Backup Before Update");
  const testDbDir = path.join(process.cwd(), "test_backup_tmp");
  if (!fs.existsSync(testDbDir)) fs.mkdirSync(testDbDir, { recursive: true });
  const testDbFile = path.join(testDbDir, "lab.db");
  const testStoreFile = path.join(testDbDir, "lab_store.json");
  fs.writeFileSync(testDbFile, "TEST_SQLITE_CONTENT_FOR_BACKUP_VERIFICATION");
  fs.writeFileSync(testStoreFile, JSON.stringify({ test: true }));

  process.env.LABRYO_DATA_DIR = testDbDir;
  updateService.createPreUpdateBackup();
  
  const backupDir = path.join(testDbDir, "backups");
  assert.ok(fs.existsSync(backupDir), "Backup directory should exist");
  const files = fs.readdirSync(backupDir);
  assert.ok(files.length >= 2, "Both SQLite and store backups should be created");
  assert.ok(files.some(f => f.includes("pre_update_") && f.endsWith("lab.db")), "lab.db backup should exist");
  assert.ok(files.some(f => f.includes("pre_update_") && f.endsWith("lab_store.json")), "lab_store.json backup should exist");
  
  // Clean up test backup
  fs.rmSync(testDbDir, { recursive: true, force: true });
  delete process.env.LABRYO_DATA_DIR;
  console.log("  ✓ UpdateService & Pre-update backup verified successfully.");

  // -------------------------------------------------------------------------
  // 2. Catalog Management & Store Sync Tests
  // -------------------------------------------------------------------------
  console.log("\n[TEST 3] Catalog Test Creation, Search & Sync");
  const testCode = "TEST_E2E_" + Date.now();
  const testName = "E2E Automated Serum Biomarker";

  const newTest = await createTestInStore({
    code: testCode,
    name: testName,
    shortName: "E2E-BIO",
    category: "CHEMISTRY",
    department: "CHEMISTRY",
    price: 35000,
    cost: 10000,
    unit: "ng/mL",
    sampleType: "Serum",
    container: "Red Top",
    isActive: true,
    sortOrder: 999,
  });

  assert.ok(newTest.id, "New test should have an ID");
  assert.strictEqual(newTest.code, testCode);

  // Search test in store
  const storeAfterAdd = await getStore();
  const found = storeAfterAdd.tests.find((t: any) => t.id === newTest.id || t.code === testCode);
  assert.ok(found, "Added test must be searchable in store");
  assert.strictEqual(found?.name, testName);
  console.log(`  ✓ Test ${testCode} added and found in store.`);

  // Update test
  console.log("[TEST 4] Catalog Test Update");
  const updatedName = testName + " (Updated)";
  const updatedTest = await updateTestInStore(newTest.id, {
    name: updatedName,
    price: 40000,
  });
  assert.strictEqual(updatedTest.name, updatedName);
  assert.strictEqual(updatedTest.price, 40000);
  console.log(`  ✓ Test updated successfully with new price 40,000.`);

  // Create Panel
  console.log("[TEST 5] Catalog Panel Creation & Linkage");
  const panelCode = "PANEL_E2E_" + Date.now();
  const newPanel = await createPanelInStore({
    code: panelCode,
    name: "E2E Comprehensive Biomarker Panel",
    shortName: "E2E-PANEL",
    category: "CHEMISTRY",
    department: "CHEMISTRY",
    price: 75000,
    isActive: true,
    testIds: [newTest.id],
  });
  assert.ok(newPanel.id, "Panel should have an ID");
  assert.strictEqual(newPanel.code, panelCode);
  assert.deepStrictEqual(newPanel.testIds, [newTest.id]);
  console.log(`  ✓ Panel ${panelCode} created with linked test ID.`);

  // Clean up
  console.log("[TEST 6] Catalog Deletion");
  const panelDeleted = await deletePanelInStore(newPanel.id);
  assert.strictEqual(panelDeleted, true, "Panel should be deleted");
  const testDeleted = await deleteTestInStore(newTest.id);
  assert.strictEqual(testDeleted, true, "Test should be deleted");
  console.log("  ✓ Test & Panel cleaned up successfully.");

  console.log("\n=================================================");
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! (6/6)");
  console.log("=================================================\n");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
