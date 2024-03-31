import { viem } from 'hardhat'
import { deployContract } from '@timeholder/asset-box/dist/test/utils'
import { deployContracts as baseDeployContracts } from '@timeholder/asset-box/dist/test/common'
import type {
  TestTypes as BaseTestTypes,
  TestContracts as BaseTestContracts,
} from '@timeholder/asset-box/dist/test/common'
import type {
  GetContractReturnType,
  WalletClient,
} from '@nomicfoundation/hardhat-viem/types'
import type { ArtifactsMap } from 'hardhat/types'
import {
  abi as TIMEAbi,
  bytecode as TIMEBytecode,
} from '../../artifacts/contracts/TIME.sol/TIME.json'

export interface TestTypes extends BaseTestTypes {
  TIME: GetContractReturnType<ArtifactsMap['TIME']['abi']>
  AssetLocker: GetContractReturnType<ArtifactsMap['AssetLocker']['abi']>
  Gov: GetContractReturnType<ArtifactsMap['Gov']['abi']>
  TimeHolder: GetContractReturnType<ArtifactsMap['TimeHolder']['abi']>
}

export interface TestContracts extends BaseTestContracts {
  TIME: TestTypes['TIME']
}

export async function deployContracts(): Promise<TestContracts> {
  const [owner] = (await viem.getWalletClients()) as WalletClient[]
  const TIME = (await deployContract(
    owner,
    TIMEAbi,
    TIMEBytecode,
  )) as unknown as TestTypes['TIME']
  const testContracts = await baseDeployContracts()

  return {
    TIME,
    ...testContracts,
  }
}
