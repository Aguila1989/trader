import { Horizon } from "@stellar/stellar-sdk";
import { config } from "../config";

/** Shared read/write Horizon client. Reads are safe; writes require a signed tx. */
export const horizon = new Horizon.Server(config.horizonUrl);
