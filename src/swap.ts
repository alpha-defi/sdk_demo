
import {Connection, Keypair, PublicKey,} from "@solana/web3.js";
import { Liquidity,  SPL_ACCOUNT_LAYOUT, Token, TokenAmount, TOKEN_PROGRAM_ID } from "@raydium-io/raydium-sdk";
  

async function getTokenAccountsByOwner(
  connection: Connection,
  owner: PublicKey,
) {
  const tokenResp = await connection.getTokenAccountsByOwner(
    owner,
    {
      programId: TOKEN_PROGRAM_ID
    },
  );

  const accounts: {
    pubkey: PublicKey;
    accountInfo: any;
  }[] = [];

  for (const { pubkey, account } of tokenResp.value) {
    accounts.push({
      pubkey,
      accountInfo:SPL_ACCOUNT_LAYOUT.decode(account.data)
    });
  }

  return accounts;
}

(async () => {
    const connection = new Connection("https://solana-api.projectserum.com", "confirmed");

    // change to your privateKey
    // const secretKey = ( Buffer.from(bs58.decode('xxxxxxxxxxxxxxxxxxxxxxxx'), "binary"))
    const secretKey = Buffer.from(JSON.parse('[1,1,1,1,1]'))
    const ownerKeypair = Keypair.fromSecretKey( secretKey )
    const owner = ownerKeypair.publicKey;
    console.log(owner.toString());

    const tokenAccounts = await getTokenAccountsByOwner(connection, owner)

    const allPoolKeys = await Liquidity.fetchAllPoolKeys(connection);

    const RAY_USDC = "6UmmUiYoBjSrhakAobJw8BvkmJtDVxaeBtbt7rxWo1mg"

    const poolKeys = allPoolKeys.find((item) => item.id.toBase58() === RAY_USDC)

    if (poolKeys){
        const {transaction, signers} = await Liquidity.makeSwapTransaction({
            connection,
            poolKeys,
            userKeys: {
                tokenAccounts,
                owner,
            },
            amountIn: new TokenAmount(new Token(poolKeys.baseMint, 6), 1000000),
            amountOut: new TokenAmount(new Token(poolKeys.quoteMint,6), 2000000),
            fixedSide: "in"
        })

        const txid = await connection.sendTransaction(
            transaction, 
            [...signers, ownerKeypair],
            {skipPreflight: true}
        );

        console.log(`https://solscan.io/tx/${txid}`)
    }
})()