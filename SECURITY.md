# Security Policy

## Supported Version

The current development version of ForgeToken is the only supported version.

ForgeToken is an educational and portfolio project and has not undergone an independent professional security audit.

It should not be used to secure production funds without additional review.

## Reporting a Vulnerability

If you discover a potential security vulnerability, please report it privately before publishing details.

A useful vulnerability report should include:

- a clear description of the issue
- affected function or contract
- required preconditions
- attack scenario
- potential impact
- proof of concept or reproducible test, if possible
- suggested mitigation, if known

Please avoid publicly disclosing exploitable details before the issue has been reviewed.

## Security Scope

Security-relevant areas include:

- ERC-20 balance accounting
- allowance accounting
- `transferFrom`
- delegated burning through `burnFrom`
- token minting
- maximum supply enforcement
- ownership controls
- pause and unpause controls
- unauthorized state modification
- transaction atomicity
- supply and balance invariants

## Trusted Role

ForgeToken contains a privileged `owner` role.

The owner is authorized to:

- mint tokens up to the remaining maximum supply
- pause token operations
- unpause token operations
- transfer ownership

The owner is considered a trusted actor.

Compromise or malicious use of the owner's private key is outside the contract's security guarantees.

## Security Properties

The implementation is designed to maintain the following properties:

- `totalSupply` must never exceed `maxSupply`
- transfers must not modify `totalSupply`
- minting must increase supply exactly by the minted amount
- burning must decrease supply exactly by the burned amount
- users must not spend more tokens than they own
- spenders must not exceed finite allowances
- infinite allowances must not be reduced by delegated spending
- failed transactions must not leave partial state changes
- only the owner may execute privileged administrative operations

Additional details are documented in `docs/THREAT_MODEL.md`.

## Security Testing

ForgeToken uses multiple security-oriented testing techniques:

- unit tests
- property tests
- invariant tests
- randomized tests
- stateful model-based tests
- Slither static analysis

Current Slither configuration runs 98 detectors against the contract implementation with no findings.

The `pragma` and `solc-version` detectors are intentionally excluded because imported OpenZeppelin interfaces use broad Solidity version ranges while ForgeToken is compiled with Solidity 0.8.28.

## Out of Scope

The following areas are currently outside the ForgeToken security scope:

- compromised private keys
- frontend vulnerabilities
- malicious wallets
- phishing
- RPC provider compromise
- validator or consensus attacks
- bridges
- oracle systems
- DEX integrations
- governance systems
- upgradeability

ForgeToken is not upgradeable.

## Disclaimer

Testing and static analysis reduce risk but do not prove the absence of vulnerabilities.

This repository is intended to demonstrate Solidity development, testing, and security engineering practices.