import { Horizon, Config } from "@stellar/stellar-sdk";
import { config } from "../config";

// SEC-06: bound every SDK HTTP call (Horizon, stellar.toml + federation
// resolvers) so a slow / tarpitting host can't stall the process indefinitely.
Config.setTimeout(20_000);

/** Shared read/write Horizon client. Reads are safe; writes require a signed tx. */
export const horizon = new Horizon.Server(config.horizonUrl);
