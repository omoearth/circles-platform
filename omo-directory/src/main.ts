import {Request, Response} from "express";
import * as IPFS from "ipfs-core";
import {Directory} from "./directory";
import fetch from 'cross-fetch';
import {TaskScheduler, TaskSchedulerSlotLength} from "./taskScheduler";

const fs = require('fs');
const express = require("express");
const router = express.Router();
const app = express();
const taskScheduler = new TaskScheduler();

let directory:Directory = {};
let lastCid: any = "You're alone";
let ipfs:any;

export const catRaw = async (cid: any): Promise<Buffer[]> => {
    const chunks = []
    for await (const chunk of ipfs.cat(cid)) {
        chunks.push(chunk)
    }
    return chunks
}

export const catBuf = async (cid: any): Promise<Buffer> => {
    const raw = await catRaw(cid)
    return Buffer.concat(raw)
}

async function init()
{
    console.log("Creating IPFS node ..")
    ipfs = await IPFS.create();

    console.log("Loading the directory cid from 'lastCid.cid'");
    await fs.exists("lastCid.cid", async (exists:boolean) => {
        if (exists)
        {
            fs.readFile('lastCid.cid', async (error:any, data:any) => {
                console.log("Loading the directory from ", data.toString());

                lastCid = data.toString();
                const buf = await catBuf(data.toString());
                directory = JSON.parse(buf.toString());
            });
        } else {
            console.log("No directory cid at 'lastCid.cid'");
        }
    });
}

router.get('/directory', (request:Request,response:Response) =>
{
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Headers", "X-Requested-With");
    response.send(lastCid.toString());
});

router.get('/list',(request:Request,response:Response) =>
{
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Headers", "X-Requested-With");
    response.send(JSON.stringify(directory, null, 2));
});

router.post('/signup/:fissionName', async (request:Request,response:Response) =>
{
    // TODO: The profile is only available after the IPNS link was updated.
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Headers", "X-Requested-With");

    taskScheduler.addOrResetTask(request.params.fissionName, 5, async () =>
    {
        return new Promise<any>((async (resolve, reject) => {
            try
            {
                let done = false;
                setTimeout(() => {
                    if (done)
                    {
                        return;
                    }
                    reject(new Error(`The execution of Task '${request.params.fissionName}' timed out after 60 sec.`));
                }, 60000);
                const dnsLink = `https://ipfs.io/api/v0/dns?arg=${request.params.fissionName}.fission.name`;
                console.log("loading", dnsLink);
                const dnsLinkResult = await fetch(dnsLink);
                const dnsLinkResultObj = await dnsLinkResult.json();

                if (!dnsLinkResultObj || !dnsLinkResultObj.Path)
                {
                    return;
                }

                const otherProfilePath = `https://ipfs.io/${dnsLinkResultObj.Path}/userland/Apps/userland/MamaOmo/userland/OmoSapien/userland/profiles/userland/me/userland`;
                console.log("loading", otherProfilePath);
                const otherProfileData = await fetch(otherProfilePath);
                const otherProfileObj = await otherProfileData.json();

                /*
                const avatar = otherProfileObj.avatar && otherProfileObj.avatar.length > 512
                    ? null
                    : otherProfileObj.avatar
                */
                const existingDirectoryEntry = directory[request.params.fissionName];
                if (existingDirectoryEntry)
                {
                    const changed =
                        existingDirectoryEntry.firstName != otherProfileObj.firstName
                        ||existingDirectoryEntry.lastName != otherProfileObj.lastName
                        ||existingDirectoryEntry.circlesSafe != otherProfileObj.circlesAddress;

                    if (changed)
                    {
                        console.log(`Entry '${request.params.fissionName}' was updated.`)
                    }
                }
                else
                {
                    console.log(`Entry '${request.params.fissionName}' was added.`)
                }

                directory[request.params.fissionName] = {
                    firstName: otherProfileObj.firstName,
                    lastName: otherProfileObj.lastName,
                    //    avatarUrl: avatar,
                    circlesSafe: otherProfileObj.circlesAddress,
                    fissionName: request.params.fissionName
                };

                const cid = await ipfs.add(JSON.stringify(directory));
                await ipfs.pin.add(cid.cid);

                await fs.writeFile('lastCid.cid', cid.cid.toString(), () => {
                    console.log("Wrote last cid:", cid.cid.toString());
                });

                done = true;
                lastCid = cid.cid;
                resolve();
            }
            catch (e)
            {
                console.warn("Couldn't load a foreign profile:");
                console.warn(e);
                reject(e);
            }
        }));
    });

    response.send("Pending");
});


taskScheduler.start();
// add router in the Express app.
app.use("/", router);
app.listen(5001, async () => {
    await init()
});

