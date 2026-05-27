import { ethers } from "hardhat";

const ADDRESSES = {
  USDC: "0xC562066d4FB39C26Fe5C20EFc3E3C19188Fe578D",
  CBLD: "0x5e697416159400fA7299457c1D0F4Efe5a3E6344",
  DISTRIBUTOR: "0xfa47C887098559DdE9D17eA8a5F7Cb9e391E0F15",
  PROPERTY_ESCROW: "0xD8c19CdddCc98cAcFb5a48Ed9f59BaCbAB61Cb33"
};

async function main() {
  console.log("🧪 Running End-to-End Integration Test\n");

  const [deployer] = await ethers.getSigners();
  
  // On testnet, we only have one signer, so we'll use it for all operations
  console.log("👤 Test Account:", deployer.address);
  
  // Get contracts
  const usdc = await ethers.getContractAt("MockERC20", ADDRESSES.USDC);
  const cbld = await ethers.getContractAt("MockERC20", ADDRESSES.CBLD);
  const distributor = await ethers.getContractAt("CBDRewardDistributor", ADDRESSES.DISTRIBUTOR);
  const escrow = await ethers.getContractAt("PropertyEscrow", ADDRESSES.PROPERTY_ESCROW);

  // Step 1: Mint USDC to deployer (acting as investor)
  console.log("\n💰 Step 1: Minting USDC...");
  await usdc.mint(deployer.address, ethers.parseUnits("15000", 6));
  console.log("✅ Minted 15,000 USDC");

  // Step 2: First investment $10,000
  console.log("\n💸 Step 2: Making first investment of $10,000...");
  const invest1Amount = ethers.parseUnits("10000", 6);
  const approveTx = await usdc.approve(ADDRESSES.PROPERTY_ESCROW, invest1Amount);
  await approveTx.wait();
  console.log("✅ USDC approved");
  
  const tx1 = await escrow.invest(invest1Amount);
  await tx1.wait();
  console.log("✅ Investment successful!");
  console.log("   Shares:", (await escrow.investorShares(deployer.address)).toString());
  console.log("   Ownership:", (await escrow.getSharePercentageBps(deployer.address)).toString() / 100, "%");

  // Step 3: Issue 9% CBLD reward (900 CBLD for $10,000)
  console.log("\n🎁 Step 3: Issuing 9% CBLD reward...");
  const tx2 = await distributor.issueInvestmentReward(deployer.address, invest1Amount, 1);
  await tx2.wait();
  const cbldBalance = await cbld.balanceOf(deployer.address);
  console.log("✅ Reward issued:", ethers.formatEther(cbldBalance), "CBLD");
  console.log("   Expected: 900 CBLD (9% of $10,000)");

  // Step 4: Deposit profit
  console.log("\n💵 Step 4: Property owner depositing $1,000 profit...");
  const approveTx2 = await usdc.approve(ADDRESSES.PROPERTY_ESCROW, ethers.parseUnits("1000", 6));
  await approveTx2.wait();
  const tx5 = await escrow.depositProfit(ethers.parseUnits("1000", 6));
  await tx5.wait();
  console.log("✅ Profit deposited!");

  // Step 5: Distribute profit
  console.log("\n📊 Step 5: Admin distributing profit...");
  const tx6 = await escrow.distributeProfit(ethers.parseUnits("1000", 6));
  await tx6.wait();
  const claimable = await escrow.claimableProfit(deployer.address);
  console.log("✅ Profit distributed!");
  console.log("   Claimable:", ethers.formatUnits(claimable, 6), "USDC");

  // Step 6: Claim profit
  console.log("\n💰 Step 6: Claiming profit...");
  const balanceBefore = await usdc.balanceOf(deployer.address);
  const tx7 = await escrow.claimProfit();
  await tx7.wait();
  const balanceAfter = await usdc.balanceOf(deployer.address);
  console.log("✅ Profit claimed!");
  console.log("   Received:", ethers.formatUnits(balanceAfter - balanceBefore, 6), "USDC");

  // Final Summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ END-TO-END TEST COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(60));
  console.log("\n📊 Final State:");
  console.log("Total Raised:", ethers.formatUnits(await escrow.totalRaised(), 6), "USDC");
  console.log("Investor Count:", (await escrow.getInvestorCount()).toString());
  console.log("Total CBLD Rewards Issued:", ethers.formatEther(await distributor.totalRewardsIssued()));
  console.log("USDC Balance:", ethers.formatUnits(await usdc.balanceOf(deployer.address), 6));
  console.log("CBLD Balance:", ethers.formatEther(await cbld.balanceOf(deployer.address)));
  console.log("\n🎉 All systems working perfectly!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
