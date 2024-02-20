import { readFileSync } from "fs";
const snarkjs = require("snarkjs");

async function verifyProof() {
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

  const vKey = JSON.parse(
    readFileSync("./artifacts/circom/zkMint.vkey.json").toString()
  );

  const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);

  if (res === true) {
    console.log("Verification ✅");
  } else {
    console.log("Invalid Proof ❌");
  }
}

async function main() {
  await verifyProof();
}

main().then(() => {
  process.exit(0);
});

// >>>> Public Signals :  [
//   '6887397156140876712790287181254968303598107210034020813355386591537240192955', // output :  nullifier
//   '13685342771307086727788352245295811587294570533216871320031667359854616932584', // input : hash
//   '264824749929303887678233742936933952991032708407' // input : address
// ]
