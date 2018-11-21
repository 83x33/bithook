# Bithook

Bithook is a simple mechanism/heuristic that let you precisely react to specific events occuring during the payment cycle of a given Bitcoin address.
It's a zero dependency utility, directly connected to your `bitcoind` (bitcoin-core) instance.

Bitcoin is an asynchronous protocol, transactions are sent to the network, then eventually included in a block, on top of which other blocks keeps getting added. It's hard to gather all the relevant informations, at different time in space, and converge to a comprehensive payment framework/unit. 
Bithook abstracts that complexity, and let you interact at any step of the payment cycle, providing all the context necessary to make custom business logic decisions. 

## Install

```js
// install
npm install bithook --save

// import es6
import bithook from 'bithook'

// import es5
var bithook = require("bithook").default
```

## Use

Connect to your bitcoind server (make sure your ip is whitelisted in your bitcoin.conf with `rpcallowip`)

```js
const chain = new bithook({ bitcoind: 'bitcoind://rpcuser:rpcpassword@yourserver.com:8332' })
```

Hook onto a bitcoin address with `chain.hook()`. 
  - 1st param is the `address` you want to track
  - 2nd param (the hook `handler` function) is where you write your custom logic

```js
chain.hook("1CNgN2HJvQMi1RvLDA7fazc5SyQLQAoX1W", (data, hook) => {
  // Custom business logic goes here

  // use any relevant informations for your logic
  const { status, confs } = data

  // ex: forward data (to an url, or a database)
  if(status == "received") db.save(data)
  if(status == "confirmed") http.post('some.url', data)

  // don't forget to kill the hook at some point
  if(confs > 6) hook.kill()
})
```

## handler(data, hook)

You can think of the handler as a map reduce through the **Payment cycle**, which combine the 3 following events :

  - A) the tx is received by your node (just received, not included in block yet). 
  - B) the tx is included in a block. (first block confirmation)
  - C) on every new block if B) has happened, untill you kill the hook with `hook.kill()`.

At the moment you create a hook and define it's handler, the handler get's called whenever event A, B or C happens. Events always happen in the same order: A then B then C. 

The `data` object mutates through the payment cycles :

Event A:
  - `data.status == "received"`
  - `data.confs == 0`
  - `data.txhash`

Event B:
  - `data.status == "confirmed"`
  - `data.confs == 1`
  - `data.blockhash` actual block hash
  - `data.height` actual block height
  - `data.ts` actual timestamp

Event C:
  - only `data.confs` changes




A hook handler receive a `data` object as 1st argument. You write your business logic against the values of the different fields of that `data` object.

<table class="table">
  <tbody>
    <tr>
      <th>field</th>
      <th>type</th>
      <th>info</th>
    </tr>
    <tr>
      <td><code>status</code></td>
      <td>string</td>
      <td>`received` or `confirmed`</td>
    </tr>
    <tr>
      <td><code>address</code></td>
      <td>string</td>
      <td></td>
    </tr>
    <tr>
      <td><code>satoshis</code></td>
      <td>int</td>
      <td></td>
    </tr>
    <tr>
      <td><code>confs</code></td>
      <td>int</td>
      <td></td>
    </tr>
    <tr>
      <td><code>txhash</code></td>
      <td>string</td>
      <td></td>
    </tr>
    <tr>
      <td><code>blockhash</code></td>
      <td>string</td>
      <td></td>
    </tr>
    <tr>
      <td><code>height</code></td>
      <td>int</td>
      <td></td>
    </tr>
    <tr>
      <td><code>meta</code></td>
      <td>string</td>
      <td>the meta object you optionnaly passed as a second argument when you created the hook.</td>
    </tr>
  </tbody>
</table>



