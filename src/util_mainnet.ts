import {Connection, PublicKey,} from "@solana/web3.js";
import { Liquidity,  Market,
  SERUM_PROGRAM_ID_V3, LIQUIDITY_PROGRAM_ID_V4 } from "@raydium-io/raydium-sdk";
  


export async function fetchPoolKeys(
  connection: Connection,
  poolId: PublicKey,
  version : number = 4
) {

  // const version = 4
  const serumVersion = 3
  const marketVersion = 3

  const programId = LIQUIDITY_PROGRAM_ID_V4
  const serumProgramId = SERUM_PROGRAM_ID_V3

  const account = await connection.getAccountInfo(poolId)
  const { state: LiquidityStateLayout }  = Liquidity.getLayouts(version)

  //@ts-ignore
  const fields = LiquidityStateLayout.decode(account.data);
  const { status, baseMint, quoteMint, lpMint, openOrders, targetOrders, baseVault, quoteVault, marketId } = fields;

  let withdrawQueue, lpVault;
  if (Liquidity.isV4(fields)) {
    withdrawQueue = fields.withdrawQueue;
    lpVault = fields.lpVault;
  } else {
    withdrawQueue = PublicKey.default;
    lpVault = PublicKey.default;
  }
  
  // uninitialized
  // if (status.isZero()) {
  //   return ;
  // }

  const associatedPoolKeys = await Liquidity.getAssociatedPoolKeys({
    version,
    baseMint,
    quoteMint,
    marketId,
  });

  const poolKeys = {
    id: poolId,
    baseMint,
    quoteMint,
    lpMint,
    version,
    programId,

    authority: associatedPoolKeys.authority,
    openOrders,
    targetOrders,
    baseVault,
    quoteVault,
    withdrawQueue,
    lpVault,
    marketVersion: serumVersion,
    marketProgramId: serumProgramId,
    marketId,
    marketAuthority: associatedPoolKeys.marketAuthority,
  };

  const marketInfo = await connection.getAccountInfo( marketId);
  const { state: MARKET_STATE_LAYOUT } = Market.getLayouts(marketVersion);
  //@ts-ignore
  const market = MARKET_STATE_LAYOUT.decode(marketInfo.data);

  const {
    baseVault: marketBaseVault,
    quoteVault: marketQuoteVault,
    bids: marketBids,
    asks: marketAsks,
    eventQueue: marketEventQueue,
  } = market;

  // const poolKeys: LiquidityPoolKeys;
  return {
    ...poolKeys,
    ...{
      marketBaseVault,
      marketQuoteVault,
      marketBids,
      marketAsks,
      marketEventQueue,
    },
  };
}

export const fetchAllPoolKeys = Liquidity.fetchAllPoolKeys
