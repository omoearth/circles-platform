import {Directory, DirectoryChangeType} from "./directory";
import {Profile} from "../entities/profile";
import FileSystem from "webnative/fs/filesystem";

export class Profiles extends Directory<Profile>
{
  constructor(fs:FileSystem)
  {
    super(fs, ["odentity", "profiles"]);
  }

  async tryGetMyProfile() : Promise<Profile|null>
  {
    return await this.tryGetByName("me");
  }

  async addOrUpdateMyProfile(myProfile:Profile)
  {
    if (myProfile.name !== "me")
    {
      throw new Error("The own profile must always have the name 'me'.");
    }
    return await this.addOrUpdate(myProfile, "addOrUpdateMyProfile");
  }

  async maintainIndexes(change: DirectoryChangeType, entity: Profile, hint?:string): Promise<void>
  {
    if (entity.name === "me" && hint !== "addOrUpdateMyProfile")
    {
      throw new Error(`The 'me' entity is a system entity in '${this.getPath()}' and should not be used directly.`);
    }
  }
}