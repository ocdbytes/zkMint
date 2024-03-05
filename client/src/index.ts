import { BigNumberish, Contract, JsonRpcProvider, Wallet } from "ethers";
import ZKMINTABI from "../assets/zkmintabi.json";
//@ts-ignore
import { utils } from "ffjavascript";
const snarkjs = require("snarkjs");

const { unstringifyBigInts } = utils;

console.log(`
=================================================
ZK MINT
=================================================                                                           
`);

if (process.argv.length <= 3) {
  console.error("Expected two arguments : private_key & secret_nft_phase");
  console.log("Usage : yarn zkmint <PRIVATE_KEY> <SECRET_NFT_PHASE>");
  process.exit(1);
}

const _PRIV_KEY = process.argv[2];
const _SECRET_KEY = process.argv[3];
const _CONTRACT_ADDRESS = "0x50C2333F7Ba819de0A69FbAD21C0A5E41388a9d7";
const _HASH =
  "13685342771307086727788352245295811587294570533216871320031667359854616932584";

interface ICallData {
  pi_a: BigNumberish[];
  pi_b: BigNumberish[][];
  pi_c: BigNumberish[];
  input: BigNumberish[];
}

function p256(n: any): BigInt {
  let nstr = n.toString(16);
  while (nstr.length < 64) nstr = "0" + nstr;
  nstr = `0x${nstr}`;
  return BigInt(nstr);
}

const generateProof = async (wallet_address: string) => {
  const input = {
    hash: _HASH,
    address: wallet_address,
    preimage: _SECRET_KEY,
  };

  const out = await snarkjs.wtns.calculate(
    input,
    "./assets/circuit.wasm",
    "./assets/circuit.wtns"
  );

  const proof = await snarkjs.groth16.prove(
    "./assets/zkmint.zkey",
    "./assets/circuit.wtns"
  );

  return proof;
};

const generateCallData = async (wallet_address: string): Promise<ICallData> => {
  const mint_proof = await generateProof(wallet_address);

  const proof = unstringifyBigInts(mint_proof.proof);
  const pub_inputs = unstringifyBigInts(mint_proof.publicSignals);

  let inputs: BigNumberish[] = [];
  for (let i = 0; i < pub_inputs.length; i++) {
    inputs.push(p256(pub_inputs[i]).toString());
  }

  let pi_a = [p256(proof.pi_a[0]).toString(), p256(proof.pi_a[1]).toString()];
  console.log(pi_a);
  let pi_b = [
    [p256(proof.pi_b[0][1]).toString(), p256(proof.pi_b[0][0]).toString()],
    [p256(proof.pi_b[1][1]).toString(), p256(proof.pi_b[1][0]).toString()],
  ];
  console.log(pi_b);
  let pi_c = [p256(proof.pi_c[0]).toString(), p256(proof.pi_c[1]).toString()];
  console.log(pi_c);
  let input = inputs;
  console.log(input);

  return { pi_a, pi_b, pi_c, input };
};

const main = async () => {
  console.log("Provided Private Key : ", _PRIV_KEY);
  console.log("Provided Secret Key : ", _SECRET_KEY);

  const provider = new JsonRpcProvider(
    "https://ethereum-sepolia-rpc.publicnode.com"
  );
  const wallet = new Wallet(_PRIV_KEY, provider);
  const wallet_address = wallet.address;

  const { pi_a, pi_b, pi_c, input } = await generateCallData(wallet_address);

  const contract = new Contract(_CONTRACT_ADDRESS, ZKMINTABI.abi, wallet);

  const nullifier = input[0];

  try {
    const txn = await contract.mintWithProof(nullifier, pi_a, pi_b, pi_c);
    await txn.wait();
    console.log("=================================================");
    console.log("Proof Verified ✅");
    console.log("Mint Successful ✅");
    console.log("Txn Hash :", txn.hash);
    console.log("=================================================");
  } catch (error) {
    console.error("Proof Verification failed or Nullifier already used");
    console.log(error);
    process.exit(0);
  }
};

if (require.main === module) {
  main();
}
