import assert from "node:assert";
import {
  calculateLdlUnitAware,
  calculateVldlUnitAware,
  calculateNonHdlUnitAware,
  calculateTcHdlRatio,
  calculateLdlHdlRatio,
  calculateLipidPanel,
  normalizeLipidUnit,
  LIPID_NOT_CALCULATED_MSG,
} from "../apps/web/src/lib/clinicalIntelligence";

function run() {
  console.log("=== Lipid unit-aware tests (item 9) ===");

  // mg/dL basics: TC 220, HDL 45, TG 150 -> LDL 145, VLDL 30, Non-HDL 175
  let r = calculateLipidPanel(220, 45, 150, "mg/dL");
  assert.strictEqual(r.ldl.value, 145, "LDL mg/dL");
  assert.strictEqual(r.vldl.value, 30, "VLDL mg/dL");
  assert.strictEqual(r.nonHdl.value, 175, "Non-HDL");
  assert.strictEqual(r.tcHdlRatio.value, 4.9, "TC/HDL 1 decimal");
  assert.strictEqual(r.ldlHdlRatio.value, 3.2, "LDL/HDL 1 decimal");

  // Rounding integers for mg/dL
  r = calculateLipidPanel(200, 50, 148, "mg/dL");
  // 200-50-148/5=200-50-29.6=120.4 -> 120
  assert.strictEqual(r.ldl.value, 120, "mg/dL integer rounding");
  assert.strictEqual(r.vldl.value, 30, "VLDL 148/5=29.6 -> 30");

  // TG boundary 399 valid, 400 invalid (mg/dL)
  const ok399 = calculateLdlUnitAware(220, 45, 399, "mg/dL");
  assert.ok(ok399.value !== null && ok399.invalidReason === undefined, "TG=399 valid");
  const bad400 = calculateLdlUnitAware(220, 45, 400, "mg/dL");
  assert.strictEqual(bad400.value, null, "TG=400 invalid");
  assert.ok(String(bad400.invalidReason).includes("TG"), "TG=400 reason mentions TG");
  const vBad = calculateVldlUnitAware(400, "mg/dL");
  assert.strictEqual(vBad.value, null, "VLDL TG=400 invalid");
  assert.ok(String(vBad.invalidReason).includes(LIPID_NOT_CALCULATED_MSG.split(" ")[0]) || String(vBad.invalidReason).length > 0, "VLDL invalid msg");
  const vOk = calculateVldlUnitAware(399, "mg/dL");
  assert.strictEqual(vOk.value, 80, "VLDL 399/5=79.8 -> 80");

  // mmol/L: divisor 2.2, threshold 4.5
  // TC 5.2, HDL 1.2, TG 1.7 -> LDL = 5.2-1.2-1.7/2.2 = 4.0-0.7727=3.23
  const mm = calculateLipidPanel(5.2, 1.2, 1.7, "mmol/L");
  assert.strictEqual(mm.unit, "mmol/L");
  assert.ok(Math.abs((mm.ldl.value as number) - 3.23) < 0.01, `mmol LDL ~3.23 got ${mm.ldl.value}`);
  assert.ok(Math.abs((mm.vldl.value as number) - 0.77) < 0.02, `mmol VLDL ~0.77 got ${mm.vldl.value}`);
  assert.ok(Math.abs((mm.nonHdl.value as number) - 4.0) < 0.001, "mmol Non-HDL 4.0");

  // mmol/L boundary: 4.4 valid, 4.5 invalid
  const mmOk = calculateLdlUnitAware(5.2, 1.2, 4.4, "mmol/L");
  assert.ok(mmOk.value !== null, "TG=4.4 mmol/L valid");
  const mmBad = calculateLdlUnitAware(5.2, 1.2, 4.5, "mmol/L");
  assert.strictEqual(mmBad.value, null, "TG=4.5 mmol/L invalid");
  assert.ok(String(mmBad.invalidReason).includes("TG"), "mmol invalid reason");

  // Direct LDL override wins
  const ov = calculateLipidPanel(220, 45, 450, "mg/dL", 130);
  assert.strictEqual(ov.ldl.value, 130, "direct override wins even when TG>=400");
  assert.strictEqual(ov.ldl.isCalculated, false, "override marked not calculated");
  assert.strictEqual(ov.vldl.value, null, "VLDL still invalid when TG>=400");
  // LDL/HDL uses override: 130/45=2.9
  assert.strictEqual(ov.ldlHdlRatio.value, 2.9, "LDL/HDL from override");

  // Clearing: undefined inputs -> nulls
  const empty = calculateLipidPanel(undefined, 45, 150, "mg/dL");
  assert.strictEqual(empty.ldl.value, null, "missing TC -> no LDL");
  assert.strictEqual(empty.nonHdl.value, null, "missing TC -> no Non-HDL");

  // Ratios 1 decimal
  assert.strictEqual(calculateTcHdlRatio(220, 45).value, 4.9);
  assert.strictEqual(calculateLdlHdlRatio(145, 45).value, 3.2);

  // Unit normalize
  assert.strictEqual(normalizeLipidUnit("mmol/L"), "mmol/L");
  assert.strictEqual(normalizeLipidUnit("MMOL/l"), "mmol/L");
  assert.strictEqual(normalizeLipidUnit("mg/dL"), "mg/dL");
  assert.strictEqual(normalizeLipidUnit(undefined), "mg/dL");

  console.log("ALL LIPID TESTS PASSED");
}

run();
