// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {TimeSeller} from "../TimeSeller.sol";

contract TimeSellerV2 is TimeSeller {
  function version ()
  external pure virtual override
  returns (string memory) {
    return "2.0.0";
  }
}
