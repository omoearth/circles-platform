import Dapps from 'src/dapps/omoli/views/pages/Dapps.svelte'
import {faBoxes, faCoins} from "@fortawesome/free-solid-svg-icons";
import { RunProcess } from 'src/libs/o-events/runProcess';
import {DappManifest} from "../../libs/o-os/interfaces/dappManifest";
import {initializeApp} from "../safe/processes/omo/initializeApp";
import {tryGetDappState} from "../../libs/o-os/loader";
import {FissionAuthState} from "../fissionauth/manifest";

export interface OmoLiState {}
export const omoli : DappManifest<OmoLiState,OmoLiState> = {
  id: "omo.li:1",
  dependencies: [],
  isHidden: true,
  icon: faBoxes,
  title: "Dapps",
  routeParts: ["omoli"],
  tag: Promise.resolve("mockup"),
  isEnabled: true,
  pages: [{
    isDefault: true,
    routeParts: ["dapps"],
    component: Dapps,
    available: [
      (detail) => {
        console.log("routeGuard.detail:", detail);
        const fissionAuthState = tryGetDappState<FissionAuthState>("omo.fission.auth:1");
        return fissionAuthState.fission !== undefined
      }
    ],
    userData: {
      showActionBar: false,
      actions: [{
        type: "trigger",
        pos: "overflow",
        mapping: {
          design: {
            icon: faCoins,
          },
          data: {
            label: "Connect Circles Safe"
          }
        },
        event: () => new RunProcess(initializeApp)
      }]
    }
  }]
};
