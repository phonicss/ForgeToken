# ForgeToken Threat Model

## 1. Purpose

This document describes the security assumptions, trusted roles, protected assets, attack surfaces, invariants, and out-of-scope risks of the ForgeToken smart contract.

ForgeToken is an ERC-20 compatible token implementation built from scratch for educational and portfolio purposes.

The contract includes:

- capped token supply
- owner-controlled minting
- token burning
- delegated burning through allowances
- pausable token operations
- ownership transfer
- ERC-20 allowance management
- infinite allowance support
- centralized balance and supply updates through `_update()`

The purpose of this threat model is to define which behaviors are considered valid and which conditions must always remain true.

## 2. Assets

The primary assets protected by the contract are:

### Token balances

Each account's token balance must accurately represent the amount of ForgeToken owned by that account.

### Total supply

`totalSupply` must always equal the total number of tokens currently in circulation.

### Maximum supply

`totalSupply` must never exceed `maxSupply`.

### Allowances

Allowances must accurately represent the amount a spender is authorized to transfer or burn on behalf of another account.

### Ownership

Only the current owner must be able to execute privileged administrative operations.

## 3. Trusted Actors

### Owner

The owner is a trusted privileged actor.

The owner is authorized to:

- mint new tokens
- pause the contract
- unpause the contract
- transfer ownership

The owner is not authorized to:

- exceed `maxSupply`
- transfer tokens from arbitrary users without allowance
- burn arbitrary user tokens without allowance
- directly modify user balances

Compromise of the owner private key is outside the contract's ability to prevent.

## 4. Untrusted Actors

All other externally owned accounts and contracts are considered untrusted.

An untrusted actor may:

- hold tokens
- transfer their own tokens
- approve allowances
- spend authorized allowances
- burn their own tokens
- burn another account's tokens only when sufficient allowance exists

An untrusted actor must not be able to:

- mint tokens
- pause or unpause the contract
- transfer ownership
- spend more than their allowance
- transfer more tokens than an account owns
- burn more tokens than an account owns
- increase total supply beyond `maxSupply`

## 5. Security Invariants

The following properties must always hold.

### Supply cap


totalSupply <= maxSupply


No sequence of valid operations may cause `totalSupply` to exceed `maxSupply`.

### Balance conservation

For all existing token holders:


sum(all balances) == totalSupply


### Transfer conservation

A token transfer must not modify `totalSupply`.

For a transfer of `amount` from A to B:


balance[A]_after = balance[A]_before - amount
balance[B]_after = balance[B]_before + amount

totalSupply_after = totalSupply_before


### Mint correctness

Minting must increase both recipient balance and total supply by exactly the minted amount.


balance[to]_after =
balance[to]_before + amount

totalSupply_after =
totalSupply_before + amount


### Burn correctness

Burning must reduce both account balance and total supply by exactly the burned amount.


balance[from]_after =
balance[from]_before - amount

totalSupply_after =
totalSupply_before - amount


### Allowance safety

A spender must never spend more than the current allowance.

For finite allowances:


allowance_after =
allowance_before - amount


Infinite allowance:


type(uint256).max


must not be decreased by `transferFrom` or `burnFrom`.

### Atomicity

If a transaction reverts, no contract state modified during that transaction may persist.

This includes:

- balances
- total supply
- allowances
- ownership
- paused state

## 6. Privileged Operations

### Mint

Only the owner may mint tokens.

Minting must revert if:


amount > maxSupply - totalSupply


### Pause

Only the owner may pause the contract.

While paused, the following operations are disabled:

- `transfer`
- `transferFrom`
- `mint`
- `burn`
- `burnFrom`

Allowance management remains available while paused.

### Ownership transfer

Only the current owner may transfer ownership.

Ownership cannot be transferred to:

address(0)


After ownership transfer, the previous owner must immediately lose access to privileged operations.

## 7. Attack Surface

### Balance manipulation

An attacker may attempt to manipulate balances through:

- transfers
- delegated transfers
- minting
- burning
- delegated burning

All balance changes are centralized through `_update()` to reduce duplicated accounting logic.

### Allowance abuse

An attacker may attempt to:

- spend above approved allowance
- reuse spent allowance
- manipulate allowance through `transferFrom`
- manipulate allowance through `burnFrom`

Allowance spending is centralized through `_spendAllowance()`.

### Unauthorized administrative access

An attacker may attempt to call:

- `mint`
- `pause`
- `unpause`
- `transferOwnership`

These operations are protected by `onlyOwner`.

### Supply inflation

An attacker or compromised owner may attempt to mint beyond the configured maximum supply.

The contract enforces:


totalSupply + amount <= maxSupply


through the available mint capacity check.

### Zero-address operations

The contract rejects invalid zero-address operations where appropriate.

The zero address is only used internally to represent:

- token minting
- token burning

## 8. Reentrancy Analysis

ForgeToken does not perform external calls during token state transitions.

Functions such as:

- `transfer`
- `transferFrom`
- `mint`
- `burn`
- `burnFrom`

only modify internal contract state and emit events.

Therefore, there is currently no external-call reentrancy surface in the token accounting logic.

If future versions add external calls, hooks, callbacks, or integrations, this assumption must be reviewed.

## 9. Arithmetic Safety

ForgeToken uses Solidity `^0.8.28`.

Arithmetic overflow and underflow are checked by the Solidity compiler unless explicitly placed inside an `unchecked` block.

The current implementation does not use `unchecked` arithmetic.

## 10. Known Trust Assumptions

The security model assumes that the owner is trusted.

A malicious or compromised owner may:

- pause token operations
- mint tokens up to the remaining supply cap
- transfer ownership

The contract does not implement:

- multisignature administration
- timelocks
- governance
- role-based access control

These are intentionally outside the current project scope.

## 11. Out of Scope

The following risks are outside the scope of the current ForgeToken implementation:

- compromised private keys
- malicious wallets
- phishing attacks
- frontend vulnerabilities
- RPC provider compromise
- validator or consensus attacks
- bridges
- decentralized exchange integrations
- oracle manipulation
- governance attacks
- upgradeability risks

ForgeToken is not upgradeable.

## 12. Security Testing

The project uses multiple testing approaches.

### Unit testing

Tests individual functions, success paths, events, and revert conditions.

### Property testing

Checks properties across multiple input values.

### Invariant testing

Checks system-wide properties such as:


sum(balances) == totalSupply
totalSupply <= maxSupply


### Randomized testing

Uses deterministic pseudo-random operation sequences.

### Stateful model-based testing

A TypeScript reference model tracks expected contract state across a sequence of randomized operations.

After every operation, the model state is compared against the Solidity contract state.

### Static analysis

The contract is analyzed with Slither.

Current configuration excludes the `pragma` and `solc-version` detectors because imported OpenZeppelin interfaces intentionally use broad compiler version ranges.

Current Slither result:


98 detectors
0 findings


## 13. Limitations

Passing tests and static analysis does not prove that the contract is free from vulnerabilities.

The project has not undergone an independent professional security audit and should not be used to secure production funds without further review.