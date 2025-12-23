# Understanding FHEVM Handles

## Overview

In FHEVM (Fully Homomorphic Encryption Virtual Machine), **handles** are the fundamental building blocks for working with encrypted data. This guide explains how handles work, how they're generated, their lifecycle, and best practices for managing them.

---

## What Are Handles?

A **handle** is a unique reference to an encrypted value stored in the FHEVM system. Instead of storing the actual encrypted data on-chain (which would be expensive and impractical), FHEVM uses handles as pointers or references to encrypted values maintained by the Zama coprocessor.

### Key Characteristics

- **Unique Identifier**: Each handle uniquely identifies a specific encrypted value
- **Compact Storage**: Handles are much smaller than full encrypted data
- **Type-Safe**: Different types (euint32, euint64, ebool) have distinct handles
- **Immutable Reference**: Once created, a handle always points to the same encrypted value
- **Permission-Controlled**: Access to decrypt or use handles is managed by the permission system

### Handle Types

```solidity
// Common handle types in FHEVM
euint8    // Handle to encrypted 8-bit unsigned integer
euint16   // Handle to encrypted 16-bit unsigned integer
euint32   // Handle to encrypted 32-bit unsigned integer
euint64   // Handle to encrypted 64-bit unsigned integer
euint128  // Handle to encrypted 128-bit unsigned integer
euint256  // Handle to encrypted 256-bit unsigned integer
ebool     // Handle to encrypted boolean
eaddress  // Handle to encrypted address
```

---

## How Handles Are Generated

### 1. From External Input (User Encryption)

When users submit encrypted data to a contract, the FHEVM generates a handle from the encrypted input and proof:

```solidity
import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";

contract Example {
    euint32 private _value;

    function setValue(externalEuint32 encryptedInput, bytes calldata inputProof) external {
        // FHEVM generates a handle from the external encrypted input
        euint32 handle = FHE.fromExternal(encryptedInput, inputProof);
        _value = handle;
    }
}
```

**Process:**
1. User encrypts data client-side using FHEVM SDK
2. User generates zero-knowledge proof binding the encrypted data to their address
3. Contract receives encrypted data and proof
4. `FHE.fromExternal()` validates proof and creates handle
5. Handle is stored in contract state

### 2. From FHE Operations

When you perform operations on encrypted values, FHEVM generates new handles for the results:

```solidity
contract Counter {
    euint32 private _count;

    function increment(externalEuint32 encryptedValue, bytes calldata inputProof) external {
        euint32 inputHandle = FHE.fromExternal(encryptedValue, inputProof);

        // FHE.add() creates a NEW handle for the sum
        euint32 newHandle = FHE.add(_count, inputHandle);

        _count = newHandle;  // Store the new handle
    }
}
```

**Key Operations That Generate Handles:**

```solidity
// Arithmetic operations
euint32 sum = FHE.add(a, b);      // Creates new handle
euint32 diff = FHE.sub(a, b);     // Creates new handle
euint32 product = FHE.mul(a, b);  // Creates new handle
euint32 quotient = FHE.div(a, b); // Creates new handle

// Comparison operations (return ebool handles)
ebool isEqual = FHE.eq(a, b);     // Creates new ebool handle
ebool isGreater = FHE.gt(a, b);   // Creates new ebool handle
ebool isLess = FHE.lt(a, b);      // Creates new ebool handle

// Logical operations
ebool result = FHE.and(boolA, boolB);  // Creates new handle
ebool result = FHE.or(boolA, boolB);   // Creates new handle
ebool result = FHE.not(boolA);         // Creates new handle

// Selection operations
euint32 selected = FHE.select(condition, ifTrue, ifFalse);  // Creates new handle
```

### 3. From Trivial Encryption

You can create handles from plaintext values directly in the contract:

```solidity
contract Example {
    function initialize() external {
        // Encrypt plaintext value to create a handle
        euint32 zero = FHE.trivialEncrypt(0);
        euint32 hundred = FHE.trivialEncrypt(100);
        ebool trueValue = FHE.trivialEncrypt(true);
    }
}
```

**Use Cases:**
- Initializing contract state with default encrypted values
- Creating constant encrypted values
- Testing and development

**Warning:** Don't use `trivialEncrypt()` for sensitive values that should remain confidential, as the plaintext is visible in transaction data.

---

## Symbolic Execution and Handle Behavior

FHEVM uses **symbolic execution** to optimize operations on encrypted data. This means:

### Lazy Evaluation

Operations on handles are not executed immediately. Instead, FHEVM builds a computation graph:

```solidity
euint32 a = FHE.trivialEncrypt(5);
euint32 b = FHE.trivialEncrypt(10);
euint32 c = FHE.add(a, b);        // Operation recorded, not executed
euint32 d = FHE.mul(c, b);        // Depends on c
euint32 result = FHE.add(d, a);   // Complex computation graph
```

The FHEVM coprocessor optimizes this graph before execution, potentially:
- Reordering operations for efficiency
- Combining multiple operations
- Parallelizing independent computations

### Handle Determinism

**Important:** For the same inputs and operations, FHEVM generates deterministic handles:

```solidity
// These will always produce the same handle value for the same inputs
euint32 result1 = FHE.add(a, b);
euint32 result2 = FHE.add(a, b);  // Same handle as result1
```

However, handles from different operation sequences may differ:

```solidity
// (a + b) + c
euint32 temp1 = FHE.add(a, b);
euint32 result1 = FHE.add(temp1, c);

// a + (b + c)
euint32 temp2 = FHE.add(b, c);
euint32 result2 = FHE.add(a, temp2);

// result1 and result2 may have different handles
// but decrypt to the same plaintext value
```

---

## Handle Lifecycle

### 1. Creation Phase

A handle is created through one of these methods:
- `FHE.fromExternal()` - From user input
- FHE operation results - From computations
- `FHE.trivialEncrypt()` - From plaintext

```solidity
// Creation examples
euint32 userInput = FHE.fromExternal(encryptedData, proof);
euint32 computed = FHE.add(value1, value2);
euint32 initialized = FHE.trivialEncrypt(0);
```

### 2. Storage Phase

Handles can be stored in contract state:

```solidity
contract Vault {
    // Handles stored as state variables
    euint32 private _balance;
    mapping(address => euint32) private _userBalances;

    struct Position {
        euint32 amount;
        euint32 timestamp;
    }
    mapping(address => Position) private _positions;
}
```

**Storage Costs:**
- Storing a handle is much cheaper than storing full encrypted data
- Handles are fixed-size regardless of the encrypted data they reference
- Multiple copies of the same handle point to the same encrypted value

### 3. Usage Phase

Handles can be used in computations and passed between functions:

```solidity
contract Treasury {
    euint32 private _totalBalance;

    // Passing handles between functions
    function _calculateFee(euint32 amount) private returns (euint32) {
        euint32 feeRate = FHE.trivialEncrypt(5);  // 5% fee
        euint32 hundred = FHE.trivialEncrypt(100);
        euint32 fee = FHE.div(FHE.mul(amount, feeRate), hundred);
        return fee;  // Return the handle
    }

    function deposit(externalEuint32 encAmount, bytes calldata proof) external {
        euint32 amount = FHE.fromExternal(encAmount, proof);
        euint32 fee = _calculateFee(amount);  // Use returned handle
        euint32 netAmount = FHE.sub(amount, fee);

        _totalBalance = FHE.add(_totalBalance, netAmount);
    }
}
```

### 4. Permission Management Phase

Handles require explicit permissions for decryption or external access:

```solidity
function getValue() external {
    euint32 value = _balance;

    // Grant permission for contract to use the handle
    FHE.allowThis(value);

    // Grant permission for user to decrypt the handle
    FHE.allow(value, msg.sender);
}
```

**Permission Rules:**
- Newly created handles have no permissions by default
- `FHE.allowThis()` allows the contract to access the handle in future calls
- `FHE.allow(handle, address)` grants decryption permission to an address
- `FHE.allowTransient()` grants temporary permission (not persisted across transactions)

### 5. Decryption Phase

Handles can be decrypted for authorized users:

```solidity
// In tests or authorized contexts
const handleValue = await contract.getBalance();
const decryptedValue = await fhevm.userDecryptEuint32(handleValue);
console.log("Balance:", decryptedValue);
```

**Decryption Options:**
- **User Decryption**: User decrypts with their private key
- **Public Decryption**: Relayer decrypts and posts result on-chain
- **Threshold Decryption**: Multiple parties collaborate to decrypt

### 6. Garbage Collection

Handles that are no longer referenced are eventually garbage collected:

```solidity
contract Example {
    euint32 private _value;

    function updateValue(externalEuint32 newValue, bytes calldata proof) external {
        euint32 oldHandle = _value;  // Old handle

        // Replace with new handle
        _value = FHE.fromExternal(newValue, proof);

        // oldHandle is no longer referenced
        // FHEVM will eventually garbage collect the old encrypted value
    }
}
```

---

## Best Practices

### 1. Always Manage Permissions

```solidity
// ✅ GOOD: Always set permissions after operations
function increment(externalEuint32 value, bytes calldata proof) external {
    euint32 input = FHE.fromExternal(value, proof);
    _count = FHE.add(_count, input);

    FHE.allowThis(_count);        // Allow contract to use
    FHE.allow(_count, msg.sender); // Allow user to decrypt
}

// ❌ BAD: Missing permissions
function increment(externalEuint32 value, bytes calldata proof) external {
    euint32 input = FHE.fromExternal(value, proof);
    _count = FHE.add(_count, input);
    // Missing permissions - user can't decrypt!
}
```

### 2. Understand Handle Immutability

```solidity
// ✅ GOOD: Create new handles for new values
function setValue(externalEuint32 newValue, bytes calldata proof) external {
    _value = FHE.fromExternal(newValue, proof);  // New handle
    FHE.allowThis(_value);
    FHE.allow(_value, msg.sender);
}

// ❌ BAD: Trying to "modify" a handle (doesn't work)
function tryToModify() external {
    // You can't change what a handle points to
    // You must create a new handle
}
```

### 3. Don't Compare Handles Directly

```solidity
// ❌ BAD: Comparing handles directly
function areEqual(euint32 a, euint32 b) external view returns (bool) {
    return a == b;  // This compares handles, not encrypted values!
}

// ✅ GOOD: Use FHE.eq() to compare encrypted values
function areEqual(euint32 a, euint32 b) external view returns (ebool) {
    return FHE.eq(a, b);  // Returns encrypted boolean
}
```

### 4. Avoid Returning Handles in View Functions

```solidity
// ❌ BAD: Returning handle in view function
function getBalance() external view returns (euint32) {
    return _balance;  // Can't set permissions in view function
}

// ✅ GOOD: Return handle in non-view function with permissions
function getBalance() external returns (euint32) {
    FHE.allowThis(_balance);
    FHE.allow(_balance, msg.sender);
    return _balance;
}
```

### 5. Minimize Handle Operations

```solidity
// ❌ BAD: Redundant operations create unnecessary handles
function calculate(euint32 a, euint32 b) external {
    euint32 temp1 = FHE.add(a, b);
    euint32 temp2 = FHE.add(a, b);  // Duplicate operation
    euint32 temp3 = FHE.mul(temp1, temp2);
}

// ✅ GOOD: Reuse handles where possible
function calculate(euint32 a, euint32 b) external {
    euint32 sum = FHE.add(a, b);    // Calculate once
    euint32 result = FHE.mul(sum, sum);  // Reuse handle
}
```

---

## Common Patterns

### Pattern 1: Safe Handle Storage

```solidity
contract SecureVault {
    mapping(address => euint32) private _balances;

    function deposit(externalEuint32 amount, bytes calldata proof) external {
        euint32 depositHandle = FHE.fromExternal(amount, proof);

        // Load existing balance handle
        euint32 currentBalance = _balances[msg.sender];

        // Create new balance handle
        euint32 newBalance = FHE.add(currentBalance, depositHandle);

        // Store new handle
        _balances[msg.sender] = newBalance;

        // Set permissions
        FHE.allowThis(newBalance);
        FHE.allow(newBalance, msg.sender);
    }
}
```

### Pattern 2: Conditional Handle Selection

```solidity
contract AuctionHouse {
    function selectWinner(
        euint32 bid1,
        euint32 bid2
    ) external returns (euint32) {
        // Compare bids
        ebool bid1Higher = FHE.gt(bid1, bid2);

        // Select winning bid handle
        euint32 winningBid = FHE.select(bid1Higher, bid1, bid2);

        return winningBid;
    }
}
```

### Pattern 3: Handle Array Management

```solidity
contract Lottery {
    euint32[] private _tickets;

    function buyTicket(externalEuint32 ticketNumber, bytes calldata proof) external {
        euint32 ticket = FHE.fromExternal(ticketNumber, proof);

        _tickets.push(ticket);  // Store handle in array

        FHE.allowThis(ticket);
        FHE.allow(ticket, msg.sender);
    }

    function getTicketCount() external view returns (uint256) {
        return _tickets.length;  // Array operations work normally
    }
}
```

---

## Advanced Topics

### Handle Type Casting

FHEVM supports safe type conversions between handle types:

```solidity
euint32 value32 = FHE.trivialEncrypt(100);

// Upcasting (safe - no precision loss)
euint64 value64 = FHE.castToEuint64(value32);
euint128 value128 = FHE.castToEuint128(value64);

// Downcasting (use with caution - may lose precision)
euint16 value16 = FHE.castToEuint16(value32);  // Truncates if > 65535
euint8 value8 = FHE.castToEuint8(value16);     // Truncates if > 255
```

### Handle Reencryption

For user decryption, handles must be reencrypted with the user's public key:

```solidity
function getUserBalance() external returns (euint32) {
    euint32 balance = _balances[msg.sender];

    // Reencrypt for user
    FHE.allow(balance, msg.sender);

    return balance;  // User can decrypt client-side
}
```

### Cross-Contract Handle Sharing

Handles can be passed between contracts:

```solidity
contract TokenA {
    function getBalance(address user) external returns (euint32) {
        euint32 balance = _balances[user];
        FHE.allowThis(balance);  // Allow this contract
        FHE.allow(balance, msg.sender);  // Allow caller contract
        return balance;
    }
}

contract TokenB {
    function checkTokenABalance(address tokenA, address user) external {
        euint32 balance = ITokenA(tokenA).getBalance(user);
        // Now we have access to the handle from TokenA
    }
}
```

---

## Troubleshooting

### Problem: "Cannot decrypt handle"

**Cause:** Missing permissions on the handle.

**Solution:**
```solidity
// Ensure permissions are set
FHE.allowThis(handle);
FHE.allow(handle, userAddress);
```

### Problem: "Handle comparison returns unexpected results"

**Cause:** Comparing handle references instead of encrypted values.

**Solution:**
```solidity
// Don't: a == b (compares handles)
// Do: FHE.eq(a, b) (compares encrypted values)
ebool isEqual = FHE.eq(a, b);
```

### Problem: "Handle lost after operation"

**Cause:** Forgot to store the new handle from an operation.

**Solution:**
```solidity
// Store the new handle
_value = FHE.add(_value, increment);  // Update state with new handle
```

### Problem: "View function can't set permissions"

**Cause:** View functions can't modify state, including permissions.

**Solution:**
```solidity
// Change view to non-view function
function getValue() external returns (euint32) {  // Not 'view'
    FHE.allow(_value, msg.sender);
    return _value;
}
```

---

## Summary

- **Handles** are references to encrypted values in FHEVM
- Handles are **generated** from external input, FHE operations, or trivial encryption
- FHEVM uses **symbolic execution** for optimized computation graphs
- Handles have a **lifecycle**: creation → storage → usage → permissions → decryption → garbage collection
- Always **manage permissions** with `FHE.allowThis()` and `FHE.allow()`
- **Don't compare handles directly** - use `FHE.eq()` for value comparison
- Handles are **immutable** - operations create new handles
- **Type casting** is supported between compatible handle types
- Handles can be **passed between contracts** with proper permissions

---

## Further Reading

- [FHEVM Documentation](https://docs.zama.ai/fhevm) - Official Zama FHEVM docs
- [ANTI_PATTERNS.md](./ANTI_PATTERNS.md) - Common mistakes to avoid
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - Development workflow
- [Example Contracts](./contracts/) - Practical handle usage examples
- [Test Suites](./test/) - Handle testing patterns

---

**Understanding handles is fundamental to FHEVM development. Master these concepts to build robust, efficient, and secure privacy-preserving smart contracts.**
