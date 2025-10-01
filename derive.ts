#!/usr/bin/env bun

import { secp256k1 } from "@noble/curves/secp256k1";
import { ed25519 } from "@noble/curves/ed25519";
import { keccak_256 } from "@noble/hashes/sha3";
import { sha256 } from "@noble/hashes/sha256";
import { hkdf } from "@noble/hashes/hkdf";
import { readFileSync } from "fs";

// Get the file path from command line argument
const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: bun run derive.ts <path-to-priv_validator_key.json>");
  process.exit(1);
}

// Read the priv_validator_key.json
let validatorKey;
try {
  const fileContent = readFileSync(filePath, "utf-8");
  validatorKey = JSON.parse(fileContent);
} catch (error) {
  console.error("Error reading file:", error instanceof Error ? error.message : String(error));
  process.exit(1);
}

// Decode the ed25519 private key (first 32 bytes)
const ed25519PrivKeyBase64 = validatorKey.priv_key.value;
const ed25519PrivKeyFull = Buffer.from(ed25519PrivKeyBase64, "base64");
const ed25519PrivKey = ed25519PrivKeyFull.slice(0, 32);
const ed25519PubKey = ed25519.getPublicKey(ed25519PrivKey);

// Derive the validator address (first 20 bytes of SHA256(pubkey))
const validatorAddressHash = sha256(ed25519PubKey);
const validatorAddressBytes = validatorAddressHash.slice(0, 20);
const validatorHexAddress = Buffer.from(validatorAddressBytes).toString("hex").toUpperCase();

console.log("=== Validator Info (from priv_validator_key.json) ===");
console.log("Ed25519 Public Key:", Buffer.from(ed25519PubKey).toString("hex"));
console.log("Validator Hex Address:", validatorHexAddress);

// Derive a deterministic secp256k1 key using HKDF
// This creates a cryptographic link between ed25519 and secp256k1 keys
const info = Buffer.from("metamask-derivation");
const secp256k1PrivKeyBytes = hkdf(sha256, ed25519PrivKey, undefined, info, 32);
const secp256k1PrivKey = Buffer.from(secp256k1PrivKeyBytes).toString("hex");

// Derive EVM address
const secp256k1PubKey = secp256k1.getPublicKey(secp256k1PrivKeyBytes, false);
const pubKeyForEvm = secp256k1PubKey.slice(1);
const evmHash = keccak_256(pubKeyForEvm);
const evmAddress = "0x" + Buffer.from(evmHash.slice(-20)).toString("hex");

console.log("\n=== Derived MetaMask Info ===");
console.log("Secp256k1 Private Key:", "0x" + secp256k1PrivKey);
console.log("EVM Address:", evmAddress);

// Create a cryptographic proof: Sign the validator address with the secp256k1 key
const message = `I control validator: ${validatorHexAddress}`;
const messageHash = keccak_256(Buffer.from(message));
const signature = secp256k1.sign(messageHash, secp256k1PrivKeyBytes);
const sigHex = signature.toCompactHex();
const recovery = signature.recovery;

console.log("\n=== Verification Proof (Share Publicly) ===");
console.log("Validator Hex Address:", validatorHexAddress);
console.log("EVM Address:", evmAddress);
console.log("Message:", message);
console.log("Signature:", sigHex);
console.log("Recovery ID:", recovery);

console.log("\n💡 To verify, anyone can run:");
console.log(`   bun run verify.ts ${validatorHexAddress} ${evmAddress} ${sigHex} ${recovery}`);
