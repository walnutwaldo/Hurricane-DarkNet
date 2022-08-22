import {ethers} from "hardhat";
import {BigNumber} from "ethers";

const TEST_PROOF = {
    "pi_a": [
        "4444752623034168106521087797019762262225053154197726898929257357916619527864",
        "8536028288224113611296974519787362320160545068260048311890970152110938343348",
        "1"
    ],
    "pi_b": [
        [
            "8652359686501624386208857545425742839397339673783761128390486417631957449103",
            "8107805583595144987198599750135060892244215495026332488958358358221935368120"
        ],
        [
            "11099324554540667946041780519926529045713796486786519280508428430387983220385",
            "9168674088762820403820792353169284426049953559042562910279913297294976682281"
        ],
        [
            "1",
            "0"
        ]
    ],
    "pi_c": [
        "2312749154869421161811697982445453372776437386222825833595194839438978656031",
        "11177228925449990826725176699711040759054821752617317219968170509120420556177",
        "1"
    ],
    "protocol": "groth16",
    "curve": "bn128"
};

const TEST_INPUT = [
    "7"
];

async function main() {
    const Verifier = await ethers.getContractFactory("Verifier");
    const verifier = await Verifier.deploy();

    const verifierAddress = verifier.address;
    console.log("Verifier Address:", verifierAddress);

    const a: [BigNumber, BigNumber] = [BigNumber.from(TEST_PROOF["pi_a"][0]), BigNumber.from(TEST_PROOF["pi_a"][1])];
    const b: [[BigNumber, BigNumber], [BigNumber, BigNumber]] = [
        [BigNumber.from(TEST_PROOF["pi_b"][0][1]), BigNumber.from(TEST_PROOF["pi_b"][0][0])],
        [BigNumber.from(TEST_PROOF["pi_b"][1][1]), BigNumber.from(TEST_PROOF["pi_b"][1][0])]
    ];
    const c: [BigNumber, BigNumber] = [BigNumber.from(TEST_PROOF["pi_c"][0]), BigNumber.from(TEST_PROOF["pi_c"][1])];

    const input: [BigNumber] = [BigNumber.from(TEST_INPUT[0])];

    const result = await verifier.verifyProof(a, b, c, input);
    console.log("Proof Verification Result:", result);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
