import FileSystem from "libs/webnative/fs/filesystem";
import { Profiles } from "./directories/profiles";
import { Keys } from "./directories/keys";
import { AuthSucceeded, Continuation } from "libs/webnative";
import {CirclesTransactions} from "./directories/circlesTransactions";
import {CirclesTokens} from "./directories/circlesTokens";

export class FissionDrive
{
  private readonly _fissionAuth: AuthSucceeded | Continuation;
  readonly _fs: FileSystem;

  get username(): string {
    return this._fissionAuth.username;
  }

  get profiles(): Profiles {
    return this._profiles;
  }
  private readonly _profiles: Profiles;

  get keys(): Keys {
    return this._keys;
  }
  private readonly _keys: Keys;

  get transactions(): CirclesTransactions {
    return this._transactions;
  }
  private readonly _transactions: CirclesTransactions;

  get tokens(): CirclesTokens {
    return this._tokens;
  }
  private readonly _tokens: CirclesTokens;


  constructor(fissionAuth: AuthSucceeded | Continuation) {
    this._fissionAuth = fissionAuth;
    this._fs = fissionAuth.fs;

    this._profiles = new Profiles(this._fs);
    this._keys = new Keys(this._fs);
    this._transactions = new CirclesTransactions(this._fs);
    this._tokens = new CirclesTokens(this._fs);
  }
}

export async function withTimeout<T>(operationName:string, func: () => Promise<T>, timeout?:number) : Promise<T>
{
  return new Promise((resolve, reject) =>
  {
    let resolved = false;
    if (timeout)
    {
      setTimeout(() =>
      {
        if (resolved)
        {
          return;
        }
        reject(new Error(`The execution of ${operationName} timed out after ${timeout / 1000} seconds.`));
      }, timeout);
    }

    try {
      func()
        .then(result => {
          resolved = true;
          resolve(result);
        })
        .catch(error => reject(error));
    }
    catch (e)
    {
      reject(e);
    }
  });
}