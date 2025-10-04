# Validator to MetaMask Key Derivation

This tool derives a deterministic MetaMask-compatible private key from a Galactica validator key (`priv_validator_key.json`) and provides cryptographic proof of ownership.

## Purpose

- Convert an ed25519 validator key to a secp256k1 MetaMask key
- Generate cryptographic proof linking both keys
- Allow public verification without revealing private keys

## Requirements

- [Bun](https://bun.sh) runtime installed
- A `priv_validator_key.json` file from your validator

## Installation

```bash
bun install
```
or
```bash
curl -fsSL https://bun.sh/install | bash
```
Sau khi chạy xong, thoát và mở lại terminal (hoặc chạy ```source ~/.bashrc```/ ```source ~/.zshrc```) để thêm Bun vào $PATH.

## Usage

### 1. Derive MetaMask Key (Private - Run Locally)

```bash
bun run derive.ts /path/to/priv_validator_key.json
```

**Output:**

- ✅ Validator hex address (public, already on explorer)
- ✅ Ed25519 public key (public)
- 🔐 Secp256k1 private key (KEEP SECRET - for MetaMask import)
- ✅ EVM address (public - your MetaMask address)
- ✅ Cryptographic proof (signature + recovery ID)

**⚠️ Keep the secp256k1 private key secret!** Only share the public information.

### 2. Import to MetaMask

1. Open MetaMask
2. Click Account menu → Import Account
3. Paste the `Secp256k1 Private Key` (starts with `0x...`)
4. The EVM address shown should match the output from step 1

### 3. Public Verification (Anyone Can Run)

Share these values publicly:

- Validator Hex Address (from explorer)
- EVM Address (your MetaMask address)
- Signature
- Recovery ID

Others can verify:

```bash
bun run verify.ts <validator_hex_address> <evm_address> <signature> <recovery_id>
```

This cryptographically proves that the person controlling the validator also controls the MetaMask address.

## How It Works

1. **Deterministic Derivation**: Uses HKDF (HMAC-based Key Derivation Function) to derive a secp256k1 key from the ed25519 validator key
2. **Cryptographic Proof**: Signs a message containing the validator address with the derived secp256k1 key
3. **Public Verification**: Anyone can verify the signature came from the claimed EVM address without knowing private keys

## Security Notes

- ✅ The derivation is deterministic (same input always produces same output)
- ✅ The secp256k1 key is cryptographically linked to the ed25519 key
- ✅ No private keys are revealed during verification
- ⚠️ Keep your `priv_validator_key.json` and derived private key secure
- ⚠️ Never share private keys publicly

## Files

- `derive.ts` - Derives MetaMask key from validator key (run privately)
- `verify.ts` - Verifies cryptographic proof (run publicly)
- `package.json` - Dependencies and scripts
- `README.md` - This file

## License

MIT
