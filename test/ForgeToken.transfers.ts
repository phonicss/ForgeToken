import { expect } from "chai";
import { deployForgeTokenFixture } from "./helpers/deployForgeToken.js";

describe("ForgeToken - Transfers", function () {
    let ethers: any;
    let forgeToken: any;
    let owner: any;
    let user1: any;
    let user2: any;

    beforeEach(async function () {
        ({
            ethers,
            forgeToken,
            owner,
            user1,
            user2
        } = await deployForgeTokenFixture());
    });

    describe("Transfers", function () {

        it("Should trasnfer betwen users correctly", async function () {
            const ownerBalanceBefore = await forgeToken.balanceOf(owner.address);
            const user1BalanceBefore = await forgeToken.balanceOf(user1.address);
            await forgeToken.transfer(user1.address, 10n);
            expect (await forgeToken.balanceOf(user1.address))
            .to.equal( user1BalanceBefore + 10n);
            expect (await forgeToken.balanceOf(owner.address))
            .to.equal(ownerBalanceBefore - 10n);
        })

        it("Should emit Transfer event", async function () {
            await expect(forgeToken.transfer(user1.address, 10n))
            .to.emit(forgeToken, "Transfer")
            .withArgs(owner.address, user1.address, 10n);
        })

        it("Should emit insufficientBalance when requested amount exceed available balance", async function () {
            await expect(forgeToken.connect(user1)
            .transfer(owner.address, 10n))
            .to.be.revertedWithCustomError(forgeToken, "InsufficientBalance")
            .withArgs(10n, 0n);
        })

        it("Should emit ZeroAddress when transfer to address 0", async function () {
            await expect(forgeToken.transfer(ethers.ZeroAddress, 10n))
            .to.be.revertedWithCustomError(forgeToken, "ZeroAddress");
        })

        it("Should allowe transfer of 0 amount and emit Transfer", async function () {
            await expect(forgeToken.transfer(user1.address, 0n))
            .to.emit(forgeToken, "Transfer")
            .withArgs(owner.address, user1.address, 0n);
        })
    })
});