import {CirclesTokenTransfer} from "omo-central-interfaces/dist/types";
import {Context} from "../../../context";
import {WnfsClientInterface} from "../../../wnfsClientInterface";

export function objectResolver(wnfs:WnfsClientInterface) {
    return async (parent: CirclesTokenTransfer, args: any, context: Context) => {
        const transfer = await wnfs.circlesTokenTransfer.findUnique({
            where: {
                id: parent.id
            },
            include: {
                object: true
            }
        });
        if (!transfer) {
            throw new Error(`Couldn't find a circles transfer with id ${parent.id}`);
        }
        return transfer.object;
    };
}