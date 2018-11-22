import ZMQ from 'zeromq'
import EventEmitter from './ee'
const url = require('url')
import { Observable, Subject } from 'rxjs'
import { map } from 'rxjs/operators'
import Tx from './tx'
import Block from './block'



const Streams = {}
Streams.tx = new Subject()
Streams.block = new Subject()
// Streams.all = Observable.merge(
//     Streams.tx.map(item => { item.type = 'tx'; return item }) 
//   , Streams.block.map(item => { item.type = 'block'; return item })
// )
 


class Zmq extends EventEmitter {

  constructor({ bitcoind, network = 'mainnet' } = {}){
    super()
    this.streams = Streams
    this.sockets = []

    const self = this
    
    const zmqPorts = {
        mainnet: 8331
      , regtest: 18331
      , testnet: 18331
    }

    const options = Object.assign({
        host: '127.0.0.1'
      , port: zmqPorts[network]
      , channels: ['rawtx', 'rawblock'] //rawtx,hashtx,rawblock,hashblock
    }, { host: url.parse(bitcoind).hostname })


    const { host, port, channels } = options

    // create an RPC connection foreach channel
    // to bypass flood miss when rawtx is used with rawblock
    channels.forEach(channel => {
      try {
        const mq = ZMQ.socket('sub')
        self.sockets.push(mq)
        mq.connect(`tcp://${host}:${port}`)
        mq.subscribe(channel)

        // redispatch events
        mq.on('message', (channel, data) => { 
          channel = channel.toString()

          ZMQProxies[channel] // proxy or emit directly
            ? ZMQProxies[channel](self, data)
            : self.emit(channel, data)
        })

        // reference for later
        self[channel] = mq

      }catch(e){ console.log('e', e) }
    })
  }

  close() {
    this.sockets.forEach(s => s.close())
  }

}


const ZMQProxies = {
  rawtx: (instance, rawtx) => {
    // instance.emit('rawtx', rawtx)
    // instance.emit('tx', Tx.fromBuffer(rawtx))
    Streams.tx.next(Tx.fromBuffer(rawtx))
  },
  rawblock: (instance, rawblock) => {
    // instance.emit('rawblock', rawblock)
    // instance.emit('block', Block.fromBuffer(rawblock))
    Streams.block.next(Block.fromBuffer(rawblock))
  }
}



export default Zmq