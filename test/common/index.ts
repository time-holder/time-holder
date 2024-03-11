import type { TestTypes as BaseTestTypes } from '@timeholder/asset-box/dist/test/common'
import type { GetContractReturnType } from '@nomicfoundation/hardhat-viem/types'
import type { ArtifactsMap } from 'hardhat/types'

export interface TestTypes extends BaseTestTypes {
  TIME: GetContractReturnType<ArtifactsMap['TIME']['abi']>
  AssetLocker: GetContractReturnType<ArtifactsMap['AssetLocker']['abi']>
  Gov: GetContractReturnType<ArtifactsMap['Gov']['abi']>
  TimeHolder: GetContractReturnType<ArtifactsMap['TimeHolder']['abi']>
  TimeSeller: GetContractReturnType<ArtifactsMap['TimeSeller']['abi']>
}
