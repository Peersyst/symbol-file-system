import {
    Account,
    AccountMetadataTransaction, Address,
    AggregateTransaction, Convert, CosignatureTransaction,
    Deadline, Metadata, MetadataSearchCriteria, MetadataType,
    NetworkType, PublicAccount, RepositoryFactoryHttp, SignedTransaction,
    Transaction, TransactionService, UInt64
} from "symbol-sdk";
import {Blocks} from "../entity/Blocks";
import {sleep} from "../helper/sleep";
import {Progress} from "../helper/Progress";
import {FeesCallback} from "../SymbolFileSystem";

export class SymbolService {
    static MAX_TRANSACTIONS_PER_AGGREGATE = 100;

    public feesWasted = UInt64.fromUint(0);

    private generationHash: string;
    private epochAdjustment: number;
    private networkType: NetworkType;
    private feeMultiplier: number;

    repositoryFactories: RepositoryFactoryHttp[];

    constructor(private readonly nodes: string[], syncCallback: () => void) {
        this.repositoryFactories = this.nodes.map((node) => new RepositoryFactoryHttp(node));
        new Promise(async (resolve) => {
            const networkRepository = this.repositoryFactory.createNetworkRepository();
            const networkProperties = await networkRepository.getNetworkProperties().toPromise()
            if (!networkProperties.network.generationHashSeed ||
                !networkProperties.network.epochAdjustment) {
                throw new Error("Error loading Symbol data.")
            }
            this.generationHash = networkProperties.network.generationHashSeed;
            this.epochAdjustment = parseInt(networkProperties.network.epochAdjustment);
            this.networkType = await networkRepository.getNetworkType().toPromise();
            const transactionFees = await networkRepository.getTransactionFees().toPromise();
            this.feeMultiplier = transactionFees.minFeeMultiplier * 2;
            resolve();
        }).then(syncCallback);
    }

    public async fetchBlocks(rawAddress: string, verbose = false): Promise<{[id: string]: string}> {
        const address = Address.createFromRawAddress(rawAddress);
        const entries = await this.getAllMetaDataEntries(address, verbose);
        return entries.reduce((acc, metadata) =>  {
            const id = metadata.metadataEntry.scopedMetadataKey.toHex();
            acc[id] = metadata.metadataEntry.value;
            return acc;
        }, {});
    }

    public async saveBlocks(previousBlocks: Blocks, newBlocks: Blocks, account: Account, payerAccount: Account, feesCb?: FeesCallback, verbose = false): Promise<boolean> {
        const filteredTransactions = Object.keys(newBlocks)
            .filter((blockId) => {
                return newBlocks[blockId] !== previousBlocks[blockId];
            });
        let pb;

        if (verbose) pb = Progress("Creating transactions...", filteredTransactions.length);
        const transactions = filteredTransactions.map((blockId, index) => {
            if (pb) pb.update(index + 1);
            return this.createSaveBlockTransaction(
                UInt64.fromHex(blockId),
                newBlocks[blockId],
                account.address,
                previousBlocks[blockId],
            );
        });
        const aggregates = this.splitIntoAggregates(transactions, payerAccount);
        if (pb) pb.finish();

        if (feesCb) {
            const approved = await feesCb(this.feesWasted.compact() / Math.pow(10, 6));
            if (!approved) return false;
        }

        if (verbose) pb = Progress("Signing transactions...", aggregates.length);
        const signedTxs = aggregates.map((tx, index) => {
            if (pb) pb.update(index);
            return this.signWithAccountAndPayer(tx, account, payerAccount)
        });
        if (pb) pb.finish();

        let i=0;
        if (verbose) pb = Progress("Announcing transactions...", signedTxs.length);
        for (const signedTx of signedTxs) {
            if(pb) pb.update(i + 1);
            i++;
            await this.announceTransaction(signedTx);
            await sleep(500);
        }
        if (pb) pb.finish();
        return true;
    }

    private splitIntoAggregates(transactions: Transaction[], payer: Account): AggregateTransaction[] {
        let innerTransactions = transactions.map((transaction) => transaction.toAggregate(payer.publicAccount));
        const aggregates: AggregateTransaction[] = [];
        while (innerTransactions.length > 0) {
            const chunkTransactions = innerTransactions.slice(0, SymbolService.MAX_TRANSACTIONS_PER_AGGREGATE);
            aggregates.push(
                AggregateTransaction.createComplete(
                    Deadline.create(this.epochAdjustment),
                    chunkTransactions,
                    this.networkType,
                    [],
                ).setMaxFeeForAggregate(this.feeMultiplier, 2)
            );
            innerTransactions = innerTransactions.slice(SymbolService.MAX_TRANSACTIONS_PER_AGGREGATE);
        }
        this.feesWasted = aggregates.reduce((acc, tx) => {
            acc = acc.add(tx.maxFee);
            return acc;
        }, UInt64.fromUint(0))

        return aggregates;
    }

    private signWithAccountAndPayer(transaction: AggregateTransaction, account: Account, payer: Account): SignedTransaction {
        const signedTransactionNotComplete = payer.sign(
            transaction,
            this.generationHash,
        );

        return payer.signTransactionGivenSignatures(
            transaction,
            [
                CosignatureTransaction.signTransactionPayload(
                    account,
                    signedTransactionNotComplete.payload,
                    this.generationHash,
                ),
            ],
            this.generationHash,
        );
    }

    private async announceTransaction(signedTransaction: SignedTransaction): Promise<void> {
        const repositoryFactory = this.repositoryFactory;
        const listener = repositoryFactory.createListener();
        const receiptHttp = repositoryFactory.createReceiptRepository();
        const transactionService = new TransactionService(repositoryFactory.createTransactionRepository(), receiptHttp);
        listener.open().then(() => {
            transactionService.announce(signedTransaction, listener).subscribe(() => {
                const signer = PublicAccount.createFromPublicKey(signedTransaction.signerPublicKey, this.networkType);
                listener.status(signer.address, signedTransaction.hash).subscribe((error) => {
                    console.log(error);
                })
            })
        });
    }

    private createSaveBlockTransaction(blockId: UInt64, data: string, accountAddress: Address, previousValue?: string): Transaction {
        if (!previousValue) {
            return AccountMetadataTransaction.create(
                Deadline.create(this.epochAdjustment),
                accountAddress,
                blockId,
                data.length,
                data,
                this.networkType,
            );
        } else {
            const newValueBytes = Convert.utf8ToUint8(data);
            const currentValueBytes = Convert.utf8ToUint8(previousValue);
            return AccountMetadataTransaction.create(
                Deadline.create(this.epochAdjustment),
                accountAddress,
                blockId,
                newValueBytes.length - currentValueBytes.length,
                Convert.decodeHex(Convert.xor(currentValueBytes, newValueBytes)),
                this.networkType,
            );
        }
    }

    public get repositoryFactory(): RepositoryFactoryHttp {
        const max = this.repositoryFactories.length - 1;
        const random = Math.floor(Math.random() * (max + 1))
        return this.repositoryFactories[random];
    }

    private async getAllMetaDataEntries(address: Address, verbose = false): Promise<Metadata[]> {
        const metadataHttp = this.repositoryFactory.createMetadataRepository();
        const searchCriteria: MetadataSearchCriteria = {
            pageNumber: 1,
            pageSize: 100,
            targetAddress: address,
            metadataType: MetadataType.Account,
        };
        const metadata: Metadata[] = [];
        let pb;
        if (verbose) pb = Progress("Fetching file data", 100000);

        let metaDataPage = await metadataHttp.search(searchCriteria).toPromise();
        while (metaDataPage.data.length > 0) {
            metadata.push(...metaDataPage.data);
            if (pb) pb.update(metadata.length)
            searchCriteria.pageNumber = (searchCriteria.pageNumber || 0) + 1;
            metaDataPage = await metadataHttp.search(searchCriteria).toPromise();
        }
        if (pb) {
            pb.update(100000);
            pb.finish();
        }
        return metadata;
    }
}
