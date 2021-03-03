import {CirclesTrustRelationPredicate, CirclesWallet} from "../../../types";
import {Context} from "../../../context";
import {WnfsClient} from "../../../wnfsClient";

export function trustRelationsResolver(wnfs:WnfsClient) {
    return async (parent: CirclesWallet, args:any, context: Context) => {
        const subjectWallet = await wnfs.circlesWallet.findUnique({
            where: {
                address: parent.address
            },
            include: {
                trusts: {
                    include: {
                        subject: true,
                        object: true
                    }
                }
            }
        });
        if (!subjectWallet) {
            throw new Error(`Couldn't find a wallet with address ${parent.address}`);
        }
        return subjectWallet.trusts.map(trust => {
            let predicate: CirclesTrustRelationPredicate;
            switch (trust.predicate) {
                case "GIVING_TO":
                    predicate = CirclesTrustRelationPredicate.GivingTo;
                    break;
                case "RECEIVING_FROM":
                    predicate = CirclesTrustRelationPredicate.ReceivingFrom;
                    break;
            }
            return {
                ...trust,
                createdAt: trust.createdAt?.toJSON(),
                predicate: predicate
            }
        });
    };
}