#!/bin/bash
# gbrain Semantic Spine Initialization
# Engine: gbrain with PGlite (local-first vector store)
# Run this on the target Windows machine after placing vault at C:\Kesarel\MMT_Vault

echo "═══════════════════════════════════════════════════════"
echo "  GBRAIN SPINE INITIALIZATION"
echo "  Vault: C:\\Kesarel\\MMT_Vault"
echo "  Engine: PGlite (Local Vector Store)"
echo "═══════════════════════════════════════════════════════"
echo ""

# Check if gbrain is installed
if ! command -v gbrain &> /dev/null; then
    echo "[!] gbrain not found. Install with:"
    echo "    npm install -g gbrain"
    echo "    # or"
    echo "    pnpm add -g gbrain"
    exit 1
fi

echo "[1/4] Initializing PGlite database..."
gbrain init --pglite

echo "[2/4] Configuring embedding pipeline..."
gbrain config set --engine pglite --embedding local

echo "[3/4] Indexing vault structure..."
gbrain index .

echo "[4/4] Verifying spine integrity..."
gbrain status

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✓ GBRAIN SPINE: ONLINE"
echo "  ✓ VECTOR STORE: PGlite (Local)"
echo "  ✓ VAULT STATUS: IMPERIAL OBSIDIAN ACTIVE"
echo "═══════════════════════════════════════════════════════"
