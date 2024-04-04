// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {NFTHolder} from "@timeholder/asset-box/contracts/base/NFTHolder.sol";
import {Receivable} from "@timeholder/asset-box/contracts/base/Receivable.sol";
import {Withdrawable} from "@timeholder/asset-box/contracts/base/Withdrawable.sol";
import {IGov} from "../interface/IGov.sol";

abstract contract Gov is IGov, NFTHolder, Receivable, Withdrawable, Initializable, UUPSUpgradeable, OwnableUpgradeable {
  function name()
  external pure virtual
  returns (string memory);

  function version()
  external pure virtual
  returns (string memory);

  error Underpayment(uint256 paid, uint256 needed);

  address private _govToken;

  function initialize(address initialGovToken)
  public virtual initializer {
    __Ownable_init(msg.sender);
    __UUPSUpgradeable_init();
    _setGovToken(initialGovToken);
  }

  function _authorizeUpgrade(address newImplementation)
  internal view override(UUPSUpgradeable) onlyOwner {}

  function _authorizeWithdraw(address sender)
  internal view override(Withdrawable) onlyOwner {}

  function setGovToken(address newGovToken)
  external virtual
  onlyOwner {
    _setGovToken(newGovToken);
  }

  function _setGovToken(address newGovToken)
  private {
    _govToken = newGovToken;
    emit SetGovToken(newGovToken);
  }

  function govToken()
  public view virtual
  returns (address) {
    return _govToken;
  }

  function govTokenDecimals()
  public view virtual
  returns (uint8) {
    if (_govToken == address(0)) return 18;
    return ERC20(_govToken).decimals();
  }

  function _receive(address token, uint256 amount)
  internal virtual {
    if (token == address(0)) {
      if (msg.value < amount) revert Underpayment(msg.value, amount);
    } else {
      uint256 value = ERC20(token).allowance(msg.sender, address(this));
      if (value < amount) revert Underpayment(value, amount);
      ERC20(token).transferFrom(msg.sender, address(this), amount);
    }
  }
}
