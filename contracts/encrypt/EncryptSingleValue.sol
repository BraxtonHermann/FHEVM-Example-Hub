// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Encrypt Single Value
/// @notice Demonstrates storing a single encrypted value
/// @dev Shows encryption binding and permission management
contract EncryptSingleValue is ZamaEthereumConfig {
  euint32 private _encryptedValue;
  address private _owner;

  event ValueEncrypted(address indexed user);

  constructor() {
    _owner = msg.sender;
  }

  /// @notice Stores an encrypted single value
  /// @dev The value is encrypted using FHE and stored in contract state
  /// @param value Encrypted value in external format
  /// @param proof Zero-knowledge proof of valid encryption
  function encryptAndStore(externalEuint32 value, bytes calldata proof) external {
    require(msg.sender == _owner, "Only owner can set value");

    euint32 encryptedValue = FHE.fromExternal(value, proof);
    _encryptedValue = encryptedValue;

    FHE.allowThis(encryptedValue);
    FHE.allow(encryptedValue, msg.sender);

    emit ValueEncrypted(msg.sender);
  }

  /// @notice Retrieves the encrypted value
  /// @dev Returns the encrypted value, caller must have permissions to decrypt
  /// @return The encrypted value
  function getEncryptedValue() external view returns (euint32) {
    return _encryptedValue;
  }

  /// @notice Grant decryption permission to another user
  /// @dev Allows another address to decrypt the stored value
  /// @param user Address to grant permission to
  function grantAccess(address user) external {
    require(msg.sender == _owner, "Only owner can grant access");
    FHE.allow(_encryptedValue, user);
  }

  /// @notice Demonstrates that the value is stored encrypted
  /// @dev Returns whether a value has been set
  /// @return True if value is set
  function isValueSet() external view returns (bool) {
    return true; // Value always exists (initialized to zero)
  }
}
