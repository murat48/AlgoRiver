#!/bin/bash

echo "🚀 Creating new Algorand Application..."

# Create a new application using goal command (if available)
# Since we don't have goal, we'll use a simple Python script

cat > deploy_simple.py << 'EOF'
from algosdk.v2client import algod
from algosdk import account, mnemonic, transaction
import base64

# Connect to Algorand testnet
algod_address = "https://testnet-api.algonode.cloud"
algod_token = ""
algod_client = algod.AlgodClient(algod_token, algod_address)

# Account from mnemonic
mnemonic_phrase = "captain rookie mom meadow bulb inhale ensure try blanket today vast mystery west evil brass decrease describe crime polar muscle cabbage lobster occur about whisper"
private_key = mnemonic.to_private_key(mnemonic_phrase)
sender = account.address_from_private_key(private_key)

print(f"Using account: {sender}")

# Get network parameters
params = algod_client.suggested_params()

# Minimal approval program (returns 1)
approval_program = b"\x01\x20\x01\x01\x22"  # TEAL: int 1; return
clear_program = b"\x01\x20\x01\x01\x22"     # TEAL: int 1; return

# Create application transaction
app_create_txn = transaction.ApplicationCreateTxn(
    sender=sender,
    sp=params,
    on_complete=transaction.OnComplete.NoOpOC,
    approval_program=approval_program,
    clear_program=clear_program,
    global_schema=transaction.StateSchema(1, 1),
    local_schema=transaction.StateSchema(0, 0)
)

# Sign transaction
signed_txn = app_create_txn.sign(private_key)

# Submit transaction
tx_id = algod_client.send_transaction(signed_txn)
print(f"📤 Transaction submitted: {tx_id}")

# Wait for confirmation
confirmed_txn = transaction.wait_for_confirmation(algod_client, tx_id, 4)
app_id = confirmed_txn['application-index']

print(f"✅ New Application Created!")
print(f"📋 App ID: {app_id}")
print(f"🔗 Creator: {sender}")
print(f"📤 Transaction: {tx_id}")
print(f"🌐 Explorer: https://testnet.algoexplorer.io/application/{app_id}")

EOF

echo "Running Python deployment script..."
python3 deploy_simple.py