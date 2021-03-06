import * as anchor from '@project-serum/anchor';
import { BN, Idl, Program, AnchorProvider } from '@project-serum/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { LastToTen } from './last_to_ten';
import { AccountUtils, toBN, isKp } from './';


export class LastTenClient extends AccountUtils {
  // @ts-ignore
  wallet: anchor.Wallet;
  provider!: anchor.Provider;
  lastTenProgram!: anchor.Program<LastToTen>;

  constructor(
    conn: Connection,
    // @ts-ignore
    wallet: anchor.Wallet,
    idl?: Idl,
    programId?: PublicKey
  ) {
    super(conn);
    this.wallet = wallet;
    this.setProvider();
    this.setLastTenProgram(idl, programId);
  }

  setProvider() {
    this.provider = new AnchorProvider(
      this.conn,
      this.wallet,
      AnchorProvider.defaultOptions()
    );
    anchor.setProvider(this.provider);
  }

  setLastTenProgram(idl?: Idl, programId?: PublicKey) {
    //instantiating program depends on the environment
    if (idl && programId) {
      //means running in prod
      this.lastTenProgram = new anchor.Program<LastToTen>(
        idl as any,
        programId,
        this.provider
      );
    }
  }

  // --------------------------------------- fetch deserialized accounts

  async fetchBucketAcc() {
    const [pda, _] = await this.findBucketPDA();
    return this.lastTenProgram.account.bucket.fetch(pda);
  }

  // --------------------------------------- find PDA addresses

  async findBucketPDA(){
    return await PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode("bucket"))],
      this.lastTenProgram.programId
    )
  }

  // --------------------------------------- find PDA addresses

  async fillBucket(
    bucket:PublicKey,
    player: PublicKey,
  ){
    const txSig = await this.lastTenProgram.methods.fillBucket()
      .accounts({
        bucket,
        player,
        systemProgram: SystemProgram.programId
      }).signers([]).rpc();
    
    return {txSig};
  }

}