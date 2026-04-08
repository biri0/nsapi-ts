export class NSAuthError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "NSAuthError";
    this.status = status;
  }
}

export class NSCommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NSCommandError";
  }
}
