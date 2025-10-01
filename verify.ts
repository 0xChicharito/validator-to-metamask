#!/usr/bin/env bun

import { secp256k1 } from "@noble/curves/secp256k1";
import { keccak_256 } from "@noble/hashes/sha3";

// Get arguments from command line
const validatorHexAddress = process.argv[2];
const evmAddress = process.argv[3];
const signature = process.argv[4];
const recoveryId = parseInt(process.argv[5] || "0");

if (!validatorHexAddress || !evmAddress || !signature) {
  console.error("Usage: bun run verify.ts <validator_hex_address> <evm_address> <signature> [recovery_id]");
  console.error("\nExample:");
  console.error("  bun run verify.ts E40DFB803112C19E5A1428D8F44745B2D518BA2B 0x6296c7aecfa16786f225d8a3e3b7259606d504be 75e04e72c9d7... 0");
  process.exit(1);
}

// The message that was signed
const message = `I control validator: ${validatorHexAddress}`;
const messageHash = keccak_256(Buffer.from(message));

console.log("=== PUBLIC VERIFICATION ===\n");
console.log("1. Validator Hex Address (from explorer):");
console.log("   " + validatorHexAddress);
console.log("\n2. Claimed EVM Address:");
console.log("   " + evmAddress);
console.log("\n3. Signed Message:");
console.log("   " + message);
console.log("\n4. Signature:");
console.log("   " + signature);
console.log("\n5. Recovery ID:", recoveryId);

// Verify the signature
try {
  const sig = secp256k1.Signature.fromCompact(signature).addRecoveryBit(recoveryId);
  const publicKey = sig.recoverPublicKey(messageHash).toHex(false);

  // Derive address from recovered public key
  const pubKeyBytes = Buffer.from(publicKey, "hex");
  const pubKeyForEvm = pubKeyBytes.slice(1);
  const evmHashResult = keccak_256(pubKeyForEvm);
  const recoveredAddress = "0x" + Buffer.from(evmHashResult.slice(-20)).toString("hex");

  console.log("\n=== VERIFICATION RESULT ===\n");

  if (recoveredAddress.toLowerCase() === evmAddress.toLowerCase()) {
    console.log("✅ VALID: The signature was created by", evmAddress);
    console.log("✅ This proves that whoever controls EVM address", evmAddress);
    console.log("   also controls validator", validatorHexAddress);
  } else {
    console.log("❌ INVALID: Signature verification failed");
    console.log("   Expected:", evmAddress);
    console.log("   Got:", recoveredAddress);
  }
} catch (error) {
  console.log("❌ ERROR:", error instanceof Error ? error.message : String(error));
}

console.log("\n=== HOW THIS WORKS ===");
console.log("1. The validator owner signs a message with their MetaMask key");
console.log("2. The message contains the validator hex address");
console.log("3. Anyone can verify the signature and see it came from the claimed EVM address");
console.log("4. This cryptographically proves the same person controls both keys");
