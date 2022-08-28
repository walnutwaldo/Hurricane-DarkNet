# Hurricane DarkNet 🌀

Experiment with the live deployment at [hurricane.lol](hurricane.lol) and supports both Goerli and Ethereum Mainnet.

Hurricane is a zero-knowledge-based (zkSNARK-based) darknet for on-chain assets.
The protocol allows for depositing and withdrawing of assets, as well as making
hidden in-network transfers that **hide the sender, receiver, and asset** ‼️

⚠️ Our contracts and circuits have not been formally audited and provided on an as-is basis. The frontend also does not yet fully protect users
from accidentally losing their keys. Please be careful if using Hurricane on real assets of value.

Made at 🏠 Hacklodge 2022 by Walden Yan, Allison Qi, and Brandon Wang.

## Cryptography

Deposits and withdrawals are implemented similarly to Tornado cash using zero-knowledge merkle membership proofs and nullifers. Vitalik wrote a blog [detailing this protocol](https://vitalik.ca/general/2022/06/15/using_snarks.html#:~:text=Caulk%2Dlike%20schemes.-,ZK%2DSNARKs%20for%20coins,-Projects%20like%20Zcash). To extend the implementation to non-fungible assets, we added in symmetric key encryption of the asset (token address and ID) and mixed this into the zkSNARK construction in a way that is safe from rainbow attacks.

Our zk circuits can be found in `zk/circuits/*.circom`

Out smart contracts can be found under `zk/contracts`

## Setup

Setup instructions exist within their individual directories.
