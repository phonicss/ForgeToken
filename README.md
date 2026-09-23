# ForgeToken

ForgeToken is a security-focused ERC-20 compatible token implementation built from scratch in Solidity.

The project demonstrates low-level ERC-20 mechanics, token accounting, allowance management, access control, pausability, invariant testing, randomized state transitions, stateful model-based testing, static analysis, CI, and reproducible deployment.

OpenZeppelin is used only for the standard `IERC20` and `IERC20Metadata` interfaces. The token implementation itself is written from scratch.

> **Security notice:** ForgeToken is an educational and portfolio project. It has not undergone an independent professional audit and should not be used to secure production funds.

---

## Overview

ForgeToken implements the core ERC-20 mechanics together with additional supply-management and administrative functionality.

| Feature | Implementation |
|---|---|
| ERC-20 compatibility | `IERC20`, `IERC20Metadata` |
| Token decimals | 18 |
| Maximum supply | Immutable `maxSupply` |
| Minting | Owner-controlled |
| Burning | Supported |
| Delegated burning | `burnFrom` |
| Transfers | `transfer`, `transferFrom` |
| Allowances | ERC-20 compatible |
| Infinite allowance | `type(uint256).max` |
| Pausable operations | Owner-controlled |
| Ownership transfer | Supported |
| Custom errors | Supported |
| Centralized accounting | `_update()` |
| Unit tests | Supported |
| Property tests | Supported |
| Invariant tests | Supported |
| Randomized tests | Supported |
| Stateful model-based tests | Supported |
| Static analysis | Slither |
| Deployment | Hardhat Ignition |
| CI | GitHub Actions |

---

## Design Goals

ForgeToken intentionally does **not** inherit OpenZeppelin's `ERC20` implementation.

The purpose of the project is to demonstrate understanding of the internal mechanics of an ERC-20 token instead of relying on an existing implementation.

The contract directly implements:

- balance accounting
- allowance accounting
- transfers
- delegated transfers
- minting
- burning
- delegated burning
- maximum supply enforcement
- ownership
- pausability
- infinite allowances
- custom errors
- transaction failure handling

OpenZeppelin interfaces are used only to provide standardized ERC-20 compatibility.

---

## Architecture

All token balance and total supply mutations are centralized in:

```solidity
_update(address from, address to, uint256 amount)
```

The function represents three token state transitions.

### Transfer

When both addresses are non-zero:

- `from != address(0)`
- `to != address(0)`
- `balance[from] -= amount`
- `balance[to] += amount`
- `totalSupply` remains unchanged

### Mint

Minting is represented by:

- `from == address(0)`
- `totalSupply += amount`
- `balance[to] += amount`

Minting is restricted by:

- `totalSupply <= maxSupply`

### Burn

Burning is represented by:

- `to == address(0)`
- `balance[from] -= amount`
- `totalSupply -= amount`

---

## Allowance Architecture

Allowance consumption is centralized in:

```solidity
_spendAllowance(
    address tokenOwner,
    address spender,
    uint256 amount
)
```

Finite allowances decrease after delegated spending:

- `allowance_after = allowance_before - amount`

An allowance equal to:

```solidity
type(uint256).max
```

is treated as an infinite allowance and is not decreased by:

- `transferFrom`
- `burnFrom`

---

## Administrative Model

ForgeToken has a single privileged account:

```solidity
address public owner;
```

The owner is authorized to:

- mint new tokens
- pause token operations
- unpause token operations
- transfer ownership

The owner cannot:

- mint beyond `maxSupply`
- directly modify arbitrary balances
- transfer arbitrary user tokens without allowance
- burn arbitrary user tokens without allowance

Ownership cannot be transferred to the zero address.

---

## Pausable Operations

When the token is paused, the following functions are disabled:

- `transfer`
- `transferFrom`
- `mint`
- `burn`
- `burnFrom`

Allowance management remains available:

- `approve`
- `increaseAllowance`
- `decreaseAllowance`
- `allowance`

Read-only operations also remain available.

---

## Security Properties

ForgeToken is designed around several important invariants.

### Maximum Supply

The total supply must never exceed the configured maximum supply:

- `totalSupply <= maxSupply`

### Balance Conservation

For all token holders:

- `sum(all balances) == totalSupply`

### Transfer Conservation

Transfers must not modify the total supply:

- `totalSupply_after == totalSupply_before`

For a transfer from `A` to `B`:

- `balance[A]_after = balance[A]_before - amount`
- `balance[B]_after = balance[B]_before + amount`

### Mint Correctness

Minting must increase supply exactly by the minted amount:

- `totalSupply_after = totalSupply_before + amount`
- `balance[to]_after = balance[to]_before + amount`

### Burn Correctness

Burning must reduce supply exactly by the burned amount:

- `totalSupply_after = totalSupply_before - amount`
- `balance[from]_after = balance[from]_before - amount`

### Allowance Safety

A spender must not be able to spend more than the available finite allowance.

### Atomicity

If an operation reverts, partial state modifications must not persist.

This includes:

- balances
- allowances
- total supply
- ownership
- paused state

---

## Testing Strategy

ForgeToken uses multiple complementary testing approaches.

### Unit Tests

Individual behaviors are tested independently, including:

- deployment
- token metadata
- transfers
- transfer events
- zero-address protection
- insufficient balances
- approvals
- allowance updates
- `transferFrom`
- infinite allowance behavior
- minting
- supply cap enforcement
- burning
- delegated burning
- ownership transfer
- pause/unpause
- access control
- custom errors

### Property Tests

Properties are tested across multiple input values rather than with only one predefined amount.

Example property:

- For every successful transfer, `totalSupply_before == totalSupply_after`

Similar properties are tested for minting and burning.

### Invariant Tests

System-level properties are checked after multiple state transitions.

Examples:

- `sum(balances) == totalSupply`
- `totalSupply <= maxSupply`

### Randomized Testing

The test suite uses a deterministic pseudo-random generator to execute many operations with varying values.

Deterministic seeds make failures reproducible.

Example flow:

1. Generate a pseudo-random amount.
2. Execute a transfer.
3. Execute a reverse transfer.
4. Check balances and total supply.

---

## Stateful Model-Based Testing

ForgeToken includes stateful model-based testing.

A TypeScript reference model tracks the expected state while the Solidity contract performs a sequence of randomized operations.

The model tracks values such as:

- owner balance
- user balances
- total supply
- allowances

For every generated operation, the model predicts whether the transaction should succeed or revert.

After every state transition:

- Solidity contract state must match the TypeScript reference model.

This approach tests dependent sequences of operations rather than testing every function only in isolation.

It also verifies that failed transactions leave the contract state unchanged.

---

## Test Coverage

Run Solidity coverage with:

```bash
npx hardhat test --coverage
```

Current coverage:

- Statements: **92 / 97 — 94.84%**
- Lines: **92 / 97 — 94.84%**

The currently generated report does not provide meaningful Solidity function or branch metrics, so only statement and line coverage are reported here.

The remaining uncovered statements are defensive checks inside internal functions that cannot currently be reached through the external contract API.

Examples include zero-address guards where the relevant value:

- is derived from `msg.sender`, or
- has already been validated earlier in the call path.

These checks are intentionally retained instead of being removed solely to achieve a 100% coverage metric.

The generated HTML report is available locally under:

`coverage/html/`

---

## Static Analysis

ForgeToken is analyzed using Slither.

Run:

```bash
slither contracts/ForgeToken.sol
```

Current result:

- **98 detectors**
- **0 findings**

The Slither configuration excludes:

- `pragma`
- `solc-version`

These detectors were manually reviewed.

They trigger because imported OpenZeppelin interfaces support broad Solidity compiler ranges while ForgeToken itself is compiled using Solidity `0.8.28`.

The configuration is stored in:

`slither.config.json`

Static analysis is used together with automated testing and manual review.

A clean Slither result does not prove the absence of vulnerabilities.

---

## Threat Model

A dedicated threat model documents:

- protected assets
- trusted actors
- untrusted actors
- administrative privileges
- security invariants
- attack surfaces
- reentrancy assumptions
- arithmetic assumptions
- out-of-scope risks

See:

`docs/THREAT_MODEL.md`

---

## Security Policy

The repository contains a security policy describing:

- security scope
- trusted roles
- vulnerability reporting expectations
- security properties
- testing methodology
- out-of-scope risks

See:

`SECURITY.md`

---

## Sepolia Deployment

ForgeToken is deployed on Ethereum Sepolia.

**Network:** Ethereum Sepolia  
**Chain ID:** 11155111

**Contract address:**

`0x6F9954063E03165009dA1599FDFc70d1ccD9e846`

### Verified Source

Blockscout:

https://eth-sepolia.blockscout.com/address/0x6F9954063E03165009dA1599FDFc70d1ccD9e846#code

Sourcify:

https://sourcify.dev/server/repo-ui/11155111/0x6F9954063E03165009dA1599FDFc70d1ccD9e846

The source code has been successfully verified on Blockscout and Sourcify.

---

## Deployment

Deployment is managed using Hardhat Ignition.

The deployment module is located at:

`ignition/modules/ForgeToken.ts`

Local deployment:

```bash
npx hardhat ignition deploy ignition/modules/ForgeToken.ts
```

Sepolia deployment:

```bash
npx hardhat ignition deploy \
  ignition/modules/ForgeToken.ts \
  --network sepolia
```

---

## Constructor

ForgeToken is deployed using:

```solidity
constructor(
    string memory _name,
    string memory _symbol,
    uint256 _initialSupply,
    uint256 _maxSupply
)
```

The constructor accepts supply values in whole-token units.

Example:

- `initialSupply = 1,000,000`
- `maxSupply = 2,000,000`

The contract internally converts these values to 18-decimal base units.

The Sepolia deployment uses:

- **Name:** Forge Token
- **Symbol:** FORGE
- **Initial supply:** 1,000,000 FORGE
- **Maximum supply:** 2,000,000 FORGE
- **Decimals:** 18

---

## Development Stack

The project uses:

- Solidity 0.8.28
- Hardhat 3
- TypeScript
- Ethers.js 6
- Mocha
- Chai
- Hardhat Ignition
- Slither
- OpenZeppelin Contracts interfaces
- GitHub Actions

---

## Project Structure

```text
forge-token/
├── contracts/
│   └── ForgeToken.sol
│
├── ignition/
│   └── modules/
│       └── ForgeToken.ts
│
├── test/
│   ├── helpers/
│   │
│   ├── ForgeToken.deployment.ts
│   ├── ForgeToken.transfers.ts
│   ├── ForgeToken.allowances.ts
│   ├── ForgeToken.minting.ts
│   ├── ForgeToken.burning.ts
│   ├── ForgeToken.access.ts
│   ├── ForgeToken.invariants.ts
│   └── ForgeToken.model.ts
│
├── docs/
│   └── THREAT_MODEL.md
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── SECURITY.md
├── slither.config.json
├── hardhat.config.ts
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

---

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd forge-token
```

Install dependencies:

```bash
npm ci
```

---

## Compile

Compile contracts with:

```bash
npm run compile
```

or:

```bash
npx hardhat compile
```

---

## Run Tests

```bash
npm test
```

or:

```bash
npx hardhat test
```

---

## Run Coverage

```bash
npx hardhat test --coverage
```

---

## Run Slither

Install Slither separately if it is not already available:

```bash
pipx install slither-analyzer
```

Then run:

```bash
slither contracts/ForgeToken.sol
```

---

## Production Build

The project contains a dedicated Hardhat production build profile.

Compile using:

```bash
npx hardhat compile --build-profile production
```

Production Solidity configuration:

- Optimizer enabled: **true**
- Optimizer runs: **200**

---

## Configuration Variables

The Sepolia configuration expects:

- `SEPOLIA_RPC_URL`
- `SEPOLIA_PRIVATE_KEY`

Verification may additionally use:

- `ETHERSCAN_API_KEY`

Secrets should never be committed to the repository.

Hardhat keystore can be used to store them locally:

```bash
npx hardhat keystore set SEPOLIA_RPC_URL
```

```bash
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
```

```bash
npx hardhat keystore set ETHERSCAN_API_KEY
```

A dedicated development wallet should be used for testnet deployments.

---

## Continuous Integration

GitHub Actions is used to independently validate repository changes.

The CI pipeline runs:

1. Checkout repository.
2. Install dependencies.
3. Compile Solidity contracts.
4. Run automated tests.
5. Run Slither static analysis.

The workflow is located at:

`.github/workflows/ci.yml`

CI runs on repository pushes and pull requests.

---

## Security Considerations

ForgeToken currently performs no external calls during token accounting.

The core operations:

- `transfer`
- `transferFrom`
- `mint`
- `burn`
- `burnFrom`

only modify internal storage and emit events.

Therefore, the current token accounting implementation does not expose an external-call reentrancy surface.

This assumption must be reviewed if future versions introduce:

- hooks
- callbacks
- external integrations
- arbitrary contract calls

---

## Known Trust Assumptions

The owner is considered a trusted privileged actor.

A malicious or compromised owner may:

- mint tokens up to the remaining maximum supply
- pause token operations
- unpause token operations
- transfer ownership

The contract currently does not implement:

- multisig administration
- timelocks
- governance
- role-based access control
- upgradeability

These mechanisms are intentionally outside the scope of this project.

---

## Out of Scope

The current security model does not attempt to protect against:

- compromised private keys
- malicious wallets
- phishing
- vulnerable frontends
- compromised RPC providers
- consensus-layer attacks
- bridges
- oracle manipulation
- DEX-specific risks
- governance attacks
- upgradeability risks

ForgeToken is not upgradeable.

---

## Security Disclaimer

ForgeToken is an educational and portfolio project designed to demonstrate Solidity development and smart-contract security engineering practices.

The project has not undergone an independent professional security audit.

Automated tests, model-based tests, invariant testing, coverage analysis, static analysis, and source-code verification reduce risk but do not prove that the implementation is free from vulnerabilities.

Do not use this contract to secure production funds without additional independent security review.

---

## License

This project is licensed under the MIT License.