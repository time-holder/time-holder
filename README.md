<div style="width: 100%;">
  <img src="animated.svg" style="width: 100%;" alt="animated">
</div>

# ⏳ TIME Holder

[![npm version](https://img.shields.io/npm/v/@timeholder/time-holder/latest.svg)](https://www.npmjs.com/package/@timeholder/time-holder)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://github.com/time-holder/time-holder/actions/workflows/tests.yml/badge.svg)](https://github.com/time-holder/time-holder/actions/workflows/tests.yml)

🤚💎✋ TIME Holder is a DApp running on [EVM](https://ethereum.org/zh/developers/docs/evm), designed to create a powerful and secure **Contract Wallet** for users, which not only helps in reducing the risk of asset theft but also aids in overcoming human weaknesses, thereby enabling users to become **Diamond Hands** in the cryptocurrency world.

## 👋 Introduction

📦 Firstly, **TIME Holder** provides users with an exclusive **Contract Wallet** ([**AssetBox**](https://github.com/time-holder/asset-box)), that isolates cryptographic assets from the users' wallets. This isolation prevents asset loss that might occur from negligence, such as leaking of wallet private keys or granting incorrect authorizations.

🔒 Secondly, **TIME Holder** also provides a **Contract Wallet** with **Asset Locking Feature** ([**AssetLocker**](https://github.com/time-holder/asset-locker)), allowing users to lock their assets in their own exclusive contract and set a deadline. Before the deadline is reached, users will not be able to withdraw their assets. This effectively helps users overcome human weaknesses and steadfastly hold valuable assets, becoming true **Diamond Hands.**

⏳ Finally, **TIME Holder** is a guardian of **AssetLocker**, as well as a manager of time. It can both help users firmly hold onto valuable assets and assist in unlocking their assets when necessary.

## 🛠️ Technology Stack

Our project leverages a range of technologies to ensure robust smart contract development, testing, and deployment. Below is a detailed list of the technology stack we use:

- [**Solidity**](https://soliditylang.org/): The primary programming language for writing our smart contracts. Solidity is a statically-typed programming language designed for developing smart contracts that run on the Ethereum Virtual Machine (EVM).

- [**OpenZeppelin**](https://openzeppelin.com/contracts/): A library for secure smart contract development. OpenZeppelin Contracts is a library of modular, reusable, secure smart contracts, written in Solidity. It's an open-source framework for the Ethereum community.

- [**Hardhat**](https://hardhat.org/): A development environment to compile, deploy, test, and debug Ethereum software. Hardhat is designed to help developers manage and automate the recurring tasks inherent to the process of building smart contracts and dApps.

- [**Viem**](https://viem.sh/): A TypeScript Interface for Ethereum that provides low-level stateless primitives for interacting with Ethereum. An alternative to `ethers.js` and `web3.js` with a focus on reliability, efficiency, and excellent developer experience.

- [**Chai**](https://www.chaijs.com/): An assertion library for node and the browser that can be delightfully paired with any javascript testing framework. Chai is often used as the testing framework for writing tests for Ethereum smart contracts.

This technology stack provides us with the tools necessary to ensure our smart contracts are secure, reliable, and efficient. We encourage contributors to familiarize themselves with these technologies to better understand our development and testing processes.

## 🔍 Running Tests

To ensure the reliability and security of our smart contracts, we have implemented comprehensive test suites using the Chai testing framework. Follow the steps below to run the tests and verify the contracts' functionalities.

Before running the tests, make sure you have the following installed:
- Node.js (recommend using the latest stable version)
- npm (Node.js package manager)

```shell
npm install
npm run test
```

After running the tests, you'll see output in the terminal indicating whether each test has passed or failed.

## Licensing

See [LICENSE](LICENSE).

