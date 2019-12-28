import React, { Component, Fragment } from 'react'
import actions from 'redux/actions'
import { connect } from 'redaction'
import helpers, { constants, links } from 'helpers'
import config from 'app-config'
import { isMobile } from 'react-device-detect'

import cssModules from 'react-css-modules'
import styles from './Row.scss'

import { Link } from 'react-router-dom'
import CopyToClipboard from 'react-copy-to-clipboard'

import Coin from 'components/Coin/Coin'
import InlineLoader from 'components/loaders/InlineLoader/InlineLoader'
import BtnTooltip from 'components/controls/WithdrawButton/BtnTooltip'
import { Button } from 'components/controls'

import LinkAccount from '../LinkAccount/LinkAcount'
import KeychainStatus from '../KeychainStatus/KeychainStatus'
import { withRouter } from 'react-router'
import ReactTooltip from 'react-tooltip'
import { FormattedMessage, injectIntl } from 'react-intl'
import CurrencyButton from 'components/controls/CurrencyButton/CurrencyButton'
import { relocalisedUrl, localisedUrl } from 'helpers/locale'
import SwapApp from 'swap.app'

@injectIntl
@withRouter
@connect(
  ({
    rememberedOrders,
    user: { ethData, btcData, tokensData, /* xlmData, */nimData, usdtData, ltcData },
    currencies: { items: currencies },
  }, { currency }) => ({
    currencies,
    item: [
      btcData,
      ethData,
      /* xlmData, */
      ltcData,
      usdtData,
      ...Object.keys(tokensData).map(k => (tokensData[k])),
    ].map(({ account, keyPair, ...data }) => ({
      ...data,
    })).find((item) => item.currency === currency),
    decline: rememberedOrders.savedOrders,
  })
)

@cssModules(styles, { allowMultiple: true })
export default class Row extends Component {

  state = {
    isBalanceFetching: false,
    viewText: false,
    tradeAllowed: false,
    isAddressCopied: false,
    isTouch: false,
    isBalanceEmpty: true,
    showButtons: false,
    existUnfinished: false,
  }

  static getDerivedStateFromProps({ item: { balance } }) {
    return {
      isBalanceEmpty: balance === 0,
    }
  }

  constructor(props) {
    super(props)
    const { currency, currencies } = this.props

    const isBlockedCoin = config.noExchangeCoins
      .map(item => item.toLowerCase())
      .includes(currency.toLowerCase())

    this.state.tradeAllowed = !!currencies.find(c => c.value === currency.toLowerCase()) && !isBlockedCoin
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleSliceAddress)
  }

  componentDidMount() {
    const { hiddenCoinsList } = this.props

    window.addEventListener('resize', this.handleSliceAddress)

    Object.keys(config.erc20)
      .forEach(name => {
        if (!hiddenCoinsList.includes(name.toUpperCase())) {
          actions.core.markCoinAsVisible(name.toUpperCase())
        }
      })
  }

  componentDidUpdate() {
    const { item: { currency, balance } } = this.props

    if (balance > 0) {
      actions.analytics.balanceEvent({ action: 'have', currency, balance })
    }
  }

  handleReloadBalance = async () => {
    const { isBalanceFetching } = this.state

    if (isBalanceFetching) {
      return null
    }

    this.setState({
      isBalanceFetching: true,
    })

    const { item: { currency } } = this.props

    await actions[currency.toLowerCase()].getBalance(currency.toLowerCase())

    this.setState(() => ({
      isBalanceFetching: false,
    }))
  }

  shouldComponentUpdate(nextProps, nextState) {
    const getComparableProps = ({ item, index, selectId }) => ({
      item,
      index,
      selectId,
    })
    return JSON.stringify({
      ...getComparableProps(nextProps),
      ...nextState,
    }) !== JSON.stringify({
      ...getComparableProps(this.props),
      ...this.state,
    })
  }

  handleTouch = (e) => {
    this.setState({
      isTouch: true,
    })
  }

  handleSliceAddress = () => {
    const {
      item: {
        address,
      },
    } = this.props
    let firstPart = address.substr(0, 6)
    let secondPart = address.substr(address.length - 4)
    return (window.innerWidth < 700 || isMobile || address.length > 42) ? `${firstPart}...${secondPart}` : address
  }

  handleTouchClear = (e) => {
    this.setState({
      isTouch: false,
    })
  }

  handleCopyAddress = () => {
    this.setState({
      isAddressCopied: true,
    }, () => {
      setTimeout(() => {
        this.setState({
          isAddressCopied: false,
        })
      }, 500)
    })
  }

  handleWithdraw = () => {
    const {
      item: {
        decimals,
        token,
        contractAddress,
        unconfirmedBalance,
        currency,
        address,
        balance,
      },
    } = this.props

    // actions.analytics.dataEvent(`balances-withdraw-${currency.toLowerCase()}`)
    actions.modals.open(constants.modals.Withdraw, {
      currency,
      address,
      contractAddress,
      decimals,
      token,
      balance,
      unconfirmedBalance,
    })
  }

  handleReceive = () => {
    const {
      item: {
        currency,
        address,
      },
    } = this.props

    actions.modals.open(constants.modals.ReceiveModal, {
      currency,
      address,
    })
  }

  handleShowOptions = () => {
    this.setState({
      showMobileButtons: true,
    })
  }

  handleGoTrade = (currency) => {
    const { intl: { locale }, decline } = this.props

    const pair = currency.toUpperCase() === 'btc' ? 'eth' : 'btc'

    if (decline.length === 0) {
      window.scrollTo(0, 0)
      this.props.history.push(localisedUrl(locale, `${links.exchange}/${currency.toLowerCase()}-to-${pair}`))
    } else {
      const getDeclinedExistedSwapIndex = helpers.handleGoTrade.getDeclinedExistedSwapIndex({ currency, decline })
      if (getDeclinedExistedSwapIndex !== false) {
        this.handleDeclineOrdersModalOpen(getDeclinedExistedSwapIndex)
      } else {
        window.scrollTo(0, 0)
        this.props.history.push(localisedUrl(locale, `${links.exchange}/${currency.toLowerCase()}-to-${pair}`))
      }
    }
  }

  handleDeclineOrdersModalOpen = (indexOfDecline) => {
    const orders = SwapApp.shared().services.orders.items
    const declineSwap = actions.core.getSwapById(this.props.decline[indexOfDecline])

    if (declineSwap !== undefined) {
      actions.modals.open(constants.modals.DeclineOrdersModal, {
        declineSwap,
      })
    }
  }

  handleMarkCoinAsHidden = (coin) => {
    actions.core.markCoinAsHidden(coin)
  }

  showButtons = () => {
    this.setState(() => ({
      showButtons: true,
    }))
  }

  hideButtons = () => {
    this.setState(() => ({
      showButtons: false,
    }))
  }

  deleteThisSwap = () => {
    actions.core.forgetOrders(this.props.decline[0])
  }

  render() {
    const {
      isBalanceFetching,
      tradeAllowed,
      isAddressCopied,
      isTouch,
      isBalanceEmpty,
      showButtons,
    } = this.state

    const {
      item: {
        currency,
        balance,
        isBalanceFetched,
        address,
        fullName,
        unconfirmedBalance,
        contractAddress,
        balanceError,
      },
      intl: { locale },
    } = this.props

    return (
      <tr
        data-tut="reactour__store"
        styleName={this.props.index === this.props.selectId || !isMobile ? 'showButtons' : 'hidden'}
        onClick={() => { this.props.handleSelectId(this.props.index) }}
        onTouchEnd={this.handleTouchClear}
        onTouchMove={this.handleTouch}
        style={isTouch && this.props.index !== this.props.selectId ? { background: '#f5f5f5' } : { background: '#fff' }}
        onMouseEnter={this.showButtons}
        onMouseLeave={this.hideButtons}
      >
        <td>
          <Link to={localisedUrl(locale, `${links.home}/${fullName}-wallet`)} title={`Online ${fullName} wallet`}>
            <Coin name={currency} />
          </Link>
        </td>
        <td>
          <Link to={localisedUrl(locale, `${links.home}/${fullName}-wallet`)} title={`Online ${fullName} wallet`}>
            {fullName}
          </Link>
          {balanceError &&
            <div className={styles.errorMessage}>
              {fullName}
              <FormattedMessage
                id="RowWallet276"
                defaultMessage=" node is down (You cannot perform transactions). " />
              <a href="mailto:support@atomicswapwallet.io">
                <FormattedMessage
                  id="RowWallet282"
                  defaultMessage="Need help?" />
              </a>
            </div>
          }
        </td>
        <td styleName="table_balance-cell" data-tut="reactour__balance">
          {
            !isBalanceFetched || isBalanceFetching ? (
              <InlineLoader />
            ) : (
                <div styleName="no-select-inline" onClick={this.handleReloadBalance} >
                  <i className="fas fa-sync-alt" styleName="icon" />
                  <span>
                    {
                      balanceError ? '?' : String(balance).length > 4 ? balance.toFixed(4) : balance
                    }{' '}{currency}
                  </span>
                  {currency === 'BTC' && unconfirmedBalance !== 0 && (
                    <Fragment>
                      <br />
                      <span styleName="unconfirmedBalance">
                        <FormattedMessage id="RowWallet181" defaultMessage="Unconfirmed balance" />
                        {unconfirmedBalance} {' '}
                      </span>
                    </Fragment>
                  )}
                  {currency === 'LTC' && unconfirmedBalance !== 0 && (
                    <Fragment>
                      <br />
                      <span styleName="unconfirmedBalance">
                        <FormattedMessage id="RowWallet189" defaultMessage="Unconfirmed balance" />
                        {unconfirmedBalance}
                      </span>
                    </Fragment>
                  )}
                  {currency === 'USDT' && unconfirmedBalance !== 0 && (
                    <Fragment>
                      <br />
                      <span styleName="unconfirmedBalance">
                        <FormattedMessage id="RowWallet197" defaultMessage="Unconfirmed balance" />
                        {unconfirmedBalance}
                      </span>
                    </Fragment>
                  )}
                </div>
              )
          }
          <span styleName="mobileName">{fullName}</span>
        </td>
        <Fragment>
          <CopyToClipboard text={address} data-tut="reactour__address" onCopy={this.handleCopyAddress}>
            <td styleName="yourAddress">
              {
                !contractAddress ? (
                  <div styleName="notContractAddress">
                    {
                      address !== '' && <i className="far fa-copy" styleName="icon" data-tip data-for="Copy" style={{ width: '14px' }} />
                    }
                    <LinkAccount type={currency} address={address}>{this.handleSliceAddress()}</LinkAccount>
                    <ReactTooltip id="Copy" type="light" effect="solid">
                      <span>
                        <FormattedMessage id="Row235" defaultMessage="Copy" />
                      </span>
                    </ReactTooltip>
                    }
                    {(currency === 'BTC' || currency === 'ETH') && (<KeychainStatus currency={currency} />)
                    }
                  </div>
                ) : (
                    <Fragment>
                      <i className="far fa-copy" styleName="icon" data-tip data-for="Copy" style={{ width: '14px' }} />
                      <LinkAccount type={currency} contractAddress={contractAddress} address={address} >{this.handleSliceAddress()}</LinkAccount>
                    </Fragment>
                  )
              }
              {isAddressCopied &&
                <p styleName="copied" >
                  <FormattedMessage id="Row293" defaultMessage="Address copied to clipboard" />
                </p>
              }
            </td>
          </CopyToClipboard>
        </Fragment>
        <td>
          <div>
            <CurrencyButton
              onClick={this.handleReceive}
              dataTooltip={{
                id: `deposit${currency}`,
                deposit: true,
              }}
              wallet="true">
              <FormattedMessage id="Row313" defaultMessage="Deposit" />
            </CurrencyButton>
            <BtnTooltip onClick={this.handleWithdraw} disable={isBalanceEmpty} id={`row${currency}`}>
              <i className="fas fa-arrow-alt-circle-right" />
              <FormattedMessage id="Row328" defaultMessage="Send" />
            </BtnTooltip>
            {
              tradeAllowed && (
                <BtnTooltip onClick={() => this.handleGoTrade(currency)} styleName={isBalanceEmpty && 'disableWth'}>
                  <i className="fas fa-exchange-alt" />
                  <FormattedMessage id="Row334" defaultMessage="Exchange" />
                </BtnTooltip>
              )
            }
          </div>
        </td>
      </tr>
    )
  }
}
