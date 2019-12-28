import config from 'app-config'

import modals from './modals'
import loader from './loader'
import notifications from './notifications'
import firebase from './firebase'

import user from './user'
import feed from './feed'
import core from './core'
import filter from './filter'

import btc from './btc'
// import xlm from './xlm'
import ltc from './ltc'
import eth from './eth'
import keychain from './keychain'
import token from './token'
import nimiq from './nimiq'
import api from './api'
import pairs from './pairs'
import referral from './referral'
import analytics from './analytics'

import ipfs from './ipfs'


import usdt from './usdt'


const tokens = {}

Object.keys(config.erc20)
  .forEach(key => {
    tokens[key] = token
  })

export default {
  ...tokens,
  filter,
  modals,
  loader,
  notifications,
  firebase,
  user,
  core,
  ltc,
  // xlm,
  btc,
  usdt,
  eth,
  keychain,
  token,
  nimiq,
  feed,
  analytics,
  referral,
  ipfs,
  api,
  pairs,
}
