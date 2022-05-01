
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
      console.log(item.programId.toBase58(), item.marketProgramId.toBase58(), item.id.toBase58(),)
    })

    const RAY_USDC = "ELSGBb45rAQNsMTVzwjUqL8vBophWhPn4rNbqwxenmqY"
    const poolKeys = await fetchPoolKeys(connection, new PublicKey(RAY_USDC))
    if (poolKeys){
      
      const poolInfo = await Liquidity.fetchInfo({connection, poolKeys})
      const amountIn = new TokenAmount(new Token(poolKeys.baseMint, 6), 1000000)
      const currencyOut = new Token(poolKeys.quoteMint,6)
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
      
      // const minAmountOut = new TokenAmount(new Token(poolKeys.quoteMint, 6), 1000000)
      
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