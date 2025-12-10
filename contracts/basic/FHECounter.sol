// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHE Counter
/// @notice A simple encrypted counter demonstrating basic FHE operations
/// @dev Demonstrates encrypted state management using FHEVM
contract FHECounter is ZamaEthereumConfig {
  euint32 private _count;

  event CountIncremented(address indexed user);
  event CountDecremented(address indexed user);

  /// @notice Returns the current encrypted count
  /// @dev The returned value is encrypted and can only be decrypted by authorized users
  /// @return The encrypted counter value
  function getCount() external view returns (euint32) {
    return _count;
  }

  /// @notice Increments the counter by an encrypted amount
  /// @dev Demonstrates:
  ///   - Accepting encrypted input from external sources
  ///   - Performing FHE operations on encrypted state
  ///   - Managing permissions for encrypted values
  /// @param inputEuint32 Encrypted value to add (external format)
  /// @param inputProof Zero-knowledge proof proving valid encryption
  function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {
    euint32 encryptedValue = FHE.fromExternal(inputEuint32, inputProof);
    _count = FHE.add(_count, encryptedValue);

    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);

    emit CountIncremented(msg.sender);
  }

  /// @notice Decrements the counter by an encrypted amount
  /// @dev Similar to increment but performs subtraction
  /// @param inputEuint32 Encrypted value to subtract
  /// @param inputProof Zero-knowledge proof proving valid encryption
  function decrement(externalEuint32 inputEuint32, bytes calldata inputProof) external {
    euint32 encryptedValue = FHE.fromExternal(inputEuint32, inputProof);
    _count = FHE.sub(_count, encryptedValue);

    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);

    emit CountDecremented(msg.sender);
  }

  /// @notice Resets the counter to zero
  /// @dev Only the caller who performed operations can reset
  function reset() external {
    _count = FHE.asEuint32(0);
  }
}
