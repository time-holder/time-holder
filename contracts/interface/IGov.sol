// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IGov {
  event SetGovToken(address govToken);

  /**
   * @dev Set the contract address for the governance token.
   */
  function setGovToken(address newGovToken) external;

  /**
   * @dev Returns the contract address for the governance token.
   */
  function govToken() external view returns (address);

  /**
   * @dev Returns the number of decimals for the governance token.
   */
  function govTokenDecimals() external view returns (uint8);
}
