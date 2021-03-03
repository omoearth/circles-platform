import {PurchaseStatus, QueryPurchasesArgs} from "../../types";
import {Context} from "../../context";
import {WnfsClient} from "../../wnfsClient";

export function purchasesResolver(wnfs:WnfsClient) {
    return async (parent: any, args: QueryPurchasesArgs, context: Context) => {
        const fissionName = await context.verifyJwt();
        if (args.query.purchasedByFissionName !== fissionName) {
            throw new Error(`You can only query your own purchases.`);
        }
        const purchases = await wnfs.purchase.findMany({
            where: {
                purchasedByFissionName: args.query.purchasedByFissionName
            },
            include: {
                purchasedItem: {
                    include: {
                        createdBy: true
                    }
                },
                purchasedBy: true
            }
        });
        const mapStatus = (inStatus: "INVALID" | "ITEM_LOCKED" | "PAYMENT_PROVEN"): PurchaseStatus => {
            switch (inStatus) {
                case "INVALID":
                    return PurchaseStatus.Invalid;
                case "ITEM_LOCKED":
                    return PurchaseStatus.ItemLocked;
                case "PAYMENT_PROVEN":
                    return PurchaseStatus.PaymentProven;
                default:
                    throw new Error(`Unknown status`);
            }
        };
        return purchases;
    };
}