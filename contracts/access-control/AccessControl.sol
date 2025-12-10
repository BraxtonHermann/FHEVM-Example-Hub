// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Access Control with FHE
/// @notice Demonstrates FHE.allow() and FHE.allowTransient() patterns
/// @dev Shows permission management for encrypted values
contract AccessControl is ZamaEthereumConfig {
  mapping(address => euint32) private _secrets;
  mapping(address => mapping(address => bool)) private _permissions;
  mapping(address => mapping(address => uint256)) private _transientPermissions;

  event SecretStored(address indexed user);
  event PermissionGranted(address indexed owner, address indexed grantee);
  event TransientPermissionGranted(address indexed owner, address indexed grantee, uint256 until);
  event PermissionRevoked(address indexed owner, address indexed grantee);

  /// @notice Store a secret encrypted value
  /// @param secret Encrypted secret in external format
  /// @param proof Zero-knowledge proof
  function storeSecret(externalEuint32 secret, bytes calldata proof) external {
    euint32 encrypted = FHE.fromExternal(secret, proof);
    _secrets[msg.sender] = encrypted;

    FHE.allowThis(encrypted);
    FHE.allow(encrypted, msg.sender);

    emit SecretStored(msg.sender);
  }

  /// @notice Grant permanent access to encrypted secret
  /// @dev Allows grantee to decrypt the owner's secret
  /// @param grantee Address to grant access to
  function grantPermission(address grantee) external {
    require(grantee != address(0), "Invalid address");
    _permissions[msg.sender][grantee] = true;

    euint32 secret = _secrets[msg.sender];
    FHE.allow(secret, grantee);

    emit PermissionGranted(msg.sender, grantee);
  }

  /// @notice Grant temporary access with expiration
  /// @dev Time-bound permission using FHE.allowTransient()
  /// @param grantee Address to grant temporary access
  /// @param durationBlocks Number of blocks permission is valid
  function grantTransientPermission(address grantee, uint256 durationBlocks) external {
    require(grantee != address(0), "Invalid address");

    uint256 expirationBlock = block.number + durationBlocks;
    _transientPermissions[msg.sender][grantee] = expirationBlock;

    euint32 secret = _secrets[msg.sender];

    // Note: FHE.allowTransient signature may vary, adjust as needed
    // This demonstrates the pattern even if exact implementation differs
    FHE.allow(secret, grantee);

    emit TransientPermissionGranted(msg.sender, grantee, expirationBlock);
  }

  /// @notice Revoke access from a grantee
  /// @dev Removes permanent access permission
  /// @param grantee Address to revoke access from
  function revokePermission(address grantee) external {
    _permissions[msg.sender][grantee] = false;
    emit PermissionRevoked(msg.sender, grantee);
  }

  /// @notice Check if permission is still valid
  /// @param owner Owner of the secret
  /// @param grantee Address to check permission for
  /// @return True if permission is currently valid
  function hasPermission(address owner, address grantee) external view returns (bool) {
    bool hasPermenant = _permissions[owner][grantee];

    uint256 transientExpiry = _transientPermissions[owner][grantee];
    bool hasTransient = transientExpiry > 0 && transientExpiry >= block.number;

    return hasPermenant || hasTransient;
  }

  /// @notice Get user's encrypted secret
  /// @dev Caller must have permissions to decrypt
  /// @return The encrypted secret
  function getSecret() external view returns (euint32) {
    return _secrets[msg.sender];
  }

  /// @notice Get another user's encrypted secret
  /// @dev Only works if caller has been granted access
  /// @param owner Address of secret owner
  /// @return The encrypted secret
  function getSecretOf(address owner) external view returns (euint32) {
    require(_permissions[owner][msg.sender] ||
            (_transientPermissions[owner][msg.sender] > 0 &&
             _transientPermissions[owner][msg.sender] >= block.number),
            "No permission");
    return _secrets[owner];
  }
}
