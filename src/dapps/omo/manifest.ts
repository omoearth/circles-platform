import Dapps from 'src/dapps/omo/views/pages/Dapps.svelte'
import {faCoins} from "@fortawesome/free-solid-svg-icons";
import {RunProcess} from 'src/libs/o-events/runProcess';
import {connectSafe} from '../safe/processes/connectSafe/connectSafe';
import {PageManifest} from "../../libs/o-os/pageManifest";


export const omo: PageManifest = {
  component: Dapps,
  conditions: [
    (detail) => {
      console.log("routeGuard.detail:", detail);
      return window.fissionAuth !== undefined
    }
  ],
  userData: {
    dapp: "omo",
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
      event: () => new RunProcess(connectSafe)
    }]
  }
}
