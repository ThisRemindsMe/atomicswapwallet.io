import React, { Component } from 'react'
import propTypes from 'prop-types'

import { isMobile } from 'react-device-detect'
import { connect } from 'redaction'
import { constants } from 'helpers'
import { localisedUrl } from 'helpers/locale'
import firestore from 'helpers/firebase/firestore'
import actions from 'redux/actions'
import { withRouter } from 'react-router'
import { hasSignificantBalance, hasNonZeroBalance, notTestUnit } from 'helpers/user'
import moment from 'moment'

import CSSModules from 'react-css-modules'
import stylesWallet from './Wallet.scss'

import Row from './Row/Row'
import Table from 'components/tables/Table/Table'
import { WithdrawButton } from 'components/controls'
import styles from 'components/tables/Table/Table.scss'
import PageHeadline from 'components/PageHeadline/PageHeadline'
import PageSeo from 'components/Seo/PageSeo'
import SubTitle from 'components/PageHeadline/SubTitle/SubTitle'
import KeyActionsPanel from 'components/KeyActionsPanel/KeyActionsPanel'
import SaveKeysModal from 'components/modals/SaveKeysModal/SaveKeysModal'
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl'
import Referral from 'components/Footer/Referral/Referral'

import config from 'app-config'


const isWidgetBuild = config && config.isWidget

@connect(
  ({
    core: { hiddenCoinsList },
    user: { ethData, btcData, tokensData, /* xlmData, nimData, */ usdtData, ltcData },
    currencies: { items: currencies },
  }) => ({
    tokens: ((config && config.isWidget) ?
      [ config.erc20token.toUpperCase() ]
      :
      Object.keys(tokensData).map(k => (tokensData[k].currency))
    ),
    items: ((config && config.isWidget) ?
      [btcData, ethData, usdtData ]
      :
      [btcData, ethData, /* xlmData, */ ltcData, usdtData /* nimData */ ]).map((data) => (
      data.currency
    )),
    currencyBalance: [
      btcData, ethData, /* xlmData, */ ltcData, usdtData, ...Object.keys(tokensData).map(k => (tokensData[k])), /* nimData */
    ].map(({ balance, currency }) => ({
      balance,
      name: currency,
    })),
    currencies,
    hiddenCoinsList : (config && config.isWidget) ? [] : hiddenCoinsList,
    userEthAddress: ethData.address,
    tokensData: { ethData, btcData, ltcData, usdtData },
  })
)
@injectIntl
@withRouter
@CSSModules(stylesWallet, { allowMultiple: true })
export default class Wallet extends Component {

  static propTypes = {
    core: propTypes.object,
    user: propTypes.object,
    currencies: propTypes.array,
    hiddenCoinsList: propTypes.array,
    history: propTypes.object,
    items: propTypes.arrayOf(propTypes.string),
    tokens: propTypes.arrayOf(propTypes.string),
    location: propTypes.object,
    intl: propTypes.object.isRequired,
    match: propTypes.object,
  }

  state = {
    saveKeys: false,
    openModal: false,
    isShowingPromoText: false,
  }

  componentWillMount() {
    actions.user.getBalances()
    // actions.analytics.dataEvent('open-page-balances')

    this.checkImportKeyHash()

    if (process.env.MAINNET) {
      localStorage.setItem(constants.localStorage.testnetSkip, false)
    } else {
      localStorage.setItem(constants.localStorage.testnetSkip, true)
    }

    const testSkip = JSON.parse(localStorage.getItem(constants.localStorage.testnetSkip))
    const saveKeys = JSON.parse(localStorage.getItem(constants.localStorage.privateKeysSaved))

    this.setState(() => ({
      testSkip,
      saveKeys,
    }))
  }

  componentWillReceiveProps() {
    const { currencyBalance } = this.props

    const hasAtLeastTenDollarBalance = hasSignificantBalance(currencyBalance)

    if (process.env.MAINNET && hasAtLeastTenDollarBalance) {
      this.setState({ isShowingPromoText: true })
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const getComparableProps = (props) => ({
      items: props.items,
      currencyBalance: props.currencyBalance,
      tokens: props.tokens,
      currencies: props.currencies,
      hiddenCoinsList: props.hiddenCoinsList,
    })
    return JSON.stringify({
      ...getComparableProps(this.props),
      ...this.state,
    }) !== JSON.stringify({
      ...getComparableProps(nextProps),
      ...nextState,
    })
  }

  forceCautionUserSaveMoney = () => {
    const { currencyBalance } = this.props

    const hasNonZeroCurrencyBalance = hasNonZeroBalance(currencyBalance)
    const isNotTestUser = notTestUnit(currencyBalance)
    const doesCautionPassed = localStorage.getItem(constants.localStorage.wasCautionPassed)

    if (!doesCautionPassed && (hasNonZeroCurrencyBalance || isNotTestUser) && process.env.MAINNET) {
      actions.modals.open(constants.modals.PrivateKeys, {})
    }
  }

  checkImportKeyHash = () => {
    const { history, intl: { locale } } = this.props

    const urlHash = history.location.hash
    const importKeysHash = '#importKeys'

    if (!urlHash) {
      return
    }

    if (urlHash !== importKeysHash) {
      return
    }

    localStorage.setItem(constants.localStorage.privateKeysSaved, true)
    localStorage.setItem(constants.localStorage.firstStart, true)

    actions.modals.open(constants.modals.ImportKeys, {
      onClose: () => {
        history.replace((localisedUrl(locale, '/')))
      },
    })
  }

  checkBalance = () => {
    const now = moment().format('HH:mm:ss DD/MM/YYYY ZZ')
    const lastCheck = localStorage.getItem(constants.localStorage.lastCheckBalance) || now
    const lastCheckMoment = moment(lastCheck, 'HH:mm:ss DD/MM/YYYY ZZ')

    const isFirstCheck = moment(now, 'HH:mm:ss DD/MM/YYYY ZZ').isSame(lastCheckMoment)
    const isOneHourAfter = moment(now, 'HH:mm:ss DD/MM/YYYY ZZ').isAfter(lastCheckMoment.add(1, 'hours'))

    const { ethData, btcData, ltcData } = this.props.tokensData

    const balancesData = {
      ethBalance: ethData.balance,
      btcBalance: btcData.balance,
      ltcBalance: ltcData.balance,
      ethAddress: ethData.address,
      btcAddress: btcData.address,      
      ltcAddress: ltcData.address,
    }

    if (isOneHourAfter || isFirstCheck) {
      localStorage.setItem(constants.localStorage.lastCheckBalance, now)
      firestore.updateUserData(balancesData)
    }
  }

  render() {
    const { items, tokens, currencies, hiddenCoinsList, intl, location } = this.props
    const { isShowingPromoText } = this.state

    this.checkBalance()
    const titles = [
      <FormattedMessage id="Wallet114" defaultMessage="Coin" />,
      <FormattedMessage id="Wallet115" defaultMessage="Name" />,
      <FormattedMessage id="Wallet116" defaultMessage="Balance" />,
      <FormattedMessage id="Wallet117" defaultMessage="Your Address" />,
      isMobile ?
        <FormattedMessage id="Wallet118" defaultMessage="Send, receive, swap" />
        :
        <FormattedMessage id="Wallet119" defaultMessage="Actions" />,
    ]

    const titleSwapOnline = defineMessages({
      metaTitle: {
        id: 'Wallet140',
        defaultMessage: 'Atomicswapwallet.io - Cryptocurrency Wallet with Atomic Swap Exchange',
      },
    })
    const titleWidgetBuild = defineMessages({
      metaTitle: {
        id: 'WalletWidgetBuildTitle',
        defaultMessage: 'Cryptocurrency Wallet with Atomic Swap Exchange',
      },
    })
    const title = (isWidgetBuild) ? titleWidgetBuild : titleSwapOnline

    const description = defineMessages({
      metaDescription: {
        id: 'Wallet146',
        defaultMessage: `Our online wallet with Atomic swap algorithms will help you store and exchange cryptocurrency instantly
        and more secure without third-parties. Decentralized exchange.`,
      },
    })

    const sectionWalletStyleName = isMobile ? 'sectionWalletMobile' : 'sectionWallet'

    return (
      <section styleName={isWidgetBuild ? `${sectionWalletStyleName} ${sectionWalletStyleName}_widget` : sectionWalletStyleName}>
        <PageSeo
          location={location}
          defaultTitle={intl.formatMessage(title.metaTitle)}
          defaultDescription={intl.formatMessage(description.metaDescription)} />
        <PageHeadline styleName={isWidgetBuild ? 'pageLine pageLine_widget' : 'pageLine'}>
          <SubTitle>
            <FormattedMessage id="Wallet104" defaultMessage="Your online cryptocurrency wallet" />
          </SubTitle>
        </PageHeadline>
        <KeyActionsPanel />

        {!isShowingPromoText && (
          <div styleName="depositText">
            <FormattedMessage id="Wallet137" defaultMessage="Deposit funds to addresses below" />
          </div>
        )}
        {isShowingPromoText && (
          <div>
            <FormattedMessage
              id="WalletPromoText"
              defaultMessage="
                🎁 🎁 🎁 Thank you for using Atomicswapwallet.io!
                Tell us about your experience with our service
                and we will gift you $5 in HYPE Token 🎁 🎁 🎁"
            />
           
          </div>
        )}

        <Table
          id="table-wallet"
          className={styles.wallet}
          titles={titles}
          rows={[...items, ...tokens].filter(currency => currency && !hiddenCoinsList.includes(currency))}
          rowRender={(row, index, selectId, handleSelectId) => (
            <Row key={row} currency={row} currencies={currencies} hiddenCoinsList={hiddenCoinsList} selectId={selectId} index={index} handleSelectId={handleSelectId} />
          )}
        />
        {
          (config && !config.isWidget) && (
            <div styleName="inform">
              <Referral address={this.props.userEthAddress} />

              <h2 styleName="informHeading">Wallet based on the Atomic Swap technology</h2>
              <FormattedMessage
                id="Wallet156"
                defaultMessage="Welcome to Atomicswapwallet.io, a decentralized cross-chain wallet supporting Atomic Swaps.

Safely store and promptly exchange Bitcoin, Ethereum, USD, Tether, and numerous ERC-20 tokens with other users.

Atomicswapwallet.io does not store your keys or tokens. Our wallet operates directly on the browser with no additional installs or downloads required.

The services we provide are fully decentralized with all operations executed via the IPFS network.

Our wallet integrates multiple blockchains on a single interface, allowing you to store, send, receive, and exchange your coins and tokens in a truly decentralized manner. No third-parties, no proxy-tokens, and no token-wrapping required.

Please do not forget to save your private keys! We do not store any information about you or your keys and coins. Once you lose your keys, you will not be able to recover your funds!"
                values={{
                  br: <br />,
                }}
              />
            </div>
          )
        }
      </section>
    )
  }
}
