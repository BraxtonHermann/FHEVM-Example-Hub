// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title User Decrypt Single Value
/// @notice Demonstrates user-side decryption of encrypted values
/// @dev Shows how users can decrypt values they have permission for
contract UserDecryptSingleValue is ZamaEthereumConfig {
  mapping(address => euint32) private _userValues;
  mapping(address => address[]) private _accessGrantees;

  event ValueStored(address indexed user);
  event AccessGranted(address indexed user, address indexed grantee);

  /// @notice Stores an encrypted value for the caller
  /// @param value Encrypted value in external format
  /// @param proof Zero-knowledge proof of valid encryption
  function storeEncryptedValue(externalEuint32 value, bytes calldata proof) external {
    euint32 encryptedValue = FHE.fromExternal(value, proof);
    _userValues[msg.sender] = encryptedValue;

    FHE.allowThis(encryptedValue);
    FHE.allow(encryptedValue, msg.sender);

    emit ValueStored(msg.sender);
  }

  /// @notice Get encrypted value for caller
  /// @dev User can retrieve their own encrypted value
  /// @return The encrypted value
  function getMyValue() external view returns (euint32) {
    return _userValues[msg.sender];
  }

  /// @notice Grant another user permission to decrypt your value
  /// @dev Allows specific address to decrypt the caller's encrypted value
  /// @param grantee Address to grant decryption permission to
  function grantDecryptPermission(address grantee) external {
    euint32 value = _userValues[msg.sender];
    FHE.allow(value, grantee);
    _accessGrantees[msg.sender].push(grantee);

    emit AccessGranted(msg.sender, grantee);
  }

  /// @notice Check if value exists for address
  /// @param user Address to check
  /// @return True if user has stored an encrypted value
  function hasStoredValue(address user) external view returns (bool) {
    return true; // All addresses have an encrypted value (even if zero)
  }

  /// @notice Get list of grantees for a user
  /// @param user Address of value owner
  /// @return Array of addresses granted decryption permission
  function getAccessGrantees(address user) external view returns (address[] memory) {
    return _accessGrantees[user];
  }
}
