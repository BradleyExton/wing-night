import { networkInterfaces, type NetworkInterfaceInfo } from "node:os";

import { Router } from "express";
import type { LanAddressesListing } from "@wingnight/shared";

type InterfaceTable = NodeJS.Dict<NetworkInterfaceInfo[]>;

// 10/8, 172.16/12 and 192.168/16: the ranges a home router hands out, so the
// ones the tablet is on.
const isPrivateRange = (address: string): boolean => {
  const [first, second] = address.split(".").map(Number);

  return (
    first === 10 ||
    (first === 192 && second === 168) ||
    (first === 172 && second !== undefined && second >= 16 && second <= 31)
  );
};

// Pure over the interface table: every external IPv4 address, private ranges
// first. Link-local (169.254) is dropped — it is what a machine gives itself
// when no router answered, and nothing else can reach it.
export const listLanAddresses = (interfaces: InterfaceTable): LanAddressesListing => {
  const addresses = Object.values(interfaces)
    .flatMap((entries) => entries ?? [])
    .filter((entry) => entry.family === "IPv4" && !entry.internal)
    .map((entry) => entry.address)
    .filter((address) => !address.startsWith("169.254."));

  return {
    addresses: [
      ...addresses.filter(isPrivateRange),
      ...addresses.filter((address) => !isPrivateRange(address))
    ]
  };
};

// Read per request, not at boot: the laptop can join the party's Wi-Fi after
// the server is already up.
export const createLanAddressesRouter = (): Router => {
  const lanAddressesRouter = Router();

  lanAddressesRouter.get("/", (_request, response) => {
    response.status(200).json(listLanAddresses(networkInterfaces()));
  });

  return lanAddressesRouter;
};
