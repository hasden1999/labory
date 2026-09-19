#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Automated Integration Test Suite for LIS Medical Device ASTM Interfacing
=========================================================================
1. Medical Analyzer Simulator (ASTM E1381 Transport & ASTM E1394 Application Layer)
2. Scenario 1: Successful 5-parameter CBC transmission, verified in SQLite DB.
3. Scenario 2: Corrupted frame with invalid checksum, verified NAK (0x15) and rejected persistence.
"""

import sys
import os
import time
import socket
import sqlite3
import subprocess

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# ANSI Colors for Terminal Output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

# ASCII Control Characters
STX = b"\x02"
ETX = b"\x03"
EOT = b"\x04"
ENQ = b"\x05"
ACK = b"\x06"
NAK = b"\x15"
CR = b"\x0d"
LF = b"\x0a"

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../apps/server/prisma/lab.db"))
TCP_HOST = "127.0.0.1"
TCP_PORT = int(os.environ.get("DEVICE_TCP_PORT", "5000"))


class ASTMAnalyzerSimulator:
    """
    Simulates a Clinical Hematology Analyzer (e.g. Mindray BC-5000 / BC-3000)
    communicating via ASTM E1381 / E1394 standard.
    """

    def __init__(self, host: str = TCP_HOST, port: int = TCP_PORT, timeout: float = 5.0):
        self.host = host
        self.port = port
        self.timeout = timeout
        self.sock = None

    def connect(self):
        """Establish TCP connection to the LIS server listener."""
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.settimeout(self.timeout)
        self.sock.connect((self.host, self.port))
        print(f"{CYAN}🔌 Connected to LIS Device Server at {self.host}:{self.port}{RESET}")

    def close(self):
        """Close TCP socket cleanly."""
        if self.sock:
            try:
                self.sock.close()
            except Exception:
                pass
            self.sock = None

    @staticmethod
    def calculate_checksum(frame_content: bytes) -> str:
        """
        ASTM E1381 Checksum:
        Sum of byte values starting immediately after STX up to and including ETX/ETB.
        Modulo 256, formatted as a 2-character uppercase Hex string.
        """
        checksum = sum(frame_content) % 256
        return f"{checksum:02X}"

    def send_enq(self) -> bool:
        """
        Send ENQ (0x05) to initiate session.
        Expects ACK (0x06) in response.
        """
        print(f"  --> Sending <ENQ> (0x05)...")
        self.sock.sendall(ENQ)
        resp = self.sock.recv(1)
        if resp == ACK:
            print(f"  <-- Received <ACK> (0x06) - Session Established!")
            return True
        elif resp == NAK:
            print(f"  <-- Received <NAK> (0x15) - Receiver Busy/Rejecting!")
            return False
        else:
            print(f"  <-- Unexpected response: {resp.hex() if resp else 'None'}")
            return False

    def send_frame(self, frame_text: str, frame_num: int, corrupt_checksum: bool = False) -> tuple[bytes, str, str]:
        """
        Sends an ASTM E1381 frame:
        <STX> [frame_num] [frame_text] <CR> <ETX> [checksum] <CR> <LF>
        Returns (response_byte, expected_checksum, sent_checksum).
        """
        # Frame payload between STX and checksum (including frame number and ETX)
        payload = f"{frame_num % 8}{frame_text}\r".encode("utf-8") + ETX
        calculated_cs = self.calculate_checksum(payload)

        if corrupt_checksum:
            # Deliberately invalidate checksum
            sent_cs = "FF" if calculated_cs != "FF" else "00"
            print(f"  ⚠️  [TAMPER] Corrupting checksum! Real: {calculated_cs} -> Sent: {sent_cs}")
        else:
            sent_cs = calculated_cs

        raw_packet = STX + payload + sent_cs.encode("ascii") + CR + LF
        self.sock.sendall(raw_packet)

        resp = self.sock.recv(1)
        resp_name = "<ACK> (0x06)" if resp == ACK else ("<NAK> (0x15)" if resp == NAK else f"0x{resp.hex()}")
        print(f"  --> Frame {frame_num % 8}: [{frame_text[:40]}...] (CS: {sent_cs}) --> {resp_name}")
        return resp, calculated_cs, sent_cs

    def send_eot(self):
        """Send EOT (0x04) to terminate session."""
        print(f"  --> Sending <EOT> (0x04) - Session Closed.\n")
        self.sock.sendall(EOT)


# ---------------------------------------------------------------------------
# Database Inspection Helpers
# ---------------------------------------------------------------------------

def get_db_connection():
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(f"Database not found at {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def query_sample(sample_number: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Sample WHERE sampleNumber = ?", (sample_number,))
        return cursor.fetchone()


def query_incoming_results(sample_number: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, testCode, testName, resultValue, unit, isAbnormal, isCritical, status, matchedSampleId "
            "FROM IncomingResult WHERE sampleNumber = ? ORDER BY testCode ASC",
            (sample_number,),
        )
        return cursor.fetchall()


def query_sample_tests(sample_id: str):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT st.id, tc.code as testCode, tc.name as testCatalogName, st.resultValue, st.unit, st.isAutoImported, st.importedFrom "
            "FROM SampleTest st "
            "JOIN TestCatalog tc ON st.testId = tc.id "
            "WHERE st.sampleId = ?",
            (sample_id,),
        )
        return cursor.fetchall()


# ---------------------------------------------------------------------------
# Server Liveness Check & Auto-Spawn
# ---------------------------------------------------------------------------

def is_port_open(host: str, port: int) -> bool:
    try:
        with socket.create_connection((host, port), timeout=1.0):
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False


def ensure_server_running():
    """Ensure TCP Device listener is up. If not, spawn runTcpServer.ts."""
    if is_port_open(TCP_HOST, TCP_PORT):
        print(f"{GREEN}✓ TCP Device Server is already listening on port {TCP_PORT}{RESET}")
        return None

    print(f"{YELLOW}⏳ TCP Server not detected on port {TCP_PORT}. Auto-starting TCP Device Server...{RESET}")
    server_script = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../apps/server/src/services/runTcpServer.ts"))
    
    proc = subprocess.Popen(
        ["npx", "tsx", server_script],
        cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        shell=True,
    )

    # Wait up to 10 seconds for server to start
    for _ in range(20):
        time.sleep(0.5)
        if is_port_open(TCP_HOST, TCP_PORT):
            print(f"{GREEN}✓ TCP Device Server started successfully (PID: {proc.pid}){RESET}")
            return proc

    raise RuntimeError(f"Failed to start TCP Device Server on port {TCP_PORT} within timeout.")


def reset_test_environment():
    """Runs setupTestDevice.ts to guarantee database seeding and active CBC mappings."""
    print(f"{CYAN}🔧 Seeding test devices & sample fixtures via setupTestDevice.ts...{RESET}")
    setup_script = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../apps/server/src/utils/setupTestDevice.ts"))
    result = subprocess.run(
        ["npx", "tsx", setup_script],
        cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")),
        capture_output=True,
        text=True,
        shell=True,
    )
    if result.returncode != 0:
        print(f"{RED}Setup script failed:{RESET}\n{result.stderr}")
        raise RuntimeError("Failed to prepare test database fixtures.")
    print(f"{GREEN}✓ Database fixtures initialized!{RESET}\n")


# ---------------------------------------------------------------------------
# Test Scenario 1: Valid CBC 5-Parameters
# ---------------------------------------------------------------------------

def run_scenario_1_valid_cbc() -> bool:
    print("=" * 75)
    print(f"{BOLD}▶ السيناريو الأول: إرسال فحص CBC ناجح بـ 5 بارامترات والتحقق من حفظها وربطها بالعينة{RESET}")
    print(f"{BOLD}  Scenario 1: Valid 5-Parameter CBC Transmission -> DB Persistence Verification{RESET}")
    print("=" * 75)

    sample_number = 2001
    simulator = ASTMAnalyzerSimulator()
    simulator.connect()

    try:
        # 1. ENQ Handshake
        if not simulator.send_enq():
            print(f"{RED}❌ Handshake failed!{RESET}")
            return False

        # 2. Header Frame (H)
        resp, _, _ = simulator.send_frame(r"H|\^&|||Mindray^BC-5000|||||||P|1", 1)
        assert resp == ACK, f"Header frame rejected: {resp}"

        # 3. Patient Frame (P)
        resp, _, _ = simulator.send_frame(r"P|1||2001||Mustafa Ahmed||19920510|M", 2)
        assert resp == ACK, f"Patient frame rejected: {resp}"

        # 4. Order Frame (O)
        resp, _, _ = simulator.send_frame(r"O|1|2001||^^^CBC||||||||||||||||||||F", 3)
        assert resp == ACK, f"Order frame rejected: {resp}"

        # 5. 5 Results Frames (R): WBC, RBC, HGB, PLT, HCT
        cbc_parameters = [
            (r"R|1|^^^WBC|7.50|10*3/uL|4.0-10.0|N||F", "WBC", "7.50"),
            (r"R|2|^^^RBC|4.80|10*6/uL|3.8-5.8|N||F", "RBC", "4.80"),
            (r"R|3|^^^HGB|14.2|g/dL|11.5-17.5|N||F", "HGB", "14.2"),
            (r"R|4|^^^PLT|250|10*3/uL|150-450|N||F", "PLT", "250"),
            (r"R|5|^^^HCT|42.0|%|36.0-50.0|N||F", "HCT", "42.0"),
        ]

        frame_num = 4
        for frame_content, test_code, expected_val in cbc_parameters:
            resp, _, _ = simulator.send_frame(frame_content, frame_num)
            assert resp == ACK, f"Result frame for {test_code} was not ACKed! (got: {resp})"
            frame_num += 1

        # 6. Terminator Frame (L)
        resp, _, _ = simulator.send_frame(r"L|1|N", frame_num)
        assert resp == ACK, f"Terminator frame was not ACKed!"

        # 7. EOT
        simulator.send_eot()

    finally:
        simulator.close()

    # 8. Database Verification
    print(f"{CYAN}🔍 Verifying results saved in SQLite Database ({DB_PATH})...{RESET}")
    time.sleep(1.0)  # Allow async DB transaction to commit

    incoming = query_incoming_results(sample_number)
    print(f"\n📊 [IncomingResult] Records found for Sample #{sample_number}: {len(incoming)}")
    for r in incoming:
        print(f"   • {r['testCode']:<6} = {r['resultValue']:<6} {r['unit'] or '':<10} (Status: {r['status']})")

    if len(incoming) != 5:
        print(f"{RED}❌ Expected exactly 5 IncomingResult records, but found {len(incoming)}!{RESET}")
        return False

    sample = query_sample(sample_number)
    if not sample:
        print(f"{RED}❌ Sample #{sample_number} not found in DB!{RESET}")
        return False

    sample_tests = query_sample_tests(sample["id"])
    print(f"\n🧪 [SampleTest] Auto-imported tests attached to Sample #{sample_number}: {len(sample_tests)}")
    for st in sample_tests:
        print(f"   • {st['testCode']:<6} ({st['testCatalogName']}) = {st['resultValue']} [AutoImport: {st['isAutoImported']}]")

    # Verification Assertions
    assert len(incoming) == 5, "Must have exactly 5 incoming results"
    assert sample["status"] in ("IN_PROGRESS", "READY"), f"Sample status should be updated to IN_PROGRESS, got: {sample['status']}"
    assert len(sample_tests) >= 5, f"Expected at least 5 populated tests on Sample, got {len(sample_tests)}"

    print(f"\n{GREEN}✅ السيناريو الأول نجح بالكامل: تم استقبال وحفظ جميع الـ 5 بارامترات وربطها بالعينة #{sample_number}!{RESET}\n")
    return True


# ---------------------------------------------------------------------------
# Test Scenario 2: Corrupted Frame Checksum (NAK & Rejection)
# ---------------------------------------------------------------------------

def run_scenario_2_corrupted_frame() -> bool:
    print("=" * 75)
    print(f"{BOLD}▶ السيناريو الثاني: إرسال فريم تالف بـ Checksum خاطئ والتحقق من NAK (0x15) ورفض الحفظ{RESET}")
    print(f"{BOLD}  Scenario 2: Corrupted Frame Checksum -> NAK (0x15) & Persistence Rejection{RESET}")
    print("=" * 75)

    sample_number = 2002
    simulator = ASTMAnalyzerSimulator()
    simulator.connect()

    try:
        # 1. ENQ Handshake
        if not simulator.send_enq():
            print(f"{RED}❌ Handshake failed!{RESET}")
            return False

        # 2. Header Frame (Valid)
        resp, _, _ = simulator.send_frame(r"H|\^&|||Mindray^BC-5000|||||||P|1", 1)
        assert resp == ACK, f"Header frame rejected: {resp}"

        # 3. Patient Frame (Valid)
        resp, _, _ = simulator.send_frame(r"P|1||2002||Zaid Ali||19950101|M", 2)
        assert resp == ACK, f"Patient frame rejected: {resp}"

        # 4. Order Frame (Valid)
        resp, _, _ = simulator.send_frame(r"O|1|2002||^^^CBC||||||||||||||||||||F", 3)
        assert resp == ACK, f"Order frame rejected: {resp}"

        # 5. CORRUPTED Result Frame (Checksum Deliberately Invalidated)
        print(f"\n{YELLOW}⚡ Transmitting Corrupted Frame with Invalid Checksum...{RESET}")
        resp, real_cs, sent_cs = simulator.send_frame(
            r"R|1|^^^WBC|8.10|10*3/uL|4.0-10.0|N||F",
            frame_num=4,
            corrupt_checksum=True,
        )

        # Verification 1: Server MUST respond with NAK (0x15)
        if resp == NAK:
            print(f"{GREEN}✓ Server correctly REJECTED frame and returned <NAK> (0x15)!{RESET}")
        else:
            print(f"{RED}❌ ERROR: Server did NOT return NAK! Received: {resp.hex() if resp else 'None'}{RESET}")
            return False

        # 6. Send EOT
        simulator.send_eot()

    finally:
        simulator.close()

    # 7. Database Verification: Ensure ZERO results were saved for Sample 2002
    print(f"{CYAN}🔍 Verifying NO results were written to DB for Sample #{sample_number}...{RESET}")
    time.sleep(1.0)

    incoming = query_incoming_results(sample_number)
    sample = query_sample(sample_number)
    sample_tests = query_sample_tests(sample["id"]) if sample else []

    print(f"📊 [IncomingResult] Records for Sample #{sample_number}: {len(incoming)} (Expected: 0)")
    print(f"🧪 [SampleTest] Auto-imported tests for Sample #{sample_number}: {len(sample_tests)} (Expected: 0)")
    print(f"📋 Sample Status: {sample['status']} (Expected: 'RECEIVED')")

    if len(incoming) != 0:
        print(f"{RED}❌ Security/Integrity Failure: System saved {len(incoming)} incoming results despite checksum failure!{RESET}")
        return False

    if len(sample_tests) != 0:
        print(f"{RED}❌ Security/Integrity Failure: System populated tests on sample despite corrupted transmission!{RESET}")
        return False

    if sample["status"] != "RECEIVED":
        print(f"{RED}❌ Sample status altered to {sample['status']} despite corrupted transmission!{RESET}")
        return False

    print(f"\n{GREEN}✅ السيناريو الثاني نجح بالكامل: تم رفض الفريم التالف برمز NAK، ولم يتم حفظ أي بيانات مشوهة في قاعدة البيانات!{RESET}\n")
    return True


# ---------------------------------------------------------------------------
# Main Runner
# ---------------------------------------------------------------------------

def main():
    print(f"\n{BOLD}{CYAN}========================================================================{RESET}")
    print(f"{BOLD}{CYAN}🏥 LIS Analyzer Automated Integration Test Suite (ASTM E1381/E1394){RESET}")
    print(f"{BOLD}{CYAN}========================================================================{RESET}\n")

    # 1. Reset DB Fixtures
    reset_test_environment()

    # 2. Ensure Server is running
    server_proc = ensure_server_running()

    success = False
    try:
        # Run Scenario 1: Valid CBC
        ok1 = run_scenario_1_valid_cbc()
        if not ok1:
            print(f"{RED}Scenario 1 FAILED!{RESET}")
            sys.exit(1)

        # Run Scenario 2: Corrupted Checksum
        ok2 = run_scenario_2_corrupted_frame()
        if not ok2:
            print(f"{RED}Scenario 2 FAILED!{RESET}")
            sys.exit(1)

        success = ok1 and ok2
    finally:
        if server_proc:
            print(f"{CYAN}Stopping auto-spawned TCP server...{RESET}")
            server_proc.terminate()

    if success:
        print(f"{BOLD}{GREEN}========================================================================{RESET}")
        print(f"{BOLD}{GREEN}🎉 تهانينا! اجتازت جميع سيناريوهات الاختبار التكاملي لربط الأجهزة الطبية بنجاح 100%!{RESET}")
        print(f"{BOLD}{GREEN}All Integration Test Scenarios Passed Successfully! (Exit Code 0){RESET}")
        print(f"{BOLD}{GREEN}========================================================================{RESET}\n")
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
