// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IGov {
  event SetGovToken(address govToken);

  function govToken() external view returns (address);

  function setGovToken(address newGovToken) external;

  function govTokenDecimals() external view returns (uint8);
}
