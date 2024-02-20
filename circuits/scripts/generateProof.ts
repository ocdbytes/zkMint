const snarkjs = require("snarkjs");

async function genProof() {
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    {
      hash: "13685342771307086727788352245295811587294570533216871320031667359854616932584",
      address: "0x2E632709bFe2C9af4159D4373080284B0dcb0d37",
      preimage: "1212121212121212",
    },
    "./artifacts/circom/zkMint.wasm",
    "./artifacts/circom/zkMint.zkey"
  );

  console.log(">>>> Proof : ", proof);
  console.log(">>>> Public Signals : ", publicSignals);
}

async function main() {
  await genProof();
}

main().then(() => {
  process.exit(0);
});

// To generate verifier.sol :
// yarn snarkjs zkey export solidityverifier ./artifacts/circom/zkMint.zkey verifier.sol
