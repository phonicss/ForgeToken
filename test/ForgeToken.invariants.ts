import { expect } from "chai";
import { deployForgeTokenFixture } from "./helpers/deployForgeToken.js";

describe("ForgeToken - Invariants", function () {
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

    describe("Invariant test", function () {
        it("Should pass invariant tests", async function () {
            await forgeToken.transfer(user1.address, 100n);
            await forgeToken.transfer(user2.address, 200n);
            await forgeToken.connect(owner).mint(user1.address, 50n);
            await forgeToken.connect(user1).burn(25n)
            await forgeToken.approve(user2.address, 100n);
            await forgeToken.connect(user2).transferFrom(owner.address, user1.address, 40n);
            await forgeToken.connect(user1).approve(user2.address, 30n);
            await forgeToken.connect(user2).burnFrom(user1.address, 10n);

            const ownerBalance = await forgeToken.balanceOf(owner.address);
            const user1Balance = await forgeToken.balanceOf(user1.address);
            const user2Balance = await forgeToken.balanceOf(user2.address);
            const totalSupply = await forgeToken.totalSupply();
            
            expect(ownerBalance + user1Balance + user2Balance)
            .to.equal(totalSupply);

            expect(totalSupply)
            .to.be.lte(await forgeToken.maxSupply());

            const initialSupply = ethers.parseUnits("1000000", 18);
            expect(totalSupply)
            .to.equal(initialSupply + 15n);

            expect(ownerBalance)
            .to.equal(ethers.parseUnits("1000000", 18) - 340n);

            expect(user1Balance)
            .to.equal(155n);

            expect(user2Balance)
            .to.equal(200n);
        })
    })
});