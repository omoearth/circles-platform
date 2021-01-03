import { Directory, DirectoryChangeType } from "./directory";
import { Profile } from "../entities/profile";
import FileSystem from "webnative/fs/filesystem";

export class Profiles extends Directory<Profile>
{
  constructor(fs: FileSystem) {
    super(fs, ["profiles"]);
  }

  async tryGetMyProfile(): Promise<Profile | null> {
    /*
    const samuel = await this.fs.get("/hansi1599/public/Apps/MamaOmo/OmoSapien/profiles");
    console.log("samuel:", samuel);
    */
    return await this.tryGetByName("me");
  }

  async addOrUpdateMyProfile(myProfile: Profile) {
    if (myProfile.name !== "me") {
      throw new Error("The own profile must always have the name 'me'.");
    }
    return await this.addOrUpdate(myProfile, true, "addOrUpdateMyProfile");
  }

  async maintainIndexes(change: DirectoryChangeType, entity: Profile, hint?: string): Promise<void> {
    if (entity.name === "me" && hint !== "addOrUpdateMyProfile") {
      throw new Error(`The 'me' entity is a system entity in '${this.getPath()}' and should not be used directly.`);
    }

    // Add or update a public version of 'me' to my public directory
    if (entity.name === "me")
    {
      await this.fs.add("public/Apps/MamaOmo/OmoSapien/profiles/me", JSON.stringify(entity));
    }
  }
}
