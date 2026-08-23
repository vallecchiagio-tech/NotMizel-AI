import os
import sys
import hashlib
import sqlite3
import datetime
import subprocess
import urllib.request
import argparse

TSA_URL = "http://timestamp.digicert.com"
ROOT_CERT_URL = "https://cacerts.digicert.com/DigiCertAssuredIDRootCA.crt.pem"
INTER_CERT_URL = "https://cacerts.digicert.com/DigiCertSHA2AssuredIDTimestampingCA.crt.pem"
CA_CHAIN_FILE = "ca_chain.pem"
DB_NAME = "mobile_audit.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notary_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_name TEXT,
        sha256_hash TEXT UNIQUE,
        timestamp_utc TEXT,
        tsr_filename TEXT
    )
    """)
    conn.commit()
    conn.close()

def ensure_ca_chain():
    """Garantisce la presenza della catena CA aggiornata per la verifica crittografica."""
    if not os.path.exists(CA_CHAIN_FILE):
        try:
            print("[*] Scaricamento catena certificati DigiCert in corso...")
            root_pem = urllib.request.urlopen(ROOT_CERT_URL).read().decode('utf-8')
            inter_pem = urllib.request.urlopen(INTER_CERT_URL).read().decode('utf-8')
            with open(CA_CHAIN_FILE, "w") as f:
                f.write(root_pem + "\n" + inter_pem)
        except Exception as e:
            print(f"[!] Errore nel recupero della catena CA: {e}")

def generate_file_hash(file_path):
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(4096):
            sha256.update(chunk)
    return sha256.hexdigest()

def request_rfc3161_tsa(file_path, output_tsr_path):
    query_file = "request.tsq"
    subprocess.run(["openssl", "ts", "-query", "-data", file_path, "-sha256", "-cert", "-out", query_file], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    cmd_curl = [
        "curl", "-s",
        "-H", "Content-Type: application/timestamp-query",
        "--data-binary", f"@{query_file}",
        TSA_URL,
        "-o", output_tsr_path
    ]
    subprocess.run(cmd_curl)
    
    if os.path.exists(query_file):
        os.remove(query_file)
        
    return os.path.exists(output_tsr_path) and os.path.getsize(output_tsr_path) > 100

def cmd_notarize(args):
    file_path = args.file
    if not os.path.exists(file_path):
        print(f"[!] Errore: File non trovato -> {file_path}")
        return
    
    init_db()
    file_hash = generate_file_hash(file_path)
    now_utc = datetime.datetime.now(datetime.timezone.utc).isoformat()
    tsr_filename = f"{file_hash[:10]}_{int(datetime.datetime.now().timestamp())}.tsr"
    
    print(f"[*] Calcolo SHA-256: {file_hash}")
    print(f"[*] Contatto TSA ufficiale ({TSA_URL})...")
    
    tsa_success = request_rfc3161_tsa(file_path, tsr_filename)
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO notary_log (file_name, sha256_hash, timestamp_utc, tsr_filename) VALUES (?, ?, ?, ?)",
            (os.path.basename(file_path), file_hash, now_utc, tsr_filename if tsa_success else "FAILED")
        )
        conn.commit()
        print(f"\n[SUCCESS] Notarizzazione completata con successo!")
        print(f" -> File: {file_path}")
        print(f" -> Hash: {file_hash}")
        if tsa_success:
            print(f" -> Marcatura TSR salvata: {tsr_filename}\n")
        else:
            print(" [!] Marcatura TSA fallita.\n")
    except sqlite3.IntegrityError:
        print(f"\n[i] Nota: Questo file (o il suo hash) è già registrato nel database locale.\n")
    finally:
        conn.close()

def cmd_verify(args):
    file_path = args.file
    tsr_path = args.tsr
    
    if not os.path.exists(file_path) or not os.path.exists(tsr_path):
        print("[!] Errore: File sorgente o file .tsr specificato non trovato.")
        return

    ensure_ca_chain()
    current_hash = generate_file_hash(file_path)
    print(f"[*] Verifica integrità per: {file_path}")
    print(f"[*] Hash attuale: {current_hash}")

    cmd_verify = [
        "openssl", "ts", "-verify",
        "-in", tsr_path,
        "-data", file_path,
        "-CAfile", CA_CHAIN_FILE
    ]
    
    result = subprocess.run(cmd_verify, capture_output=True, text=True)
    
    if "Verification: OK" in result.stdout or "Verification: OK" in result.stderr:
        print("\n[SUCCESS] VERIFICA CRITTOGRAFICA RIUSCITA (10/10)!")
        print(" -> Il file è perfettamente integro e non manomesso.")
        print(" -> La firma temporale emessa da DigiCert è valida.")
        
        cmd_info = ["openssl", "ts", "-reply", "-in", tsr_path, "-text"]
        info_res = subprocess.run(cmd_info, capture_output=True, text=True)
        for line in info_res.stdout.splitlines():
            if "Time stamp:" in line:
                print(f" -> Data/Ora Certificata (UTC): {line.strip().split(':', 1)[1]}")
    else:
        print("\n[FAILURE] VERIFICA FALLITA!")
        print(" -> Attenzione: il file è stato modificato o la marca non corrisponde.")

def cmd_list(args):
    init_db()
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT id, file_name, sha256_hash, timestamp_utc, tsr_filename FROM notary_log")
    rows = cursor.fetchall()
    conn.close()
    
    print("\n--- REGISTRO NOTARIZZAZIONI LOCALI (SQLite) ---")
    for row in rows:
        print(f"ID: {row[0]} | File: {row[1]} | TSR: {row[4]}")
        print(f"  Hash: {row[2]}")
        print(f"  Data: {row[3]}\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Mobile Notary Suite - RFC 3161 Notarization Tool")
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    # Sotto-comando notarize
    p_not = subparsers.add_parser("notarize", help="Notarizza un file")
    p_not.add_argument("file", help="Percorso del file da notarizzare")
    p_not.set_defaults(func=cmd_notarize)
    
    # Sotto-comando verify
    p_ver = subparsers.add_parser("verify", help="Verifica un file con la sua marca .tsr")
    p_ver.add_argument("file", help="Percorso del file originale")
    p_ver.add_argument("tsr", help="Percorso del file di marca .tsr")
    p_ver.set_defaults(func=cmd_verify)
    
    # Sotto-comando list
    p_list = subparsers.add_parser("list", help="Mostra lo storico nel database")
    p_list.set_defaults(func=cmd_list)
    
    parsed_args = parser.parse_args()
    parsed_args.func(parsed_args)
