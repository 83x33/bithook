import ZMQ from './zmq'
import WL from './watchlist'
import Bitcoind from './bitcoind'



export default function SDK({ 
    bitcoind
  , network = "mainnet"
  , connect=true
  , log=(...args)=>{console.log(...args)}
}){
  this.bitcoind = new Bitcoind({ bitcoind, network })
  this.zmq = new ZMQ({ bitcoind, network })
  this.streams = this.zmq.streams
  this.ctx = { tip: 0 }
  this.log = log

  const self = this
  this.log('chain', network)

  // get tip
  this.bitcoind.call('getblockcount').then(height => {
    self.tip(height)
  })

  connect && this.streams.tx.subscribe(raw => {
    const tx = (raw.vanilla && raw.vanilla()) || raw
    // self.log('tx', tx)
    processOutputs(SDK.scanForOutputs(raw, network), 'tx', self.tip())
  })

  connect && this.streams.block.subscribe(raw => {
    const block = (raw.vanilla && raw.vanilla()) || raw
    // self.log('block', block)
    self.tip(self.tip() + 1) // increment tip
    processOutputs(SDK.scanForOutputs(raw, network), 'block', self.tip())
  })
}



SDK.scanForOutputs = (item, network = 'mainnet') => {
  const addresses = WL.keys()
  const outputs = (addresses.length && item.findOutputs({ 
      addresses
    , network
    , script: false
    , hydrate: true
  })) || []
  return outputs
}

SDK.prototype.fake = function(outputs=[], type='tx') {
  processOutputs(outputs, type)
}

SDK.prototype.tip = function(tip) {
  if(tip) this.ctx.tip = tip
  return this.ctx.tip
}


SDK.prototype.hook = function(address, meta, handler) {
  this.log(`address "${address}" hooked`)
  const self = this
  if(typeof meta == 'function'){ handler = meta; meta = {}; }


  const hook = {}
  hook.unwatch = () => WL.pull(address)
  hook.destroy = () => {
    hook.unwatch()
    self.destroy.call(self) // for now we call parent chain function
  }

  WL.push(address, { 
      handler
    , hookInstance: hook
    , hook: {
          address
        , status: 'hooked'
        , satoshis: 0
        , confs: 0
        , txhash: ''
        , blockhash: ''
        , meta
      } 
  })

  return hook
}

SDK.prototype.destroy = function() {
  this.log('destroyed')
  this.zmq.close()
}


const processOutput = function({ type, output, height }) {
  return new Promise(async (resolve, reject) => {
    try{
      let { handler, hook, hookInstance } = WL.get(output.address)
      output = JSON.parse(JSON.stringify(output)) // clone ouput (because we delete some props)
      let hasChanged = false

      // Case: receving tx (we also filter with status to avoid double tx rpc emission)
      if(type == 'tx' && hook.status == 'hooked'){
        hasChanged = true
        hook = { ...hook, ...output }
        hook.status = 'received'
        hook.height_discover = height
      }

      // Case: receving block
      if(type == 'block'){
        hasChanged = true
        hook = { ...hook, ...output }
        hook.status = 'confirmed'
        hook.height = height
        hook.confs = 1
      }

      if(hasChanged){

        // TODO update price info if missing
        // if(!hook.price) {
        //   try { hook.price = await Prices.convert(hook.satoshis, 'satoshis', 'usd') }
        //   catch(e){ console.log('fetch price error', e.message) }
        // }

        // call handler
        handler(hook, hookInstance)

        // update watchlist with new hook data
        WL.push(hook.address, { handler, hook, hookInstance })
        

        resolve(hook)
      }else{
        resolve(false)
      }
      
    }catch(e){
      console.log('processOutput error', e)
      reject(e)
    }
  }) 
}

const processOutputs = function(outputs, type, height) {
  return Promise.all(
    outputs.map(output => { 
      return processOutput({
          type
        , output
        , height
      })
    })
  )
}