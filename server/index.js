const secp = require("ethereum-cryptography/secp256k1");
const { toHex, hexToBytes } = require("ethereum-cryptography/utils");

const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

app.use(cors());
app.use(express.json());

const balances = {
    "0x888bb1d02b058f7b522b41c832ddfdd39b2252f3": 100,
    "0xcde8d5d82b7cbd3848b17e8cf639f24548fef705": 50,
    "0x4ffaf38bfefe79f7e69b075bfe4505131078d2c6": 75,
};

const handledSignatures = new Set();

app.get("/balance/:address", (req, res) => {
    const { address } = req.params;
    const balance = balances[address] || 0;
    res.send({ balance });
});

app.post("/send", (req, res) => {
    const { sender, recipient, amount, signature, uuid, bit } = req.body;

    if (handledSignatures.has(signature)) {
        console.log("signature was already handled");
        return res.status(400).send({ message: "Invalid signature" });
    }

    handledSignatures.add(signature);

    // rebuild the signature
    const msg = {
        amount,
        uuid,
        recipient,
    };

    const msgHash = Buffer.from(JSON.stringify(msg));
    const recoveredPublicKey = secp.recoverPublicKey(msgHash, signature, bit);

    if (`0x${toHex(recoveredPublicKey.slice(-20))}` !== sender) {
        return res.status(400).send({ message: "Invalid sender" });
    }

    const isSigned = secp.verify(signature, msgHash, recoveredPublicKey);

    if (!isSigned) {
        return res.status(400).send({ message: "Invalid signature" });
    }

    setInitialBalance(sender);
    setInitialBalance(recipient);

    if (balances[sender] < amount) {
        res.status(400).send({ message: "Not enough funds!" });
    } else {
        balances[sender] -= amount;
        balances[recipient] += amount;
        res.send({ balance: balances[sender] });
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
    if (!balances[address]) {
        balances[address] = 0;
    }
}
