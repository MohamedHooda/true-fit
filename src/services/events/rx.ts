import { Subject, filter } from "rxjs"
import {
    ITrueFitEventRelaying,
    TrueFitEvent,
    TrueFitEventListener,
    TrueFitEventTypes,
} from "."
/**
 * Async event relay that uses RxJS.
 * Does not support awaiting of event dispatching.
 */
export default class RxEventHandler implements ITrueFitEventRelaying {
    private eventSubject: Subject<TrueFitEvent> = new Subject<TrueFitEvent>()

    async dispatchEvent(event: TrueFitEvent): Promise<void> {
        this.eventSubject.next(event)
    }

    listenForEvents(
        eventTypes: TrueFitEventTypes[],
        listener: TrueFitEventListener,
    ): void {
        this.eventSubject
            .pipe(filter((event) => eventTypes.includes(event.type)))
            .subscribe(listener)
    }
}
