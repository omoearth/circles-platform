import type { Observable } from "rxjs";
import type { State } from "xstate";
import { useMachine } from "xstate-svelte";
import { Subject } from "rxjs";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import App from "src/App.svelte";

import type { Account } from "src/libs/o-circles-protocol/interfaces/account";
import { config } from "src/libs/o-circles-protocol/config";
import { CirclesHub } from "src/libs/o-circles-protocol/circles/circlesHub";
import type { ProcessContext } from "src/libs/o-processes/processContext";
import { GnosisSafeProxy } from "src/libs/o-circles-protocol/safe/gnosisSafeProxy";
import { Person } from "src/libs/o-circles-protocol/model/person";
import type { ProcessDefinition } from "src/libs/o-processes/processManifest";
import type { ProcessEvent } from "src/libs/o-processes/processEvent";
import { EventBroker } from "./eventBroker";
import type { OmoEvent } from "./libs/o-events/omoEvent";

dayjs.extend(relativeTime)

export interface Process {
  id: number;
  events: Observable<any>;
  sendEvent(event: any);
}

declare global {
  interface Window {
    mySafeAddress: string,
    eventBroker: EventBroker,
    dispatchShellEvent: (event: OmoEvent) => void,
    stateMachines: {
      current(): Process | null,
      cancel(),
      run: (definition: ProcessDefinition, contextModifier?: (processContext: ProcessContext) => ProcessContext) => Process
    }
  }
}

window.mySafeAddress = localStorage.getItem("omo.safeAddress");

const eventBroker = new EventBroker();
eventBroker.createTopic("omo", "shell");

window.eventBroker = eventBroker;
window.dispatchShellEvent = (event) => {
  window.eventBroker.getTopic("omo", "shell").publish(event);
}

function getServiceContext(): ProcessContext {
  const safeAddress = localStorage.getItem("omo.safeAddress");
  const account: Account = {
    privateKey: localStorage.getItem("omo.privateKey"),
    address: localStorage.getItem("omo.address"),
  };
  const web3 = config.getCurrent().web3();
  const circlesHub = new CirclesHub(web3, config.getCurrent().HUB_ADDRESS);
  const processContext: ProcessContext = {
    safe: !account.address ? null : new GnosisSafeProxy(web3, account.address, safeAddress),
    account: account,
    person: !safeAddress ? null : new Person(circlesHub, safeAddress),
    other: {}
  };
  return processContext;
}

window.stateMachines = <any>{
  _current: null,
  current(): Process {
    return this._current;
  },
  cancel() {
    this._current = null;
  },
  run<TContext>(definition: ProcessDefinition, contextModifier?: (processContext: ProcessContext) => TContext) {
    const { service, state, send } = useMachine(
      definition.stateMachine,
      {
        context: contextModifier
          ? contextModifier(getServiceContext())
          : getServiceContext()
      });

    const processEvents = new Subject<{
      stopped: boolean,
      currentState?: State<any, any, any>,
      previousState?: State<any, any, any>,
      event?: ProcessEvent
    }>();

    service.onTransition((state1, event) => {
      processEvents.next({
        stopped: false,
        currentState: state1,
        previousState: state1.history,
        event: event
      });
    });
    service.onStop(() => {
      processEvents.next({
        stopped: true
      });
      this._current = null;
    });

    const process: Process = {
      id: 0,
      events: processEvents,
      sendEvent: (event: any) => send(event)
    };

    service.start();

    this._current = process;

    return process;
  }
};

const app = new App({
  target: document.body,
});

export default app;
