#!/usr/bin/env python3
"""Dump das contagens/ids do SQLite do backend (leitura, nao altera nada)."""
import os
import sqlite3
import sys

path = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser(
    "~/Teleprompt/data/teleprompt-dev.db")

if not os.path.exists(path):
    print("DB nao encontrado em:", path)
    sys.exit(1)

conn = sqlite3.connect(path)
conn.row_factory = sqlite3.Row
cur = conn.cursor()


def cols(table):
    try:
        return {r[1] for r in cur.execute(f"PRAGMA table_info({table})").fetchall()}
    except Exception:
        return set()


print("========== WORKSPACES (%s) ==========" % cur.execute(
    "SELECT COUNT(*) FROM Workspaces").fetchone()[0])
wcols = cols("Workspaces")
wsel = [c for c in ("Id", "Code", "Name") if c in wcols]
order = "Code" if "Code" in wcols else "Id"
for r in cur.execute(f"SELECT {', '.join(wsel)} FROM Workspaces ORDER BY {order}"):
    print("  " + " | ".join(str(r[c]) for c in wsel))

print()
print("========== WORKSPACE_MEMBERS ==========")
for r in cur.execute("SELECT WorkspaceId, COUNT(*) AS n FROM WorkspaceMembers GROUP BY WorkspaceId") or []:
    print(f"  ws={r['WorkspaceId']} -> {r['n']} membros")

print()
print("========== PROJETOS por workspace ==========")
tot = 0
for r in cur.execute("SELECT WorkspaceId, COUNT(*) AS n FROM Projects GROUP BY WorkspaceId"):
    print(f"  ws={r['WorkspaceId']} -> {r['n']} projetos")
    tot += r["n"]
print("  TOTAL projetos:", tot)

print()
print("========== ROTEIROS por workspace ==========")
tot = 0
for r in cur.execute("SELECT WorkspaceId, COUNT(*) AS n FROM Scripts GROUP BY WorkspaceId"):
    print(f"  ws={r['WorkspaceId']} -> {r['n']} roteiros")
    tot += r["n"]
print("  TOTAL roteiros:", tot)

print()
print("========== USERS (AspNetUsers) ==========")
ucols = cols("AspNetUsers")
sel = ["Email", "UserName"]
if "DisplayName" in ucols:
    sel.append("DisplayName")
if "WorkspaceId" in ucols:
    sel.append("WorkspaceId")
sel.append("Role" if "Role" in ucols else "Id")
for r in cur.execute("SELECT " + ", ".join(sel) + " FROM AspNetUsers").fetchall():
    print("  " + " | ".join(str(r[k]) for k in sel))

print()
print("========== PROJETOS cujo workspace NAO existe na tabela Workspaces ==========")
ws = {r["Id"] for r in cur.execute("SELECT Id FROM Workspaces")}
missing = 0
for r in cur.execute("SELECT DISTINCT WorkspaceId FROM Projects"):
    if r["WorkspaceId"] not in ws:
        print(f"  ws={r['WorkspaceId']}  (SEM workspace correspondente)")
        missing += 1
if not missing:
    print("  (nenhum — todos batem)")

conn.close()