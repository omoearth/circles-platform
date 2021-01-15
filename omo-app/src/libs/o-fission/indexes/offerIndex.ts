import {Index} from "./index";
import {IpfsNode} from "./ipfsNode";
import {OfferMetadata} from "../directories/offers";

export interface OfferIndexEntry
{
  filename:string;
  offeredByFissionName: string;
  productName: string;
  productPicture: string;
  productPrice: string;
  productDescription: string;
  productLocation: any;
}

export interface OfferIndexData
{
  byFissionName: {
    [fissionName:string]: OfferIndexEntry
  }
}

export class OfferIndex extends Index
{
  async tryGetOfferIndex() : Promise<OfferIndexData>
  {
    const offerIndexCidResponse = await fetch("https://directory.omo.earth/offers");
    const offerIndexCid = await offerIndexCidResponse.text();
    const offerIndexDataBuffer = await Index.catCid(offerIndexCid);
    const offerIndexDataJson = offerIndexDataBuffer.toString();
    const offerIndex: OfferIndexData = JSON.parse(offerIndexDataJson);

    if (!offerIndex || !offerIndex.byFissionName)
    {
      return null;
    }

    return offerIndex;
  }

  static async tryReadPublicOffers(fissionUser: string): Promise<OfferMetadata[]>
  {
    const fsRoot = await Index.tryGetUserFsRoot(fissionUser);
    if (!fsRoot)
    {
      return null;
    }

    return await IpfsNode.runWithIPFS(async ipfs =>
    {
      const path = fsRoot
        + "/userland/Apps/userland/MamaOmo/userland/OmoSapien/userland/offers/userland";

      const publicProfileDir = ipfs.ls(path);
      const offerNames:string[] = [];
      for await (const element of publicProfileDir)
      {
        offerNames.push(element.name);
      }

      const offers:OfferMetadata[] = await Promise.all(offerNames.map(async offerName => {
        const offerMetadataBuffer = await ipfs.files.read(path + "/" + offerName + "/userland/metadata/userland");
        const offerMetadataJson = Buffer.from(offerMetadataBuffer).toString();
        const offerMetadata:OfferMetadata = JSON.parse(offerMetadataJson);
        return offerMetadata;
      }));

      return offers;
    });
  }
}
