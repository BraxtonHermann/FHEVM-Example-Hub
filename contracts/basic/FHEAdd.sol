// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHE Addition
/// @notice Demonstrates encrypted addition operations
/// @dev Shows how to perform FHE arithmetic on encrypted values
contract FHEAdd is ZamaEthereumConfig {
  euint32 private _sum;
  mapping(address => euint32) private _userSums;

  event AdditionPerformed(address indexed user, address indexed beneficiary);

  /// @notice Performs encrypted addition
  /// @dev Adds two encrypted values together
  /// @param value1 First encrypted value (external format)
  /// @param proof1 Proof for first value
  /// @param value2 Second encrypted value (external format)
  /// @param proof2 Proof for second value
  function add(
    externalEuint32 value1,
    bytes calldata proof1,
    externalEuint32 value2,
    bytes calldata proof2
  ) external {
    euint32 encrypted1 = FHE.fromExternal(value1, proof1);
    euint32 encrypted2 = FHE.fromExternal(value2, proof2);

    euint32 result = FHE.add(encrypted1, encrypted2);

    _sum = result;
    _userSums[msg.sender] = result;

    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    emit AdditionPerformed(msg.sender, msg.sender);
  }

  /// @notice Performs addition with stored value
  /// @dev Adds encrypted input to the stored sum
  /// @param value Encrypted value to add to sum
  /// @param proof Proof for the value
  function addToSum(externalEuint32 value, bytes calldata proof) external {
    euint32 encrypted = FHE.fromExternal(value, proof);
    _sum = FHE.add(_sum, encrypted);

    FHE.allowThis(_sum);
    FHE.allow(_sum, msg.sender);

    emit AdditionPerformed(msg.sender, msg.sender);
  }

  /// @notice Get the current sum
  /// @return Encrypted sum value
  function getSum() external view returns (euint32) {
    return _sum;
  }

  /// @notice Get user's last sum
  /// @param user Address to query
  /// @return User's encrypted sum
  function getUserSum(address user) external view returns (euint32) {
    return _userSums[user];
  }
}
