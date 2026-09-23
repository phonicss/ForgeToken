import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ForgeTokenModule = buildModule("ForgeTokenModule", (m) => {
    const tokenName = m.getParameter("tokenName", "Forge Token");
    const tokenSymbol = m.getParameter("tokenSymbol", "FORGE");

    const initialSupply = m.getParameter(
        "initialSupply",
        1_000_000n
    );

    const maxSupply = m.getParameter(
        "maxSupply",
        2_000_000n
    );

    const forgeToken = m.contract(
        "ForgeToken",
        [
            tokenName,
            tokenSymbol,
            initialSupply,
            maxSupply
        ]
    );

    return { forgeToken };
});

export default ForgeTokenModule;