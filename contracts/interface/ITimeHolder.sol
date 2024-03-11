// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITimeHolder {

  /**
   * @dev Transfer the guardianship of the locker to a new guardian.
   * Can only be called by the current owner.
   */
  function transferGuardianship(address payable locker, address newGuardian) external;

  /**
   * @dev Unlock locker.
   */
  function unlock(address payable locker) external;

  /**
   * @dev Get the amount needed to unlock.
   *
   * amount = 10 ** govTokenDecimals() * seconds (1 seconds = 1TIME)
   */
  function getUnlockAmount(address payable locker) external view returns (uint256);

  /**
   * @dev Shorten unlock time of locker.
   *
   * @param shortenedTime is seconds and must be greater than `0`.
   */
  function shortenUnlockTime(address payable locker, uint256 shortenedTime) external;

  /**
   * @dev Get the amount needed to shorten unlock time.
   *
   * @param shortenedTime is seconds and must be greater than `0`.
   *
   * amount = 10 ** govTokenDecimals() * seconds (1 seconds = 1TIME)
   */
  function getShortenUnlockTimeAmount(address payable locker, uint256 shortenedTime) external view returns (uint256);
}
