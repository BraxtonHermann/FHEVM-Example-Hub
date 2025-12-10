// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ERC7984 Basic Token
/// @notice Confidential token with encrypted balances
/// @dev Demonstrates encrypted token transfers and balance management
contract ERC7984Basic is ZamaEthereumConfig {
  string public name = "Encrypted Token";
  string public symbol = "ENC";
  uint8 public decimals = 18;

  euint64 private _totalSupply;
  mapping(address => euint64) private _balances;
  mapping(address => mapping(address => uint256)) private _allowances;

  event Transfer(address indexed from, address indexed to);
  event Approval(address indexed owner, address indexed spender, uint256 value);
  event Mint(address indexed to);

  constructor(uint256 initialSupply) {
    _totalSupply = FHE.asEuint64(initialSupply);
    _balances[msg.sender] = _totalSupply;

    FHE.allowThis(_totalSupply);
    FHE.allow(_totalSupply, msg.sender);
  }

  /// @notice Get encrypted total supply
  /// @dev Returns encrypted total supply of tokens
  /// @return Encrypted total supply
  function totalSupply() external view returns (euint64) {
    return _totalSupply;
  }

  /// @notice Get encrypted balance of account
  /// @dev Returns encrypted balance for an address
  /// @param account Address to query
  /// @return Encrypted balance
  function balanceOf(address account) external view returns (euint64) {
    return _balances[account];
  }

  /// @notice Transfer encrypted amount to recipient
  /// @dev Transfers encrypted tokens from caller to recipient
  /// @param to Recipient address
  /// @param encryptedAmount Encrypted amount in external format
  /// @param proof Zero-knowledge proof
  function transfer(
    address to,
    externalEuint64 encryptedAmount,
    bytes calldata proof
  ) external {
    require(to != address(0), "Invalid recipient");

    euint64 amount = FHE.fromExternal(encryptedAmount, proof);

    // Encrypted subtraction from sender balance
    _balances[msg.sender] = FHE.sub(_balances[msg.sender], amount);

    // Encrypted addition to recipient balance
    _balances[to] = FHE.add(_balances[to], amount);

    FHE.allowThis(_balances[msg.sender]);
    FHE.allow(_balances[msg.sender], msg.sender);

    FHE.allowThis(_balances[to]);
    FHE.allow(_balances[to], to);

    emit Transfer(msg.sender, to);
  }

  /// @notice Approve encrypted amount for spender
  /// @dev Sets allowance for encrypted amount
  /// @param spender Spender address
  /// @param amount Encrypted amount in external format
  /// @param proof Zero-knowledge proof
  function approve(
    address spender,
    externalEuint64 amount,
    bytes calldata proof
  ) external {
    require(spender != address(0), "Invalid spender");

    euint64 encryptedAmount = FHE.fromExternal(amount, proof);
    // Note: Standard ERC7984 stores plaintext amounts for allowances
    // This is a simplified version for demonstration
    _allowances[msg.sender][spender] = type(uint256).max;

    emit Approval(msg.sender, spender, type(uint256).max);
  }

  /// @notice Mint new encrypted tokens
  /// @dev Creates new encrypted tokens
  /// @param to Recipient of minted tokens
  /// @param encryptedAmount Encrypted amount to mint
  /// @param proof Zero-knowledge proof
  function mint(address to, externalEuint64 encryptedAmount, bytes calldata proof) external {
    euint64 amount = FHE.fromExternal(encryptedAmount, proof);

    _totalSupply = FHE.add(_totalSupply, amount);
    _balances[to] = FHE.add(_balances[to], amount);

    FHE.allowThis(_totalSupply);
    FHE.allowThis(_balances[to]);
    FHE.allow(_balances[to], to);

    emit Mint(to);
  }

  /// @notice Burn tokens from caller's balance
  /// @dev Removes encrypted tokens from circulation
  /// @param encryptedAmount Encrypted amount to burn
  /// @param proof Zero-knowledge proof
  function burn(externalEuint64 encryptedAmount, bytes calldata proof) external {
    euint64 amount = FHE.fromExternal(encryptedAmount, proof);

    _balances[msg.sender] = FHE.sub(_balances[msg.sender], amount);
    _totalSupply = FHE.sub(_totalSupply, amount);

    FHE.allowThis(_balances[msg.sender]);
    FHE.allow(_balances[msg.sender], msg.sender);
  }
}
