import { ethers } from "hardhat";

async function main() {
  const contractFactory = await ethers.getContractFactory("TypingScores");
  const contract = await contractFactory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("TypingScores deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
