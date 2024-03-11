// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAssetLocker {
  event GuardianshipTransferred(address indexed previousGuardian, address indexed newGuardian);
  event UpdateUnlockTime(uint256 unlockTime);

  function guardian() external view returns (address);
  function unlockTime() external view returns (uint256);

  /**
   * @dev Transfers guardianship of the contract to a new account (`newGuardian`).
   * Can only be called by the current guardian.
   */
  function transferGuardianship(address newGuardian) external;

  /**
   * @dev Unlock.
   * Can only be called by the current guardian.
   */
  function unlock() external;

  /**
   * @dev Shorten unlock time.
   * Can only be called by the current guardian.
   *
   * @param shortenedTime is seconds and must be greater than `0`.
   */
  function shortenUnlockTime(uint256 shortenedTime) external;
}
