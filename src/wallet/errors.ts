/** A client-facing wallet error with an HTTP status. Messages are safe to show
 *  (they never contain secret material). Distinct from a 5xx server fault. */
export class WalletError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "WalletError";
    this.status = status;
  }
}
