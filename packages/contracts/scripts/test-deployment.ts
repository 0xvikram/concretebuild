import { ethers } from "hardhat";

const ADDRESSES = {
  USDC: "0xC562066d4FB39C26Fe5C20EFc3E3C19188Fe578D",
  CBLD: "0x5e697416159400fA7299457c1D0F4Efe5a3E6344",
  DISTRIBUTOR: "0xfa47C887098559DdE9D17eA8a5F7Cb9e391E0F15",
  PROPERTY_ESCROW: "0xD8c19CdddCc98cAcFb5a48Ed9f59BaCbAB61Cb33"
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // Get contracts
  const usdc = await ethers.getContractAt("MockERC20", ADDRESSES.USDC);
  const cbld = await ethers.getContractAt("MockERC20", ADDRESSES.CBLD);
  const distributor = await ethers.getContractAt("CBDRewardDistributor", ADDRESSES.DISTRIBUTOR);
  const escrow = await ethers.getContractAt("PropertyEscrow", ADDRESSES.PROPERTY_ESCROW);

  console.log("\n📊 Contract Status:");
  console.log("USDC Balance:", ethers.formatUnits(await usdc.balanceOf(deployer.address), 6));
  console.log("CBLD Balance:", ethers.formatEther(await cbld.balanceOf(deployer.address)));
  console.log("Distributor CBLD:", ethers.formatEther(await cbld.balanceOf(ADDRESSES.DISTRIBUTOR)));
  
  console.log("\n🏠 Property Escrow:");
  console.log("Active:", await escrow.propertyActive());
  console.log("Investment Open:", await escrow.investmentOpen());
  console.log("Total Valuation:", ethers.formatUnits(await escrow.totalValuation(), 6), "USDC");
  console.log("Total Raised:", ethers.formatUnits(await escrow.totalRaised(), 6), "USDC");

  // Activate property if not active
  if (!(await escrow.propertyActive())) {
    console.log("\n🔓 Activating property...");
    const tx = await escrow.activateProperty();
    await tx.wait();
    console.log("✅ Property activated!");
  }

  console.log("\n✅ All contracts working correctly!");
  console.log("\n🔗 View on Sepolia Etherscan:");
  console.log("USDC:", `https://sepolia.etherscan.io/address/${ADDRESSES.USDC}`);
  console.log("CBLD:", `https://sepolia.etherscan.io/address/${ADDRESSES.CBLD}`);
  console.log("Distributor:", `https://sepolia.etherscan.io/address/${ADDRESSES.DISTRIBUTOR}`);
  console.log("Property:", `https://sepolia.etherscan.io/address/${ADDRESSES.PROPERTY_ESCROW}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
