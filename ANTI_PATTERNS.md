# FHEVM Anti-Patterns and Common Mistakes

## Overview

This document outlines common anti-patterns, mistakes, and pitfalls when developing with FHEVM. Understanding these issues will help you write more secure and efficient privacy-preserving smart contracts.

---

## Table of Contents

1. [Permission Management Anti-Patterns](#permission-management-anti-patterns)
2. [View Function Mistakes](#view-function-mistakes)
3. [Input Proof Errors](#input-proof-errors)
4. [Handle Management Issues](#handle-management-issues)
5. [Gas Optimization Mistakes](#gas-optimization-mistakes)
6. [Security Vulnerabilities](#security-vulnerabilities)

---

## Permission Management Anti-Patterns

### ❌ Anti-Pattern 1: Missing FHE.allowThis()

**Problem:** Forgetting to grant the contract permission to access encrypted values.

```solidity
// WRONG: Contract cannot access the value later
function storeValue(externalEuint32 value, bytes calldata proof) external {
  euint32 encrypted = FHE.fromExternal(value, proof);
  _value = encrypted;

  FHE.allow(encrypted, msg.sender); // Only user can access, not contract!
}
```

**Correct Pattern:**

```solidity
// RIGHT: Grant both contract and user access
function storeValue(externalEuint32 value, bytes calldata proof) external {
  euint32 encrypted = FHE.fromExternal(value, proof);
  _value = encrypted;

  FHE.allowThis(encrypted);       // Contract can access
  FHE.allow(encrypted, msg.sender); // User can decrypt
}
```

**Impact:** Contract operations will fail when trying to use the encrypted value.

---

### ❌ Anti-Pattern 2: Missing User Permission

**Problem:** Not granting decryption permission to the user who needs it.

```solidity
// WRONG: User cannot decrypt their own value
function storeValue(externalEuint32 value, bytes calldata proof) external {
  euint32 encrypted = FHE.fromExternal(value, proof);
  _value = encrypted;

  FHE.allowThis(encrypted); // Only contract can access
}
```

**Correct Pattern:**

```solidity
// RIGHT: Grant permission to user for decryption
function storeValue(externalEuint32 value, bytes calldata proof) external {
  euint32 encrypted = FHE.fromExternal(value, proof);
  _value = encrypted;

  FHE.allowThis(encrypted);
  FHE.allow(encrypted, msg.sender); // User can now decrypt
}
```

**Impact:** Users cannot decrypt values they should have access to.

---

### ❌ Anti-Pattern 3: Forgetting Permissions After Operations

**Problem:** Not updating permissions after FHE operations create new handles.

```solidity
// WRONG: New value from addition has no permissions
function addValues(externalEuint32 value, bytes calldata proof) external {
  euint32 encrypted = FHE.fromExternal(value, proof);

  _sum = FHE.add(_sum, encrypted); // Creates NEW handle

  // Missing: FHE.allowThis(_sum);
  // Missing: FHE.allow(_sum, msg.sender);
}
```

**Correct Pattern:**

```solidity
// RIGHT: Always grant permissions to new handles
function addValues(externalEuint32 value, bytes calldata proof) external {
  euint32 encrypted = FHE.fromExternal(value, proof);

  _sum = FHE.add(_sum, encrypted);

  FHE.allowThis(_sum);       // Contract can use new value
  FHE.allow(_sum, msg.sender); // User can decrypt result
}
```

**Impact:** Operations succeed but result cannot be accessed or decrypted.

---

## View Function Mistakes

### ❌ Anti-Pattern 4: Returning Plaintext in View Functions

**Problem:** Attempting to return decrypted values in view functions (not possible).

```solidity
// WRONG: Cannot decrypt in view function
function getValue() external view returns (uint32) {
  return FHE.decrypt(_encryptedValue); // NOT POSSIBLE!
}
```

**Correct Pattern:**

```solidity
// RIGHT: Return encrypted handle for off-chain decryption
function getValue() external view returns (euint32) {
  return _encryptedValue; // Return encrypted handle
}

// User decrypts off-chain using their private key
```

**Impact:** Code will not compile or work as expected.

---

### ❌ Anti-Pattern 5: Complex Computations in View Functions

**Problem:** Trying to perform FHE operations in view functions.

```solidity
// WRONG: View functions cannot modify state
function computeSum() external view returns (euint32) {
  euint32 result = FHE.add(_value1, _value2); // Cannot grant permissions
  return result;
}
```

**Correct Pattern:**

```solidity
// RIGHT: Pre-compute and store, or use non-view function
function computeSum() external {
  _sum = FHE.add(_value1, _value2);

  FHE.allowThis(_sum);
  FHE.allow(_sum, msg.sender);
}

function getSum() external view returns (euint32) {
  return _sum;
}
```

**Impact:** Cannot grant permissions in view functions, breaking functionality.

---

## Input Proof Errors

### ❌ Anti-Pattern 6: Missing Input Proof Validation

**Problem:** Not providing proof when converting external encrypted inputs.

```solidity
// WRONG: Missing proof parameter
function storeValue(externalEuint32 value) external {
  euint32 encrypted = FHE.fromExternal(value); // MISSING PROOF!
}
```

**Correct Pattern:**

```solidity
// RIGHT: Always provide proof with external inputs
function storeValue(externalEuint32 value, bytes calldata proof) external {
  euint32 encrypted = FHE.fromExternal(value, proof);
  // ...
}
```

**Impact:** Transaction will revert due to invalid encryption binding.

---

### ❌ Anti-Pattern 7: Reusing Proofs

**Problem:** Attempting to reuse the same proof for different values.

```solidity
// WRONG: Each encrypted value needs its own proof
function storeTwo(
  externalEuint32 val1,
  externalEuint32 val2,
  bytes calldata proof // WRONG: Single proof for two values
) external {
  euint32 enc1 = FHE.fromExternal(val1, proof);
  euint32 enc2 = FHE.fromExternal(val2, proof); // INVALID!
}
```

**Correct Pattern:**

```solidity
// RIGHT: Separate proof for each value
function storeTwo(
  externalEuint32 val1,
  bytes calldata proof1,
  externalEuint32 val2,
  bytes calldata proof2
) external {
  euint32 enc1 = FHE.fromExternal(val1, proof1);
  euint32 enc2 = FHE.fromExternal(val2, proof2);
}
```

**Impact:** Second conversion will fail with invalid proof error.

---

## Handle Management Issues

### ❌ Anti-Pattern 8: Comparing Handles Directly

**Problem:** Trying to compare encrypted handles as if they were plaintext.

```solidity
// WRONG: Cannot compare handles with == operator
function checkEqual(euint32 value1, euint32 value2) external view returns (bool) {
  return value1 == value2; // WRONG: Comparing handles, not values!
}
```

**Correct Pattern:**

```solidity
// RIGHT: Use FHE.eq() for encrypted comparison
function checkEqual(euint32 value1, euint32 value2) external returns (ebool) {
  ebool result = FHE.eq(value1, value2);

  FHE.allowThis(result);
  FHE.allow(result, msg.sender);

  return result; // Returns encrypted boolean
}
```

**Impact:** Comparing handles compares memory addresses, not encrypted values.

---

### ❌ Anti-Pattern 9: Losing Handle References

**Problem:** Not storing result handles from FHE operations.

```solidity
// WRONG: Result is lost
function compute() external {
  FHE.add(_value1, _value2); // Result discarded!
}
```

**Correct Pattern:**

```solidity
// RIGHT: Store and manage result handle
function compute() external {
  euint32 result = FHE.add(_value1, _value2);
  _result = result; // Store for later use

  FHE.allowThis(result);
  FHE.allow(result, msg.sender);
}
```

**Impact:** Cannot access computation results.

---

## Gas Optimization Mistakes

### ❌ Anti-Pattern 10: Redundant FHE Operations

**Problem:** Performing the same FHE operation multiple times.

```solidity
// WRONG: Computing same sum repeatedly
function inefficient() external {
  euint32 sum1 = FHE.add(_value1, _value2); // Expensive!
  euint32 sum2 = FHE.add(_value1, _value2); // Redundant!
}
```

**Correct Pattern:**

```solidity
// RIGHT: Compute once, reuse result
function efficient() external {
  euint32 sum = FHE.add(_value1, _value2);
  _cachedSum = sum;

  FHE.allowThis(sum);
  // Use _cachedSum elsewhere
}
```

**Impact:** Unnecessarily high gas costs.

---

### ❌ Anti-Pattern 11: Unnecessary Type Conversions

**Problem:** Converting between encrypted types when not needed.

```solidity
// WRONG: Unnecessary conversion chain
function wasteful(euint32 value) external {
  euint64 temp = FHE.asEuint64(value);  // Conversion 1
  euint32 result = FHE.asEuint32(temp); // Conversion 2 (back!)
}
```

**Correct Pattern:**

```solidity
// RIGHT: Use appropriate type from the start
function efficient(euint32 value) external {
  // Work directly with euint32
  _result = FHE.add(value, _otherValue);
}
```

**Impact:** Extra gas costs for unnecessary operations.

---

## Security Vulnerabilities

### ❌ Anti-Pattern 12: Missing Access Control

**Problem:** No access control on sensitive functions.

```solidity
// WRONG: Anyone can grant permissions
function grantAccess(address user) external {
  FHE.allow(_secretValue, user); // NO ACCESS CONTROL!
}
```

**Correct Pattern:**

```solidity
// RIGHT: Only owner can grant access
address public owner;

function grantAccess(address user) external {
  require(msg.sender == owner, "Only owner");
  FHE.allow(_secretValue, user);
}
```

**Impact:** Unauthorized users can access confidential data.

---

### ❌ Anti-Pattern 13: Information Leakage Through Events

**Problem:** Emitting sensitive plaintext in events.

```solidity
// WRONG: Leaking plaintext value in event
event ValueStored(uint32 plaintextValue); // DON'T DO THIS!

function store(externalEuint32 value, bytes calldata proof) external {
  euint32 encrypted = FHE.fromExternal(value, proof);

  // This would leak the value:
  // emit ValueStored(FHE.decrypt(encrypted)); // WRONG!
}
```

**Correct Pattern:**

```solidity
// RIGHT: Only emit non-sensitive information
event ValueStored(address indexed user);

function store(externalEuint32 value, bytes calldata proof) external {
  euint32 encrypted = FHE.fromExternal(value, proof);
  _value = encrypted;

  emit ValueStored(msg.sender); // Only emit user address
}
```

**Impact:** Confidential data exposed through transaction logs.

---

### ❌ Anti-Pattern 14: Weak Randomness

**Problem:** Using block properties for randomness with encrypted values.

```solidity
// WRONG: Predictable randomness
function weakRandom() external {
  uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp)));
  // Using this with encrypted values defeats privacy
}
```

**Correct Pattern:**

```solidity
// RIGHT: Use proper randomness source or encrypted randomness
function betterRandom() external {
  // Use Zama's encrypted random number generation
  // or proper VRF (Verifiable Random Function)
}
```

**Impact:** Predictable behavior can compromise privacy.

---

## Testing Anti-Patterns

### ❌ Anti-Pattern 15: Not Testing Permission Management

**Problem:** Tests don't verify permission grants.

```solidity
// WRONG: Test doesn't verify permissions
it("should store value", async () => {
  await contract.store(encrypted.data, encrypted.proof);
  // Missing: Check if user can decrypt
  // Missing: Check if contract can access
});
```

**Correct Pattern:**

```solidity
// RIGHT: Comprehensive permission testing
it("should store value with correct permissions", async () => {
  await contract.store(encrypted.data, encrypted.proof);

  // Verify user can decrypt
  const value = await contract.getValue();
  const decrypted = await fhevm.userDecryptEuint32(value);
  expect(decrypted).to.equal(expectedValue);

  // Verify contract can access
  await contract.useValue(); // Should not revert
});
```

**Impact:** Permission bugs go undetected until production.

---

### ❌ Anti-Pattern 16: Not Testing Edge Cases

**Problem:** Only testing happy path scenarios.

```solidity
// WRONG: Only tests normal values
it("should add values", async () => {
  await contract.add(5, 10); // Only normal case
});
```

**Correct Pattern:**

```solidity
// RIGHT: Test edge cases
it("should handle zero values", async () => {
  await contract.add(0, 0);
});

it("should handle maximum values", async () => {
  const max = 2n ** 32n - 1n;
  await contract.add(max, 0);
});

it("should handle overflow correctly", async () => {
  // Test overflow behavior
});
```

**Impact:** Edge case bugs remain undiscovered.

---

## Best Practices Summary

### ✅ Always Do:

1. **Grant permissions** - Both `FHE.allowThis()` and `FHE.allow()` after operations
2. **Provide proofs** - Include input proofs for all external encrypted inputs
3. **Store handles** - Keep references to FHE operation results
4. **Test permissions** - Verify access control in all tests
5. **Use proper types** - Choose appropriate euint types for your data
6. **Add access control** - Protect sensitive functions
7. **Test edge cases** - Zero values, maximum values, overflows
8. **Return handles** - Return encrypted handles from view functions

### ❌ Never Do:

1. **Decrypt in view functions** - Cannot be done, return handles instead
2. **Compare handles with ==** - Use `FHE.eq()` for encrypted comparison
3. **Forget permissions** - Every new handle needs permissions
4. **Reuse proofs** - Each encrypted input needs its own proof
5. **Emit plaintext** - Don't leak confidential data in events
6. **Skip access control** - Always validate caller permissions
7. **Ignore gas costs** - Cache results, avoid redundant operations
8. **Test only happy path** - Always test edge cases and errors

---

## Quick Checklist

Before deploying your FHEVM contract, verify:

- [ ] All FHE operations grant appropriate permissions
- [ ] Input proofs are required and validated
- [ ] View functions return encrypted handles, not plaintext
- [ ] Access control is implemented on sensitive functions
- [ ] Events don't leak confidential information
- [ ] Tests cover permission management
- [ ] Tests include edge cases (zero, max values, overflows)
- [ ] Gas optimization is considered
- [ ] Handles are properly stored and managed
- [ ] No plaintext comparisons of encrypted values

---

## Additional Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Security Best Practices](https://docs.zama.ai/fhevm/security)
- [Testing Guide](./TESTING_AND_AUTOMATION_GUIDE.md)
- [Example Implementations](./contracts/)

---

## Contributing

Found a new anti-pattern? Please contribute by:
1. Creating an issue with the pattern description
2. Submitting a pull request with the addition
3. Including code examples demonstrating the issue

---

**Remember:** Privacy and security in FHEVM contracts require careful attention to detail. Always test thoroughly and follow best practices!
