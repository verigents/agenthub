import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { coinbaseWallet, injectedWallet, metaMaskWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { http, createConfig } from "wagmi";
import { sepolia } from "@wagmi/chains";


const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo";
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.drpc.org";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
        walletConnectWallet,
        injectedWallet,
      ],
    },
  ],
  {
    appName: "Atoa Agents",
    projectId,
  }
);

export const wagmiConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(rpcUrl),
  },
  ssr: true,
  connectors,
});


