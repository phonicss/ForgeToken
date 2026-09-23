import { network } from "hardhat";

export async function deployForgeTokenFixture() {
    const { ethers } = await network.create();

    const [owner, user1, user2] =
        await ethers.getSigners();

    const forgeToken =
        await ethers.deployContract(
            "ForgeToken",
            [
                "Forge Token",
                "FORGE",
                1_000_000,
                2_000_000
            ]
        );

    return {
        ethers,
        forgeToken,
        owner,
        user1,
        user2
    };
}