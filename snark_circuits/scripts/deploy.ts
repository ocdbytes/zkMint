import { ethers } from "hardhat";
import { utils } from "ffjavascript";
import { BigNumber, BigNumberish } from "ethers";

const { unstringifyBigInts } = utils;
const fs = require("fs");
const snarkjs = require("snarkjs");

interface ICallData {
  pi_a: BigNumberish[];
  pi_b: BigNumberish[][];
  pi_c: BigNumberish[];
  input: BigNumberish[];
}

const BASE_PATH = "./circuits/zkmint/";

function p256(n: any): BigNumber {
  let nstr = n.toString(16);
  while (nstr.length < 64) nstr = "0" + nstr;
  nstr = `0x${nstr}`;
  return BigNumber.from(nstr);
}

async function generateCallData(): Promise<ICallData> {
  let zkProof = await generateProof();

  const proof = unstringifyBigInts(zkProof.proof);
  const pub = unstringifyBigInts(zkProof.publicSignals);

  // console.log(">>>> pub : ", pub);

  let inputs: BigNumberish[] = [];
  for (let i = 0; i < pub.length; i++) {
    inputs.push(p256(pub[i]));
  }

  let pi_a = [p256(proof.pi_a[0]), p256(proof.pi_a[1])];
  // console.log(pi_a);
  let pi_b = [
    [p256(proof.pi_b[0][1]), p256(proof.pi_b[0][0])],
    [p256(proof.pi_b[1][1]), p256(proof.pi_b[1][0])],
  ];
  // console.log(pi_b);
  let pi_c = [p256(proof.pi_c[0]), p256(proof.pi_c[1])];
  // console.log(pi_c);
  let input = inputs;
  console.log(input);

  return { pi_a, pi_b, pi_c, input };
}

async function generateProof() {
  // read input parameters
  const inputData = fs.readFileSync(BASE_PATH + "input.json", "utf8");
  const input = JSON.parse(inputData);

  // calculate witness
  const out = await snarkjs.wtns.calculate(
    input,
    BASE_PATH + "out/circuit.wasm",
    BASE_PATH + "out/circuit.wtns"
  );

  // calculate proof
  const proof = await snarkjs.groth16.prove(
    BASE_PATH + "out/zkmint.zkey",
    BASE_PATH + "out/circuit.wtns"
  );

  // write proof to file
  fs.writeFileSync(
    BASE_PATH + "out/proof.json",
    JSON.stringify(proof, null, 1)
  );

  return proof;
}

async function main() {
  // deploy contract
  const Verifier = await ethers.getContractFactory(
    "./contracts/ZkmintVerifier.sol:Verifier"
  );
  const verifier = await Verifier.deploy();
  await verifier.deployed();

  console.log(`Verifier deployed to ${verifier.address}`);

  const zkMint = await ethers.getContractFactory(
    "./contracts/zkMint.sol:zkMint"
  );
  const zkmint = await zkMint.deploy(verifier.address);
  await zkmint.deployed();
  // generate proof call data
  const { pi_a, pi_b, pi_c, input } = await generateCallData();

  // verify proof on contract
  //@ts-ignore
  const tx = await verifier.verifyProof(pi_a, pi_b, pi_c, input);

  console.log(`Verifier result: ${tx}`);
  console.assert(tx == true, "Proof verification failed!");

  const nullifier =
    "9644105564195611480549718047467681678545755263698788280615376901065755873393";

  console.log(nullifier);

  const tx1 = await zkmint.mintWithProof(nullifier, pi_a, pi_b, pi_c);
  console.log("Mint Result : ", tx1.hash);
  console.assert(tx1.hash != null, "Mint failed");

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
