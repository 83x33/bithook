let w = {} // watchlist

export default {
    get: address => address ? (w[address]||false) : w
  , set: list => { w = list || w }
  , keys: () => Object.keys(w)
  , push: (address, data) => {
      w[address] = data
    }
  , pull: (address) => {
      // console.log('delete', address)
      delete w[address]
    } 
}