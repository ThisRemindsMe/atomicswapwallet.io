import React from 'react'
import { connect } from 'redaction'

import PageHeadline from 'components/PageHeadline/PageHeadline'
import SubTitle from 'components/PageHeadline/SubTitle/SubTitle'
import { FormattedMessage } from 'react-intl'


const About = ({ address }) => (
  <section style={{ height: '100%' }}>
    <p></p><p></p><h1>AtomicSwapWallet.io</h1>
    <h5>100% Decentralized Browser-based Cryptocurrency Wallet Supporting Atomic Swaps</h5>

    <p></p><p></p><p></p><p></p><b>Supported Coins for Wallet:</b> Bitcoin, Litecoin, USDT(omni), Ethereum, and various ERC20 Tokens
  <p></p><p></p><b>Supported Pairs for Atomic Swaps:</b>

    <li>Bitcoin can be Swapped for Ethereum, ERC20 Tokens, Litecoin</li>
    <li>Ethereum can be Swapped for Bitcoin, Litecoin</li>
    <li>Litecoin can be Swapped for Bitcoin, Ethereum</li>
    <li>USDT can be Swapped for only ERC20 Tokens</li>
    <li>ERC20 Tokens can be Swapped for Bitcoin or USDT</li>
    <p></p><p></p><p></p><p></p>
    <h4>What are Atomic Swaps? Explained in Simple English</h4>
    <iframe width="80%" height="315" src="https://www.youtube.com/embed/fh-i8lVhN9o" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    <p></p><p></p><p></p><p></p>
    <h4>Atomic Swaps Explained in 3 Mins</h4>
    <iframe width="80%" height="315" src="https://www.youtube.com/embed/WkXUz3UFn6Y" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    <p></p><p></p><p></p><p></p>
    <h5>Questions?</h5>
    <h6>We're here to help! Email us at support@atomicswapwallet.io</h6>
  </section>
)

export default connect(state => ({
  address: state.user.ethData.address,
}))(About)
