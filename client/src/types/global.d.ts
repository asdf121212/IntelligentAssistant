// Type declarations for third-party libraries without type definitions

declare module 'imap' {
  export interface Box {
    name: string;
    flags: string[];
    readOnly: boolean;
    uidvalidity: number;
    uidnext: number;
    permFlags: string[];
    messages: {
      total: number;
      new: number;
      unseen: number;
    };
    highestmodseq: string;
  }

  export interface Config {
    user: string;
    password: string;
    host: string;
    port: number;
    tls: boolean;
    tlsOptions?: any;
    connTimeout?: number;
    authTimeout?: number;
    debug?: any;
    autotls?: string;
    keepalive?: boolean;
  }

  export default class Connection {
    constructor(config: Config);
    connect(): void;
    end(): void;
    destroy(): void;
    openBox(name: string, readOnly: boolean, callback: (err: Error, box: Box) => void): void;
    search(criteria: any[], callback: (err: Error, results: number[]) => void): void;
    fetch(source: any, options: any): any;
    on(event: string, listener: (...args: any[]) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
  }
}

declare module 'mailparser' {
  export function simpleParser(source: any, options?: any): Promise<any>;
}

declare module 'nodemailer' {
  export interface SendMailOptions {
    from?: string;
    to?: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject?: string;
    text?: string;
    html?: string;
    attachments?: any[];
    headers?: any;
  }

  export interface Transporter {
    sendMail(mailOptions: SendMailOptions): Promise<any>;
  }

  export function createTransport(options: any): Transporter;
}