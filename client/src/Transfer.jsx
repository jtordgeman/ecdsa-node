import { useState } from "react";
import server from "./server";
import * as secp from 'ethereum-cryptography/secp256k1';
import { v4 as uuidv4 } from 'uuid';
import { toHex } from "ethereum-cryptography/utils";

function Transfer({ address, setBalance, privateKey }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  const encoder = new TextEncoder();

  async function transfer(evt) {
    evt.preventDefault();

    try {
      const uuid = uuidv4();
      const msg = {
        amount: parseInt(sendAmount),
        uuid,
        recipient
      }

      const msgHash = encoder.encode(JSON.stringify(msg));
      const [signature, bit] = await secp.sign(msgHash, privateKey, {recovered: true});

      const {
        data: { balance },
      } = await server.post(`send`, {
        sender: address,
        signature: toHex(signature),
        bit,
        amount: parseInt(sendAmount),
        recipient,
        uuid
      });
      setBalance(balance);
    } catch (ex) {

      alert(ex.response.data.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
