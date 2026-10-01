import sqlite3
import os
import shutil
import time

def run():
    master_db_path = os.path.abspath('apps/server/prisma/lab.db')
    user_db_path = os.path.join(os.environ['APPDATA'], '@lab-manager', 'desktop', 'data', 'lab.db')

    if not os.path.exists(user_db_path):
        print(f"User DB does not exist at: {user_db_path}")
        return

    # Safety backup
    backup_path = f"{user_db_path}.backup_{int(time.time())}"
    shutil.copyfile(user_db_path, backup_path)
    print(f"Created safety backup at: {backup_path}")

    m_conn = sqlite3.connect(master_db_path)
    m_conn.row_factory = sqlite3.Row
    u_conn = sqlite3.connect(user_db_path)
    u_conn.row_factory = sqlite3.Row

    m_cursor = m_conn.cursor()
    u_cursor = u_conn.cursor()

    master_tests = m_cursor.execute("SELECT * FROM TestCatalog").fetchall()
    master_map = {}
    for t in master_tests:
        master_map[t["name"].strip().lower()] = t

    user_tests = u_cursor.execute("SELECT * FROM TestCatalog").fetchall()
    print(f"Current TestCatalog count in user DB: {len(user_tests)}")

    u_conn.execute("BEGIN TRANSACTION")

    merged_count = 0
    repointed_refs = 0

    try:
        for ut in user_tests:
            norm = ut["name"].strip().lower()
            if norm not in master_map:
                continue

            can = master_map[norm]
            if ut["id"] != can["id"]:
                # Check if canonical exists in user DB
                existing_can = u_cursor.execute("SELECT id FROM TestCatalog WHERE id = ?", (can["id"],)).fetchone()
                if not existing_can:
                    # Insert canonical test
                    cols = [k for k in can.keys()]
                    placeholders = ", ".join(["?"] * len(cols))
                    col_names = ", ".join(cols)
                    vals = [can[k] for k in cols]
                    u_cursor.execute(f"INSERT INTO TestCatalog ({col_names}) VALUES ({placeholders})", vals)

                # Re-point SampleTest
                u_cursor.execute("UPDATE SampleTest SET testId = ? WHERE testId = ?", (can["id"], ut["id"]))
                repointed_refs += u_cursor.rowcount

                # Re-point TestPanelItem (avoid duplicate primary key)
                existing_panel_items = set(r[0] for r in u_cursor.execute("SELECT panelId FROM TestPanelItem WHERE testId = ?", (can["id"],)).fetchall())
                old_panel_items = u_cursor.execute("SELECT id, panelId FROM TestPanelItem WHERE testId = ?", (ut["id"],)).fetchall()
                for opi in old_panel_items:
                    if opi[1] not in existing_panel_items:
                        u_cursor.execute("UPDATE TestPanelItem SET testId = ? WHERE id = ?", (can["id"], opi[0]))
                        repointed_refs += 1
                        existing_panel_items.add(opi[1])
                    else:
                        u_cursor.execute("DELETE FROM TestPanelItem WHERE id = ?", (opi[0],))

                # Re-point DeviceTestMapping
                u_cursor.execute("UPDATE DeviceTestMapping SET testCatalogId = ? WHERE testCatalogId = ?", (can["id"], ut["id"]))
                repointed_refs += u_cursor.rowcount

                # Delete duplicate reference ranges if table exists
                # (older schemas did not have ReferenceRange table)
                # u_cursor.execute("DELETE FROM ReferenceRange WHERE testId = ?", (ut["id"],))

                # Delete duplicate test
                u_cursor.execute("DELETE FROM TestCatalog WHERE id = ?", (ut["id"],))
                merged_count += 1

        u_conn.commit()
    except Exception as e:
        u_conn.rollback()
        print(f"Error during merge: {e}")
        raise

    after_count = u_cursor.execute("SELECT count(*) FROM TestCatalog").fetchone()[0]
    print(f"Merged {merged_count} duplicate tests.")
    print(f"Re-pointed {repointed_refs} foreign key references.")
    print(f"Final TestCatalog count in user DB: {after_count}")

    m_conn.close()
    u_conn.close()

if __name__ == "__main__":
    run()
