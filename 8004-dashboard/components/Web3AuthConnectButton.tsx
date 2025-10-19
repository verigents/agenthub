"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Web3AuthConnectButton() {
  return <ConnectButton chainStatus="icon" showBalance={false} />;
}


