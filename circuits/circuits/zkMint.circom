pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

template zkMint() {
  // public inputs
  signal input hash;
  signal input address;

  // private inputs
  signal input preimage;

  signal output nullifier;

  component hasher = Poseidon(1);
  hasher.inputs[0] <== preimage;
  hasher.out === hash;

  component nullifierHasher = Poseidon(2);
  nullifierHasher.inputs[0] <== address;
  nullifierHasher.inputs[1] <== preimage;

  nullifier <== nullifierHasher.out;
}

component main {public [hash, address]} = zkMint();