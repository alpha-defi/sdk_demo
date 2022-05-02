
import { Connection, Keypair, PublicKey,} from "@solana/web3.js";
import { Liquidity, Token, TokenAmount,Percent } from "@raydium-io/raydium-sdk";

// @ts-ignore
import bs58 from "bs58"

import {getTokenAccountsByOwner, fetchAllPoolKeys, fetchPoolKeys} from "./devnet"

(async () => {
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");

    // change to your privateKey
    // const secretKey = Buffer.from(JSON.parse('[1,1,1,1,1]'))
    const secretKey = bs58.decode('3qswEeCJcA9ogpN3JEuXBtmnU35YPzSxBwzrk6sdTPhogMJ64WuabU9XWg2yUegJvv1qupYPqo2jQrrK26N7HGsD')

    const ownerKeypair = Keypair.fromSecretKey( secretKey )

    const owner = ownerKeypair.publicKey;
    console.log(owner.toString());

    const tokenAccounts = await getTokenAccountsByOwner(connection, owner)
    console.log("tokenAccounts.length:", tokenAccounts.length)

    const allPoolKeys = await fetchAllPoolKeys(connection);
    console.log("allPoolKeys.length:", allPoolKeys.length)

    allPoolKeys.forEach((item) => {
      // if (item.baseMint.toBase58() == WSOL.mint || item.quoteMint.toBase58() == WSOL.mint )
        console.log(item.id.toBase58(),item.baseMint.toBase58(),item.quoteMint.toBase58())
    })

    // SOL-USDT
    const POOL_ID = "384zMi9MbUKVUfkUdrnuMfWBwJR9gadSxYimuXeJ9DaJ"

    // RAY_USDC
    // const POOL_ID = "ELSGBb45rAQNsMTVzwjUqL8vBophWhPn4rNbqwxenmqY"

    const poolKeys = await fetchPoolKeys(connection, new PublicKey(POOL_ID))
    if (poolKeys){
      
      const poolInfo = await Liquidity.fetchInfo({connection, poolKeys})

      // real amount = 1000000 / 10**poolInfo.baseDecimals
      const amountIn = new TokenAmount(new Token(poolKeys.baseMint, poolInfo.baseDecimals), 1000000)

      const currencyOut = new Token(poolKeys.quoteMint, poolInfo.quoteDecimals)

      // 5% slippage
      const slippage = new Percent(5, 100)

      const {
        amountOut,
        minAmountOut,
        currentPrice,
        executionPrice,
        priceImpact,
        fee,
      } = Liquidity.computeAmountOut({ poolKeys, poolInfo, amountIn, currencyOut, slippage, })

      
      // @ts-ignore
      console.log(amountOut.toFixed(), minAmountOut.toFixed(), currentPrice.toFixed(), executionPrice.toFixed(), priceImpact.toFixed(), fee.toFixed())
      
      // const minAmountOut = new TokenAmount(new Token(poolKeys.quoteMint, poolInfo.quoteDecimals), 1000000)
      
      const {transaction, signers} = await Liquidity.makeSwapTransaction({
          connection,
          poolKeys,
          userKeys: {
              tokenAccounts,
              owner,
          },
          amountIn,
          amountOut: minAmountOut,
          fixedSide: "in"
      })

      const txid = await connection.sendTransaction(
          transaction, 
          [...signers, ownerKeypair],
          {skipPreflight: true}
      );

      console.log(`https://explorer.solana.com/tx/${txid}?cluster=devnet`)
    }
})()