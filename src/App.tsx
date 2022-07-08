import { createDefaultAuthorizationResultCache, SolanaMobileWalletAdapter } from '@solana-mobile/wallet-adapter-mobile';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, useAnchorWallet, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
    GlowWalletAdapter,
    PhantomWalletAdapter,
    SlopeWalletAdapter,
    SolflareWalletAdapter,
    TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import React, { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import { LastTenClient } from './client';
import * as ltIdl from './client/last_to_ten.json';

export const App: FC = () => {
    return (
        <Context>
            <Content />
        </Context>
    );
};

const Context: FC<{ children: ReactNode }> = ({ children }) => {
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    const network = WalletAdapterNetwork.Devnet;

    // You can also provide a custom RPC endpoint.
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
    // Only the wallets you configure here will be compiled into your application, and only the dependencies
    // of wallets that your users connect to will be loaded.
    const wallets = useMemo(
        () => [
            new SolanaMobileWalletAdapter({
                appIdentity: { name: 'Solana React UI Starter App' },
                authorizationResultCache: createDefaultAuthorizationResultCache(),
            }),
            new PhantomWalletAdapter(),
            new GlowWalletAdapter(),
            new SlopeWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            new TorusWalletAdapter(),
        ],
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

const Content: FC = () => {
    const wallet = useAnchorWallet();
    const [bucketSize, setBucketSize] = useState(0);
    const conn = new Connection('https://api.devnet.solana.com');
    const program = new PublicKey('6DXeNKvUyeqeqdbCwP9VTTedJd3e2MCiuf1KWZBdhoJY');

    const refreshSize = async () => {
        const ltClient = new LastTenClient(conn, wallet as any, ltIdl as any, program);
        const bucket = await ltClient.fetchBucketAcc();
        setBucketSize(bucket.volume);
    }

    const onTrigger = async () => {
        if (wallet) {
            const ltClient = new LastTenClient(conn, wallet as any, ltIdl as any, program);
            const [pda, _] = await ltClient.findBucketPDA();
            ltClient.fillBucket(pda, wallet?.publicKey);
        }
    }

    useEffect(() => {
        (async () => {
            if (wallet) {
                await refreshSize();
            }
        })();
    }, [wallet]);

    return (
        <div className='flex flex-col'>
            <h1> Bucket Size: {bucketSize} </h1>
            <a className='bg-blue-900 text-center cursor-pointer rounded p-4' onClick={onTrigger}> Fill Bucket </a>
            <br></br>
            <WalletMultiButton />
        </div>
    );
};
